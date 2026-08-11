import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { INITIAL_ASSETS } from "../src/data";

const prisma = new PrismaClient();
const MICROS = 1_000_000;

function toMicros(value: number): bigint {
  return BigInt(Math.round(value * MICROS));
}

async function main() {
  for (const asset of INITIAL_ASSETS) {
    await prisma.asset.upsert({
      where: { id: asset.id },
      update: {
        enName: asset.enName,
        faName: asset.faName,
        category: asset.category,
        priceMicros: toMicros(asset.price),
        change: asset.change,
        flag: asset.flag,
        locationEn: asset.locationEn,
        locationFa: asset.locationFa,
        progress: asset.progress,
        descriptionEn: asset.descriptionEn ?? null,
        descriptionFa: asset.descriptionFa ?? null,
        backingEn: asset.backingEn ?? null,
        backingFa: asset.backingFa ?? null,
        custodianEn: asset.custodianEn ?? null,
        custodianFa: asset.custodianFa ?? null,
        riskLevel: asset.riskLevel ?? null,
        payoutIntervalEn: asset.payoutIntervalEn ?? null,
        payoutIntervalFa: asset.payoutIntervalFa ?? null,
        tsetmcUrl: asset.tsetmcUrl ?? null,
        bourseSymbol: asset.bourseSymbol ?? null
      },
      create: {
        id: asset.id,
        enName: asset.enName,
        faName: asset.faName,
        category: asset.category,
        priceMicros: toMicros(asset.price),
        change: asset.change,
        flag: asset.flag,
        locationEn: asset.locationEn,
        locationFa: asset.locationFa,
        progress: asset.progress,
        descriptionEn: asset.descriptionEn ?? null,
        descriptionFa: asset.descriptionFa ?? null,
        backingEn: asset.backingEn ?? null,
        backingFa: asset.backingFa ?? null,
        custodianEn: asset.custodianEn ?? null,
        custodianFa: asset.custodianFa ?? null,
        riskLevel: asset.riskLevel ?? null,
        payoutIntervalEn: asset.payoutIntervalEn ?? null,
        payoutIntervalFa: asset.payoutIntervalFa ?? null,
        tsetmcUrl: asset.tsetmcUrl ?? null,
        bourseSymbol: asset.bourseSymbol ?? null
      }
    });
  }

  const passwordHash = await hash("DemoPass123!", 12);

  const demo = await prisma.user.upsert({
    where: { email: "demo@assetchain.local" },
    update: {
      name: "Demo Investor",
      passwordHash
    },
    create: {
      email: "demo@assetchain.local",
      name: "Demo Investor",
      passwordHash
    }
  });

  await prisma.account.upsert({
    where: { userId: demo.id },
    update: { usdtBalanceMicros: toMicros(10_000) },
    create: {
      userId: demo.id,
      usdtBalanceMicros: toMicros(10_000),
      tomanBalance: 0
    }
  });

  await prisma.activity.create({
    data: {
      userId: demo.id,
      type: "system",
      descriptionEn: "Demo database was seeded",
      descriptionFa: "دیتابیس آزمایشی مقداردهی اولیه شد"
    }
  });

  console.log("Seed completed.");
  console.log("Demo email: demo@assetchain.local");
  console.log("Demo password: DemoPass123!");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
