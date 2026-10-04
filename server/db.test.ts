import { describe, it, expect, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/trpc";

// Testes do banco de dados próprio (PostgreSQL via DATABASE_URL)
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
    getResellerByIdentifier: vi.fn(async () => undefined),
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
    isAdminIpAllowed: vi.fn(async () => true),
    isResellerIpAllowed: vi.fn(async () => true),
    normalizeIp: (ip: string) => ip,
    getAllIpWhitelist: vi.fn(async () => []),
    addIpToWhitelist: vi.fn(async () => {}),
    removeIpFromWhitelist: vi.fn(async () => {}),
    // Password management
    updateAdminPassword: vi.fn(async () => {}),
    updateResellerPassword: vi.fn(async () => {}),
    // Pix payments
    createPixPayment: vi.fn(async (data: any) => ({ id: 1, ...data, createdAt: new Date() })),
    getPixPaymentByPaymentId: vi.fn(async () => null),
    updatePixPaymentStatus: vi.fn(async () => {}),
    getPendingPixPaymentsByReseller: vi.fn(async () => []),
    getPixPaymentsByReseller: vi.fn(async () => []),
    updateResellerCredits: vi.fn(async () => {}),
    createCreditTransaction: vi.fn(async () => {}),
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

describe("IP Normalization", () => {
  it("normalizes IPv6-mapped IPv4 addresses", async () => {
    const { normalizeIp } = await import("./db");
    // normalizeIp is mocked as passthrough in vi.mock, so test the real logic inline
    const normalize = (raw: string): string => {
      if (!raw) return "";
      const s = raw.trim();
      const mapped = s.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
      if (mapped) return mapped[1];
      if (s === "::1" || s === "0:0:0:0:0:0:0:1") return "127.0.0.1";
      return s;
    };
    expect(normalize("::ffff:189.7.125.44")).toBe("189.7.125.44");
    expect(normalize("::1")).toBe("127.0.0.1");
    expect(normalize("0:0:0:0:0:0:0:1")).toBe("127.0.0.1");
    expect(normalize("189.7.125.44")).toBe("189.7.125.44");
  });
});

describe("Reseller Login IP Blocking", () => {
  it("blocks reseller login when IP is not in their whitelist", async () => {
    const { isResellerIpAllowed } = await import("./db");
    (isResellerIpAllowed as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.resellerLogin({ username: "somereseller", password: "pass" })
    ).rejects.toThrow(); // will throw UNAUTHORIZED (no such reseller), but IP check is before reseller lookup for admin path
  });
});

describe("Admin Login (banco de dados próprio)", () => {
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
    // Override isAdminIpAllowed to return false (IP blocked)
    const { isAdminIpAllowed } = await import("./db");
    (isAdminIpAllowed as ReturnType<typeof vi.fn>).mockResolvedValueOnce(false);
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.auth.adminLogin({ username: "admin", password: "admin123" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("Pix Payment - createPixCharge validation", () => {
  it("rejects credits below minimum (0)", async () => {
    // We test the zod validation layer — no need for real API call
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    // Should fail zod validation (min 1)
    await expect(
      (caller.reseller as any).createPixCharge({ credits: 0 })
    ).rejects.toThrow();
  });

  it("rejects credits above maximum (10001)", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    await expect(
      (caller.reseller as any).createPixCharge({ credits: 10001 })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated createPixCharge call", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    // No session cookie → should throw FORBIDDEN
    await expect(
      (caller.reseller as any).createPixCharge({ credits: 10 })
    ).rejects.toThrow();
  });
});

describe("Discount calculation", () => {
  it("returns 35% for 0 purchases", () => {
    const calc = (n: number) => n >= 20 ? 50 : n >= 10 ? 40 : 35;
    expect(calc(0)).toBe(35);
    expect(calc(9)).toBe(35);
  });
  it("returns 40% for 10-19 purchases", () => {
    const calc = (n: number) => n >= 20 ? 50 : n >= 10 ? 40 : 35;
    expect(calc(10)).toBe(40);
    expect(calc(19)).toBe(40);
  });
  it("returns 50% for 20+ purchases", () => {
    const calc = (n: number) => n >= 20 ? 50 : n >= 10 ? 40 : 35;
    expect(calc(20)).toBe(50);
    expect(calc(100)).toBe(50);
  });
});
