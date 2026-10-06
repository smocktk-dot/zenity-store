/**
 * ============================================================================
 *  VG AUTH — Cliente Web (browser / Node 18+)
 *  Endpoint: POST https://vgsellers.lat/api/vgauth/v1
 *
 *  USO:
 *    const auth = new VgAuth("MeuSite", "OWNER_ID", "PUB_KEY_128_HEX", "1.0");
 *    await auth.init();
 *    await auth.register("user", "pass", "KEY", "email@x.com");
 *    await auth.login("user", "pass");        // ou auth.license("KEY")
 *    await auth.check();                      // heartbeat
 *
 *  3º parâmetro = PUBLIC KEY de assinatura do app (ECDSA P-256, hex de 128
 *  chars — copie no painel admin em "Pub Key"). Ela só VALIDA as respostas do
 *  servidor: quem extrai do seu bundle não consegue forjar resposta, porque a
 *  chave privada nunca sai do servidor.
 *  (Valor de 64 hex = secret legado — ainda aceito, modo HMAC antigo.)
 *
 *  HWID: no browser não existe serial de placa-mãe/CPU — o cliente gera um
 *  fingerprint persistente (localStorage) que é enviado como hwid_mb.
 * ============================================================================
 */
class VgAuth {
  constructor(name, ownerid, credential, version = "1.0", endpoint = "https://vgsellers.lat/api/vgauth/v1") {
    this.name = name;
    this.ownerid = ownerid;
    // credential: 128 hex = pubkey ECDSA P-256 (recomendado); 64 hex = secret legado
    this.publicKey = /^[0-9a-fA-F]{128}$/.test(credential || "") ? credential.toLowerCase() : null;
    this.secret = this.publicKey ? null : credential;
    this.version = version;
    this.endpoint = endpoint;
    this.sessionid = null;
    this.enckey = null;
    this.loggedIn = false;
    this.user = null;
    this.message = "";
    this.banned = false;
    this.banReason = "";
  }

  /** Fingerprint persistente do dispositivo (substituto de HWID no web) */
  static fingerprint() {
    try {
      let fp = localStorage.getItem("vga_fp");
      if (!fp) {
        fp = "fp_" + crypto.getRandomValues(new Uint32Array(4)).join("-");
        localStorage.setItem("vga_fp", fp);
      }
      return fp;
    } catch {
      return "fp_unknown";
    }
  }

  async init() {
    const body = { type: "init", name: this.name, ownerid: this.ownerid, ver: this.version };
    // legado: servidores antigos ainda exigem o secret no init (o novo ignora)
    if (this.secret) body.secret = this.secret;
    const r = await this._post(body);
    if (!(await this._verify(r))) return this._fail("signature_mismatch");
    this.message = r.message;
    if (r.success) {
      this.sessionid = r.sessionid;
      this.enckey = r.enckey;
      return true;
    }
    return false;
  }

  async register(username, pass, key, email = "") {
    return this._auth({ type: "register", username, pass, key, email });
  }

  async login(username, pass) {
    return this._auth({ type: "login", username, pass });
  }

  async license(key) {
    return this._auth({ type: "license", key });
  }

  async check() {
    const r = await this._post({ type: "check", sessionid: this.sessionid });
    if (!(await this._verify(r))) { this.loggedIn = false; return this._fail("signature_mismatch"); }
    this.message = r.message;
    this.banned = r.banned === true;
    this.banReason = r.reason || "";
    if (!r.success) this.loggedIn = false;
    return !!r.success;
  }

  async log(message) {
    const r = await this._post({ type: "log", sessionid: this.sessionid, message });
    return !!r.success;
  }

  // ── internos ──────────────────────────────────────────────────────────────
  async _auth(extra) {
    if (!this.sessionid) return this._fail("not_initialized");
    const r = await this._post({
      sessionid: this.sessionid,
      hwid_mb: VgAuth.fingerprint(),
      hwid_cpu: "web",
      ...extra,
    });
    if (!(await this._verify(r))) return this._fail("signature_mismatch");
    this.message = r.message;
    this.banned = r.banned === true;
    this.banReason = r.reason || "";
    if (r.success) {
      this.user = r.info || null;
      this.loggedIn = true;
      return true;
    }
    return false;
  }

  /** Mensagem amigável em PT-BR para exibir ao usuário final */
  errorText() {
    if (this.banned) return "Você foi banido." + (this.banReason ? " Motivo: " + this.banReason : "");
    const map = {
      invalid_credentials: "Usuário ou senha incorretos.",
      invalid_key: "Key inválida ou inexistente.",
      key_already_used: "Essa key já foi utilizada.",
      key_banned: "Essa key foi banida.",
      key_revoked: "Essa key foi revogada.",
      key_paused: "Essa key está pausada.",
      subscription_expired: "Sua assinatura expirou.",
      subscription_invalid: "Sua assinatura não é mais válida.",
      hwid_mismatch: "Esta key está vinculada a outro dispositivo.",
      rate_limited: "Muitas tentativas. Aguarde 1 minuto.",
      app_disabled: "Aplicação desativada.",
      invalid_session: "Sessão inválida. Recarregue a página.",
      missing_session: "Sessão inválida. Recarregue a página.",
      signature_mismatch: "Falha de segurança: resposta não autenticada.",
      not_initialized: "Cliente não inicializado.",
    };
    return map[this.message] || "Erro: " + this.message;
  }

  async _post(body) {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  /** Verifica assinatura da resposta + frescor (120s) — anti emulador/replay.
   *  Com pubkey embutida exige o campo `sig` (ECDSA P-256); no modo legado
   *  cai para `signature` (HMAC com o secret). */
  async _verify(r) {
    if (!r || !r.ts) return false;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - r.ts) > 120) return false;
    const payload = `${r.success ? "1" : "0"}|${r.message ?? ""}|${r.sessionid ?? ""}|${r.ts}`;
    const bytes = new TextEncoder().encode(payload);
    const subtle = globalThis.crypto?.subtle || (await import("crypto")).webcrypto.subtle;

    if (this.publicKey) {
      if (!r.sig) return false; // fail-closed: nunca cai p/ HMAC tendo pubkey
      try {
        const jwk = {
          kty: "EC", crv: "P-256",
          x: VgAuth._hexToB64u(this.publicKey.slice(0, 64)),
          y: VgAuth._hexToB64u(this.publicKey.slice(64)),
        };
        const key = await subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
        const sig = VgAuth._hexToBytes(r.sig);
        return await subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, sig, bytes);
      } catch {
        return false;
      }
    }

    if (!this.secret || !r.signature) return false;
    const key = await subtle.importKey(
      "raw", new TextEncoder().encode(this.secret),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const mac = await subtle.sign("HMAC", key, bytes);
    const hex = [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, "0")).join("");
    // comparação em tempo constante
    if (hex.length !== r.signature.length) return false;
    let diff = 0;
    for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ r.signature.charCodeAt(i);
    return diff === 0;
  }

  static _hexToBytes(h) {
    if (!h || h.length % 2) return new Uint8Array(0);
    const out = new Uint8Array(h.length / 2);
    for (let i = 0; i < out.length; i++) out[i] = parseInt(h.substr(i * 2, 2), 16);
    return out;
  }

  static _hexToB64u(h) {
    const bytes = VgAuth._hexToBytes(h);
    const b64 = typeof btoa !== "undefined"
      ? btoa(String.fromCharCode(...bytes))
      : Buffer.from(bytes).toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  _fail(m) { this.message = m; return false; }
}

if (typeof module !== "undefined") module.exports = VgAuth;
