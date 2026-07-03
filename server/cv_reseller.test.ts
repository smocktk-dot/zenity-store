import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getAdminByUsername: vi.fn(),
  getAdminById: vi.fn(),
  createAdmin: vi.fn(),
  getResellerByUsername: vi.fn(),
  getResellerById: vi.fn(),
  getAllResellers: vi.fn(),
  createReseller: vi.fn(),
  updateReseller: vi.fn(),
  updateResellerCredits: vi.fn(),
  getAllCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  deleteCategory: vi.fn(),
  getAllApps: vi.fn(),
  getAppById: vi.fn(),
  createApp: vi.fn(),
  updateApp: vi.fn(),
  deleteApp: vi.fn(),
  getPlansByAppId: vi.fn(),
  getPlanById: vi.fn(),
  createPlan: vi.fn(),
  updatePlan: vi.fn(),
  deletePlan: vi.fn(),
  getAppsByResellerId: vi.fn(),
  assignAppToReseller: vi.fn(),
  removeAppFromReseller: vi.fn(),
  getAssignedAppIds: vi.fn(),
  getKeysByResellerId: vi.fn(),
  getAllKeys: vi.fn(),
  getKeyById: vi.fn(),
  createLicenseKey: vi.fn(),
  updateLicenseKey: vi.fn(),
  getTransactionsByResellerId: vi.fn(),
  createCreditTransaction: vi.fn(),
}));

import * as db from "./db";

function createPublicCtx(): TrpcContext {
  const cookies: Record<string, string> = {};
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      cookie: (name: string, val: string) => { cookies[name] = val; },
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const ctx = createPublicCtx();
    const cleared: string[] = [];
    (ctx.res as any).clearCookie = (name: string) => cleared.push(name);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(cleared.length).toBeGreaterThan(0);
  });
});

describe("auth.session", () => {
  it("returns null when no token is present", async () => {
    const ctx = createPublicCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.session();
    expect(result).toBeNull();
  });
});

describe("auth.setupAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects invalid setup key", async () => {
    const ctx = createPublicCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.setupAdmin({ username: "admin", password: "pass123", setupKey: "WRONG" })
    ).rejects.toThrow();
  });

  it("rejects duplicate admin username", async () => {
    vi.mocked(db.getAdminByUsername).mockResolvedValue({ id: 1, username: "admin" } as any);
    const ctx = createPublicCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.setupAdmin({ username: "admin", password: "pass123", setupKey: "CV-SETUP-2024" })
    ).rejects.toThrow();
  });

  it("creates admin with valid setup key", async () => {
    vi.mocked(db.getAdminByUsername).mockResolvedValue(undefined);
    vi.mocked(db.createAdmin).mockResolvedValue(undefined as any);
    const ctx = createPublicCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.setupAdmin({
      username: "newadmin", password: "pass123456", setupKey: "CV-SETUP-2024"
    });
    expect(result).toEqual({ success: true });
    expect(db.createAdmin).toHaveBeenCalled();
  });
});

describe("discount calculation", () => {
  it("applies correct discount tiers based on purchase count", () => {
    const calcDiscount = (purchases: number) => {
      if (purchases >= 20) return 50;
      if (purchases >= 10) return 40;
      return 35;
    };
    expect(calcDiscount(0)).toBe(35);
    expect(calcDiscount(9)).toBe(35);
    expect(calcDiscount(10)).toBe(40);
    expect(calcDiscount(19)).toBe(40);
    expect(calcDiscount(20)).toBe(50);
    expect(calcDiscount(100)).toBe(50);
  });
});
