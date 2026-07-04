import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

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
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // Endpoint that returns the real IP seen by the server (used by admin whitelist UI)
  app.get("/api/my-ip", (req, res) => {
    const headers = req.headers;
    // Try all common proxy headers in priority order
    const candidates = [
      (headers["x-forwarded-for"] as string || "").split(",")[0].trim(),
      headers["x-real-ip"] as string || "",
      headers["cf-connecting-ip"] as string || "",
      headers["true-client-ip"] as string || "",
      headers["x-client-ip"] as string || "",
      req.socket?.remoteAddress || "",
    ];
    const raw = candidates.find(c => c && c.length > 0) || "";
    // Normalize IPv6-mapped IPv4
    let ip = raw.trim();
    const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
    if (mapped) ip = mapped[1];
    if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") ip = "127.0.0.1";
    res.json({
      ip,
      raw,
      allHeaders: {
        "x-forwarded-for": headers["x-forwarded-for"],
        "x-real-ip": headers["x-real-ip"],
        "cf-connecting-ip": headers["cf-connecting-ip"],
        "true-client-ip": headers["true-client-ip"],
        "x-client-ip": headers["x-client-ip"],
        "socket": req.socket?.remoteAddress,
      },
    });
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
