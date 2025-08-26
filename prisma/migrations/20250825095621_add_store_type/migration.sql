-- CreateEnum
CREATE TYPE "public"."StoreType" AS ENUM ('SHOP', 'WAREHOUSE', 'CONTAINER', 'OTHER');

-- AlterTable
ALTER TABLE "public"."Store" ADD COLUMN     "type" "public"."StoreType" NOT NULL DEFAULT 'SHOP';
