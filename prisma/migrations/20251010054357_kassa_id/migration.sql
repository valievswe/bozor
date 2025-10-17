/*
  Warnings:

  - You are about to drop the column `paymeKassaId` on the `Store` table. All the data in the column will be lost.
  - Added the required column `kassaID` to the `Store` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Store" DROP COLUMN "paymeKassaId",
ADD COLUMN     "kassaID" TEXT NOT NULL;
