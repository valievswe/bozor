-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('PAYME', 'BANK_TRANSFER', 'CASH', 'OTHER');

-- AlterTable
ALTER TABLE "public"."Transaction" ADD COLUMN     "paymentMethod" "public"."PaymentMethod" NOT NULL DEFAULT 'PAYME';

-- CreateTable
CREATE TABLE "public"."Attendance" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "isPresent" BOOLEAN NOT NULL DEFAULT true,
    "leaseId" INTEGER NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_leaseId_date_key" ON "public"."Attendance"("leaseId", "date");

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "public"."Lease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
