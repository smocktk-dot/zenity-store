const DEFAULT_KEY_MASK = "KEY-******-******";

async function keyauthRequestLicenses(opts: {
  sellerKey: string;
  durationDays: number;
  quantity: number;
  owner?: string;
  note?: string;
  mask?: string;
}): Promise<string[]> {
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

  const data = await res.json() as { success?: boolean; message?: string; key?: string | string[]; keys?: string[] | string };
  if (!data.success) {
    throw new Error(`KeyAuth: ${data.message || "falha ao criar licença"}`);
  }

  // Normaliza os formatos possíveis da KeyAuth:
  // - keys: string[]            (amount > 1)
  // - keys: "K1\nK2\nK3"        (string unica com separadores)
  // - key:  "K1" | "K1\nK2\nK3" | string[]
  const rawKeys: unknown = data.keys ?? data.key;
  return (Array.isArray(rawKeys) ? rawKeys : typeof rawKeys === "string" ? [rawKeys] : [])
    .flatMap(k => String(k).split(/[\s,;]+/))
    .map(k => k.trim())
    .filter(k => k.length > 0);
}

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

  // Pede tudo de uma vez; se a API devolver menos do que o pedido (ex.: ignora
  // `amount` ou muda o formato da resposta), faz chamadas extras ate completar.
  // Limite de tentativas evita loop infinito se a API falhar sempre.
  const keys = new Set<string>();
  let attempts = 0;
  const maxAttempts = opts.quantity + 5;

  while (keys.size < opts.quantity && attempts < maxAttempts) {
    attempts++;
    const missing = opts.quantity - keys.size;
    const batch = await keyauthRequestLicenses({ ...opts, quantity: missing });
    if (batch.length === 0) {
      throw new Error(`KeyAuth retornou 0 licença(s) (pedido: ${missing})`);
    }
    for (const k of batch) keys.add(k);
  }

  if (keys.size < opts.quantity) {
    throw new Error(`KeyAuth retornou ${keys.size} de ${opts.quantity} licença(s)`);
  }

  return Array.from(keys).slice(0, opts.quantity);
}

export interface KeyauthLicenseInfo {
  key: string;
  used: boolean;
  usedBy: string | null;
  status: string | null;
  expiry: number | null;
  created: number | null;
  level: string | number | null;
  note: string | null;
  banned: boolean;
}

/**
 * Busca os detalhes de uma licença específica via fetchallkeys.
 * Retorna null se a licença não for encontrada no app.
 */
export async function keyauthFetchKeyInfo(opts: {
  sellerKey: string;
  keyValue: string;
}): Promise<KeyauthLicenseInfo | null> {
  if (!opts.sellerKey) return null;

  const url = new URL("https://keyauth.win/api/seller/");
  url.searchParams.set("sellerkey", opts.sellerKey);
  url.searchParams.set("type", "fetchallkeys");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) {
    throw new Error(`KeyAuth respondeu HTTP ${res.status}`);
  }

  const data = await res.json() as any;
  if (!data.success) return null;

  const licenses: any[] = Array.isArray(data.licenses)
    ? data.licenses
    : Array.isArray(data.keys)
      ? data.keys
      : [];

  const lic = licenses.find(l => String(l.key ?? l.license ?? "") === opts.keyValue);
  if (!lic) return null;

  const used =
    lic.used === 1 || lic.used === "1" || lic.used === true ||
    String(lic.status ?? "").toLowerCase() === "used";

  return {
    key: String(lic.key ?? lic.license ?? opts.keyValue),
    used,
    usedBy: lic.usedby ?? lic.usedBy ?? null,
    status: lic.status ?? null,
    expiry: Number.isFinite(Number(lic.expiry)) ? Number(lic.expiry) : null,
    created: Number.isFinite(Number(lic.created)) ? Number(lic.created) : null,
    level: lic.level ?? null,
    note: lic.note ?? null,
    banned: lic.banned === 1 || lic.banned === "1" || lic.banned === true,
  };
}

export interface KeyauthUserInfo {
  username: string;
  hwid: string | null;
  ip: string | null;
  lastlogin: number | null;
  created: number | null;
  banned: boolean;
}

/**
 * Busca dados de um usuário via fetchallusers — retorna HWID e IP
 * registrados no painel. Retorna null se o usuário não existir.
 */
export async function keyauthFetchUserInfo(opts: {
  sellerKey: string;
  username: string;
}): Promise<KeyauthUserInfo | null> {
  if (!opts.sellerKey) return null;

  const url = new URL("https://keyauth.win/api/seller/");
  url.searchParams.set("sellerkey", opts.sellerKey);
  url.searchParams.set("type", "fetchallusers");
  url.searchParams.set("format", "json");

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) {
    throw new Error(`KeyAuth respondeu HTTP ${res.status}`);
  }

  const data = await res.json() as any;
  if (!data.success) return null;

  const users: any[] = Array.isArray(data.users) ? data.users : [];
  const u = users.find(x => String(x.username ?? "") === opts.username);
  if (!u) return null;

  const num = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : null);
  return {
    username: String(u.username ?? opts.username),
    hwid: u.hwid ?? null,
    ip: u.ip ?? null,
    lastlogin: num(u.lastlogin),
    created: num(u.createdate ?? u.created),
    banned: u.banned === 1 || u.banned === "1" || u.banned === true,
  };
}
