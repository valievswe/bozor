-- AlterEnum
ALTER TYPE "public"."PaymentMethod" ADD VALUE 'CLICK';

-- CreateTable
CREATE TABLE "public"."click_transactions" (
    "id" SERIAL NOT NULL,
    "click_trans_id" TEXT NOT NULL,
    "click_paydoc_id" TEXT,
    "merchant_trans_id" TEXT NOT NULL,
    "merchant_prepare_id" INTEGER,
    "amount" DECIMAL(10,2) NOT NULL,
    "action" INTEGER NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "error" INTEGER NOT NULL DEFAULT 0,
    "error_note" TEXT,
    "sign_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "click_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "click_transactions_click_trans_id_key" ON "public"."click_transactions"("click_trans_id");

-- CreateIndex
CREATE INDEX "click_transactions_merchant_trans_id_idx" ON "public"."click_transactions"("merchant_trans_id");

-- CreateIndex
CREATE INDEX "click_transactions_click_trans_id_idx" ON "public"."click_transactions"("click_trans_id");
