import express, { type Express, type Request, type Response } from "express";
import {
  getResellerByApiKey, getResellerById, getAssignedAppIds, getAppsByResellerId,
  getAppById, getPlansByAppId, getPlanById, getStockByApp,
  getAvailableStockForPlan, reserveStockForReseller, releaseStockReservation, createLicenseKey,
  updateResellerCredits, createCreditTransaction,
} from "./db";
import type { Reseller } from "../drizzle/schema";

async function authReseller(req: Request): Promise<Reseller | undefined> {
  const apiKey = req.headers["x-api-key"] as string | undefined;
  if (!apiKey) return undefined;
  return getResellerByApiKey(apiKey);
}

async function resolvePlan(appId: number, planId: number | undefined, planName: string | undefined) {
  if (planId) {
    const plan = await getPlanById(Number(planId));
    if (plan && plan.appId === appId) return plan;
    return undefined;
  }
  if (!planName) return undefined;
  const plans = await getPlansByAppId(appId);
  const name = String(planName).toLowerCase().trim();
  return plans.find(p => p.name.toLowerCase().trim() === name);
}

export function registerResellerApi(app: Express) {
  app.post("/api/reseller/v1/auth/verify", async (req, res) => {
    const reseller = await authReseller(req);
    if (!reseller) return res.status(401).json({ error: "Invalid API key" });
    const { passwordHash, ...safe } = reseller;
    res.json({ reseller: safe, balance: reseller.credits });
  });

  app.get("/api/reseller/v1/products", async (req, res) => {
    const reseller = await authReseller(req);
    if (!reseller) return res.status(401).json({ error: "Invalid API key" });
    const rows = await getAppsByResellerId(reseller.id);
    const result = await Promise.all(rows.map(async ({ app }) => {
      const [plans, stock] = await Promise.all([getPlansByAppId(app.id), getStockByApp(app.id)]);
      const planList = plans.map(p => ({
        id: p.id,
        name: p.name,
        durationDays: p.durationDays,
        priceCredits: p.priceCredits,
        stockCount: stock.filter(s => s.planId === p.id && s.status === "available").length,
      }));
      return { id: app.id, name: app.name, description: app.description, version: app.version, plans: planList };
    }));
    res.json(result);
  });

  app.post("/api/reseller/v1/buy", async (req, res) => {
    const reseller = await authReseller(req);
    if (!reseller) return res.status(401).json({ error: "Invalid API key" });
    if (reseller.resellerType !== "credits") return res.status(403).json({ error: "Not a credits reseller" });
    const { appId, planId, planName, quantity = 1, customer, note } = req.body;
    if (!appId) return res.status(400).json({ error: "appId is required" });
    if (!planId && !planName) return res.status(400).json({ error: "planId or planName is required" });
    const app = await getAppById(Number(appId));
    if (!app) return res.status(404).json({ error: "App not found" });
    const assigned = await getAssignedAppIds(reseller.id);
    if (!assigned.includes(app.id)) return res.status(403).json({ error: "App not assigned" });
    const plan = await resolvePlan(app.id, planId ? Number(planId) : undefined, planName);
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    const qty = Math.max(1, Math.min(100, Number(quantity) || 1));
    const basePrice = parseFloat(plan.priceCredits as string);
    const discount = parseFloat(reseller.discountPercent as string);
    const pricePerKey = basePrice * (1 - discount / 100);
    const totalCost = pricePerKey * qty;
    let currentCredits = parseFloat(reseller.credits as string);
    if (currentCredits < totalCost) return res.status(402).json({ error: `Insufficient credits. Need: ${totalCost.toFixed(2)}, have: ${currentCredits.toFixed(2)}` });
    const stock = await getAvailableStockForPlan(app.id, plan.id, qty);
    if (stock.length < qty) return res.status(409).json({ error: `Insufficient stock. Available: ${stock.length}, requested: ${qty}` });
    const reserved: any[] = [];
    for (const s of stock) {
      const r = await reserveStockForReseller(s.id, reseller.id);
      if (!r) return res.status(409).json({ error: "Stock reservation failed" });
      reserved.push(r);
    }
    const freshReseller = await getResellerById(reseller.id);
    currentCredits = parseFloat(String(freshReseller?.credits ?? reseller.credits));
    if (currentCredits < totalCost) {
      for (const r of reserved) await releaseStockReservation(r.id);
      return res.status(402).json({ error: `Insufficient credits after reservation. Need: ${totalCost.toFixed(2)}, have: ${currentCredits.toFixed(2)}` });
    }
    const newCredits = currentCredits - totalCost;
    const newPurchases = reseller.totalPurchases + qty;
    const noteParts: string[] = [];
    if (customer) noteParts.push(`customer: ${customer}`);
    if (note) noteParts.push(note);
    const noteValue = noteParts.length ? noteParts.join(" | ") : undefined;
    const keys: string[] = [];
    for (const r of reserved) {
      await createLicenseKey({
        keyValue: r.keyValue,
        resellerId: reseller.id,
        appId: app.id,
        planId: plan.id,
        planName: plan.name,
        durationDays: plan.durationDays,
        creditsSpent: pricePerKey.toFixed(2),
        resellerCredits: newCredits.toFixed(2),
        source: "api",
        ...(noteValue ? { note: noteValue } : {}),
      } as any);
      keys.push(r.keyValue);
    }
    await updateResellerCredits(reseller.id, newCredits.toFixed(2), newPurchases, reseller.discountPercent as string);
    await createCreditTransaction({
      resellerId: reseller.id,
      type: "deduct",
      amount: totalCost.toFixed(2),
      balanceBefore: reseller.credits,
      balanceAfter: newCredits.toFixed(2),
      description: `API buy ${qty}x ${app.name} (${plan.name})`,
    });
    res.json({ keys, cost: totalCost.toFixed(2), balanceAfter: newCredits.toFixed(2), plan: { id: plan.id, name: plan.name, durationDays: plan.durationDays } });
  });
}
