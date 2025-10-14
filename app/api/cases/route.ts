/**
 * Cases API Routes
 * GET - Fetch cases for a client
 * POST - Create new case
 */

import { NextRequest, NextResponse } from 'next/server';

import { caseService } from '@/lib/services/business/case.service';

/**
 * GET /api/cases?clientId={id}
 * Fetch all cases for a specific client
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientIdParam = searchParams.get('clientId');

    if (!clientIdParam) {
      return NextResponse.json(
        { error: 'clientId is required' },
        { status: 400 }
      );
    }

    const clientId = parseInt(clientIdParam);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { error: 'Invalid clientId' },
        { status: 400 }
      );
    }

    // Fetch cases with related data
    const cases = await caseService.getCasesByClientId(clientId);

    // Transform to match frontend format
    const transformedCases = cases.map(c => ({
      id: c.id,
      caseId: c.caseId,
      title: c.title,
      creationDate: c.createdAt.toLocaleDateString('en-GB'),
      status: c.status,
      actionRequired: c.actionRequiredBy,
      escalatedBy: c.escalatedBy,
      assignedTo: c.assignedTo,
      description: c.description,
      interactionCount: c._count.interactions,
      fileCount: c._count.files,
    }));

    return NextResponse.json(transformedCases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cases
 * Create a new case
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      clientId,
      title,
      escalatedBy,
      assignedTo,
      status,
      actionRequiredBy,
      description,
    } = body;

    // Validate required fields
    if (!clientId || !title || !escalatedBy) {
      return NextResponse.json(
        { error: 'Missing required fields: clientId, title, escalatedBy' },
        { status: 400 }
      );
    }

    // Create case
    const newCase = await caseService.createCase({
      clientId: parseInt(clientId),
      title,
      escalatedBy,
      assignedTo,
      status,
      actionRequiredBy,
      description,
    });

    // Transform to match frontend format
    const transformedCase = {
      id: newCase.id,
      caseId: newCase.caseId,
      title: newCase.title,
      creationDate: newCase.createdAt.toLocaleDateString('en-GB'),
      status: newCase.status,
      actionRequired: newCase.actionRequiredBy,
      escalatedBy: newCase.escalatedBy,
      assignedTo: newCase.assignedTo,
      description: newCase.description,
      interactionCount: newCase._count.interactions,
      fileCount: newCase._count.files,
    };

    return NextResponse.json(transformedCase, { status: 201 });
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json(
      { error: 'Failed to create case' },
      { status: 500 }
    );
  }
}
