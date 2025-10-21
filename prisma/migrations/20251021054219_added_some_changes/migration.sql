-- AlterTable
ALTER TABLE "public"."Attendance" ADD COLUMN     "amount" DECIMAL(65,30) DEFAULT 0,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "transactionId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."Stall" ADD COLUMN     "dailyFee" DECIMAL(65,30) DEFAULT 0;
