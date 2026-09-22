import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerResellerApi } from "../resellerApi";
import { registerVgAuthApi } from "../vgauthApi";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handlePurinCashWebhook } from "../purinCashWebhook";
import { isIpBanned } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Webhook must use express.raw BEFORE the global json parser so we can validate HMAC
  app.post("/api/webhooks/purincash", express.raw({ type: "application/json" }), handlePurinCashWebhook);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerResellerApi(app);
  registerVgAuthApi(app);
  // Endpoint that returns the real IP seen by the server (used by admin whitelist UI)
  app.get("/api/my-ip", (req, res) => {
    const h = req.headers;
    // Priority: Cloudflare > true-client-ip > x-real-ip > x-forwarded-for > socket
    const candidates = [
      (h["cf-connecting-ip"] as string) || "",
      (h["true-client-ip"] as string) || "",
      (h["x-real-ip"] as string) || "",
      ((h["x-forwarded-for"] as string) || "").split(",")[0].trim(),
      (h["x-client-ip"] as string) || "",
      req.socket?.remoteAddress || "",
    ];
    const raw = candidates.find(c => c && c.length > 0) || "";
    // Normalize: ::ffff:x.x.x.x → IPv4, ::1 → 127.0.0.1, real IPv6 kept as-is
    let ip = raw.trim();
    const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    if (mapped) ip = mapped[1];
    if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") ip = "127.0.0.1";
    res.json({
      ip,
      raw,
      allHeaders: {
        "cf-connecting-ip": h["cf-connecting-ip"],
        "x-forwarded-for": h["x-forwarded-for"],
        "x-real-ip": h["x-real-ip"],
        "true-client-ip": h["true-client-ip"],
        "socket": req.socket?.remoteAddress,
      },
    });
  });

  // Ban check — isento do middleware de ban pra o frontend saber exibir a tela
  app.get("/api/ban-check", async (req, res) => {
    try {
      const h = req.headers;
      const candidates = [
        (h["cf-connecting-ip"] as string) || "",
        (h["true-client-ip"] as string) || "",
        (h["x-real-ip"] as string) || "",
        ((h["x-forwarded-for"] as string) || "").split(",")[0].trim(),
        req.socket?.remoteAddress || "",
      ];
      let ip = (candidates.find(c => c && c.length > 0) || "").trim();
      const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
      if (mapped) ip = mapped[1];
      if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") ip = "127.0.0.1";
      res.json({ banned: await isIpBanned(ip) });
    } catch {
      res.json({ banned: false });
    }
  });

  // IP banido → bloqueia toda a API
  app.use("/api", async (req, res, next) => {
    try {
      const h = req.headers;
      const candidates = [
        (h["cf-connecting-ip"] as string) || "",
        (h["true-client-ip"] as string) || "",
        (h["x-real-ip"] as string) || "",
        ((h["x-forwarded-for"] as string) || "").split(",")[0].trim(),
        req.socket?.remoteAddress || "",
      ];
      let ip = (candidates.find(c => c && c.length > 0) || "").trim();
      const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
      if (mapped) ip = mapped[1];
      if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") ip = "127.0.0.1";
      if (await isIpBanned(ip)) {
        return res.status(403).json({ error: "banned", message: "Você Foi Banido Seu Otario" });
      }
    } catch { /* falha no check não bloqueia o site */ }
    next();
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
