-- Move payment and infrastructure fields from contracts to clients

-- Step 1: Add new columns to clients table
ALTER TABLE "clients" ADD COLUMN "payment_method" "PaymentMethod";
ALTER TABLE "clients" ADD COLUMN "direct_debit_setup" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "clients" ADD COLUMN "direct_debit_confirmed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "clients" ADD COLUMN "contract_added_to_xero" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "clients" ADD COLUMN "recurring_invoice_setup" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "clients" ADD COLUMN "dpa_signed_gdpr" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "clients" ADD COLUMN "first_invoice_sent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "clients" ADD COLUMN "first_payment_made" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "clients" ADD COLUMN "last_price_increase" DATE;

-- Step 2: Migrate data from active contracts to clients
-- For each client, get their ACTIVE contract and copy the payment fields
UPDATE "clients" c
SET
    payment_method = ct.payment_method,
    direct_debit_setup = ct.direct_debit_setup,
    direct_debit_confirmed = ct.direct_debit_confirmed,
    contract_added_to_xero = ct.contract_added_to_xero,
    recurring_invoice_setup = ct.recurring_invoice_setup,
    dpa_signed_gdpr = ct.dpa_signed_gdpr,
    first_invoice_sent = ct.first_invoice_sent,
    first_payment_made = ct.first_payment_made,
    last_price_increase = ct.last_price_increase
FROM (
    SELECT DISTINCT ON (client_id)
        client_id,
        payment_method,
        direct_debit_setup,
        direct_debit_confirmed,
        contract_added_to_xero,
        recurring_invoice_setup,
        dpa_signed_gdpr,
        first_invoice_sent,
        first_payment_made,
        last_price_increase
    FROM "contracts"
    WHERE status = 'ACTIVE'
    ORDER BY client_id, created_at DESC
) ct
WHERE c.id = ct.client_id;

-- Step 3: Drop the old columns from contracts table
ALTER TABLE "contracts" DROP COLUMN "payment_method";
ALTER TABLE "contracts" DROP COLUMN "direct_debit_setup";
ALTER TABLE "contracts" DROP COLUMN "direct_debit_confirmed";
ALTER TABLE "contracts" DROP COLUMN "contract_added_to_xero";
ALTER TABLE "contracts" DROP COLUMN "recurring_invoice_setup";
ALTER TABLE "contracts" DROP COLUMN "dpa_signed_gdpr";
ALTER TABLE "contracts" DROP COLUMN "first_invoice_sent";
ALTER TABLE "contracts" DROP COLUMN "first_payment_made";
ALTER TABLE "contracts" DROP COLUMN "last_price_increase";
