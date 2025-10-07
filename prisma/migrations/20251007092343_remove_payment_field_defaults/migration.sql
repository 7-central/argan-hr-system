-- AlterTable: Remove DEFAULT constraints from payment fields
-- This allows them to be truly nullable (null/false/true) instead of always defaulting to false

ALTER TABLE "clients" ALTER COLUMN "direct_debit_setup" DROP DEFAULT;
ALTER TABLE "clients" ALTER COLUMN "direct_debit_confirmed" DROP DEFAULT;
ALTER TABLE "clients" ALTER COLUMN "recurring_invoice_setup" DROP DEFAULT;
