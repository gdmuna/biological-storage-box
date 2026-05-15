-- CreateEnum
CREATE TYPE "UserProfileSex" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'BANNED');

-- CreateEnum
CREATE TYPE "UserStatusOperatorType" AS ENUM ('SYSTEM', 'MANUAL');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('PENDING', 'ACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "FileDomain" AS ENUM ('AVATAR', 'DOCUMENT', 'VIDEO');

-- CreateEnum
CREATE TYPE "FileVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateTable
CREATE TABLE "UserProfile" (
    "userId" TEXT NOT NULL,
    "nickname" TEXT,
    "avatarId" TEXT,
    "bio" TEXT,
    "sex" "UserProfileSex",
    "sexVisible" BOOLEAN NOT NULL DEFAULT true,
    "birthday" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UserStatusHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "operatorType" "UserStatusOperatorType" NOT NULL,
    "operatorId" TEXT,
    "fromStatus" "UserStatus" NOT NULL,
    "toStatus" "UserStatus" NOT NULL,
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "domain" "FileDomain" NOT NULL,
    "visibility" "FileVisibility" NOT NULL,
    "bucket" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "status" "FileStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserStatusHistory_userId_createdAt_idx" ON "UserStatusHistory"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "File_userId_idx" ON "File"("userId");

-- CreateIndex
CREATE INDEX "File_status_createdAt_idx" ON "File"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_avatarId_fkey" FOREIGN KEY ("avatarId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserStatusHistory" ADD CONSTRAINT "UserStatusHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
