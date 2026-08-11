-- AlterTable
ALTER TABLE "Asset" ADD COLUMN "closingPriceRial" BIGINT;
ALTER TABLE "Asset" ADD COLUMN "dayHighRial" BIGINT;
ALTER TABLE "Asset" ADD COLUMN "dayLowRial" BIGINT;
ALTER TABLE "Asset" ADD COLUMN "lastPriceRial" BIGINT;
ALTER TABLE "Asset" ADD COLUMN "marketUpdatedAt" DATETIME;
ALTER TABLE "Asset" ADD COLUMN "tradeValueRial" BIGINT;
ALTER TABLE "Asset" ADD COLUMN "tradeVolume" BIGINT;
ALTER TABLE "Asset" ADD COLUMN "tsetmcInsCode" TEXT;
ALTER TABLE "Asset" ADD COLUMN "yesterdayPriceRial" BIGINT;
