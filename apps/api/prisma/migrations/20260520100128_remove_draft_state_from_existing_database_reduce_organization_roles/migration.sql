/*
  Warnings:

  - The values [DRAFT] on the enum `InvoiceStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [ADMIN,PROCUREMENT_MANAGER,BUYER,APPROVER,FINANCE_MANAGER,SUPPLIER_MANAGER,VIEWER] on the enum `OrganizationRole` will be removed. If these variants are still used in the database, this will fail.
  - The values [DRAFT] on the enum `PurchaseOrderStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [DRAFT] on the enum `RequisitionStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[requisitionId]` on the table `purchase_orders` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `entityType` on the `audit_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `requisitionId` on table `purchase_orders` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('REQUISITION', 'PURCHASE_ORDER', 'INVOICE', 'PAYMENT', 'GOODS_RECEIPT');

-- AlterEnum
BEGIN;
CREATE TYPE "InvoiceStatus_new" AS ENUM ('SUBMITTED', 'PENDING_MATCH', 'MATCHED', 'EXCEPTION', 'APPROVED', 'REJECTED', 'PAID');
ALTER TABLE "public"."invoices" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "invoices" ALTER COLUMN "status" TYPE "InvoiceStatus_new" USING ("status"::text::"InvoiceStatus_new");
ALTER TYPE "InvoiceStatus" RENAME TO "InvoiceStatus_old";
ALTER TYPE "InvoiceStatus_new" RENAME TO "InvoiceStatus";
DROP TYPE "public"."InvoiceStatus_old";
ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "OrganizationRole_new" AS ENUM ('OWNER', 'MANAGER', 'FINANCE', 'STAFF');
ALTER TABLE "organization_members" ALTER COLUMN "role" TYPE "OrganizationRole_new" USING ("role"::text::"OrganizationRole_new");
ALTER TYPE "OrganizationRole" RENAME TO "OrganizationRole_old";
ALTER TYPE "OrganizationRole_new" RENAME TO "OrganizationRole";
DROP TYPE "public"."OrganizationRole_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "PurchaseOrderStatus_new" AS ENUM ('SUBMITTED', 'SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'INVOICED', 'CLOSED', 'CANCELLED');
ALTER TABLE "public"."purchase_orders" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "purchase_orders" ALTER COLUMN "status" TYPE "PurchaseOrderStatus_new" USING ("status"::text::"PurchaseOrderStatus_new");
ALTER TYPE "PurchaseOrderStatus" RENAME TO "PurchaseOrderStatus_old";
ALTER TYPE "PurchaseOrderStatus_new" RENAME TO "PurchaseOrderStatus";
DROP TYPE "public"."PurchaseOrderStatus_old";
ALTER TABLE "purchase_orders" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RequisitionStatus_new" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'ORDERED');
ALTER TABLE "public"."purchase_requisitions" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "purchase_requisitions" ALTER COLUMN "status" TYPE "RequisitionStatus_new" USING ("status"::text::"RequisitionStatus_new");
ALTER TYPE "RequisitionStatus" RENAME TO "RequisitionStatus_old";
ALTER TYPE "RequisitionStatus_new" RENAME TO "RequisitionStatus";
DROP TYPE "public"."RequisitionStatus_old";
ALTER TABLE "purchase_requisitions" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';
COMMIT;

-- DropForeignKey
ALTER TABLE "purchase_orders" DROP CONSTRAINT "purchase_orders_requisitionId_fkey";

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "entityType",
ADD COLUMN     "entityType" "EntityType" NOT NULL;

-- AlterTable
ALTER TABLE "invoices" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';

-- AlterTable
ALTER TABLE "purchase_orders" ALTER COLUMN "requisitionId" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';

-- AlterTable
ALTER TABLE "purchase_requisitions" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED';

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_requisitionId_key" ON "purchase_orders"("requisitionId");

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_requisitionId_fkey" FOREIGN KEY ("requisitionId") REFERENCES "purchase_requisitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
