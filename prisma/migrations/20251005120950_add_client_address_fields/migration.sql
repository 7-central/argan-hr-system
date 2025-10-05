-- AddClientAddressFields
-- Add address fields to the clients table

ALTER TABLE "clients" ADD COLUMN "address_line_1" TEXT;
ALTER TABLE "clients" ADD COLUMN "address_line_2" TEXT;
ALTER TABLE "clients" ADD COLUMN "city" TEXT;
ALTER TABLE "clients" ADD COLUMN "postcode" TEXT;
ALTER TABLE "clients" ADD COLUMN "country" TEXT DEFAULT 'United Kingdom';
