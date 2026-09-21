import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FALLBACK_IRR_PER_USDT = 1_864_140n;
const MICROS_PER_USDT = 1_000_000n;
const SNAPSHOT_DATE = new Date("2026-09-21T00:00:00.000Z");

const assets = [
  {
    id: "FARS",
    enName: "Persian Gulf Petrochemical Industries",
    faName: "صنایع پتروشیمی خلیج فارس",
    category: "petro",
    descriptionEn: "Iran’s largest petrochemical holding, with stakes across the Persian Gulf petrochemical value chain.",
    descriptionFa: "بزرگ‌ترین هلدینگ پتروشیمی ایران با سبدی از شرکت‌های زنجیره ارزش خلیج فارس.",
    bourseSymbol: "FARS",
    tsetmcInsCode: "25244329144808274",
    lastPriceRial: 9342n,
    closingPriceRial: 9342n,
    yesterdayPriceRial: 9342n,
    dayLowRial: 9342n,
    dayHighRial: 9342n,
    tradeVolume: 0n
  },
  {
    id: "NARENJ",
    enName: "Naranj Leveraged Equity Fund",
    faName: "نارنج اهرم",
    category: "investment",
    descriptionEn: "A leveraged equity ETF managed by Toranj that tracks the broader Iranian stock market with amplified exposure.",
    descriptionFa: "صندوق سهامی اهرمی نارنج تحت مدیریت ترنج، با نوسان بیشتر نسبت به بازار سهام ایران.",
    bourseSymbol: "NARENJ",
    tsetmcInsCode: "35831329532779850",
    lastPriceRial: 52455n,
    closingPriceRial: 52455n,
    yesterdayPriceRial: 52455n,
    dayLowRial: 52455n,
    dayHighRial: 52455n,
    tradeVolume: 0n
  },
  {
    id: "SHTRAN",
    enName: "Tehran Oil Refining",
    faName: "پالایش نفت تهران",
    category: "petro",
    descriptionEn: "An Iranian oil refining company that operates in petroleum refining and supplies refined petroleum products to the domestic energy market.",
    descriptionFa: "یک شرکت پالایشی ایرانی فعال در پالایش نفت و تأمین فرآورده‌های نفتی برای بازار انرژی داخلی.",
    bourseSymbol: "SHTRAN",
    tsetmcInsCode: "51617145873056483",
    lastPriceRial: 5256n,
    closingPriceRial: 5256n,
    yesterdayPriceRial: 5256n,
    dayLowRial: 5256n,
    dayHighRial: 5256n,
    tradeVolume: 0n
  },
  {
    id: "SHASTA",
    enName: "Social Security Investment",
    faName: "سرمایه‌گذاری تأمین اجتماعی",
    category: "investment",
    descriptionEn: "A diversified Iranian investment holding company with interests across multiple industrial, energy, pharmaceutical, mining, and financial sectors.",
    descriptionFa: "یک هلدینگ سرمایه‌گذاری متنوع ایرانی با فعالیت در چندین صنعت از جمله انرژی، دارو، معدن و خدمات مالی.",
    bourseSymbol: "SHASTA",
    tsetmcInsCode: "2400322364771558",
    lastPriceRial: 2880n,
    closingPriceRial: 2880n,
    yesterdayPriceRial: 2880n,
    dayLowRial: 2880n,
    dayHighRial: 2880n,
    tradeVolume: 0n
  },
  {
    id: "FMELI",
    enName: "National Iranian Copper Industries",
    faName: "ملی صنایع مس ایران",
    category: "metals",
    descriptionEn: "Iran’s primary copper miner and producer, covering extraction, smelting, and copper products.",
    descriptionFa: "شرکت اصلی استخراج و تولید مس ایران، فعال در معدن، ذوب و محصولات مسی.",
    bourseSymbol: "FMELI",
    tsetmcInsCode: "35425587644337450",
    lastPriceRial: 18710n,
    closingPriceRial: 18710n,
    yesterdayPriceRial: 18710n,
    dayLowRial: 18710n,
    dayHighRial: 18710n,
    tradeVolume: 0n
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
      descriptionEn: asset.descriptionEn,
      descriptionFa: asset.descriptionFa,
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

  const keepIds = assets.map((asset) => asset.id);
  const obsolete = await prisma.asset.findMany({
    where: { id: { notIn: keepIds } },
    select: { id: true }
  });

  for (const old of obsolete) {
    const [holdings, lots, trades] = await Promise.all([
      prisma.holding.count({ where: { assetId: old.id } }),
      prisma.purchaseLot.count({ where: { assetId: old.id } }),
      prisma.trade.count({ where: { assetId: old.id } })
    ]);

    if (holdings + lots + trades === 0) {
      await prisma.asset.delete({ where: { id: old.id } });
    }
  }

  const existingAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN" },
    select: { id: true }
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: "admin@rwastocks.online",
        name: "RwaStocks Admin",
        passwordHash: await hash("RwaAdmin!2026", 12),
        role: "SUPER_ADMIN",
        account: {
          create: {
            usdtBalanceMicros: 0n
          }
        }
      }
    });
  }

  console.log(
    "Production fallback seed completed: 5 funded TSETMC snapshot assets (2026-09-21)."
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