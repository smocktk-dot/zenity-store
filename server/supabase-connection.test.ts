import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/trpc";

// Mock the db module to test the admin login flow
vi.mock("./db", async () => {
  const bcrypt = await import("bcryptjs");
  const passwordHash = await bcrypt.hash("admin123", 10);
  return {
    getAdminByUsername: vi.fn(async (username: string) => {
      if (username === "admin") {
        return { id: 1, username: "admin", passwordHash, createdAt: new Date(), updatedAt: new Date() };
      }
      return undefined;
    }),
    getAdminById: vi.fn(async (id: number) => {
      if (id === 1) {
        const bcrypt2 = await import("bcryptjs");
        const hash = await bcrypt2.hash("admin123", 10);
        return { id: 1, username: "admin", passwordHash: hash, createdAt: new Date(), updatedAt: new Date() };
      }
      return undefined;
    }),
    getResellerByUsername: vi.fn(async () => undefined),
    getResellerById: vi.fn(async () => undefined),
    upsertUser: vi.fn(async () => {}),
    getUserByOpenId: vi.fn(async () => undefined),
    getAllResellers: vi.fn(async () => []),
    getAllApps: vi.fn(async () => []),
    getAllCategories: vi.fn(async () => []),
    getAllKeys: vi.fn(async () => []),
    getDb: vi.fn(async () => null),
    // IP Whitelist — empty list means allow all
    isIpWhitelisted: vi.fn(async () => true),
    getAllIpWhitelist: vi.fn(async () => []),
    addIpToWhitelist: vi.fn(async () => {}),
    removeIpFromWhitelist: vi.fn(async () => {}),
    // Password management
    updateAdminPassword: vi.fn(async () => {}),
    updateResellerPassword: vi.fn(async () => {}),
  };
});

function makeCtx(overrides: Partial<TrpcContext> = {}): TrpcContext {
  const mockRes: any = {
    setHeader: vi.fn(),
    getHeader: vi.fn(),
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  };
  const mockReq: any = {
    headers: {},
    cookies: {},
    socket: { remoteAddress: "127.0.0.1" },
  };
  return { req: mockReq, res: mockRes, user: null, ...overrides };
}

describe("Admin Login (PostgreSQL schema)", () => {
  it("returns success token for valid admin credentials when IP is whitelisted", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.adminLogin({ username: "admin", password: "admin123" });
    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("role", "admin");
  });

  it("throws for invalid admin credentials", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.adminLogin({ username: "admin", password: "wrongpassword" })
    ).rejects.toThrow();
  });

  it("blocks admin login when IP is not in non-empty whitelist", async () => {
    // Override isIpWhitelisted to return false (IP blocked)
    const { isIpWhitelisted } = await import("./db");
    (isIpWhitelisted as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.adminLogin({ username: "admin", password: "admin123" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
