import { NextRequest, NextResponse } from 'next/server';

// eslint-disable-next-line no-restricted-imports -- Onboarding API uses direct DB access until onboarding service is implemented
import { getDatabaseInstance } from '@/lib/database';

const db = getDatabaseInstance();

/**
 * GET /api/clients/[id]/onboarding
 * Fetch onboarding data for a client and their active contract
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString, 10);

    if (isNaN(id) || id < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    // Fetch client with active contract
    const client = await db.client.findUnique({
      where: { id },
      select: {
        id: true,
        companyName: true,
        welcomeEmailSent: true,
        contracts: {
          where: {
            status: 'ACTIVE',
          },
          select: {
            id: true,
            contractNumber: true,
            directDebitSetup: true,
            directDebitConfirmed: true,
            signedContractReceived: true,
            contractUploaded: true,
            contractAddedToXero: true,
            contractSentToClient: true,
            dpaSignedGdpr: true,
            firstInvoiceSent: true,
            firstPaymentMade: true,
            paymentTermsAgreed: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        client: {
          id: client.id,
          companyName: client.companyName,
          welcomeEmailSent: client.welcomeEmailSent,
        },
        contract: client.contracts[0] || null,
      },
    });
  } catch (error) {
    console.error('Error fetching onboarding data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/clients/[id]/onboarding
 * Update a single onboarding field
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idString } = await params;
    const id = parseInt(idString, 10);

    if (isNaN(id) || id < 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid client ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { type, field, value } = body;

    if (!type || !field || typeof value !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    if (type === 'client') {
      // Update client field
      if (field !== 'welcomeEmailSent') {
        return NextResponse.json(
          { success: false, error: 'Invalid client field' },
          { status: 400 }
        );
      }

      await db.client.update({
        where: { id },
        data: {
          welcomeEmailSent: value,
        },
      });
    } else if (type === 'contract') {
      // Update contract field
      const validFields = [
        'directDebitSetup',
        'directDebitConfirmed',
        'signedContractReceived',
        'contractUploaded',
        'contractAddedToXero',
        'contractSentToClient',
        'dpaSignedGdpr',
        'firstInvoiceSent',
        'firstPaymentMade',
        'paymentTermsAgreed',
      ];

      if (!validFields.includes(field)) {
        return NextResponse.json(
          { success: false, error: 'Invalid contract field' },
          { status: 400 }
        );
      }

      // Find the active contract
      const client = await db.client.findUnique({
        where: { id },
        select: {
          contracts: {
            where: { status: 'ACTIVE' },
            take: 1,
          },
        },
      });

      if (!client || client.contracts.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No active contract found' },
          { status: 404 }
        );
      }

      // Update the contract
      await db.contract.update({
        where: { id: client.contracts[0].id },
        data: {
          [field]: value,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type' },
        { status: 400 }
      );
    }

    // Fetch updated data
    const updatedClient = await db.client.findUnique({
      where: { id },
      select: {
        id: true,
        companyName: true,
        welcomeEmailSent: true,
        contracts: {
          where: {
            status: 'ACTIVE',
          },
          select: {
            id: true,
            contractNumber: true,
            directDebitSetup: true,
            directDebitConfirmed: true,
            signedContractReceived: true,
            contractUploaded: true,
            contractAddedToXero: true,
            contractSentToClient: true,
            dpaSignedGdpr: true,
            firstInvoiceSent: true,
            firstPaymentMade: true,
            paymentTermsAgreed: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        client: {
          id: updatedClient!.id,
          companyName: updatedClient!.companyName,
          welcomeEmailSent: updatedClient!.welcomeEmailSent,
        },
        contract: updatedClient!.contracts[0] || null,
      },
    });
  } catch (error) {
    console.error('Error updating onboarding field:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
