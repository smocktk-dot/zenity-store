import type { Request, Response } from "express";
import crypto from "crypto";
import {
  createCreditTransaction,
  createLicenseKey,
  getAppById,
  getAvailableStockForPlan,
  getKeysByPaymentId,
  getPixPaymentByPaymentId,
  getPlanById,
  getResellerById,
  reserveStockForReseller,
  updatePixPaymentStatus,
  updateResellerCredits,
} from "./db";

const FINAL_PAYMENT_STATUSES = new Set(["expired", "cancelled", "refunded"]);
const PURIN_API_KEY = process.env.PURIN_CASH_API_KEY;
const PURIN_WEBHOOK_SECRET = process.env.PURINCASH_WEBHOOK_SECRET;

function isValidHmac(rawBody: Buffer, signature: string | string[] | undefined, secret: string): boolean {
  if (!signature || !secret) return false;
  const sig = Array.isArray(signature) ? signature[0] : signature;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  if (sig.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function handlePurinCashWebhook(req: Request, res: Response) {
  try {
    const rawBody = req.body as Buffer;
    const signature = req.headers["x-webhook-signature"];
    const webhookId = req.headers["x-webhook-id"] as string | undefined;

    console.log("[PurinCash Webhook] hit", {
      method: req.method,
      url: req.url,
      host: req.headers.host,
      forwardedHost: req.headers["x-forwarded-host"],
      contentType: req.headers["content-type"],
      webhookId,
      hasSecret: !!PURIN_WEBHOOK_SECRET,
      bodyLength: rawBody?.length,
    });

    if (!PURIN_WEBHOOK_SECRET) {
      console.error("[PurinCash Webhook] missing PURINCASH_WEBHOOK_SECRET");
      return res.status(401).json({ error: "Webhook não configurado" });
    }
    if (!isValidHmac(rawBody, signature, PURIN_WEBHOOK_SECRET)) {
      console.warn("[PurinCash Webhook] invalid signature");
      return res.status(401).json({ error: "Assinatura inválida" });
    }

    const payload = rawBody ? JSON.parse(rawBody.toString("utf8")) : {};
    const { event, paymentId, status, paidAt } = payload as {
      event?: string;
      paymentId?: string;
      status?: string;
      amountCents?: number;
      paidAt?: string;
    };

    if (!paymentId || !status) {
      console.warn("[PurinCash Webhook] missing paymentId or status", { event, paymentId, status });
      return res.status(400).json({ error: "Missing paymentId or status" });
    }

    console.log(`[PurinCash Webhook] paymentId=${paymentId} status=${status} event=${event}`);

    const result = await processPurinPaymentUpdate(paymentId, status as any, paidAt ? new Date(paidAt) : new Date());
    return res.status(result.status).json(result.body);
  } catch (error) {
    console.error("[PurinCash Webhook] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function checkPurinPaymentStatus(paymentId: string) {
  if (!PURIN_API_KEY) return null;

  const isSplit = paymentId.startsWith("psplit_");
  const isCharge = paymentId.startsWith("psc_") || isSplit;
  const url = isSplit
    ? `https://api.purincash.com/v1/split-charges/${paymentId}`
    : isCharge
      ? `https://api.purincash.com/v1/charges/${paymentId}`
      : `https://api.purincash.com/v1/payments/${paymentId}`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${PURIN_API_KEY}` },
    });
    if (!response.ok) {
      console.error("[PurinCash Polling] HTTP", response.status, await response.text());
      return null;
    }
    const data = await response.json() as { status?: string; paidAt?: string; amountCents?: number };
    console.log("[PurinCash Polling] paymentId=", paymentId, "status=", data.status);
    return data;
  } catch (e) {
    console.error("[PurinCash Polling] Error:", e);
    return null;
  }
}

export async function processPurinPaymentUpdate(
  paymentId: string,
  status: "paid" | "expired" | "cancelled" | "refunded" | string,
  paidAt: Date
): Promise<{ status: number; body: Record<string, any> }> {
  const payment = await getPixPaymentByPaymentId(paymentId);
  if (!payment) {
    console.warn("[PurinCash] Payment not found:", paymentId);
    return { status: 404, body: { error: "Payment not found" } };
  }

  if (status === "paid") {
    const reseller = await getResellerById(payment.resellerId);
    if (!reseller) {
      return { status: 404, body: { error: "Reseller not found" } };
    }

    if (payment.paymentType === "other-store") {
      const appId = payment.appId;
      const planId = payment.planId;
      const quantity = payment.quantity ?? 1;
      if (!appId || !planId || quantity < 1) {
        throw new Error(`Pagamento other-store ${paymentId} sem app, plano ou quantidade válida`);
      }
      const existingKeys = await getKeysByPaymentId(paymentId);
      if (payment.status === "paid" && existingKeys.length >= quantity) {
        return { status: 200, body: { ok: true, message: "Already processed" } };
      }
      const app = await getAppById(appId);
      const plan = await getPlanById(planId);
      if (!app || !plan || plan.appId !== appId) {
        throw new Error(`App ou plano não encontrado para o pagamento other-store ${paymentId}`);
      }
      const missingQuantity = Math.max(0, quantity - existingKeys.length);
      if (missingQuantity > 0) {
        const stockItems = await getAvailableStockForPlan(appId, planId, missingQuantity);
        if (stockItems.length < missingQuantity) {
          throw new Error(`Estoque insuficiente para ${plan.name}: tem ${stockItems.length}, precisa ${missingQuantity}`);
        }
        for (const item of stockItems) {
          const reserved = await reserveStockForReseller(item.id, payment.resellerId);
          if (!reserved) {
            throw new Error(`Falha ao reservar key do estoque: ${item.id}`);
          }
          await createLicenseKey({
            keyValue: reserved.keyValue,
            resellerId: payment.resellerId,
            appId,
            planId: plan.id,
            planName: plan.name,
            durationDays: plan.durationDays,
            creditsSpent: "0",
            resellerCredits: reseller.credits as string,
            note: `other-store:${paymentId}`,
            source: "other-store",
          });
        }
      }
      if (payment.status !== "paid") {
        const newPurchases = reseller.totalPurchases + quantity;
        await updateResellerCredits(
          payment.resellerId,
          reseller.credits as string,
          newPurchases,
          reseller.discountPercent as string,
        );
      }
      await updatePixPaymentStatus(paymentId, "paid", paidAt);
      console.log(`[PurinCash] Delivered ${quantity} key(s) for other-store payment ${paymentId}`);
      return { status: 200, body: { ok: true } };
    } else if (payment.paymentType === "key") {
      const appId = payment.appId;
      const planId = payment.planId;
      const quantity = payment.quantity ?? 1;
      if (!appId || !planId || quantity < 1) {
        throw new Error(`Pagamento de key ${paymentId} sem app, plano ou quantidade válida`);
      }

      const existingKeys = await getKeysByPaymentId(paymentId);
      if (payment.status === "paid" && existingKeys.length >= quantity) {
        return { status: 200, body: { ok: true, message: "Already processed" } };
      }

      const app = await getAppById(appId);
      const plan = await getPlanById(planId);
      if (!app || !plan || plan.appId !== appId) {
        throw new Error(`App ou plano não encontrado para o pagamento ${paymentId}`);
      }

      const missingQuantity = Math.max(0, quantity - existingKeys.length);
      if (missingQuantity > 0) {
        const stockItems = await getAvailableStockForPlan(appId, planId, missingQuantity);
        if (stockItems.length < missingQuantity) {
          throw new Error(`Estoque insuficiente para ${plan.name}: tem ${stockItems.length}, precisa ${missingQuantity}`);
        }

        const pricePerKey = payment.amountCents / quantity / 100;
        const notePrefix = (payment as any).paymentMethod === "ltc" ? "ltc" : "pix";
        for (const item of stockItems) {
          const reserved = await reserveStockForReseller(item.id, payment.resellerId);
          if (!reserved) {
            throw new Error(`Falha ao reservar key do estoque: ${item.id}`);
          }
          await createLicenseKey({
            keyValue: reserved.keyValue,
            resellerId: payment.resellerId,
            appId,
            planId: plan.id,
            planName: plan.name,
            durationDays: plan.durationDays,
            creditsSpent: pricePerKey.toFixed(2),
            resellerCredits: reseller.credits as string,
            note: `${notePrefix}:${paymentId}`,
          });
        }
      }

      if (payment.status !== "paid") {
        const newPurchases = reseller.totalPurchases + quantity;
        await updateResellerCredits(
          payment.resellerId,
          reseller.credits as string,
          newPurchases,
          reseller.discountPercent as string,
        );
      }
      await updatePixPaymentStatus(paymentId, "paid", paidAt);

      console.log(`[PurinCash] Delivered ${quantity} key(s) for payment ${paymentId}`);
      return { status: 200, body: { ok: true } };
    } else {
      if (payment.status === "paid") {
        return { status: 200, body: { ok: true, message: "Already processed" } };
      }

      const creditsToAdd = parseFloat(payment.credits as string);
      const currentCredits = parseFloat(reseller.credits as string);
      const newCredits = currentCredits + creditsToAdd;

      await updateResellerCredits(
        payment.resellerId,
        newCredits.toFixed(2),
        reseller.totalPurchases,
        reseller.discountPercent as string,
      );
      await createCreditTransaction({
        resellerId: payment.resellerId,
        type: "add",
        amount: creditsToAdd.toFixed(2),
        balanceBefore: currentCredits.toFixed(2),
        balanceAfter: newCredits.toFixed(2),
        description: `Compra via Pix - ${creditsToAdd} crédito(s) (${paymentId})`,
      });
      await updatePixPaymentStatus(paymentId, "paid", paidAt);

      console.log(`[PurinCash] Added ${creditsToAdd} credits for payment ${paymentId}`);
      return { status: 200, body: { ok: true } };
    }
  } else if (FINAL_PAYMENT_STATUSES.has(status) && payment.status === "pending") {
    await updatePixPaymentStatus(paymentId, status as "expired" | "cancelled" | "refunded");
    return { status: 200, body: { ok: true } };
  }

  return { status: 200, body: { ok: true } };
}
