import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getResellerById } from "../db";
import { sdk } from "./sdk";
import { getCustomToken, verifyCustomJwt, CUSTOM_COOKIE } from "../routers";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  if (!user) {
    try {
      const token = getCustomToken(opts.req);
      if (token) {
        const payload = await verifyCustomJwt(token);
        if (payload?.sub && typeof payload.sub === "string") {
          const id = Number(payload.sub);
          if (!Number.isNaN(id)) {
            user = {
              id,
              openId: payload.sub,
              name: (payload.username as string) || undefined,
              email: null,
              loginMethod: "cv_session",
              role: payload.role === "admin" ? "admin" : "user",
              createdAt: new Date(),
              updatedAt: new Date(),
              lastSignedIn: new Date(),
            } as User;
          }
        }
      }
    } catch (err) {
      console.error("[Context] cv_session verification failed:", err);
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
