/*
  Warnings:

  - You are about to drop the column `tin` on the `Owner` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stir]` on the table `Owner` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `stir` to the `Owner` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Owner_tin_key";

-- AlterTable
ALTER TABLE "public"."Owner" DROP COLUMN "tin",
ADD COLUMN     "stir" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Owner_stir_key" ON "public"."Owner"("stir");
