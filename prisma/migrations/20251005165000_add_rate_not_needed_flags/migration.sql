-- Remove the out_of_scope_rates_agreed column
ALTER TABLE "contracts" DROP COLUMN IF EXISTS "out_of_scope_rates_agreed";

-- Add "not needed" flags for each rate type
ALTER TABLE "contracts" ADD COLUMN "hr_admin_rate_not_needed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contracts" ADD COLUMN "employment_law_rate_not_needed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contracts" ADD COLUMN "mileage_rate_not_needed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "contracts" ADD COLUMN "overnight_rate_not_needed" BOOLEAN NOT NULL DEFAULT false;
