/**
 * Individual Case API Routes
 * PATCH - Update case fields
 * DELETE - Delete case
 */

import { NextRequest, NextResponse } from 'next/server';

import { caseService } from '@/lib/services/business/case.service';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/cases/[id]
 * Update case fields
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const caseId = parseInt(id);

    if (isNaN(caseId)) {
      return NextResponse.json(
        { error: 'Invalid case ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      escalatedBy,
      assignedTo,
      status,
      actionRequiredBy,
      description,
    } = body;

    // Build update data with proper types
    const updateData = caseService.updateCase(caseId, {
      ...(title !== undefined && { title }),
      ...(escalatedBy !== undefined && { escalatedBy }),
      ...(assignedTo !== undefined && { assignedTo }),
      ...(status !== undefined && { status }),
      ...(actionRequiredBy !== undefined && { actionRequiredBy }),
      ...(description !== undefined && { description }),
    });

    // Update case
    const updatedCase = await updateData;

    // Transform to match frontend format
    const transformedCase = {
      id: updatedCase.id,
      caseId: updatedCase.caseId,
      title: updatedCase.title,
      creationDate: updatedCase.createdAt.toLocaleDateString('en-GB'),
      status: updatedCase.status,
      actionRequired: updatedCase.actionRequiredBy,
      escalatedBy: updatedCase.escalatedBy,
      assignedTo: updatedCase.assignedTo,
      description: updatedCase.description,
      interactionCount: updatedCase._count.interactions,
      fileCount: updatedCase._count.files,
    };

    return NextResponse.json(transformedCase);
  } catch (error) {
    console.error('Error updating case:', error);
    return NextResponse.json(
      { error: 'Failed to update case' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cases/[id]
 * Delete a case and all related data
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const caseId = parseInt(id);

    if (isNaN(caseId)) {
      return NextResponse.json(
        { error: 'Invalid case ID' },
        { status: 400 }
      );
    }

    // Delete case (cascade will handle interactions and files in DB)
    // TODO: Also delete files from S3 bucket
    await caseService.deleteCase(caseId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting case:', error);
    return NextResponse.json(
      { error: 'Failed to delete case' },
      { status: 500 }
    );
  }
}
