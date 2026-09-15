const DEFAULT_KEY_MASK = "KEY-******-******";

export async function keyauthCreateLicense(opts: {
  sellerKey: string;
  durationDays: number;
  quantity: number;
  owner?: string;
  note?: string;
  mask?: string;
}): Promise<string[]> {
  if (!opts.sellerKey) {
    throw new Error("Seller key da KeyAuth não configurada");
  }

  const expiry = opts.durationDays >= 9000 ? 0 : opts.durationDays;
  const url = new URL("https://keyauth.win/api/seller/");
  url.searchParams.set("sellerkey", opts.sellerKey);
  url.searchParams.set("type", "add");
  url.searchParams.set("format", "json");
  url.searchParams.set("expiry", String(expiry));
  url.searchParams.set("mask", opts.mask || DEFAULT_KEY_MASK);
  url.searchParams.set("amount", String(opts.quantity));
  if (opts.owner) url.searchParams.set("owner", opts.owner);
  if (opts.note) url.searchParams.set("note", opts.note);

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) {
    throw new Error(`KeyAuth respondeu HTTP ${res.status}`);
  }

  const data = await res.json() as { success?: boolean; message?: string; key?: string; keys?: string[] };
  if (!data.success) {
    throw new Error(`KeyAuth: ${data.message || "falha ao criar licença"}`);
  }

  const keys = Array.isArray(data.keys)
    ? data.keys
    : typeof data.key === "string" && data.key.length > 0
      ? [data.key]
      : [];

  if (keys.length !== opts.quantity || keys.some(key => typeof key !== "string" || key.length === 0)) {
    throw new Error(`KeyAuth retornou ${keys.length} de ${opts.quantity} licença(s)`);
  }

  return keys;
}
