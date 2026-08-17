import type { Express, Request, Response } from "express";
import { getResellerById, getOtherStoreResellerByDiscordId } from "../db";
import { signCustomJwt, CUSTOM_COOKIE } from "../routers";
import { getSessionCookieOptions } from "./cookies";

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1539006266003685446";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "sxrZe2ezIbCNFLllzwXtt-lOxbL08xak";
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || "https://vgsellers.lat/api/auth/discord/callback";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerDiscordOAuth(app: Express) {
  app.get("/api/auth/discord", (_req: Request, res: Response) => {
    const url = new URL("https://discord.com/oauth2/authorize");
    url.searchParams.set("client_id", DISCORD_CLIENT_ID);
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "identify");
    url.searchParams.set("prompt", "consent");
    res.redirect(302, url.toString());
  });

  app.get("/api/auth/discord/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const error = getQueryParam(req, "error");

    if (error) {
      res.redirect(302, "/?error=discord_denied");
      return;
    }
    if (!code) {
      res.redirect(302, "/?error=missing_code");
      return;
    }

    try {
      // 1. Trocar code por access token
      const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
          redirect_uri: REDIRECT_URI,
        }),
      });
      if (!tokenRes.ok) {
        const err = await tokenRes.text();
        console.error("[Discord OAuth] token exchange failed:", err);
        res.redirect(302, "/?error=discord_token");
        return;
      }
      const tokenData = await tokenRes.json() as any;

      // 2. Buscar info do usuario
      const userRes = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      if (!userRes.ok) {
        const err = await userRes.text();
        console.error("[Discord OAuth] user info failed:", err);
        res.redirect(302, "/?error=discord_user");
        return;
      }
      const user = await userRes.json() as any;
      const discordId = String(user.id);

      // 3. Verificar se esse Discord ID esta vinculado a um Other Store reseller
      const otherStore = await getOtherStoreResellerByDiscordId(discordId);
      if (!otherStore) {
        res.redirect(302, "/?error=discord_not_linked");
        return;
      }

      const reseller = await getResellerById(otherStore.resellerId);
      if (!reseller || reseller.status !== "active") {
        res.redirect(302, "/?error=account_inactive");
        return;
      }

      // 4. Criar sessao longa (30 dias)
      const tokenPayload: Record<string, any> = {
        sub: String(reseller.id),
        role: "reseller",
        username: reseller.username,
        otherStoreId: otherStore.id,
      };
      const token = await signCustomJwt(tokenPayload);
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(CUSTOM_COOKIE, token, { ...cookieOptions, maxAge: 30 * 24 * 3600 * 1000 });

      res.redirect(302, "/reseller");
    } catch (err) {
      console.error("[Discord OAuth] callback error:", err);
      res.redirect(302, "/?error=discord_error");
    }
  });
}
