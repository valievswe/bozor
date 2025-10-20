/*
  Warnings:

  - You are about to drop the column `leaseId` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Stall` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stallId,date]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."Attendance" DROP CONSTRAINT "Attendance_leaseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Lease" DROP CONSTRAINT "Lease_stallId_fkey";

-- DropIndex
DROP INDEX "public"."Attendance_leaseId_date_key";

-- AlterTable
ALTER TABLE "public"."Attendance" DROP COLUMN "leaseId",
ADD COLUMN     "stallId" INTEGER;

-- AlterTable
ALTER TABLE "public"."Stall" DROP COLUMN "description",
ADD COLUMN     "payment_url" TEXT,
ADD COLUMN     "saleTypeId" INTEGER,
ADD COLUMN     "sectionId" INTEGER,
ALTER COLUMN "stallNumber" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."Section" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SaleType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tax" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "SaleType_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SaleType_name_key" ON "public"."SaleType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_stallId_date_key" ON "public"."Attendance"("stallId", "date");

-- RenameForeignKey
ALTER TABLE "public"."auth_group_permissions" RENAME CONSTRAINT "auth_group_permissio_permission_id_84c5c92e_fk_auth_perm" TO "auth_group_permissions_permission_id_fkey";

-- RenameForeignKey
ALTER TABLE "public"."auth_group_permissions" RENAME CONSTRAINT "auth_group_permissions_group_id_b120cbf9_fk_auth_group_id" TO "auth_group_permissions_group_id_fkey";

-- RenameForeignKey
ALTER TABLE "public"."auth_permission" RENAME CONSTRAINT "auth_permission_content_type_id_2f476e4b_fk_django_co" TO "auth_permission_content_type_id_fkey";

-- RenameForeignKey
ALTER TABLE "public"."auth_user_groups" RENAME CONSTRAINT "auth_user_groups_group_id_97559544_fk_auth_group_id" TO "auth_user_groups_group_id_fkey";

-- RenameForeignKey
ALTER TABLE "public"."auth_user_groups" RENAME CONSTRAINT "auth_user_groups_user_id_6a12ed8b_fk_auth_user_id" TO "auth_user_groups_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "public"."auth_user_user_permissions" RENAME CONSTRAINT "auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm" TO "auth_user_user_permissions_permission_id_fkey";

-- RenameForeignKey
ALTER TABLE "public"."auth_user_user_permissions" RENAME CONSTRAINT "auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id" TO "auth_user_user_permissions_user_id_fkey";

-- RenameForeignKey
ALTER TABLE "public"."django_admin_log" RENAME CONSTRAINT "django_admin_log_content_type_id_c4bce8eb_fk_django_co" TO "django_admin_log_content_type_id_fkey";

-- RenameForeignKey
ALTER TABLE "public"."django_admin_log" RENAME CONSTRAINT "django_admin_log_user_id_c564eba6_fk_auth_user_id" TO "django_admin_log_user_id_fkey";

-- AddForeignKey
ALTER TABLE "public"."Stall" ADD CONSTRAINT "Stall_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "public"."Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Stall" ADD CONSTRAINT "Stall_saleTypeId_fkey" FOREIGN KEY ("saleTypeId") REFERENCES "public"."SaleType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_stallId_fkey" FOREIGN KEY ("stallId") REFERENCES "public"."Stall"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."auth_group_permissions_group_id_b120cbf9" RENAME TO "auth_group_permissions_group_id_idx";

-- RenameIndex
ALTER INDEX "public"."auth_group_permissions_group_id_permission_id_0cd325b0_uniq" RENAME TO "auth_group_permissions_group_id_permission_id_key";

-- RenameIndex
ALTER INDEX "public"."auth_group_permissions_permission_id_84c5c92e" RENAME TO "auth_group_permissions_permission_id_idx";

-- RenameIndex
ALTER INDEX "public"."auth_permission_content_type_id_2f476e4b" RENAME TO "auth_permission_content_type_id_idx";

-- RenameIndex
ALTER INDEX "public"."auth_permission_content_type_id_codename_01ab375a_uniq" RENAME TO "auth_permission_content_type_id_codename_key";

-- RenameIndex
ALTER INDEX "public"."auth_user_username_6821ab7c_like" RENAME TO "auth_user_username_idx";

-- RenameIndex
ALTER INDEX "public"."auth_user_groups_group_id_97559544" RENAME TO "auth_user_groups_group_id_idx";

-- RenameIndex
ALTER INDEX "public"."auth_user_groups_user_id_6a12ed8b" RENAME TO "auth_user_groups_user_id_idx";

-- RenameIndex
ALTER INDEX "public"."auth_user_groups_user_id_group_id_94350c0c_uniq" RENAME TO "auth_user_groups_user_id_group_id_key";

-- RenameIndex
ALTER INDEX "public"."auth_user_user_permissions_permission_id_1fbb5f2c" RENAME TO "auth_user_user_permissions_permission_id_idx";

-- RenameIndex
ALTER INDEX "public"."auth_user_user_permissions_user_id_a95ead1b" RENAME TO "auth_user_user_permissions_user_id_idx";

-- RenameIndex
ALTER INDEX "public"."auth_user_user_permissions_user_id_permission_id_14a6b632_uniq" RENAME TO "auth_user_user_permissions_user_id_permission_id_key";

-- RenameIndex
ALTER INDEX "public"."django_admin_log_content_type_id_c4bce8eb" RENAME TO "django_admin_log_content_type_id_idx";

-- RenameIndex
ALTER INDEX "public"."django_admin_log_user_id_c564eba6" RENAME TO "django_admin_log_user_id_idx";

-- RenameIndex
ALTER INDEX "public"."django_content_type_app_label_model_76bd3d3b_uniq" RENAME TO "django_content_type_app_label_model_key";

-- RenameIndex
ALTER INDEX "public"."django_session_expire_date_a5c62663" RENAME TO "django_session_expire_date_idx";

-- RenameIndex
ALTER INDEX "public"."django_session_session_key_c0390e0f_like" RENAME TO "django_session_session_key_idx";

-- RenameIndex
ALTER INDEX "public"."payments_cancelled_at_6c0a9685" RENAME TO "payments_cancelled_at_idx";

-- RenameIndex
ALTER INDEX "public"."payments_created_at_c267fff5" RENAME TO "payments_created_at_idx";

-- RenameIndex
ALTER INDEX "public"."payments_gateway_transaction_id_b228f470_uniq" RENAME TO "payments_gateway_transaction_id_key";

-- RenameIndex
ALTER INDEX "public"."payments_performed_at_a001c611" RENAME TO "payments_performed_at_idx";

-- RenameIndex
ALTER INDEX "public"."payments_updated_at_78aac9e9" RENAME TO "payments_updated_at_idx";
