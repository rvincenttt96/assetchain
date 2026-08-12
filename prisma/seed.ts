import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const assets = [
  {
    id: "KGOL",
    enName: "Gol Gohar Mining and Industrial",
    faName: "کگل",
    category: "metals",
    bourseSymbol: "کگل",
    tsetmcInsCode: "35700344742885862"
  },
  {
    id: "DTMAD",
    enName: "Darou Pakhsh Raw Materials",
    faName: "دتماد",
    category: "pharma",
    bourseSymbol: "دتماد",
    tsetmcInsCode: "34641719089573667"
  },
  {
    id: "SHTRAN",
    enName: "Tehran Oil Refining",
    faName: "شتران",
    category: "petro",
    bourseSymbol: "شتران",
    tsetmcInsCode: "51617145873056483"
  },
  {
    id: "SHASTA",
    enName: "Social Security Investment",
    faName: "شستا",
    category: "investment",
    bourseSymbol: "شستا",
    tsetmcInsCode: "2400322364771558"
  },
  {
    id: "KAVEH",
    enName: "South Kaveh Steel",
    faName: "کاوه",
    category: "metals",
    bourseSymbol: "کاوه",
    tsetmcInsCode: "60350996279289099"
  }
];

async function main() {
  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { id: asset.id },
      update: {
        ...asset,
        priceMicros: 0n,
        change: 0,
        flag: "ir",
        locationEn: "Iran",
        locationFa: "ایران",
        progress: 100,
        tsetmcUrl: `https://main.tsetmc.com/InstInfo/${asset.tsetmcInsCode}`
      },
      create: {
        ...asset,
        priceMicros: 0n,
        change: 0,
        flag: "ir",
        locationEn: "Iran",
        locationFa: "ایران",
        progress: 100,
        tsetmcUrl: `https://main.tsetmc.com/InstInfo/${asset.tsetmcInsCode}`
      }
    });
  }

  console.log("Production seed completed: 5 TSETMC assets, trading price locked at zero.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
