/**
 * Save File Record to Database
 * POST /api/cases/upload/save
 */

import { NextRequest, NextResponse } from 'next/server';

import { caseService } from '@/lib/services/business/case.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      caseId,
      interactionId,
      fileName,
      fileUrl,
      fileSize,
      fileTitle,
      fileDescription,
      fileTags,
    } = body;

    if (!caseId || !fileName || !fileUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // TODO: Get actual admin user ID from session
    const uploadedBy = 'admin-user';

    // Create file record
    const fileRecord = await caseService.createFile({
      caseId: parseInt(caseId),
      interactionId: interactionId ? parseInt(interactionId) : null,
      fileName,
      fileUrl,
      fileSize: parseInt(fileSize),
      uploadedBy,
      fileTitle,
      fileDescription,
      fileTags,
    });

    return NextResponse.json({
      success: true,
      fileId: fileRecord.id,
    });
  } catch (error) {
    console.error('Error saving file record:', error);
    return NextResponse.json(
      { error: 'Failed to save file record' },
      { status: 500 }
    );
  }
}
