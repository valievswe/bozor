/*
  Warnings:

  - You are about to drop the column `paymeKassaId` on the `Lease` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[paymeKassaId]` on the table `Store` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `paymeKassaId` to the `Store` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Lease_paymeKassaId_key";

-- AlterTable
ALTER TABLE "public"."Lease" DROP COLUMN "paymeKassaId";

-- AlterTable
ALTER TABLE "public"."Store" ADD COLUMN     "paymeKassaId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Store_paymeKassaId_key" ON "public"."Store"("paymeKassaId");
