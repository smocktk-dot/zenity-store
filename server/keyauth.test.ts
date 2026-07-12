import { afterEach, describe, expect, it, vi } from "vitest";
import { keyauthCreateLicense } from "./keyauth";

describe("keyauthCreateLicense", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns and validates a single key", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, key: "ZENITY-ONE" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(keyauthCreateLicense({
      sellerKey: "seller",
      durationDays: 30,
      quantity: 1,
    })).resolves.toEqual(["ZENITY-ONE"]);

    const requestUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(requestUrl.searchParams.get("expiry")).toBe("30");
    expect(requestUrl.searchParams.get("amount")).toBe("1");
  });

  it("maps lifetime plans to expiry zero", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, keys: ["A", "B"] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(keyauthCreateLicense({
      sellerKey: "seller",
      durationDays: 9999,
      quantity: 2,
    })).resolves.toEqual(["A", "B"]);

    const requestUrl = new URL(fetchMock.mock.calls[0][0]);
    expect(requestUrl.searchParams.get("expiry")).toBe("0");
  });

  it("rejects a successful response that does not contain every key", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, keys: ["ONLY-ONE"] }),
    }));

    await expect(keyauthCreateLicense({
      sellerKey: "seller",
      durationDays: 30,
      quantity: 2,
    })).rejects.toThrow("retornou 1 de 2 licença(s)");
  });

  it("rejects an unconfigured seller key before calling the API", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(keyauthCreateLicense({
      sellerKey: "",
      durationDays: 30,
      quantity: 1,
    })).rejects.toThrow("Seller key da KeyAuth não configurada");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
