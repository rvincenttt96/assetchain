-- CreateTable
CREATE TABLE "DepositRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "txid" TEXT NOT NULL,
    "amountMicros" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedAt" DATETIME,
    "reviewedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DepositRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "DepositRequest_network_txid_key" ON "DepositRequest"("network", "txid");

-- CreateIndex
CREATE INDEX "DepositRequest_userId_createdAt_idx" ON "DepositRequest"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "DepositRequest_status_createdAt_idx" ON "DepositRequest"("status", "createdAt");
