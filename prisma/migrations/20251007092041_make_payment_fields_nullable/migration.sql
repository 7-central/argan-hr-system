-- AlterTable: Make payment method fields nullable to support conditional onboarding
-- null = N/A (not applicable for this payment method)
-- false = pending (needs to be completed)
-- true = completed

ALTER TABLE "clients" ALTER COLUMN "direct_debit_setup" DROP NOT NULL;
ALTER TABLE "clients" ALTER COLUMN "direct_debit_confirmed" DROP NOT NULL;
ALTER TABLE "clients" ALTER COLUMN "recurring_invoice_setup" DROP NOT NULL;
