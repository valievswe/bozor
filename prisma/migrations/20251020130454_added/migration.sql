-- CreateEnum
CREATE TYPE "public"."AttendancePayment" AS ENUM ('PAID', 'UNPAID');

-- AlterTable
ALTER TABLE "public"."Attendance" ADD COLUMN     "status" "public"."AttendancePayment" NOT NULL DEFAULT 'UNPAID';
