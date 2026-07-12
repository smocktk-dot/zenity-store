import type { Request, Response } from "express";
import {
  createCreditTransaction,
  createLicenseKey,
  getAppById,
  getKeysByPaymentId,
  getPixPaymentByPaymentId,
  getPlanById,
  getResellerById,
  updatePixPaymentStatus,
  updateResellerCredits,
} from "./db";
import { keyauthCreateLicense } from "./keyauth";
import { calcDiscount } from "./resellerPricing";

const FINAL_PAYMENT_STATUSES = new Set(["expired", "cancelled", "refunded"]);

export async function handlePurinCashWebhook(req: Request, res: Response) {
  try {
    const { paymentId, status, paidAt } = req.body as {
      paymentId?: string;
      status?: string;
      amountCents?: number;
      paidAt?: string;
    };

    if (!paymentId || !status) {
      return res.status(400).json({ error: "Missing paymentId or status" });
    }

    console.log(`[PurinCash Webhook] paymentId=${paymentId} status=${status}`);

    const payment = await getPixPaymentByPaymentId(paymentId);
    if (!payment) {
      return res.status(404).json({ error: "Payment not found" });
    }

    if (status === "paid") {
      const reseller = await getResellerById(payment.resellerId);
      if (!reseller) {
        return res.status(404).json({ error: "Reseller not found" });
      }

      if (payment.paymentType === "key") {
        const appId = payment.appId;
        const planId = payment.planId;
        const quantity = payment.quantity ?? 1;
        if (!appId || !planId || quantity < 1) {
          throw new Error(`Pagamento de key ${paymentId} sem app, plano ou quantidade válida`);
        }

        const existingKeys = await getKeysByPaymentId(paymentId);
        if (payment.status === "paid" && existingKeys.length >= quantity) {
          return res.json({ ok: true, message: "Already processed" });
        }

        const app = await getAppById(appId);
        const plan = await getPlanById(planId);
        if (!app || !plan || plan.appId !== appId) {
          throw new Error(`App ou plano não encontrado para o pagamento ${paymentId}`);
        }

        const missingQuantity = Math.max(0, quantity - existingKeys.length);
        const sellerKey = app.keyauthSellerKey || process.env.KEYAUTH_SELLER_KEY || "";
        const generatedKeys = missingQuantity > 0
          ? await keyauthCreateLicense({
              sellerKey,
              durationDays: plan.durationDays,
              quantity: missingQuantity,
              owner: reseller.username,
              note: `Zenity Store - ${reseller.username} - ${plan.name} - Pix ${paymentId}`,
            })
          : [];

        const pricePerKey = payment.amountCents / quantity / 100;
        for (const keyValue of generatedKeys) {
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

        // Status is updated last so a KeyAuth/DB failure remains retryable.
        if (payment.status !== "paid") {
          const newPurchases = reseller.totalPurchases + quantity;
          const newDiscount = calcDiscount(newPurchases);
          await updateResellerCredits(
            payment.resellerId,
            reseller.credits as string,
            newPurchases,
            newDiscount.toFixed(2),
          );
        }
        await updatePixPaymentStatus(paymentId, "paid", paidAt ? new Date(paidAt) : new Date());

        console.log(`[PurinCash Webhook] Delivered ${quantity} key(s) for payment ${paymentId}`);
      } else {
        if (payment.status === "paid") {
          return res.json({ ok: true, message: "Already processed" });
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
        await updatePixPaymentStatus(paymentId, "paid", paidAt ? new Date(paidAt) : new Date());
      }
    } else if (FINAL_PAYMENT_STATUSES.has(status) && payment.status === "pending") {
      await updatePixPaymentStatus(paymentId, status as "expired" | "cancelled" | "refunded");
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error("[PurinCash Webhook] Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
