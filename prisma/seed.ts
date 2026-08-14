import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FALLBACK_IRR_PER_USDT = 1_872_520n;
const MICROS_PER_USDT = 1_000_000n;
const SNAPSHOT_DATE = new Date("2026-08-11T00:00:00.000Z");

const assets = [
  {
    id: "KGOL",
    enName: "Gol Gohar Mining and Industrial",
    faName: "\u06a9\u06af\u0644",
    category: "metals",
    bourseSymbol: "\u06a9\u06af\u0644",
    tsetmcInsCode: "35700344742885862",
    lastPriceRial: 2908n,
    closingPriceRial: 2909n,
    yesterdayPriceRial: 2833n,
    dayLowRial: 2850n,
    dayHighRial: 2917n,
    tradeVolume: 1892402175n
  },
  {
    id: "DTMAD",
    enName: "Darou Pakhsh Raw Materials",
    faName: "\u062f\u062a\u0645\u0627\u062f",
    category: "pharma",
    bourseSymbol: "\u062f\u062a\u0645\u0627\u062f",
    tsetmcInsCode: "34641719089573667",
    lastPriceRial: 42920n,
    closingPriceRial: 42360n,
    yesterdayPriceRial: 43570n,
    dayLowRial: 42270n,
    dayHighRial: 44600n,
    tradeVolume: 10775094n
  },
  {
    id: "SHTRAN",
    enName: "Tehran Oil Refining",
    faName: "\u0634\u062a\u0631\u0627\u0646",
    category: "petro",
    bourseSymbol: "\u0634\u062a\u0631\u0627\u0646",
    tsetmcInsCode: "51617145873056483",
    lastPriceRial: 5030n,
    closingPriceRial: 5030n,
    yesterdayPriceRial: 4890n,
    dayLowRial: 5030n,
    dayHighRial: 5030n,
    tradeVolume: 473740863n
  },
  {
    id: "SHASTA",
    enName: "Social Security Investment",
    faName: "\u0634\u0633\u062a\u0627",
    category: "investment",
    bourseSymbol: "\u0634\u0633\u062a\u0627",
    tsetmcInsCode: "2400322364771558",
    lastPriceRial: 2778n,
    closingPriceRial: 2778n,
    yesterdayPriceRial: 2698n,
    dayLowRial: 2778n,
    dayHighRial: 2778n,
    tradeVolume: 1129013058n
  },
  {
    id: "KAVEH",
    enName: "South Kaveh Steel",
    faName: "\u06a9\u0627\u0648\u0647",
    category: "metals",
    bourseSymbol: "\u06a9\u0627\u0648\u0647",
    tsetmcInsCode: "60350996279289099",
    lastPriceRial: 5450n,
    closingPriceRial: 5460n,
    yesterdayPriceRial: 5360n,
    dayLowRial: 5380n,
    dayHighRial: 5520n,
    tradeVolume: 63057019n
  }
];

function priceMicros(lastPriceRial: bigint): bigint {
  return (
    lastPriceRial * MICROS_PER_USDT +
    FALLBACK_IRR_PER_USDT / 2n
  ) / FALLBACK_IRR_PER_USDT;
}

function changePercent(last: bigint, yesterday: bigint): number {
  if (yesterday <= 0n) return 0;

  return Number(
    (
      ((Number(last) - Number(yesterday)) / Number(yesterday)) *
      100
    ).toFixed(2)
  );
}

async function main() {
  for (const asset of assets) {
    const metadata = {
      enName: asset.enName,
      faName: asset.faName,
      category: asset.category,
      bourseSymbol: asset.bourseSymbol,
      tsetmcInsCode: asset.tsetmcInsCode,
      tsetmcUrl: `https://main.tsetmc.com/InstInfo/${asset.tsetmcInsCode}`,
      flag: "ir",
      locationEn: "Iran",
      locationFa: "ایران",
      progress: 100
    };

    const fallbackMarketData = {
      lastPriceRial: asset.lastPriceRial,
      closingPriceRial: asset.closingPriceRial,
      yesterdayPriceRial: asset.yesterdayPriceRial,
      dayLowRial: asset.dayLowRial,
      dayHighRial: asset.dayHighRial,
      tradeVolume: asset.tradeVolume,
      priceMicros: priceMicros(asset.lastPriceRial),
      change: changePercent(
        asset.lastPriceRial,
        asset.yesterdayPriceRial
      ),
      marketUpdatedAt: SNAPSHOT_DATE
    };

    const existing = await prisma.asset.findUnique({
      where: { id: asset.id },
      select: {
        lastPriceRial: true,
        marketUpdatedAt: true
      }
    });

    if (!existing) {
      await prisma.asset.create({
        data: {
          id: asset.id,
          ...metadata,
          ...fallbackMarketData
        }
      });
      continue;
    }

    const shouldApplyFallback =
      existing.lastPriceRial === null ||
      existing.lastPriceRial <= 0n ||
      existing.marketUpdatedAt === null ||
      existing.marketUpdatedAt < SNAPSHOT_DATE;

    await prisma.asset.update({
      where: { id: asset.id },
      data: shouldApplyFallback
        ? {
            ...metadata,
            ...fallbackMarketData
          }
        : metadata
    });
  }

  console.log(
    "Production fallback seed completed: 5 TSETMC snapshot assets (2026-08-11)."
  );
}
main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });