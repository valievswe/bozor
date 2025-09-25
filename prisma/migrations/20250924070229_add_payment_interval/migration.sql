-- CreateEnum
CREATE TYPE "public"."PaymentInterval" AS ENUM ('DAILY', 'MONTHLY');

-- AlterTable
ALTER TABLE "public"."Lease" ADD COLUMN     "paymentInterval" "public"."PaymentInterval" NOT NULL DEFAULT 'MONTHLY';
