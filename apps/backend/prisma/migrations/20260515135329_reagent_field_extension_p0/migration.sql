-- CreateEnum
CREATE TYPE "HazardLevel" AS ENUM ('NONE', 'GHS01', 'GHS02', 'GHS03', 'GHS04', 'GHS05', 'GHS06', 'GHS07', 'GHS08', 'GHS09');

-- AlterTable
ALTER TABLE "Reagent" ADD COLUMN     "batchNo" TEXT,
ADD COLUMN     "casNumber" TEXT,
ADD COLUMN     "catalogNo" TEXT,
ADD COLUMN     "expiryDate" TIMESTAMP(3),
ADD COLUMN     "hazardLevel" "HazardLevel",
ADD COLUMN     "manufactureDate" TIMESTAMP(3),
ADD COLUMN     "manufacturer" TEXT,
ADD COLUMN     "minStockThreshold" DOUBLE PRECISION,
ADD COLUMN     "quantity" DOUBLE PRECISION,
ADD COLUMN     "storageCondition" JSONB,
ADD COLUMN     "unit" TEXT;

-- CreateIndex
CREATE INDEX "Reagent_expiryDate_idx" ON "Reagent"("expiryDate");
