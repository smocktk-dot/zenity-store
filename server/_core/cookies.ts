import type { CookieOptions, Request } from "express";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string) {
  // Basic IPv4 check and IPv6 presence detection.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  return host.includes(":");
}

function isSecureRequest(req: Request) {
  if (req.protocol === "https") return true;

  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");

  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

function getCookieDomain(req: Request) {
  const hostname = req.hostname || (req.headers["x-forwarded-host"] as string) || (req.headers.host as string);
  if (!hostname) return undefined;
  const host = hostname.split(":")[0].toLowerCase();

  if (LOCAL_HOSTS.has(host) || isIpAddress(host)) {
    return undefined;
  }

  // Platform/public-suffix domains (e.g. *.vercel.app) — browsers reject cookies
  // with Domain set to a public suffix, so use a host-only cookie instead.
  if (host === "vercel.app" || host.endsWith(".vercel.app") || host.endsWith(".now.sh")) {
    return undefined;
  }

  // Share cookie across www and root domain
  const parts = host.split(".");
  if (parts.length <= 2) {
    return `.${host}`;
  }
  return `.${parts.slice(-2).join(".")}`;
}

export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const secure = isSecureRequest(req);
  return {
    domain: getCookieDomain(req),
    httpOnly: true,
    path: "/",
    // SameSite=None requires Secure; use lax on plain http so the cookie is still accepted
    sameSite: secure ? "none" : "lax",
    secure,
  };
}
