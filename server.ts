import "dotenv/config";

import path from "node:path";
import cookieParser from "cookie-parser";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

const { verify, sign } = jwt;import { compare, hash } from "bcryptjs";
import { Prisma, PrismaClient } from "@prisma/client";
import { z, ZodError } from "zod";
import { getUsdtRialRate } from "./marketRates";
import { createServer as createViteServer } from "vite";

const prisma = new PrismaClient();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  JWT_SECRET: z.string().min(32),
  DEMO_MODE: z.enum(["true", "false"]).default("true"),
  IRR_PER_USDT: z.coerce.number().int().nonnegative().default(0),
  TSETMC_SYNC_ENABLED: z.enum(["true", "false"]).default("false"),
  TSETMC_CLOSING_PRICE_BASE_URL: z.string().url().default("https://cdn.tsetmc.com/api/ClosingPrice/GetClosingPriceInfo"),
  TSETMC_PROXY_BASE_URL: z.string().default(""),
  TSETMC_PROXY_SECRET: z.string().default("")
});

const env = envSchema.parse(process.env);
const isProduction = env.NODE_ENV === "production";
const isDemoMode = env.DEMO_MODE === "true";
const SESSION_COOKIE = isProduction
  ? "__Host-assetchain_session"
  : "assetchain_session";

const MICROS_PER_USDT = 1_000_000n;
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const MARKET_PRICE_MAX_AGE_MS = 5 * 60 * 1000;
const STORED_USDT_RIAL_FALLBACK = 1_864_140;

function usdtRateFallbackRial(): number {
  return env.IRR_PER_USDT > 0 ? env.IRR_PER_USDT : STORED_USDT_RIAL_FALLBACK;
}

function hasFreshTradingPrice(asset: { priceMicros: bigint; marketUpdatedAt: Date | null }): boolean {
  return (
    asset.priceMicros > 0n &&
    asset.marketUpdatedAt !== null &&
    Date.now() - asset.marketUpdatedAt.getTime() <= MARKET_PRICE_MAX_AGE_MS
  );
}

function hasTradablePrice(asset: {
  priceMicros: bigint;
  lastPriceRial: bigint | null;
}): boolean {
  return asset.priceMicros > 0n && asset.lastPriceRial !== null && asset.lastPriceRial > 0n;
}

function toMicros(value: number): bigint {
  return BigInt(Math.round(value * Number(MICROS_PER_USDT)));
}

function normalizeTxid(network: string, txid: string): string {
  const trimmed = txid.trim().toLowerCase();
  if (network === "trc20") {
    return trimmed.replace(/^0x/, "");
  }
  return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`;
}

function isValidTxid(network: string, txid: string): boolean {
  if (network === "trc20") {
    return /^(0x)?[0-9a-f]{64}$/.test(txid);
  }
  return /^0x[0-9a-f]{64}$/.test(txid);
}

type AuthRequest = Request & {
  auth?: {
    userId: string;
    email: string;
  };
};

class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

function fromMicros(value: bigint): number {
  return Number(value) / Number(MICROS_PER_USDT);
}

function formatDate(value: Date): string {
  return value.toISOString().replace("T", " ").slice(0, 16);
}

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE_MS
  };
}

function createSessionToken(userId: string, email: string): string {
  return sign({ email }, env.JWT_SECRET, {
    subject: userId,
    expiresIn: "7d",
    issuer: "assetchain-api",
    audience: "assetchain-web"
  });
}

async function requireAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.[SESSION_COOKIE];

    if (typeof token !== "string" || token.length === 0) {
      throw new HttpError(401, "UNAUTHENTICATED", "Please sign in.");
    }

    const payload = verify(token, env.JWT_SECRET, {
      issuer: "assetchain-api",
      audience: "assetchain-web"
    });

    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      typeof (payload as JwtPayload).email !== "string"
    ) {
      throw new HttpError(401, "INVALID_SESSION", "Invalid session.");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, isActive: true }
    });

    if (!user || !user.isActive) {
      throw new HttpError(403, "ACCOUNT_INACTIVE", "This account is inactive.");
    }

    req.auth = {
      userId: user.id,
      email: user.email
    };

    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
      return;
    }

    next(new HttpError(401, "INVALID_SESSION", "Session expired or invalid."));
  }
}

const ADMIN_ROLES = new Set([
  "SUPER_ADMIN",
  "FINANCE_ADMIN",
  "ASSET_ADMIN",
  "SUPPORT_ADMIN"
]);

async function requireAdmin(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.auth?.userId) {
      throw new HttpError(401, "UNAUTHENTICATED", "Please sign in.");
    }

    const user = await prisma.user.findUnique({
      where: { id: req.auth.userId },
      select: { role: true, isActive: true }
    });

    if (!user || !user.isActive) {
      throw new HttpError(403, "ADMIN_ACCOUNT_INACTIVE", "Admin account is inactive.");
    }

    if (!ADMIN_ROLES.has(user.role)) {
      throw new HttpError(403, "ADMIN_FORBIDDEN", "Admin access required.");
    }

    next();
  } catch (error) {
    next(error);
  }
}
function asyncRoute(
  handler: (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => Promise<void>
) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    void Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function serializeAsset(asset: {
  id: string;
  enName: string;
  faName: string;
  category: string;
  priceMicros: bigint;
  change: number;
  flag: string;
  locationEn: string;
  locationFa: string;
  progress: number;
  descriptionEn: string | null;
  descriptionFa: string | null;
  backingEn: string | null;
  backingFa: string | null;
  custodianEn: string | null;
  custodianFa: string | null;
  riskLevel: string | null;
  payoutIntervalEn: string | null;
  payoutIntervalFa: string | null;
  tsetmcUrl: string | null;
  bourseSymbol: string | null;
  tsetmcInsCode: string | null;
  lastPriceRial: bigint | null;
  closingPriceRial: bigint | null;
  yesterdayPriceRial: bigint | null;
  dayLowRial: bigint | null;
  dayHighRial: bigint | null;
  tradeVolume: bigint | null;
  marketUpdatedAt: Date | null;
}) {
  return {
    id: asset.id,
    enName: asset.enName,
    faName: asset.faName,
    category: asset.category,
    price: fromMicros(asset.priceMicros),
    change: asset.change,
    flag: asset.flag,
    locationEn: asset.locationEn,
    locationFa: asset.locationFa,
    progress: asset.progress,
    descriptionEn: asset.descriptionEn ?? undefined,
    descriptionFa: asset.descriptionFa ?? undefined,
    backingEn: asset.backingEn ?? undefined,
    backingFa: asset.backingFa ?? undefined,
    custodianEn: asset.custodianEn ?? undefined,
    custodianFa: asset.custodianFa ?? undefined,
    riskLevel: asset.riskLevel ?? undefined,
    payoutIntervalEn: asset.payoutIntervalEn ?? undefined,
    payoutIntervalFa: asset.payoutIntervalFa ?? undefined,
    tsetmcUrl: asset.tsetmcUrl ?? undefined,
    bourseSymbol: asset.bourseSymbol ?? undefined,
    tsetmcInsCode: asset.tsetmcInsCode ?? undefined,
    lastPriceRial: asset.lastPriceRial === null ? undefined : Number(asset.lastPriceRial),
    closingPriceRial: asset.closingPriceRial === null ? undefined : Number(asset.closingPriceRial),
    yesterdayPriceRial: asset.yesterdayPriceRial === null ? undefined : Number(asset.yesterdayPriceRial),
    dayLowRial: asset.dayLowRial === null ? undefined : Number(asset.dayLowRial),
    dayHighRial: asset.dayHighRial === null ? undefined : Number(asset.dayHighRial),
    tradeVolume: asset.tradeVolume === null ? undefined : Number(asset.tradeVolume),
    marketUpdatedAt: asset.marketUpdatedAt?.toISOString()
  };
}


const TSETMC_SYNC_TTL_MS = 30_000;
const TSETMC_RETRY_AFTER_FAILURE_MS = 15 * 60 * 1000;
const USDT_PRICE_REFRESH_TTL_MS = 30_000;
const TSETMC_FETCH_TIMEOUT_MS = 8_000;
let lastTsetmcSyncFailedAt = 0;

function tsetmcClosingPriceUrl(insCode: string): string {
  const officialPath = "/api/ClosingPrice/GetClosingPriceInfo";
  const proxyBase = env.TSETMC_PROXY_BASE_URL.trim().replace(/\/$/, "");

  if (proxyBase) {
    return `${proxyBase}${officialPath}/${insCode}`;
  }

  return `${env.TSETMC_CLOSING_PRICE_BASE_URL.replace(/\/$/, "")}/${insCode}`;
}

function tsetmcFetchHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    accept: "application/json"
  };

  if (env.TSETMC_PROXY_SECRET) {
    headers.Authorization = `Bearer ${env.TSETMC_PROXY_SECRET}`;
  }

  return headers;
}
let lastTsetmcSyncAttemptAt = 0;
let tsetmcSyncInFlight: Promise<void> | null = null;
let lastUsdtPriceRefreshAt = 0;
let usdtPriceRefreshInFlight: Promise<void> | null = null;

async function syncTsetmcMarketData(): Promise<void> {
  if (env.TSETMC_SYNC_ENABLED !== "true") return;
  const now = Date.now();

  if (
    lastTsetmcSyncFailedAt > 0 &&
    now - lastTsetmcSyncFailedAt < TSETMC_RETRY_AFTER_FAILURE_MS
  ) {
    return;
  }

  if (now - lastTsetmcSyncAttemptAt < TSETMC_SYNC_TTL_MS) {
    return;
  }

  if (tsetmcSyncInFlight) {
    return tsetmcSyncInFlight;
  }

  lastTsetmcSyncAttemptAt = now;

  tsetmcSyncInFlight = (async () => {
    const assets = await prisma.asset.findMany({
      where: {
        tsetmcInsCode: {
          not: null
        }
      },
      select: {
        id: true,
        tsetmcInsCode: true
      }
    });

    const usdtRate = await getUsdtRialRate(usdtRateFallbackRial()).catch(() => null);

  const results = await Promise.allSettled(
      assets.map(async (asset) => {
        if (!asset.tsetmcInsCode) return;

        const response = await fetch(tsetmcClosingPriceUrl(asset.tsetmcInsCode), {
          signal: AbortSignal.timeout(TSETMC_FETCH_TIMEOUT_MS),
          headers: tsetmcFetchHeaders()
        });

        if (!response.ok) {
          throw new Error(
            `TSETMC ${asset.id} returned HTTP ${response.status}`
          );
        }

        const payload = (await response.json()) as {
          closingPriceInfo?: Record<string, unknown>;
        };

        const quote: Record<string, unknown> = payload.closingPriceInfo ?? (payload as unknown as Record<string, unknown>);

        const readInteger = (value: unknown): bigint | null => {
          const numberValue = Number(value);

          if (!Number.isFinite(numberValue) || numberValue < 0) {
            return null;
          }

          return BigInt(Math.trunc(numberValue));
        };

        const lastPrice = readInteger(quote.pDrCotVal);
        const closingPrice = readInteger(quote.pClosing);
        const yesterdayPrice = readInteger(quote.priceYesterday);
        const dayLow = readInteger(quote.priceMin);
        const dayHigh = readInteger(quote.priceMax);
        const tradeVolume = readInteger(quote.qTotTran5J);

        if (lastPrice === null || lastPrice <= 0n) {
          throw new Error(`TSETMC ${asset.id} returned an invalid last price`);
        }

        const yesterdayNumber =
          yesterdayPrice === null ? 0 : Number(yesterdayPrice);

        const change =
          yesterdayNumber > 0
            ? ((Number(lastPrice) - yesterdayNumber) / yesterdayNumber) * 100
            : 0;

        await prisma.asset.update({
          where: {
            id: asset.id
          },
          data: {
            lastPriceRial: lastPrice,
            closingPriceRial: closingPrice,
            yesterdayPriceRial: yesterdayPrice,
            dayLowRial: dayLow,
            dayHighRial: dayHigh,
            tradeVolume,
            change,
            priceMicros:
          usdtRate
            ? (lastPrice * MICROS_PER_USDT) / BigInt(usdtRate.rateRial)
            : 0n,
            marketUpdatedAt: new Date()
          }
        });
      })
    );

    const failed = results.filter(
      (result) => result.status === "rejected"
    );
    const succeeded = results.filter(
      (result) => result.status === "fulfilled"
    );

    if (succeeded.length > 0) {
      lastTsetmcSyncFailedAt = 0;
    }

    if (failed.length > 0) {
      const first = failed[0];
      const reason =
        first.status === "rejected" ? first.reason : "unknown";
      console.warn(
        `TSETMC sync completed with ${failed.length} failed instrument(s).`,
        reason
      );
      if (succeeded.length === 0) {
        lastTsetmcSyncFailedAt = Date.now();
      }
    }
  })().finally(() => {
    tsetmcSyncInFlight = null;
  });

  return tsetmcSyncInFlight;
}

async function refreshUsdtFromStoredRial(force = false): Promise<void> {
  const now = Date.now();

  if (!force && now - lastUsdtPriceRefreshAt < USDT_PRICE_REFRESH_TTL_MS) {
    return usdtPriceRefreshInFlight ?? Promise.resolve();
  }

  if (usdtPriceRefreshInFlight) {
    return usdtPriceRefreshInFlight;
  }

  lastUsdtPriceRefreshAt = now;

  usdtPriceRefreshInFlight = (async () => {
    const usdtRate = await getUsdtRialRate(usdtRateFallbackRial());
    const assets = await prisma.asset.findMany({
      select: {
        id: true,
        lastPriceRial: true
      }
    });

    await Promise.all(
      assets.map(async (asset) => {
        if (!asset.lastPriceRial || asset.lastPriceRial <= 0n) {
          return;
        }

        await prisma.asset.update({
          where: {
            id: asset.id
          },
          data: {
            priceMicros:
              (asset.lastPriceRial * MICROS_PER_USDT) / BigInt(usdtRate.rateRial),
            marketUpdatedAt: new Date()
          }
        });
      })
    );
  })().finally(() => {
    usdtPriceRefreshInFlight = null;
  });

  return usdtPriceRefreshInFlight;
}

async function ensureFreshMarketPrices(forceUsdtRefresh = false): Promise<void> {
  // Never block page/API load on TSETMC. The Cloudflare proxy hop is only
  // for background rial quotes; USDT conversion stays on the request path.
  void syncTsetmcMarketData().catch((error) => {
    console.warn("TSETMC sync failed; serving stored market data.", error);
  });
  await refreshUsdtFromStoredRial(forceUsdtRefresh).catch((error) => {
    console.warn("USDT price refresh failed; serving stored conversion.", error);
  });
}

async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      account: true,
      holdings: {
        orderBy: { assetId: "asc" }
      },
      purchaseLots: {
        where: { remainingShares: { gt: 0 } },
        orderBy: { createdAt: "asc" }
      },
      trades: {
        orderBy: { createdAt: "desc" },
        take: 100
      },
      depositRequests: {
        orderBy: { createdAt: "desc" },
        take: 100
      },
      activities: {
        orderBy: { createdAt: "desc" },
        take: 100
      }
    }
  });

  if (!user || !user.account) {
    throw new HttpError(404, "USER_NOT_FOUND", "User account not found.");
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    usdtBalance: fromMicros(user.account.usdtBalanceMicros),
    tomanBalance: Number(user.account.tomanBalance),
    role: user.role,
    isActive: user.isActive,
    portfolio: user.holdings.map((holding) => ({
      assetId: holding.assetId,
      shares: holding.shares,
      avgPrice: fromMicros(holding.avgPriceMicros)
    })),
    purchaseLots: user.purchaseLots.map((lot) => ({
      id: lot.id,
      assetId: lot.assetId,
      shares: lot.remainingShares,
      price: fromMicros(lot.buyPriceMicros),
      date: formatDate(lot.createdAt)
    })),
    transactions: [
      ...user.trades.map((trade) => ({
        id: trade.id,
        type: trade.type === "BUY" ? "buy" : "sell",
        asset: trade.assetId,
        amount: `${trade.type === "BUY" ? "-" : "+"}${fromMicros(
          trade.netMicros
        ).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6
        })} USDT`,
        date: formatDate(trade.createdAt),
        status: "completed" as const,
        sortAt: trade.createdAt.getTime()
      })),
      ...user.depositRequests.map((deposit) => ({
        id: deposit.id,
        type: "deposit" as const,
        asset: deposit.network.toUpperCase(),
        amount: `+${fromMicros(deposit.amountMicros).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 6
        })} USDT`,
        date: formatDate(deposit.createdAt),
        status:
          deposit.status === "APPROVED"
            ? ("completed" as const)
            : deposit.status === "REJECTED"
              ? ("rejected" as const)
              : ("pending" as const),
        sortAt: deposit.createdAt.getTime()
      }))
    ]
      .sort((left, right) => right.sortAt - left.sortAt)
      .map(({ sortAt: _sortAt, ...transaction }) => transaction),
    activities: user.activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      descriptionEn: activity.descriptionEn,
      descriptionFa: activity.descriptionFa,
      date: formatDate(activity.createdAt)
    }))
  };
}

const authSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8).max(128)
});

const registerSchema = authSchema.extend({
  name: z.string().trim().min(2).max(80)
});

const tradeSchema = z.object({
  assetId: z.string().trim().min(1).max(40).transform((value) => value.toUpperCase()),
  shares: z.coerce.number().int().positive().max(1_000_000),
  idempotencyKey: z.string().uuid()
});


const adminStatusSchema = z.object({
  isActive: z.boolean()
});

const adminRoleSchema = z.object({
  role: z.enum(["USER", "SUPER_ADMIN", "FINANCE_ADMIN", "ASSET_ADMIN", "SUPPORT_ADMIN"])
});

const depositRequestSchema = z.object({
  network: z.enum(["trc20", "erc20", "bep20"]),
  txid: z.string().trim().min(16).max(80),
  amountUsdt: z.coerce.number().positive().min(10).max(1_000_000)
});

const depositReviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  reviewNote: z.string().trim().max(240).optional()
});

async function requireFinanceAdminUser(userId: string): Promise<void> {
  const admin = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true }
  });

  if (
    !admin ||
    !admin.isActive ||
    (admin.role !== "SUPER_ADMIN" && admin.role !== "FINANCE_ADMIN")
  ) {
    throw new HttpError(403, "FINANCE_ADMIN_REQUIRED", "Finance admin access required.");
  }
}

async function requireSuperAdminUser(userId: string): Promise<void> {
  const admin = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, isActive: true }
  });

  if (!admin || !admin.isActive || admin.role !== "SUPER_ADMIN") {
    throw new HttpError(403, "SUPER_ADMIN_REQUIRED", "Super admin access required.");
  }
}

async function writeAdminAudit(input: {
  req: AuthRequest;
  action: string;
  entityType: string;
  entityId?: string;
  targetUserId?: string;
  description: string;
  beforeJson?: string;
  afterJson?: string;
}): Promise<void> {
  await prisma.adminAuditLog.create({
    data: {
      adminUserId: input.req.auth!.userId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      targetUserId: input.targetUserId,
      description: input.description,
      beforeJson: input.beforeJson,
      afterJson: input.afterJson,
      ipAddress: input.req.ip,
      userAgent: input.req.get("user-agent") ?? undefined
    }
  });
}

async function startServer() {
  const app = express();
if (isProduction) app.set("trust proxy", 1);

  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: isProduction ? undefined : false
    })
  );
  app.use(express.json({ limit: "32kb" }));
  app.use(cookieParser());

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many authentication attempts. Try again later."
      }
    }
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      success: true,
      status: "ok",
      appName: "RWA API",
      demoMode: isDemoMode,
      timestamp: new Date().toISOString()
    });
  });

  app.get(
    "/api/market/usdt-rate",
    asyncRoute(async (_req, res) => {
      const rate = await getUsdtRialRate(usdtRateFallbackRial());
      res.json({ success: true, ...rate });
    })
  );

  app.get(
    "/api/assets",
    asyncRoute(async (req, res) => {
      await ensureFreshMarketPrices();

      const category =
        typeof req.query.category === "string" ? req.query.category : undefined;

      const assets = await prisma.asset.findMany({
        where:
          category && category !== "all"
            ? {
                category
              }
            : undefined,
        orderBy: { id: "asc" }
      });

      res.json({
        success: true,
        assets: assets.map(serializeAsset)
      });
    })
  );

  app.get(
    "/api/assets/:id",
    asyncRoute(async (req, res) => {
      await ensureFreshMarketPrices();

      const asset = await prisma.asset.findUnique({
        where: { id: String(req.params.id).toUpperCase() }
      });

      if (!asset) {
        throw new HttpError(404, "ASSET_NOT_FOUND", "Asset not found.");
      }

      res.json({
        success: true,
        asset: serializeAsset(asset)
      });
    })
  );

  app.post(
    "/api/auth/register",
    authLimiter,
    asyncRoute(async (req, res) => {
      const input = registerSchema.parse(req.body);

      const existing = await prisma.user.findUnique({
        where: { email: input.email }
      });

      if (existing) {
        throw new HttpError(
          409,
          "EMAIL_EXISTS",
          "An account with this email already exists."
        );
      }

      const passwordHash = await hash(input.password, 12);

      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          passwordHash,
          account: {
            create: {
              usdtBalanceMicros: 0,
              tomanBalance: 0
            }
          },
          activities: {
            create: {
              type: "signup",
              descriptionEn: "Account created",
              descriptionFa: "حساب کاربری ایجاد شد"
            }
          }
        }
      });

      const token = createSessionToken(user.id, user.email);
      res.cookie(SESSION_COOKIE, token, sessionCookieOptions());

      res.status(201).json({
        success: true,
        profile: await getProfile(user.id)
      });
    })
  );

  app.post(
    "/api/auth/login",
    authLimiter,
    asyncRoute(async (req, res) => {
      const input = authSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email: input.email }
      });

      if (!user || !(await compare(input.password, user.passwordHash))) {
        throw new HttpError(
          401,
          "INVALID_CREDENTIALS",
          "Email or password is incorrect."
        );
      }

      if (!user.isActive) {
        throw new HttpError(403, "ACCOUNT_INACTIVE", "This account is inactive.");
      }

      await prisma.activity.create({
        data: {
          userId: user.id,
          type: "login",
          descriptionEn: "User logged in successfully",
          descriptionFa: "ورود کاربر با موفقیت انجام شد"
        }
      });

      const token = createSessionToken(user.id, user.email);
      res.cookie(SESSION_COOKIE, token, sessionCookieOptions());

      res.json({
        success: true,
        profile: await getProfile(user.id)
      });
    })
  );

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie(SESSION_COOKIE, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      path: "/"
    });

    res.json({ success: true });
  });

  app.get(
    "/api/user/profile",
    requireAuth,
    asyncRoute(async (req, res) => {
      res.json({
        success: true,
        profile: await getProfile(req.auth!.userId)
      });
    })
  );

  app.post(
    "/api/trades/buy",
    requireAuth,
    asyncRoute(async (req, res) => {
      const input = tradeSchema.parse(req.body);
      const userId = req.auth!.userId;
      await ensureFreshMarketPrices(true);

      await prisma.$transaction(
        async (tx) => {
          const duplicate = await tx.trade.findUnique({
            where: { idempotencyKey: input.idempotencyKey }
          });

          if (duplicate) {
            if (duplicate.userId !== userId) {
              throw new HttpError(
                409,
                "IDEMPOTENCY_CONFLICT",
                "This request identifier is already in use."
              );
            }
            return;
          }

          const asset = await tx.asset.findUnique({
            where: { id: input.assetId }
          });

          if (!asset) {
            throw new HttpError(
              404,
              "ASSET_NOT_FOUND",
              "Asset not found."
            );
          }

          if (!hasTradablePrice(asset)) {
            throw new HttpError(
              503,
              "TRADING_PRICE_UNAVAILABLE",
              "Trading is disabled until a valid backend conversion price is available."
            );
          }

          const grossMicros = asset.priceMicros * BigInt(input.shares);
          const feeMicros = (grossMicros * 35n) / 1000n;
          const totalMicros = grossMicros + feeMicros;

          const accountUpdate = await tx.account.updateMany({
            where: {
              userId,
              usdtBalanceMicros: {
                gte: totalMicros
              }
            },
            data: {
              usdtBalanceMicros: {
                decrement: totalMicros
              }
            }
          });

          if (accountUpdate.count !== 1) {
            throw new HttpError(
              400,
              "INSUFFICIENT_BALANCE",
              "Insufficient USDT balance."
            );
          }

          const holding = await tx.holding.findUnique({
            where: {
              userId_assetId: {
                userId,
                assetId: asset.id
              }
            }
          });

          if (holding) {
            const newShares = holding.shares + input.shares;
            const previousCost =
              holding.avgPriceMicros * BigInt(holding.shares);
            const newAverage =
              (previousCost + grossMicros) / BigInt(newShares);

            await tx.holding.update({
              where: { id: holding.id },
              data: {
                shares: newShares,
                avgPriceMicros: newAverage
              }
            });
          } else {
            await tx.holding.create({
              data: {
                userId,
                assetId: asset.id,
                shares: input.shares,
                avgPriceMicros: asset.priceMicros
              }
            });
          }

          await tx.purchaseLot.create({
            data: {
              userId,
              assetId: asset.id,
              remainingShares: input.shares,
              buyPriceMicros: asset.priceMicros
            }
          });

          await tx.trade.create({
            data: {
              idempotencyKey: input.idempotencyKey,
              userId,
              assetId: asset.id,
              type: "BUY",
              shares: input.shares,
              priceMicros: asset.priceMicros,
              grossMicros,
              feeMicros,
              netMicros: totalMicros
            }
          });

          await tx.activity.create({
            data: {
              userId,
              type: "trade",
              descriptionEn: `Bought ${input.shares} shares of #${asset.id}`,
              descriptionFa: `خرید ${input.shares} سهم از #${asset.id}`
            }
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable
        }
      );

      res.json({
        success: true,
        profile: await getProfile(userId)
      });
    })
  );

  app.post(
    "/api/trades/sell",
    requireAuth,
    asyncRoute(async (req, res) => {
      const input = tradeSchema.parse(req.body);
      const userId = req.auth!.userId;
      await ensureFreshMarketPrices(true);

      await prisma.$transaction(
        async (tx) => {
          const duplicate = await tx.trade.findUnique({
            where: { idempotencyKey: input.idempotencyKey }
          });

          if (duplicate) {
            if (duplicate.userId !== userId) {
              throw new HttpError(
                409,
                "IDEMPOTENCY_CONFLICT",
                "This request identifier is already in use."
              );
            }
            return;
          }

          const asset = await tx.asset.findUnique({
            where: { id: input.assetId }
          });

          if (!asset) {
            throw new HttpError(
              404,
              "ASSET_NOT_FOUND",
              "Asset not found."
            );
          }

          if (!hasTradablePrice(asset)) {
            throw new HttpError(
              503,
              "TRADING_PRICE_UNAVAILABLE",
              "Trading is disabled until a valid backend conversion price is available."
            );
          }

          const holding = await tx.holding.findUnique({
            where: {
              userId_assetId: {
                userId,
                assetId: asset.id
              }
            }
          });

          if (!holding || holding.shares < input.shares) {
            throw new HttpError(
              400,
              "INSUFFICIENT_SHARES",
              "Insufficient shares."
            );
          }

          const grossMicros = asset.priceMicros * BigInt(input.shares);
          const feeMicros = (grossMicros * 35n) / 1000n;
          const netMicros = grossMicros - feeMicros;
          const remainingHoldingShares = holding.shares - input.shares;

          if (remainingHoldingShares === 0) {
            await tx.holding.delete({
              where: { id: holding.id }
            });
          } else {
            await tx.holding.update({
              where: { id: holding.id },
              data: {
                shares: remainingHoldingShares
              }
            });
          }

          let sharesToConsume = input.shares;
          const lots = await tx.purchaseLot.findMany({
            where: {
              userId,
              assetId: asset.id,
              remainingShares: { gt: 0 }
            },
            orderBy: { createdAt: "asc" }
          });

          for (const lot of lots) {
            if (sharesToConsume === 0) break;

            const consumed = Math.min(lot.remainingShares, sharesToConsume);
            const remaining = lot.remainingShares - consumed;

            if (remaining === 0) {
              await tx.purchaseLot.delete({
                where: { id: lot.id }
              });
            } else {
              await tx.purchaseLot.update({
                where: { id: lot.id },
                data: { remainingShares: remaining }
              });
            }

            sharesToConsume -= consumed;
          }

          if (sharesToConsume !== 0) {
            throw new HttpError(
              409,
              "LOT_INTEGRITY_ERROR",
              "Purchase lots do not match the holding."
            );
          }

          await tx.account.update({
            where: { userId },
            data: {
              usdtBalanceMicros: {
                increment: netMicros
              }
            }
          });

          await tx.trade.create({
            data: {
              idempotencyKey: input.idempotencyKey,
              userId,
              assetId: asset.id,
              type: "SELL",
              shares: input.shares,
              priceMicros: asset.priceMicros,
              grossMicros,
              feeMicros,
              netMicros
            }
          });

          await tx.activity.create({
            data: {
              userId,
              type: "trade",
              descriptionEn: `Sold ${input.shares} shares of #${asset.id}`,
              descriptionFa: `فروش ${input.shares} سهم از #${asset.id}`
            }
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable
        }
      );

      res.json({
        success: true,
        profile: await getProfile(userId)
      });
    })
  );

  app.get(
    "/api/admin/overview",
    requireAuth,
    requireAdmin,
    asyncRoute(async (_req, res) => {
      const [users, activeUsers, trades, assets, accounts, buyAgg, sellAgg, feeAgg] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.trade.count(),
        prisma.asset.count(),
        prisma.account.findMany({ select: { usdtBalanceMicros: true } }),
        prisma.trade.aggregate({ where: { type: "BUY" }, _sum: { grossMicros: true } }),
        prisma.trade.aggregate({ where: { type: "SELL" }, _sum: { grossMicros: true } }),
        prisma.trade.aggregate({ _sum: { feeMicros: true } })
      ]);

      const userBalanceMicros = accounts.reduce((sum, account) => sum + account.usdtBalanceMicros, 0n);

      res.json({
        success: true,
        overview: {
          totals: {
            users,
            activeUsers,
            trades,
            assets,
            userBalancesUsdt: fromMicros(userBalanceMicros),
            buyVolumeUsdt: fromMicros(buyAgg._sum.grossMicros ?? 0n),
            sellVolumeUsdt: fromMicros(sellAgg._sum.grossMicros ?? 0n),
            feesUsdt: fromMicros(feeAgg._sum.feeMicros ?? 0n)
          }
        }
      });
    })
  );

  app.get(
    "/api/admin/users",
    requireAuth,
    requireAdmin,
    asyncRoute(async (_req, res) => {
      const users = await prisma.user.findMany({
        include: { account: true },
        orderBy: { createdAt: "desc" },
        take: 250
      });

      res.json({
        success: true,
        users: users.map((user) => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          usdtBalance: fromMicros(user.account?.usdtBalanceMicros ?? 0n),
          createdAt: user.createdAt.toISOString()
        }))
      });
    })
  );

  app.get(
    "/api/admin/trades",
    requireAuth,
    requireAdmin,
    asyncRoute(async (_req, res) => {
      const trades = await prisma.trade.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 250
      });

      res.json({
        success: true,
        trades: trades.map((trade) => ({
          id: trade.id,
          userName: trade.user.name,
          userEmail: trade.user.email,
          assetId: trade.assetId,
          type: trade.type,
          shares: trade.shares,
          priceUsdt: fromMicros(trade.priceMicros),
          grossUsdt: fromMicros(trade.grossMicros),
          feeUsdt: fromMicros(trade.feeMicros),
          netUsdt: fromMicros(trade.netMicros),
          createdAt: trade.createdAt.toISOString()
        }))
      });
    })
  );

  app.get(
    "/api/admin/assets",
    requireAuth,
    requireAdmin,
    asyncRoute(async (_req, res) => {
      const assets = await prisma.asset.findMany({ orderBy: { id: "asc" } });
      res.json({
        success: true,
        assets: assets.map((asset) => ({
          id: asset.id,
          enName: asset.enName,
          price: fromMicros(asset.priceMicros),
          change: asset.change,
          marketUpdatedAt: asset.marketUpdatedAt?.toISOString()
        }))
      });
    })
  );

  app.get(
    "/api/admin/audit",
    requireAuth,
    requireAdmin,
    asyncRoute(async (_req, res) => {
      const audit = await prisma.adminAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 250
      });

      res.json({
        success: true,
        audit: audit.map((item) => ({
          id: item.id,
          adminUserId: item.adminUserId,
          action: item.action,
          entityType: item.entityType,
          entityId: item.entityId ?? undefined,
          targetUserId: item.targetUserId ?? undefined,
          description: item.description,
          createdAt: item.createdAt.toISOString()
        }))
      });
    })
  );

  app.patch(
    "/api/admin/users/:id/status",
    requireAuth,
    requireAdmin,
    asyncRoute(async (req, res) => {
      await requireSuperAdminUser(req.auth!.userId);
      const input = adminStatusSchema.parse(req.body);
      const targetId = String(req.params.id);

      if (targetId === req.auth!.userId) {
        throw new HttpError(400, "SELF_STATUS_CHANGE_BLOCKED", "You cannot deactivate your own admin account.");
      }

      const before = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true, email: true, isActive: true } });
      if (!before) throw new HttpError(404, "USER_NOT_FOUND", "User not found.");

      await prisma.user.update({ where: { id: targetId }, data: { isActive: input.isActive } });
      await writeAdminAudit({
        req,
        action: "USER_STATUS_UPDATE",
        entityType: "User",
        entityId: targetId,
        targetUserId: targetId,
        description: `Changed ${before.email} active status to ${input.isActive}.`,
        beforeJson: JSON.stringify({ isActive: before.isActive }),
        afterJson: JSON.stringify({ isActive: input.isActive })
      });

      res.json({ success: true });
    })
  );

  app.patch(
    "/api/admin/users/:id/role",
    requireAuth,
    requireAdmin,
    asyncRoute(async (req, res) => {
      await requireSuperAdminUser(req.auth!.userId);
      const input = adminRoleSchema.parse(req.body);
      const targetId = String(req.params.id);

      if (targetId === req.auth!.userId) {
        throw new HttpError(400, "SELF_ROLE_CHANGE_BLOCKED", "You cannot change your own admin role.");
      }

      const before = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true, email: true, role: true } });
      if (!before) throw new HttpError(404, "USER_NOT_FOUND", "User not found.");

      await prisma.user.update({ where: { id: targetId }, data: { role: input.role } });
      await writeAdminAudit({
        req,
        action: "USER_ROLE_UPDATE",
        entityType: "User",
        entityId: targetId,
        targetUserId: targetId,
        description: `Changed ${before.email} role from ${before.role} to ${input.role}.`,
        beforeJson: JSON.stringify({ role: before.role }),
        afterJson: JSON.stringify({ role: input.role })
      });

      res.json({ success: true });
    })
  );

  app.get(
    "/api/user/deposits",
    requireAuth,
    asyncRoute(async (req, res) => {
      const deposits = await prisma.depositRequest.findMany({
        where: { userId: req.auth!.userId },
        orderBy: { createdAt: "desc" },
        take: 50
      });

      res.json({
        success: true,
        deposits: deposits.map((deposit) => ({
          id: deposit.id,
          network: deposit.network,
          txid: deposit.txid,
          amountUsdt: fromMicros(deposit.amountMicros),
          status: deposit.status,
          createdAt: deposit.createdAt.toISOString()
        }))
      });
    })
  );

  app.post(
    "/api/user/deposit",
    requireAuth,
    asyncRoute(async (req, res) => {
      const input = depositRequestSchema.parse(req.body);
      const txid = normalizeTxid(input.network, input.txid);

      if (!isValidTxid(input.network, txid)) {
        throw new HttpError(400, "INVALID_TXID", "Transaction hash format is invalid for this network.");
      }

      const amountMicros = toMicros(input.amountUsdt);
      const existing = await prisma.depositRequest.findUnique({
        where: {
          network_txid: {
            network: input.network,
            txid
          }
        }
      });

      if (existing) {
        throw new HttpError(409, "TXID_ALREADY_SUBMITTED", "This transaction hash was already submitted.");
      }

      const deposit = await prisma.depositRequest.create({
        data: {
          userId: req.auth!.userId,
          network: input.network,
          txid,
          amountMicros
        }
      });

      await prisma.activity.create({
        data: {
          userId: req.auth!.userId,
          type: "deposit",
          descriptionEn: `Deposit request ${fromMicros(amountMicros)} USDT on ${input.network.toUpperCase()} is waiting for admin review.`,
          descriptionFa: `درخواست واریز ${fromMicros(amountMicros)} تتر روی ${input.network.toUpperCase()} ثبت شد و منتظر تأیید ادمین است.`
        }
      });

      res.status(201).json({
        success: true,
        deposit: {
          id: deposit.id,
          network: deposit.network,
          txid: deposit.txid,
          amountUsdt: fromMicros(deposit.amountMicros),
          status: deposit.status
        },
        profile: await getProfile(req.auth!.userId)
      });
    })
  );

  app.get(
    "/api/admin/deposits",
    requireAuth,
    requireAdmin,
    asyncRoute(async (_req, res) => {
      const deposits = await prisma.depositRequest.findMany({
        include: { user: { select: { name: true, email: true } } },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 250
      });

      res.json({
        success: true,
        deposits: deposits.map((deposit) => ({
          id: deposit.id,
          userName: deposit.user.name,
          userEmail: deposit.user.email,
          userId: deposit.userId,
          network: deposit.network,
          txid: deposit.txid,
          amountUsdt: fromMicros(deposit.amountMicros),
          status: deposit.status,
          reviewNote: deposit.reviewNote,
          createdAt: deposit.createdAt.toISOString(),
          reviewedAt: deposit.reviewedAt?.toISOString()
        }))
      });
    })
  );

  app.post(
    "/api/admin/deposits/:id/review",
    requireAuth,
    requireAdmin,
    asyncRoute(async (req, res) => {
      await requireFinanceAdminUser(req.auth!.userId);
      const input = depositReviewSchema.parse(req.body);
      const depositId = String(req.params.id);

      await prisma.$transaction(async (tx) => {
        const deposit = await tx.depositRequest.findUnique({
          where: { id: depositId }
        });

        if (!deposit) {
          throw new HttpError(404, "DEPOSIT_NOT_FOUND", "Deposit request not found.");
        }

        if (deposit.status !== "PENDING") {
          throw new HttpError(409, "DEPOSIT_ALREADY_REVIEWED", "This deposit was already reviewed.");
        }

        await tx.depositRequest.update({
          where: { id: deposit.id },
          data: {
            status: input.status,
            reviewNote: input.reviewNote,
            reviewedAt: new Date(),
            reviewedById: req.auth!.userId
          }
        });

        if (input.status === "APPROVED") {
          await tx.account.update({
            where: { userId: deposit.userId },
            data: {
              usdtBalanceMicros: {
                increment: deposit.amountMicros
              }
            }
          });
        }

        await tx.activity.create({
          data: {
            userId: deposit.userId,
            type: "deposit",
            descriptionEn:
              input.status === "APPROVED"
                ? `Deposit of ${fromMicros(deposit.amountMicros)} USDT was approved.`
                : `Deposit of ${fromMicros(deposit.amountMicros)} USDT was rejected.`,
            descriptionFa:
              input.status === "APPROVED"
                ? `واریز ${fromMicros(deposit.amountMicros)} تتر تأیید شد.`
                : `واریز ${fromMicros(deposit.amountMicros)} تتر رد شد.`
          }
        });
      });

      await writeAdminAudit({
        req,
        action: input.status === "APPROVED" ? "DEPOSIT_APPROVED" : "DEPOSIT_REJECTED",
        entityType: "DepositRequest",
        entityId: depositId,
        description: `${input.status} deposit ${depositId}.`,
        afterJson: JSON.stringify({ status: input.status, reviewNote: input.reviewNote })
      });

      res.json({ success: true });
    })
  );

  app.post("/api/user/withdraw", requireAuth, (_req, _res, next) => {
    next(
      new HttpError(
        501,
        "WITHDRAWAL_DISABLED",
        "Withdrawals are disabled until custody and blockchain settlement are implemented."
      )
    );
  });

  app.use(
    "/api",
    (_req, _res, next) =>
      next(new HttpError(404, "API_NOT_FOUND", "API endpoint not found."))
  );

  app.use(
    (
      error: unknown,
      _req: Request,
      res: Response,
      _next: NextFunction
    ) => {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Submitted data is invalid.",
            details: error.flatten()
          }
        });
        return;
      }

      if (error instanceof HttpError) {
        res.status(error.status).json({
          success: false,
          error: {
            code: error.code,
            message: error.message
          }
        });
        return;
      }

      console.error(error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected server error occurred."
        }
      });
    }
  );

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(env.PORT, isProduction ? "127.0.0.1" : "0.0.0.0", () => {
    console.log(
      `AssetChain running at http://localhost:${env.PORT} (${env.NODE_ENV})`
    );
  });

  const shutdown = async () => {
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});

