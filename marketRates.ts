type NobitexStatsResponse = {
  status?: string;
  stats?: Record<
    string,
    {
      mark?: string;
      bestBuy?: string;
      bestSell?: string;
    }
  >;
};

export type UsdtRialRate = {
  rateRial: number;
  rateToman: number;
  source: "nobitex" | "env";
  updatedAt: string;
};

const NOBITEX_URL =
  "https://apiv2.nobitex.ir/market/stats?srcCurrency=usdt&dstCurrency=rls";

const CACHE_TTL_MS = 30_000;

let cache:
  | {
      value: UsdtRialRate;
      expiresAt: number;
    }
  | undefined;

function positiveNumber(value: unknown): number | undefined {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

export async function getUsdtRialRate(
  fallbackRial = 0
): Promise<UsdtRialRate> {
  const now = Date.now();

  if (cache && cache.expiresAt > now) {
    return cache.value;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const response = await fetch(NOBITEX_URL, {
      signal: controller.signal,
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Nobitex HTTP ${response.status}`);
    }

    const data = (await response.json()) as NobitexStatsResponse;
    const market = data.stats?.["usdt-rls"];

    const bestBuy = positiveNumber(market?.bestBuy);
    const bestSell = positiveNumber(market?.bestSell);

    const rateRial =
      positiveNumber(market?.mark) ??
      (bestBuy && bestSell ? Math.round((bestBuy + bestSell) / 2) : undefined);

    if (!rateRial) {
      throw new Error("Nobitex returned no valid USDT/RLS rate");
    }

    const value: UsdtRialRate = {
      rateRial: Math.round(rateRial),
      rateToman: Math.round(rateRial / 10),
      source: "nobitex",
      updatedAt: new Date().toISOString()
    };

    cache = {
      value,
      expiresAt: now + CACHE_TTL_MS
    };

    return value;
  } catch (error) {
    if (fallbackRial > 0) {
      return {
        rateRial: Math.round(fallbackRial),
        rateToman: Math.round(fallbackRial / 10),
        source: "env",
        updatedAt: new Date().toISOString()
      };
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
