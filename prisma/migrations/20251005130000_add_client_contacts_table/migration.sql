-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('PRIMARY', 'SECONDARY', 'INVOICE');

-- CreateTable
CREATE TABLE "client_contacts" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "type" "ContactType" NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "client_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_contacts_client_id_idx" ON "client_contacts"("client_id");

-- CreateIndex
CREATE INDEX "client_contacts_type_idx" ON "client_contacts"("type");

-- CreateIndex
CREATE UNIQUE INDEX "client_contacts_client_id_type_key" ON "client_contacts"("client_id", "type");

-- AddForeignKey
ALTER TABLE "client_contacts" ADD CONSTRAINT "client_contacts_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
