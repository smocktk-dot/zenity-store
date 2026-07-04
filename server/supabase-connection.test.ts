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
    getResellerByUsername: vi.fn(async () => undefined),
    upsertUser: vi.fn(async () => {}),
    getUserByOpenId: vi.fn(async () => undefined),
    getAllResellers: vi.fn(async () => []),
    getAllApps: vi.fn(async () => []),
    getAllCategories: vi.fn(async () => []),
    getAllKeys: vi.fn(async () => []),
    getDb: vi.fn(async () => null),
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
  };
  return { req: mockReq, res: mockRes, user: null, ...overrides };
}

describe("Admin Login (PostgreSQL schema)", () => {
  it("returns success token for valid admin credentials", async () => {
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
});
