import { keyauthCreateLicense } from "./keyauth";
import {
  getAvailableStockForPlan,
  releaseStockReservation,
  reserveStockForReseller,
} from "./db";

/**
 * Retorna true quando o app está configurado para gerar keys on-demand via
 * KeyAuth Seller API (ex.: Unlock All Web) — sem depender de estoque local.
 * A seller key NUNCA é exposta a resellers ou registrada em logs.
 */
export function appGeneratesOnDemand(
  app: { keyauthSellerKey?: string | null } | null | undefined
): boolean {
  return !!app?.keyauthSellerKey?.trim();
}

export interface AcquireKeysResult {
  keyValues: string[];
  /**
   * Desfaz a aquisição (libera reservas de estoque). No-op para keys geradas
   * via KeyAuth — elas permanecem na conta do seller, apenas não são entregues.
   */
  release: () => Promise<void>;
}

/**
 * Obtém `quantity` key values para o plano:
 * - Apps com keyauthSellerKey configurado: gera on-demand via KeyAuth Seller API.
 * - Demais apps: reserva itens do estoque local; em falha parcial, libera reservas.
 *
 * Deve ser chamado SOMENTE server-side, após validar pagamento confirmado ou
 * saldo de créditos suficiente — nunca entregar keys sem essas verificações.
 */
export async function acquireLicenseKeyValues(opts: {
  app: { id: number; keyauthSellerKey?: string | null };
  plan: { id: number; name: string; durationDays: number };
  quantity: number;
  resellerId: number;
  owner?: string;
  note?: string;
  mask?: string;
}): Promise<AcquireKeysResult> {
  const { app, plan, quantity, resellerId, owner, note, mask } = opts;

  if (appGeneratesOnDemand(app)) {
    const keyValues = await keyauthCreateLicense({
      sellerKey: app.keyauthSellerKey!.trim(),
      durationDays: plan.durationDays,
      quantity,
      owner,
      note,
      mask,
    });
    return { keyValues, release: async () => {} };
  }

  const stock = await getAvailableStockForPlan(app.id, plan.id, quantity);
  if (stock.length < quantity) {
    throw new Error(`Estoque insuficiente para ${plan.name}: tem ${stock.length}, precisa ${quantity}`);
  }

  const reservedIds: number[] = [];
  const keyValues: string[] = [];
  const release = async () => {
    for (const id of reservedIds) {
      try {
        await releaseStockReservation(id);
      } catch {
        // best effort
      }
    }
  };

  try {
    for (const item of stock) {
      const reserved = await reserveStockForReseller(item.id, resellerId);
      if (!reserved) {
        throw new Error(`Falha ao reservar key do estoque: ${item.id}`);
      }
      reservedIds.push(item.id);
      keyValues.push(reserved.keyValue);
    }
  } catch (err) {
    await release();
    throw err;
  }

  return { keyValues, release };
}
