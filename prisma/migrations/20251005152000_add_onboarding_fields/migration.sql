-- Add onboarding checklist field to clients table
ALTER TABLE "clients" ADD COLUMN "welcome_email_sent" BOOLEAN NOT NULL DEFAULT false;

-- Add onboarding checklist fields to contracts table
ALTER TABLE "contracts" ADD COLUMN "contract_sent_to_client" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contracts" ADD COLUMN "dpa_signed_gdpr" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contracts" ADD COLUMN "first_invoice_sent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contracts" ADD COLUMN "first_payment_made" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contracts" ADD COLUMN "payment_terms_agreed" BOOLEAN NOT NULL DEFAULT false;

-- All existing records will automatically have these fields set to false due to DEFAULT false
