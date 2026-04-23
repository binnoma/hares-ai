/**
 * Baseera AI - Get Analysis Status & Results
 * Polls analysis progress and returns results
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Analysis ID is required' },
        { status: 400 }
      );
    }

    const analysis = await db.analysis.findUnique({
      where: { id },
    });

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: 'Analysis not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      analysis: {
        id: analysis.id,
        fileName: analysis.fileName,
        fileSize: analysis.fileSize,
        fileType: analysis.fileType,
        status: analysis.status,
        appInfo: JSON.parse(analysis.appInfo),
        permissions: JSON.parse(analysis.permissions),
        files: JSON.parse(analysis.files),
        libraries: JSON.parse(analysis.libraries),
        apiEndpoints: JSON.parse(analysis.apiEndpoints),
        sensitiveStrings: JSON.parse(analysis.sensitiveStrings),
        risks: JSON.parse(analysis.risks),
        riskScore: analysis.riskScore,
        aiAnalysis: JSON.parse(analysis.aiAnalysis),
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
      },
    });
  } catch (error) {
    console.error('[status] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get analysis' },
      { status: 500 }
    );
  }
}
