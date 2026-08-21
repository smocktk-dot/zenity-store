import express, { type Express, type Request, type Response } from "express";
import {
  getResellerByApiKey, getResellerById, getAssignedAppIds, getAppsByResellerId,
  getAppById, getPlansByAppId, getPlanById, getStockByApp,
  getAvailableStockForPlan, reserveStockForReseller, releaseStockReservation, createLicenseKey,
  updateResellerCredits, createCreditTransaction,
  getOtherStoreResellerByHwid, getOtherStoreHwidsByResellerId,
} from "./db";
import type { Reseller } from "../drizzle/schema";

async function authReseller(req: Request): Promise<Reseller | undefined> {
  let apiKey = req.headers["x-api-key"] as string | undefined;
  if (!apiKey) {
    const auth = req.headers.authorization as string | undefined;
    if (auth?.toLowerCase().startsWith("bearer ")) apiKey = auth.slice(7).trim();
  }
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
        resellerSellingPrice: p.resellerSellingPrice,
        stockCount: stock.filter(s => s.planId === p.id && s.status === "available").length,
      }));
      return { id: app.id, name: app.name, description: app.description, version: app.version, plans: planList };
    }));
    res.json(result);
  });

  app.get("/api/reseller/v1/stock", async (req, res) => {
    const reseller = await authReseller(req);
    if (!reseller) return res.status(401).json({ error: "Invalid API key" });
    const appId = req.query.appId ? Number(req.query.appId) : undefined;
    const rows = await getAppsByResellerId(reseller.id);
    const apps = appId ? rows.filter(r => r.app.id === appId) : rows;
    const result = await Promise.all(apps.map(async ({ app }) => {
      const plans = await getPlansByAppId(app.id);
      const stock = await Promise.all(plans.map(async (p) => {
        const available = await getAvailableStockForPlan(app.id, p.id, 1000);
        return {
          id: p.id,
          name: p.name,
          durationDays: p.durationDays,
          priceCredits: p.priceCredits,
          resellerSellingPrice: p.resellerSellingPrice,
          stockCount: available.length,
          inStock: available.length > 0,
        };
      }));
      return { id: app.id, name: app.name, stock };
    }));
    res.json(result);
  });

  app.post("/api/reseller/v1/stock/take", async (req, res) => {
    const reseller = await authReseller(req);
    if (!reseller) return res.status(401).json({ error: "Invalid API key" });
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
    const stock = await getAvailableStockForPlan(app.id, plan.id, qty);
    if (stock.length < qty) return res.status(409).json({ error: `Insufficient stock. Available: ${stock.length}, requested: ${qty}` });
    const reserved: any[] = [];
    for (const s of stock) {
      const r = await reserveStockForReseller(s.id, reseller.id);
      if (!r) return res.status(409).json({ error: "Stock reservation failed" });
      reserved.push(r);
    }
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
        creditsSpent: "0",
        source: "api",
        ...(noteValue ? { note: noteValue } : {}),
      } as any);
      keys.push(r.keyValue);
    }
    res.json({ keys, plan: { id: plan.id, name: plan.name, durationDays: plan.durationDays } });
  });

  // Gateway-compatible endpoint that returns { data: { key: ... } }
  const gatewayTake = async (req: Request, res: Response) => {
    const reseller = await authReseller(req);
    if (!reseller) return res.status(401).json({ data: null, error: "Invalid API key" });
    const source = req.method === "GET" ? req.query : req.body;
    const { appId, planId, planName, quantity = 1, customer } = source;
    if (!appId) return res.status(400).json({ data: null, error: "appId is required" });
    if (!planId && !planName) return res.status(400).json({ data: null, error: "planId or planName is required" });
    const app = await getAppById(Number(appId));
    if (!app) return res.status(404).json({ data: null, error: "App not found" });
    const assigned = await getAssignedAppIds(reseller.id);
    if (!assigned.includes(app.id)) return res.status(403).json({ data: null, error: "App not assigned" });
    const plan = await resolvePlan(app.id, planId ? Number(planId) : undefined, planName);
    if (!plan) return res.status(404).json({ data: null, error: "Plan not found" });
    const qty = Math.max(1, Math.min(100, Number(quantity) || 1));
    const stock = await getAvailableStockForPlan(app.id, plan.id, qty);
    if (stock.length < qty) return res.status(409).json({ data: null, error: `Insufficient stock. Available: ${stock.length}, requested: ${qty}` });
    const reserved: any[] = [];
    for (const s of stock) {
      const r = await reserveStockForReseller(s.id, reseller.id);
      if (!r) return res.status(409).json({ data: null, error: "Stock reservation failed" });
      reserved.push(r);
    }
    const noteParts: string[] = [];
    if (customer) noteParts.push(`customer: ${customer}`);
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
        creditsSpent: "0",
        source: "gateway",
        ...(noteValue ? { note: noteValue } : {}),
      } as any);
      keys.push(r.keyValue);
    }
    res.json({
      data: {
        key: keys[0],
        keys: keys.length > 1 ? keys : undefined,
        plan: { id: plan.id, name: plan.name, durationDays: plan.durationDays },
      }
    });
  };

  app.get("/api/reseller/v1/gateway/take", gatewayTake);
  app.post("/api/reseller/v1/gateway/take", gatewayTake);

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

  app.post("/api/reseller/v1/other-store/hwid", async (_req, res) => {
    // Gera um identificador unico de dispositivo (nao vinculado ainda - admin cadastra depois)
    const crypto = await import("crypto");
    const hwid = "oshw_" + crypto.randomUUID().replace(/-/g, "");
    res.json({ hwid });
  });

  app.post("/api/reseller/v1/other-store/charge", async (req, res) => {
    const reseller = await authReseller(req);
    if (!reseller) return res.status(401).json({ error: "Invalid API key" });
    const hwid = req.headers["x-other-store-hwid"] as string | undefined;
    const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
    const ip = String(clientIp).split(",")[0]?.trim() || "";
    const otherStore = hwid
      ? await getOtherStoreResellerByHwid(hwid)
      : null;
    if (!otherStore || otherStore.resellerId !== reseller.id) return res.status(403).json({ error: "HWID not authorized for Other Store" });
    const { appId, planName, quantity = 1, customer } = req.body;
    if (!appId) return res.status(400).json({ error: "appId is required" });
    if (!planName) return res.status(400).json({ error: "planName is required" });
    const app = await getAppById(Number(appId));
    if (!app) return res.status(404).json({ error: "App not found" });
    const assigned = await getAssignedAppIds(reseller.id);
    if (!assigned.includes(app.id)) return res.status(403).json({ error: "App not assigned" });
    const plan = await resolvePlan(app.id, undefined, planName);
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    const qty = Math.max(1, Math.min(100, Number(quantity) || 1));
    const available = await getAvailableStockForPlan(app.id, plan.id, qty);
    if (available.length < qty) return res.status(409).json({ error: `Insufficient stock. Available: ${available.length}, requested: ${qty}` });
    const price = parseFloat(String(plan.resellerSellingPrice));
    if (!price || price <= 0) return res.status(400).json({ error: "Reseller selling price not set for plan" });
    const amountCents = Math.round(price * 100 * qty);
    const splitPercent = parseFloat(String(otherStore.splitPercent));
    const PURIN_API_KEY = process.env.PURIN_CASH_API_KEY;
    if (!PURIN_API_KEY) return res.status(500).json({ error: "PurinCash not configured" });
    const callbackUrl = `${process.env.VITE_APP_URL || "https://vgsellers.lat"}/api/webhooks/purincash`;
    const body = {
      amountCents,
      description: `Key ${plan.name} - Other Store`,
      splits: [{ recipientEmail: otherStore.recipientEmail, percentage: splitPercent }],
      callbackUrl,
      customer: customer ? { name: reseller.username, email: customer } : { name: reseller.username, email: reseller.email || `${reseller.username}@other-store.local` },
    };
    const response = await fetch("https://api.purincash.com/v1/split-charges", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${PURIN_API_KEY}` },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.text();
      console.error("[PurinCash] split charge error:", err);
      return res.status(500).json({ error: "Failed to create split charge" });
    }
    const data = await response.json() as any;
    const brCode = data?.pix?.brCode || data?.brCode || null;
    const qrCodeImage = data?.pix?.qrCodeImage || data?.qrCodeImage || null;
    res.json({ paymentId: data.paymentId, amountCents, brCode, qrCodeImage, expiresAt: data.expiresAt, plan: { id: plan.id, name: plan.name, durationDays: plan.durationDays } });
  });
}
