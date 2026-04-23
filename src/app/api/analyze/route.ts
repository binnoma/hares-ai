/**
 * Baseera AI - Upload & Analyze API
 * Handles APK file upload and starts the analysis process
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { db } from '@/lib/db';
import { analyzeApk, generateDemoAnalysis } from '@/lib/analyzer';
import { analyzeWithAI } from '@/lib/ai-analyzer';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const demoMode = formData.get('demo') as string | null;

    // Create analysis record
    const analysis = await db.analysis.create({
      data: {
        fileName: file?.name || 'demo.apk',
        fileSize: file?.size || 0,
        fileType: 'apk',
        status: 'analyzing',
        appInfo: '{}',
        permissions: '[]',
        files: '[]',
        libraries: '[]',
        apiEndpoints: '[]',
        sensitiveStrings: '[]',
        risks: '[]',
        aiAnalysis: '{}',
        riskScore: 0,
      },
    });

    // Run analysis in background
    (async () => {
      try {
        let analysisResult;

        if (demoMode === 'true') {
          // Demo mode - generate sample analysis
          analysisResult = generateDemoAnalysis();
        } else if (file) {
          // Real file upload
          const uploadsDir = path.join(process.cwd(), 'uploads');
          await mkdir(uploadsDir, { recursive: true });
          const filePath = path.join(uploadsDir, `${analysis.id}-${file.name}`);
          const bytes = await file.arrayBuffer();
          await writeFile(filePath, Buffer.from(bytes));

          analysisResult = await analyzeApk(filePath);

          // Clean up uploaded file
          try {
            const { unlink } = await import('fs/promises');
            await unlink(filePath);
          } catch {}
        } else {
          throw new Error('No file provided and demo mode not enabled');
        }

        // Update with analysis results
        await db.analysis.update({
          where: { id: analysis.id },
          data: {
            status: 'ai-analyzing',
            appInfo: JSON.stringify(analysisResult.appInfo),
            permissions: JSON.stringify(analysisResult.permissions),
            files: JSON.stringify(analysisResult.files),
            libraries: JSON.stringify(analysisResult.libraries),
            apiEndpoints: JSON.stringify(analysisResult.apiEndpoints),
            sensitiveStrings: JSON.stringify(analysisResult.sensitiveStrings),
            risks: JSON.stringify(analysisResult.risks),
            riskScore: analysisResult.riskScore,
          },
        });

        // Run AI analysis
        const aiResult = await analyzeWithAI(analysisResult);

        await db.analysis.update({
          where: { id: analysis.id },
          data: {
            status: 'completed',
            aiAnalysis: JSON.stringify(aiResult),
          },
        });

      } catch (error) {
        console.error('[analyze] Analysis error:', error);
        await db.analysis.update({
          where: { id: analysis.id },
          data: { status: 'failed' },
        });
      }
    })();

    return NextResponse.json({
      success: true,
      analysisId: analysis.id,
      message: 'Analysis started',
    });

  } catch (error) {
    console.error('[analyze] Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start analysis' },
      { status: 500 }
    );
  }
}
