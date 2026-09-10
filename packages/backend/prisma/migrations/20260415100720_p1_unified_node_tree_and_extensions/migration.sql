-- CreateEnum
CREATE TYPE "NodeType" AS ENUM ('ROOM', 'BOX', 'CONTAINER');

-- CreateEnum
CREATE TYPE "ShareResourceType" AS ENUM ('NODE');

-- CreateEnum
CREATE TYPE "SharePermission" AS ENUM ('READ', 'WRITE');

-- CreateEnum
CREATE TYPE "ShareStatus" AS ENUM ('PENDING', 'ACTIVE', 'REVOKED');

-- AlterTable
ALTER TABLE "Node" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "type" "NodeType" NOT NULL DEFAULT 'CONTAINER';

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "settings" JSONB;

-- AlterTable
ALTER TABLE "Reagent" ADD COLUMN     "environment" JSONB,
ADD COLUMN     "lastTakenAt" TIMESTAMP(3),
ADD COLUMN     "nodeId" TEXT,
ADD COLUMN     "placedAt" TIMESTAMP(3),
ADD COLUMN     "reagentTypeId" TEXT,
ADD COLUMN     "responsibleUserId" TEXT;

-- CreateTable
CREATE TABLE "NodeGridConfig" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "rows" INTEGER NOT NULL,
    "cols" INTEGER NOT NULL,

    CONSTRAINT "NodeGridConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeAlias" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NodeAlias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeImage" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NodeImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NodeLog" (
    "id" TEXT NOT NULL,
    "nodeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reagentId" TEXT,
    "operationType" TEXT NOT NULL,
    "detail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NodeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourceShare" (
    "id" TEXT NOT NULL,
    "resourceType" "ShareResourceType" NOT NULL,
    "resourceId" TEXT NOT NULL,
    "ownerOrgId" TEXT NOT NULL,
    "granteeOrgId" TEXT NOT NULL,
    "permission" "SharePermission" NOT NULL DEFAULT 'READ',
    "status" "ShareStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResourceShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReagentType" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "colorHex" TEXT,
    "unit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReagentType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NodeGridConfig_nodeId_key" ON "NodeGridConfig"("nodeId");

-- CreateIndex
CREATE INDEX "NodeAlias_nodeId_idx" ON "NodeAlias"("nodeId");

-- CreateIndex
CREATE INDEX "NodeImage_nodeId_idx" ON "NodeImage"("nodeId");

-- CreateIndex
CREATE INDEX "NodeLog_nodeId_idx" ON "NodeLog"("nodeId");

-- CreateIndex
CREATE INDEX "NodeLog_userId_idx" ON "NodeLog"("userId");

-- CreateIndex
CREATE INDEX "NodeLog_reagentId_idx" ON "NodeLog"("reagentId");

-- CreateIndex
CREATE INDEX "ResourceShare_ownerOrgId_idx" ON "ResourceShare"("ownerOrgId");

-- CreateIndex
CREATE INDEX "ResourceShare_granteeOrgId_idx" ON "ResourceShare"("granteeOrgId");

-- CreateIndex
CREATE INDEX "ResourceShare_resourceId_idx" ON "ResourceShare"("resourceId");

-- CreateIndex
CREATE INDEX "ReagentType_orgId_idx" ON "ReagentType"("orgId");

-- CreateIndex
CREATE INDEX "Reagent_nodeId_idx" ON "Reagent"("nodeId");

-- CreateIndex
CREATE INDEX "Reagent_reagentTypeId_idx" ON "Reagent"("reagentTypeId");

-- AddForeignKey
ALTER TABLE "Reagent" ADD CONSTRAINT "Reagent_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reagent" ADD CONSTRAINT "Reagent_reagentTypeId_fkey" FOREIGN KEY ("reagentTypeId") REFERENCES "ReagentType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeGridConfig" ADD CONSTRAINT "NodeGridConfig_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeAlias" ADD CONSTRAINT "NodeAlias_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeImage" ADD CONSTRAINT "NodeImage_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeLog" ADD CONSTRAINT "NodeLog_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeLog" ADD CONSTRAINT "NodeLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NodeLog" ADD CONSTRAINT "NodeLog_reagentId_fkey" FOREIGN KEY ("reagentId") REFERENCES "Reagent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceShare" ADD CONSTRAINT "ResourceShare_ownerOrgId_fkey" FOREIGN KEY ("ownerOrgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceShare" ADD CONSTRAINT "ResourceShare_granteeOrgId_fkey" FOREIGN KEY ("granteeOrgId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReagentType" ADD CONSTRAINT "ReagentType_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
