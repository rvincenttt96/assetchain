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
import { createServer as createViteServer } from "vite";

const prisma = new PrismaClient();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  JWT_SECRET: z.string().min(32),
  DEMO_MODE: z.enum(["true", "false"]).default("true"),
  IRR_PER_USDT: z.coerce.number().int().nonnegative().default(0)
});

const env = envSchema.parse(process.env);
const isProduction = env.NODE_ENV === "production";
const isDemoMode = env.DEMO_MODE === "true";
const SESSION_COOKIE = isProduction
  ? "__Host-assetchain_session"
  : "assetchain_session";

const MICROS_PER_USDT = 1_000_000n;
const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

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

function requireAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
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

    req.auth = {
      userId: payload.sub,
      email: String((payload as JwtPayload).email)
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


const TSETMC_SYNC_TTL_MS = 60_000;
let lastTsetmcSyncAttemptAt = 0;
let tsetmcSyncInFlight: Promise<void> | null = null;

async function syncTsetmcMarketData(): Promise<void> {
  const now = Date.now();

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

    const results = await Promise.allSettled(
      assets.map(async (asset) => {
        if (!asset.tsetmcInsCode) return;

        const response = await fetch(
          `https://cdn.tsetmc.com/api/ClosingPrice/GetClosingPriceInfo/${asset.tsetmcInsCode}`,
          {
            signal: AbortSignal.timeout(8_000),
            headers: {
              accept: "application/json"
            }
          }
        );

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
              env.IRR_PER_USDT > 0
                ? (lastPrice * MICROS_PER_USDT) / BigInt(env.IRR_PER_USDT)
                : 0n,
            marketUpdatedAt: new Date()
          }
        });
      })
    );

    const failed = results.filter(
      (result) => result.status === "rejected"
    );

    if (failed.length > 0) {
      console.warn(
        `TSETMC sync completed with ${failed.length} failed instrument(s).`
      );
    }
  })().finally(() => {
    tsetmcSyncInFlight = null;
  });

  return tsetmcSyncInFlight;
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
    transactions: user.trades.map((trade) => ({
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
      status: "completed"
    })),
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

async function startServer() {
  const app = express();

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
      appName: "AssetChain API",
      demoMode: isDemoMode,
      timestamp: new Date().toISOString()
    });
  });

  app.get(
    "/api/assets",
    asyncRoute(async (req, res) => {
      await syncTsetmcMarketData().catch((error) => {
        console.warn("TSETMC sync failed; serving stored market data.", error);
      });

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
      await syncTsetmcMarketData().catch((error) => {
        console.warn("TSETMC sync failed; serving stored market data.", error);
      });

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
              descriptionFa: "Ø­Ø³Ø§Ø¨ Ú©Ø§Ø±Ø¨Ø±ÛŒ Ø§ÛŒØ¬Ø§Ø¯ Ø´Ø¯"
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

      await prisma.activity.create({
        data: {
          userId: user.id,
          type: "login",
          descriptionEn: "User logged in successfully",
          descriptionFa: "ÙˆØ±ÙˆØ¯ Ù…ÙˆÙÙ‚ÛŒØªâ€ŒØ¢Ù…ÛŒØ² Ø¨Ù‡ Ø­Ø³Ø§Ø¨ Ú©Ø§Ø±Ø¨Ø±ÛŒ"
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

          if (asset.priceMicros <= 0n) {
            throw new HttpError(
              503,
              "TRADING_PRICE_UNAVAILABLE",
              "Trading is disabled until a valid backend conversion price is available."
            );
          }

          const grossMicros = asset.priceMicros * BigInt(input.shares);
          const feeMicros = grossMicros / 1000n;
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
              descriptionFa: `Ø®Ø±ÛŒØ¯ ${input.shares} Ø³Ù‡Ù… Ø§Ø² #${asset.id}`
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

          if (asset.priceMicros <= 0n) {
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
          const feeMicros = grossMicros / 1000n;
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
              descriptionFa: `ÙØ±ÙˆØ´ ${input.shares} Ø³Ù‡Ù… Ø§Ø² #${asset.id}`
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

  app.post("/api/user/deposit", requireAuth, (_req, _res, next) => {
    next(
      new HttpError(
        501,
        "DEPOSIT_DISABLED",
        "Deposits are disabled until blockchain confirmation is implemented."
      )
    );
  });

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

  const server = app.listen(env.PORT, "0.0.0.0", () => {
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
