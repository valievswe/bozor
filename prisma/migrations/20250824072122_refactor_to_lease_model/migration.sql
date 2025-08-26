/*
  Warnings:

  - You are about to drop the column `stir` on the `Owner` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `monthlyFee` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `paymeKassaId` on the `Store` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Store` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tin]` on the table `Owner` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tin` to the `Owner` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Store" DROP CONSTRAINT "Store_ownerId_fkey";

-- DropIndex
DROP INDEX "public"."Owner_stir_key";

-- DropIndex
DROP INDEX "public"."Store_paymeKassaId_key";

-- AlterTable
ALTER TABLE "public"."Owner" DROP COLUMN "stir",
ADD COLUMN     "tin" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Store" DROP COLUMN "createdAt",
DROP COLUMN "isActive",
DROP COLUMN "monthlyFee",
DROP COLUMN "ownerId",
DROP COLUMN "paymeKassaId",
DROP COLUMN "updatedAt",
ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "public"."Stall" (
    "id" SERIAL NOT NULL,
    "stallNumber" TEXT NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "description" TEXT,

    CONSTRAINT "Stall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lease" (
    "id" SERIAL NOT NULL,
    "certificateNumber" TEXT,
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "shopMonthlyFee" DECIMAL(65,30),
    "stallMonthlyFee" DECIMAL(65,30),
    "guardFee" DECIMAL(65,30),
    "paymeKassaId" TEXT NOT NULL,
    "ownerId" INTEGER NOT NULL,
    "storeId" INTEGER,
    "stallId" INTEGER,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lease_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Stall_stallNumber_key" ON "public"."Stall"("stallNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Lease_paymeKassaId_key" ON "public"."Lease"("paymeKassaId");

-- CreateIndex
CREATE UNIQUE INDEX "Owner_tin_key" ON "public"."Owner"("tin");

-- AddForeignKey
ALTER TABLE "public"."Lease" ADD CONSTRAINT "Lease_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."Owner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lease" ADD CONSTRAINT "Lease_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lease" ADD CONSTRAINT "Lease_stallId_fkey" FOREIGN KEY ("stallId") REFERENCES "public"."Stall"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lease" ADD CONSTRAINT "Lease_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
