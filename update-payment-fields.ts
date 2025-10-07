/* eslint-disable no-restricted-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Script to update payment method fields to null for existing clients
 * Run with: npx tsx update-payment-fields.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePaymentFields() {
  console.log('Updating payment fields based on payment method...\n');

  // Get all clients
  const clients = await prisma.client.findMany({
    select: {
      id: true,
      companyName: true,
      paymentMethod: true,
      directDebitSetup: true,
      directDebitConfirmed: true,
      recurringInvoiceSetup: true,
    },
  });

  for (const client of clients) {
    const updates: any = {};
    let needsUpdate = false;

    // If payment method is INVOICE, set direct debit fields to null
    if (client.paymentMethod === 'INVOICE') {
      if (client.directDebitSetup !== null) {
        updates.directDebitSetup = null;
        needsUpdate = true;
      }
      if (client.directDebitConfirmed !== null) {
        updates.directDebitConfirmed = null;
        needsUpdate = true;
      }
    }

    // If payment method is DIRECT_DEBIT, set recurring invoice setup to null
    if (client.paymentMethod === 'DIRECT_DEBIT') {
      if (client.recurringInvoiceSetup !== null) {
        updates.recurringInvoiceSetup = null;
        needsUpdate = true;
      }
    }

    // If payment method is null, set all to null
    if (client.paymentMethod === null) {
      if (client.directDebitSetup !== null) {
        updates.directDebitSetup = null;
        needsUpdate = true;
      }
      if (client.directDebitConfirmed !== null) {
        updates.directDebitConfirmed = null;
        needsUpdate = true;
      }
      if (client.recurringInvoiceSetup !== null) {
        updates.recurringInvoiceSetup = null;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      await prisma.client.update({
        where: { id: client.id },
        data: updates,
      });
      console.log(`✓ Updated ${client.companyName} (ID: ${client.id})`);
      console.log(`  Payment method: ${client.paymentMethod || 'None'}`);
      console.log(`  Changes: ${JSON.stringify(updates)}\n`);
    }
  }

  console.log('Done!');
}

updatePaymentFields()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
