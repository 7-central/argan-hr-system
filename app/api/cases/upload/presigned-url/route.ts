/**
 * Generate Presigned S3 Upload URL
 * POST /api/cases/upload/presigned-url
 */

import { NextRequest, NextResponse } from 'next/server';

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'eu-west-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = 'argan-admin-bucket';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileType, uploadPath } = body;

    if (!fileName || !uploadPath) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate S3 key with timestamp
    const timestamp = Date.now();
    const s3Key = `${uploadPath}/${timestamp}-${fileName}`;

    // Generate presigned URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: fileType || 'application/octet-stream',
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, // 5 minutes
    });

    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'eu-west-2'}.amazonaws.com/${s3Key}`;

    return NextResponse.json({
      uploadUrl,
      fileUrl,
      s3Key,
    });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
