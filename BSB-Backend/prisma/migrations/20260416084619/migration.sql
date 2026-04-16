/*
  Warnings:

  - The values [ROOM] on the enum `NodeType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `rootId` on the `Box` table. All the data in the column will be lost.
  - You are about to drop the `Root` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NodeType_new" AS ENUM ('ROOT', 'BOX', 'CONTAINER');
ALTER TABLE "public"."Node" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Node" ALTER COLUMN "type" TYPE "NodeType_new" USING ("type"::text::"NodeType_new");
ALTER TYPE "NodeType" RENAME TO "NodeType_old";
ALTER TYPE "NodeType_new" RENAME TO "NodeType";
DROP TYPE "public"."NodeType_old";
ALTER TABLE "Node" ALTER COLUMN "type" SET DEFAULT 'CONTAINER';
COMMIT;

-- DropForeignKey
ALTER TABLE "Box" DROP CONSTRAINT "Box_rootId_fkey";

-- DropForeignKey
ALTER TABLE "Root" DROP CONSTRAINT "Root_orgId_fkey";

-- DropIndex
DROP INDEX "Box_rootId_idx";

-- AlterTable
ALTER TABLE "Box" DROP COLUMN "rootId";

-- DropTable
DROP TABLE "Root";

-- CreateIndex
CREATE INDEX "Node_orgId_parentId_idx" ON "Node"("orgId", "parentId");
