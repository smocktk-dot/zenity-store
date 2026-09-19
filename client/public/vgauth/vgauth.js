/**
 * ============================================================================
 *  VG AUTH — Cliente Web (browser / Node 18+)
 *  Endpoint: POST https://vgsellers.lat/api/vgauth/v1
 *
 *  USO:
 *    const auth = new VgAuth("MeuSite", "OWNER_ID", "SECRET", "1.0");
 *    await auth.init();
 *    await auth.register("user", "pass", "KEY", "email@x.com");
 *    await auth.login("user", "pass");        // ou auth.license("KEY")
 *    await auth.check();                      // heartbeat
 *
 *  HWID: no browser não existe serial de placa-mãe/CPU — o cliente gera um
 *  fingerprint persistente (localStorage) que é enviado como hwid_mb.
 *  Para sites, recomenda-se fazer as chamadas a partir do SEU backend (o
 *  secret não fica exposto no código público do front-end).
 * ============================================================================
 */
class VgAuth {
  constructor(name, ownerid, secret, version = "1.0", endpoint = "https://vgsellers.lat/api/vgauth/v1") {
    this.name = name;
    this.ownerid = ownerid;
    this.secret = secret;
    this.version = version;
    this.endpoint = endpoint;
    this.sessionid = null;
    this.enckey = null;
    this.loggedIn = false;
    this.user = null;
    this.message = "";
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
    const r = await this._post({ type: "init", name: this.name, ownerid: this.ownerid, secret: this.secret, ver: this.version });
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
    if (!r.success) this.loggedIn = false;
    this.message = r.message;
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
    if (r.success) {
      this.user = r.info || null;
      this.loggedIn = true;
      return true;
    }
    return false;
  }

  async _post(body) {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  /** Verifica assinatura HMAC-SHA256 + frescor (120s) — anti emulador/replay */
  async _verify(r) {
    if (!r || !r.signature || !r.ts) return false;
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - r.ts) > 120) return false;
    const payload = `${r.success ? "1" : "0"}|${r.message ?? ""}|${r.sessionid ?? ""}|${r.ts}`;
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(this.secret),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    const hex = [...new Uint8Array(mac)].map(b => b.toString(16).padStart(2, "0")).join("");
    // comparação em tempo constante
    if (hex.length !== r.signature.length) return false;
    let diff = 0;
    for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ r.signature.charCodeAt(i);
    return diff === 0;
  }

  _fail(m) { this.message = m; return false; }
}

if (typeof module !== "undefined") module.exports = VgAuth;
