/**
 * Case Interactions API Routes
 * GET - Fetch interactions for a case
 * POST - Create new interaction
 */

import { NextRequest, NextResponse } from 'next/server';

import { caseService } from '@/lib/services/business/case.service';

interface RouteContext {
  params: Promise<{
    caseId: string;
  }>;
}

/**
 * GET /api/cases/[caseId]/interactions
 * Fetch all interactions for a specific case
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { caseId } = await context.params;

    // Find case by caseId (string like "CASE-0001")
    const caseRecord = await caseService.getCaseByCaseId(caseId);

    if (!caseRecord) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Fetch interactions for this case
    const interactions = await caseService.getInteractionsByCaseId(caseRecord.id);

    // Transform to match frontend format
    const transformedInteractions = interactions.map(i => ({
      id: i.id,
      party1Name: i.party1Name,
      party1Type: i.party1Type,
      party2Name: i.party2Name,
      party2Type: i.party2Type,
      content: i.content,
      createdAt: i.createdAt.toISOString(),
      fileCount: i._count.files,
    }));

    return NextResponse.json(transformedInteractions);
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cases/[caseId]/interactions
 * Create a new interaction for a case
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { caseId } = await context.params;
    const body = await request.json();
    const {
      party1Name,
      party1Type,
      party2Name,
      party2Type,
      content,
    } = body;

    // Validate required fields
    if (!party1Name || !party1Type || !party2Name || !party2Type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find case by caseId (string like "CASE-0001")
    const caseRecord = await caseService.getCaseByCaseId(caseId);

    if (!caseRecord) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Create interaction
    const newInteraction = await caseService.createInteraction({
      caseId: caseRecord.id,
      party1Name,
      party1Type,
      party2Name,
      party2Type,
      content,
    });

    // Transform to match frontend format
    const transformedInteraction = {
      id: newInteraction.id,
      party1Name: newInteraction.party1Name,
      party1Type: newInteraction.party1Type,
      party2Name: newInteraction.party2Name,
      party2Type: newInteraction.party2Type,
      content: newInteraction.content,
      createdAt: newInteraction.createdAt.toISOString(),
      fileCount: newInteraction._count.files,
    };

    return NextResponse.json(transformedInteraction, { status: 201 });
  } catch (error) {
    console.error('Error creating interaction:', error);
    return NextResponse.json(
      { error: 'Failed to create interaction' },
      { status: 500 }
    );
  }
}
