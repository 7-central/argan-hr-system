/**
 * Case Files API Routes
 * GET - Fetch files for a case or interaction
 */

import { NextRequest, NextResponse } from 'next/server';

import { caseService } from '@/lib/services/business/case.service';

/**
 * GET /api/cases/files?caseId={caseId}&interactionId={interactionId}
 * Fetch files for a case or specific interaction
 *
 * - If only caseId provided: returns all case-level files (interaction_id = null)
 * - If both caseId and interactionId provided: returns files for that interaction
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseIdParam = searchParams.get('caseId');
    const interactionIdParam = searchParams.get('interactionId');

    if (!caseIdParam) {
      return NextResponse.json(
        { error: 'caseId is required' },
        { status: 400 }
      );
    }

    // Find case by caseId (string like "CASE-0001")
    const caseRecord = await caseService.getCaseByCaseId(caseIdParam);

    if (!caseRecord) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Fetch files
    const files = await caseService.getFiles(
      caseRecord.id,
      interactionIdParam ? parseInt(interactionIdParam) : null
    );

    // Transform to match frontend format
    const transformedFiles = files.map(f => ({
      id: f.id,
      fileName: f.fileName,
      fileUrl: f.fileUrl,
      fileSize: f.fileSize,
      uploadedBy: f.uploadedBy,
      uploadedAt: f.uploadedAt.toISOString(),
      fileTitle: f.fileTitle,
      fileDescription: f.fileDescription,
      fileTags: f.fileTags,
    }));

    return NextResponse.json(transformedFiles);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
