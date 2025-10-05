-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('ACTIVE', 'DRAFT', 'ARCHIVED');
CREATE TYPE "PaymentMethod" AS ENUM ('direct_debit', 'invoice');
CREATE TYPE "RateUnit" AS ENUM ('hourly', 'daily');

-- CreateTable
CREATE TABLE "contracts" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "contract_start_date" DATE NOT NULL,
    "contract_renewal_date" DATE NOT NULL,
    "last_price_increase" DATE,
    "contract_status" "ContractStatus" NOT NULL DEFAULT 'ACTIVE',
    "payment_method" "PaymentMethod" NOT NULL,
    "direct_debit_setup" BOOLEAN NOT NULL DEFAULT false,
    "direct_debit_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "signed_contract_received" BOOLEAN NOT NULL DEFAULT false,
    "contract_uploaded" BOOLEAN NOT NULL DEFAULT false,
    "contract_added_to_xero" BOOLEAN NOT NULL DEFAULT false,
    "hr_admin_inclusive_hours" DECIMAL(5,2),
    "employment_law_inclusive_hours" DECIMAL(5,2),
    "inclusive_services" TEXT[],
    "hr_admin_rate" DECIMAL(10,2),
    "hr_admin_rate_unit" "RateUnit",
    "employment_law_rate" DECIMAL(10,2),
    "employment_law_rate_unit" "RateUnit",
    "mileage_rate" DECIMAL(10,2),
    "overnight_rate" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contracts_client_id_idx" ON "contracts"("client_id");
CREATE INDEX "contracts_contract_status_idx" ON "contracts"("contract_status");

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Migrate existing contract data from clients table to contracts table
-- Create an ACTIVE contract for each client that has contract dates
INSERT INTO "contracts" (
    "id",
    "client_id",
    "contract_start_date",
    "contract_renewal_date",
    "contract_status",
    "payment_method",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid(),
    "id" as "client_id",
    COALESCE("contract_start_date", CURRENT_DATE - INTERVAL '1 year') as "contract_start_date",
    COALESCE("contract_renewal_date", CURRENT_DATE + INTERVAL '1 year') as "contract_renewal_date",
    'ACTIVE'::"ContractStatus",
    'invoice'::"PaymentMethod",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "clients"
WHERE "status" = 'active';
