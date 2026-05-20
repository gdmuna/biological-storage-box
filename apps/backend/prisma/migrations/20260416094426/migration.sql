/*
  Warnings:

  - You are about to drop the column `reagentId` on the `NodeLog` table. All the data in the column will be lost.
  - You are about to drop the column `boxId` on the `Reagent` table. All the data in the column will be lost.
  - You are about to drop the `Box` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BoxAlias` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BoxImage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `BoxLog` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `NodeAlias` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ReagentOperationType" AS ENUM ('PLACED', 'TAKEN', 'MOVED', 'UPDATED', 'DELETED');

-- AlterEnum
ALTER TYPE "NodeType" ADD VALUE 'BOX_SLOT';

-- DropForeignKey
ALTER TABLE "Box" DROP CONSTRAINT "Box_nodeId_fkey";

-- DropForeignKey
ALTER TABLE "Box" DROP CONSTRAINT "Box_orgId_fkey";

-- DropForeignKey
ALTER TABLE "BoxAlias" DROP CONSTRAINT "BoxAlias_boxId_fkey";

-- DropForeignKey
ALTER TABLE "BoxImage" DROP CONSTRAINT "BoxImage_boxId_fkey";

-- DropForeignKey
ALTER TABLE "BoxLog" DROP CONSTRAINT "BoxLog_boxId_fkey";

-- DropForeignKey
ALTER TABLE "BoxLog" DROP CONSTRAINT "BoxLog_reagentId_fkey";

-- DropForeignKey
ALTER TABLE "BoxLog" DROP CONSTRAINT "BoxLog_userId_fkey";

-- DropForeignKey
ALTER TABLE "NodeAlias" DROP CONSTRAINT "NodeAlias_nodeId_fkey";

-- DropForeignKey
ALTER TABLE "NodeLog" DROP CONSTRAINT "NodeLog_reagentId_fkey";

-- DropForeignKey
ALTER TABLE "Reagent" DROP CONSTRAINT "Reagent_boxId_fkey";

-- DropIndex
DROP INDEX "NodeLog_reagentId_idx";

-- DropIndex
DROP INDEX "Reagent_boxId_idx";

-- AlterTable
ALTER TABLE "Node" ALTER COLUMN "type" DROP DEFAULT;

-- AlterTable
ALTER TABLE "NodeLog" DROP COLUMN "reagentId";

-- AlterTable
ALTER TABLE "Reagent" DROP COLUMN "boxId";

-- AlterTable
ALTER TABLE "ReagentType" ADD COLUMN     "reagentId" TEXT[];

-- DropTable
DROP TABLE "Box";

-- DropTable
DROP TABLE "BoxAlias";

-- DropTable
DROP TABLE "BoxImage";

-- DropTable
DROP TABLE "BoxLog";

-- DropTable
DROP TABLE "NodeAlias";

-- CreateTable
CREATE TABLE "ReagentLog" (
    "id" TEXT NOT NULL,
    "reagentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operationType" "ReagentOperationType" NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReagentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReagentLog_reagentId_idx" ON "ReagentLog"("reagentId");

-- CreateIndex
CREATE INDEX "ReagentLog_userId_idx" ON "ReagentLog"("userId");

-- AddForeignKey
ALTER TABLE "ReagentLog" ADD CONSTRAINT "ReagentLog_reagentId_fkey" FOREIGN KEY ("reagentId") REFERENCES "Reagent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReagentLog" ADD CONSTRAINT "ReagentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
