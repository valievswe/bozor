/*
  Warnings:

  - The `transactionId` column on the `Attendance` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `auth_group` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `auth_group_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `auth_permission` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `auth_user` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `auth_user_groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `auth_user_user_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `django_admin_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `django_content_type` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `django_migrations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `django_session` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[transactionId]` on the table `Attendance` will be added. If there are existing duplicate values, this will fail.
  - Made the column `stallId` on table `Attendance` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."Attendance" DROP CONSTRAINT "Attendance_stallId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Transaction" DROP CONSTRAINT "Transaction_leaseId_fkey";

-- DropForeignKey
ALTER TABLE "public"."auth_group_permissions" DROP CONSTRAINT "auth_group_permissions_group_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."auth_group_permissions" DROP CONSTRAINT "auth_group_permissions_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."auth_permission" DROP CONSTRAINT "auth_permission_content_type_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."auth_user_groups" DROP CONSTRAINT "auth_user_groups_group_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."auth_user_groups" DROP CONSTRAINT "auth_user_groups_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."auth_user_user_permissions" DROP CONSTRAINT "auth_user_user_permissions_permission_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."auth_user_user_permissions" DROP CONSTRAINT "auth_user_user_permissions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."django_admin_log" DROP CONSTRAINT "django_admin_log_content_type_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."django_admin_log" DROP CONSTRAINT "django_admin_log_user_id_fkey";

-- AlterTable
ALTER TABLE "public"."Attendance" ALTER COLUMN "stallId" SET NOT NULL,
DROP COLUMN "transactionId",
ADD COLUMN     "transactionId" INTEGER;

-- AlterTable
ALTER TABLE "public"."Transaction" ALTER COLUMN "leaseId" DROP NOT NULL,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- DropTable
DROP TABLE "public"."auth_group";

-- DropTable
DROP TABLE "public"."auth_group_permissions";

-- DropTable
DROP TABLE "public"."auth_permission";

-- DropTable
DROP TABLE "public"."auth_user";

-- DropTable
DROP TABLE "public"."auth_user_groups";

-- DropTable
DROP TABLE "public"."auth_user_user_permissions";

-- DropTable
DROP TABLE "public"."django_admin_log";

-- DropTable
DROP TABLE "public"."django_content_type";

-- DropTable
DROP TABLE "public"."django_migrations";

-- DropTable
DROP TABLE "public"."django_session";

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_transactionId_key" ON "public"."Attendance"("transactionId");

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "public"."Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Attendance" ADD CONSTRAINT "Attendance_stallId_fkey" FOREIGN KEY ("stallId") REFERENCES "public"."Stall"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "public"."Lease"("id") ON DELETE SET NULL ON UPDATE CASCADE;
