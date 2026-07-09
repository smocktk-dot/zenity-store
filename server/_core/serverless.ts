import "dotenv/config";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";

const app = express();

// Trust proxy headers (Vercel, Cloudflare, etc.) so req.protocol and IP headers work correctly
app.set("trust proxy", true);

// Configure body parser with larger size limit for file uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

registerStorageProxy(app);
registerOAuthRoutes(app);

// Endpoint that returns the real IP seen by the server
app.get("/api/my-ip", (req, res) => {
  const h = req.headers;
  const candidates = [
    (h["cf-connecting-ip"] as string) || "",
    (h["true-client-ip"] as string) || "",
    (h["x-real-ip"] as string) || "",
    ((h["x-forwarded-for"] as string) || "").split(",")[0].trim(),
    (h["x-client-ip"] as string) || "",
    req.socket?.remoteAddress || "",
  ];
  const raw = candidates.find(c => c && c.length > 0) || "";
  let ip = raw.trim();
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) ip = mapped[1];
  if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") ip = "127.0.0.1";
  res.json({ ip, raw });
});

// Webhook Purin Cash (Pix payment confirmation)
app.post("/api/webhooks/purincash", async (req, res) => {
  try {
    const { paymentId, status, amountCents, paidAt } = req.body;
    if (!paymentId || !status) {
      return res.status(400).json({ error: "Missing paymentId or status" });
    }
    console.log(`[PurinCash Webhook] paymentId=${paymentId} status=${status}`);

    if (status === "paid") {
      const {
        getPixPaymentByPaymentId,
        updatePixPaymentStatus,
        updateResellerCredits,
        getResellerById,
        createCreditTransaction,
        getAppById,
        getPlanById,
        createLicenseKey,
      } = await import("../db");

      const payment = await getPixPaymentByPaymentId(paymentId);
      if (!payment) {
        return res.status(404).json({ error: "Payment not found" });
      }
      if (payment.status === "paid") {
        return res.json({ ok: true, message: "Already processed" });
      }

      const reseller = await getResellerById(payment.resellerId);
      if (!reseller) {
        return res.status(404).json({ error: "Reseller not found" });
      }

      // Marcar como pago primeiro (idempotência)
      await updatePixPaymentStatus(paymentId, "paid", paidAt ? new Date(paidAt) : new Date());

      // ── Compra de KEY via Pix (reseller de porcentagem) ──────────────────────
      if ((payment as any).paymentType === "key") {
        const appId = (payment as any).appId;
        const planId = (payment as any).planId;
        const quantity = (payment as any).quantity ?? 1;

        const app = await getAppById(appId);
        const plan = await getPlanById(planId);

        if (!app || !plan) {
          console.error(`[PurinCash Webhook] App or plan not found for key payment ${paymentId}`);
          return res.json({ ok: true, warning: "App or plan not found" });
        }

        const KEYAUTH_SELLER_KEY = process.env.KEYAUTH_SELLER_KEY || "";
        const sellerKey = (app as any).keyauthSellerKey || KEYAUTH_SELLER_KEY;
        const amountPaid = amountCents / 100;
        const pricePerKey = quantity > 0 ? (amountPaid / quantity) : amountPaid;

        // Gerar keys via KeyAuth
        let keyauthKeys: string[] | null = null;
        try {
          const DEFAULT_KEY_MASK = "***t**-***m**-*****k";
          const params = new URLSearchParams({
            sellerkey: sellerKey,
            type: "add",
            format: "JSON",
            expiry: String(plan.durationDays),
            mask: DEFAULT_KEY_MASK,
            level: "1",
            amount: String(quantity),
            owner: reseller.username,
            note: `Zenity Store - ${reseller.username} - ${plan.name} - Pix ${paymentId}`,
          });
          const kaRes = await fetch(`https://keyauth.win/api/seller/?${params.toString()}`);
          const kaData = await kaRes.json() as any;
          if (kaData.success && Array.isArray(kaData.keys)) {
            keyauthKeys = kaData.keys;
          } else if (kaData.success && kaData.key) {
            keyauthKeys = [kaData.key];
          }
        } catch (err) {
          console.error("[KeyAuth] License creation failed in webhook:", err);
        }

        // Salvar keys no banco com note = pix:{paymentId} para rastreamento
        for (let i = 0; i < quantity; i++) {
          const keyValue = keyauthKeys ? (keyauthKeys[i] || `ZENITY-${Date.now()}-${i}`) : `ZENITY-${Date.now()}-${i}`;
          await createLicenseKey({
            keyValue,
            resellerId: payment.resellerId,
            appId,
            planId: plan.id,
            planName: plan.name,
            durationDays: plan.durationDays,
            creditsSpent: pricePerKey.toFixed(2),
            note: `pix:${paymentId}`,
          });
        }

        // Atualizar totalPurchases e desconto do reseller
        const { calcDiscount } = await import("../routers");
        const newPurchases = reseller.totalPurchases + quantity;
        const newDiscount = calcDiscount(newPurchases);
        await updateResellerCredits(payment.resellerId, reseller.credits as string, newPurchases, newDiscount.toFixed(2));

        console.log(`[PurinCash Webhook] Delivered ${quantity} key(s) for payment ${paymentId}`);

      // ── Compra de CRÉDITOS via Pix ────────────────────────────────────────────
      } else {
        const creditsToAdd = parseFloat(payment.credits as string);
        const currentCredits = parseFloat(reseller.credits as string);
        const newCredits = currentCredits + creditsToAdd;
        await updateResellerCredits(payment.resellerId, newCredits.toFixed(2), reseller.totalPurchases, reseller.discountPercent as string);
        await createCreditTransaction({
          resellerId: payment.resellerId,
          type: "add",
          amount: creditsToAdd.toFixed(2),
          balanceBefore: currentCredits.toFixed(2),
          balanceAfter: newCredits.toFixed(2),
          description: `Compra via Pix - ${creditsToAdd} crédito(s) (${paymentId})`,
        });
      }

    } else if (status === "expired" || status === "cancelled" || status === "refunded") {
      const { getPixPaymentByPaymentId, updatePixPaymentStatus } = await import("../db");
      const payment = await getPixPaymentByPaymentId(paymentId);
      if (payment && payment.status === "pending") {
        await updatePixPaymentStatus(paymentId, status as any);
      }
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("[PurinCash Webhook] Error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;
