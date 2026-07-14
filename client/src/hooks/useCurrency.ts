import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

let cachedRate: number | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function fetchUsdRate(): Promise<number> {
  const now = Date.now();
  if (cachedRate && now - cacheTime < CACHE_TTL) return cachedRate;

  try {
    // Tenta AwesomeAPI (BRL/USD)
    const res = await fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL");
    if (res.ok) {
      const data = await res.json() as { USDBRL?: { bid?: string } };
      const rate = parseFloat(data?.USDBRL?.bid || "0");
      if (rate > 0) {
        cachedRate = rate;
        cacheTime = now;
        return rate;
      }
    }
  } catch { /* fallback */ }

  try {
    // Fallback: ExchangeRate API
    const res = await fetch("https://open.er-api.com/v6/latest/USD");
    if (res.ok) {
      const data = await res.json() as { rates?: { BRL?: number } };
      const rate = data?.rates?.BRL || 0;
      if (rate > 0) {
        cachedRate = rate;
        cacheTime = now;
        return rate;
      }
    }
  } catch { /* fallback */ }

  // Último fallback: cotação fixa aproximada
  return 5.7;
}

export function useCurrency() {
  const { language } = useLanguage();
  const [usdRate, setUsdRate] = useState<number>(5.7);

  useEffect(() => {
    if (language === "en") {
      fetchUsdRate().then(setUsdRate);
    }
  }, [language]);

  /**
   * Formata um valor em BRL.
   * - Se idioma = "pt" → exibe em R$ (reais)
   * - Se idioma = "en" → converte para USD e exibe em $
   */
  function fmt(brlValue: number, opts?: { decimals?: number }): string {
    const decimals = opts?.decimals ?? 2;
    if (language === "en") {
      const usd = brlValue / usdRate;
      return `$${usd.toFixed(decimals)}`;
    }
    return `R$ ${brlValue.toFixed(decimals)}`;
  }

  /**
   * Formata centavos (amountCents) em BRL ou USD
   */
  function fmtCents(cents: number, opts?: { decimals?: number }): string {
    return fmt(cents / 100, opts);
  }

  /**
   * Retorna o símbolo da moeda atual
   */
  const symbol = language === "en" ? "$" : "R$";

  /**
   * Converte BRL para USD (retorna número)
   */
  function toUsd(brl: number): number {
    return brl / usdRate;
  }

  return { fmt, fmtCents, symbol, usdRate, toUsd, language };
}
