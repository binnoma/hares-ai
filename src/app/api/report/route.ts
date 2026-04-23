/**
 * Baseera AI - Report Generation API
 * Generates HTML report for a completed analysis
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

    if (!analysis || analysis.status !== 'completed') {
      return NextResponse.json(
        { success: false, error: 'Analysis not completed yet' },
        { status: 400 }
      );
    }

    const appInfo = JSON.parse(analysis.appInfo);
    const permissions = JSON.parse(analysis.permissions);
    const risks = JSON.parse(analysis.risks);
    const apiEndpoints = JSON.parse(analysis.apiEndpoints);
    const sensitiveStrings = JSON.parse(analysis.sensitiveStrings);
    const libraries = JSON.parse(analysis.libraries);
    const aiAnalysis = JSON.parse(analysis.aiAnalysis);

    const riskColor = analysis.riskScore >= 60 ? '#dc2626' : analysis.riskScore >= 30 ? '#f59e0b' : '#16a34a';
    const riskLabel = analysis.riskScore >= 60 ? 'خطير' : analysis.riskScore >= 30 ? 'يحتاج تحسين' : 'آمن';
    const highRisks = risks.filter((r: { severity: string }) => r.severity === 'high').length;
    const medRisks = risks.filter((r: { severity: string }) => r.severity === 'medium').length;
    const lowRisks = risks.filter((r: { severity: string }) => r.severity === 'low').length;

    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تقرير تحليل - بصيرة AI | ${appInfo.appName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Tajawal', sans-serif; background: #f8fafc; color: #1e293b; line-height: 1.8; direction: rtl; }
    .container { max-width: 900px; margin: 0 auto; padding: 40px 24px; }
    .header { text-align: center; margin-bottom: 48px; padding: 48px 24px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 16px; color: white; }
    .header h1 { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
    .header .subtitle { font-size: 16px; opacity: 0.8; }
    .header .brand { font-size: 14px; opacity: 0.6; margin-top: 16px; }
    .score-card { display: flex; align-items: center; justify-content: center; gap: 32px; margin: -36px auto 48px; padding: 32px; background: white; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .score-circle { width: 120px; height: 120px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 4px solid ${riskColor}; }
    .score-number { font-size: 36px; font-weight: 800; color: ${riskColor}; }
    .score-label { font-size: 14px; color: ${riskColor}; font-weight: 700; }
    .score-details { text-align: right; }
    .score-details h3 { font-size: 20px; margin-bottom: 8px; }
    .score-details p { font-size: 14px; color: #64748b; }
    .section { background: white; border-radius: 12px; padding: 32px; margin-bottom: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
    .section h2 { font-size: 22px; font-weight: 700; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 2px solid #e2e8f0; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-item { padding: 12px; background: #f8fafc; border-radius: 8px; }
    .info-item .label { font-size: 12px; color: #64748b; margin-bottom: 4px; }
    .info-item .value { font-size: 15px; font-weight: 600; }
    .risk-item { padding: 16px; border-radius: 8px; margin-bottom: 12px; border-right: 4px solid; }
    .risk-high { background: #fef2f2; border-color: #dc2626; }
    .risk-medium { background: #fffbeb; border-color: #f59e0b; }
    .risk-low { background: #f0fdf4; border-color: #16a34a; }
    .risk-item .risk-title { font-weight: 700; margin-bottom: 4px; }
    .risk-item .risk-desc { font-size: 14px; color: #475569; margin-bottom: 8px; }
    .risk-item .risk-rec { font-size: 13px; color: #16a34a; }
    .perm-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 13px; margin: 4px; }
    .perm-high { background: #fef2f2; color: #dc2626; }
    .perm-medium { background: #fffbeb; color: #d97706; }
    .perm-low { background: #f0fdf4; color: #16a34a; }
    .ai-section { background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1px solid #bbf7d0; }
    .ai-section h2 { border-bottom-color: #86efac; }
    .ai-content p { margin-bottom: 12px; line-height: 1.9; }
    .endpoint-table { width: 100%; border-collapse: collapse; }
    .endpoint-table th, .endpoint-table td { padding: 10px 12px; text-align: right; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .endpoint-table th { background: #f8fafc; font-weight: 600; }
    .secure-badge { color: #16a34a; }
    .insecure-badge { color: #dc2626; }
    .lib-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
    .lib-item { padding: 8px 12px; background: #f8fafc; border-radius: 6px; font-size: 13px; text-align: center; }
    .lib-name { font-weight: 600; display: block; }
    .lib-type { color: #64748b; font-size: 11px; }
    .stats-row { display: flex; gap: 16px; margin-bottom: 16px; }
    .stat-box { flex: 1; padding: 16px; border-radius: 8px; text-align: center; }
    .stat-box.high { background: #fef2f2; }
    .stat-box.medium { background: #fffbeb; }
    .stat-box.low { background: #f0fdf4; }
    .stat-number { font-size: 28px; font-weight: 800; }
    .stat-label { font-size: 12px; color: #64748b; }
    .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 12px; margin-top: 48px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡️ تقرير تحليل أمني</h1>
      <div class="subtitle">${appInfo.appName} - الإصدار ${appInfo.versionName}</div>
      <div class="brand">بصيرة AI | Baseera AI - تحليل ذكي للتطبيقات</div>
    </div>

    <div class="score-card">
      <div class="score-circle">
        <div class="score-number">${analysis.riskScore}</div>
        <div class="score-label">/ 100</div>
      </div>
      <div class="score-details">
        <h3>التقييم: ${riskLabel}</h3>
        <p>الحكم النهائي للـ AI: ${aiAnalysis.overallVerdict || riskLabel}</p>
        <p>${appInfo.packageName}</p>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-box high">
        <div class="stat-number" style="color:#dc2626">${highRisks}</div>
        <div class="stat-label">مخاطر عالية</div>
      </div>
      <div class="stat-box medium">
        <div class="stat-number" style="color:#d97706">${medRisks}</div>
        <div class="stat-label">مخاطر متوسطة</div>
      </div>
      <div class="stat-box low">
        <div class="stat-number" style="color:#16a34a">${lowRisks}</div>
        <div class="stat-label">مخاطر منخفضة</div>
      </div>
    </div>

    <div class="section ai-section">
      <h2>🧠 تحليل الذكاء الاصطناعي</h2>
      <div class="ai-content">
        <p><strong>📋 الملخص التنفيذي:</strong><br/>${aiAnalysis.executiveSummary || ''}</p>
        <p><strong>⚠️ شرح مستوى الخطورة:</strong><br/>${aiAnalysis.riskExplanation || ''}</p>
        <p><strong>🔐 تحليل الصلاحيات:</strong><br/>${aiAnalysis.permissionsAnalysis || ''}</p>
        <p><strong>🛡️ التحليل الأمني:</strong><br/>${aiAnalysis.securityAnalysis || ''}</p>
        <p><strong>📌 التوصيات:</strong><br/>${(aiAnalysis.recommendations || '').replace(/\n/g, '<br/>')}</p>
      </div>
    </div>

    <div class="section">
      <h2>📱 معلومات التطبيق</h2>
      <div class="info-grid">
        <div class="info-item"><div class="label">اسم التطبيق</div><div class="value">${appInfo.appName}</div></div>
        <div class="info-item"><div class="label">اسم الحزمة</div><div class="value">${appInfo.packageName}</div></div>
        <div class="info-item"><div class="label">الإصدار</div><div class="value">${appInfo.versionName} (${appInfo.versionCode})</div></div>
        <div class="info-item"><div class="label">SDK الهدف</div><div class="value">${appInfo.targetSdk}</div></div>
      </div>
    </div>

    <div class="section">
      <h2>🔑 الصلاحيات (${permissions.length})</h2>
      <div>
        ${permissions.map((p: { nameAr: string; severity: string; name: string }) =>
          `<span class="perm-badge perm-${p.severity}">${p.nameAr}</span>`
        ).join('')}
      </div>
    </div>

    <div class="section">
      <h2>⚠️ الثغرات والمخاطر (${risks.length})</h2>
      ${risks.map((r: { severity: string; titleAr: string; descriptionAr: string; recommendationAr: string }) => `
        <div class="risk-item risk-${r.severity}">
          <div class="risk-title">${r.severity === 'high' ? '🔴' : r.severity === 'medium' ? '🟡' : '🟢'} ${r.titleAr}</div>
          <div class="risk-desc">${r.descriptionAr}</div>
          <div class="risk-rec">💡 ${r.recommendationAr}</div>
        </div>
      `).join('')}
    </div>

    ${apiEndpoints.length > 0 ? `
    <div class="section">
      <h2>🌐 نقاط الاتصال API (${apiEndpoints.length})</h2>
      <table class="endpoint-table">
        <thead><tr><th>الرابط</th><th>الطريقة</th><th>الأمان</th></tr></thead>
        <tbody>
          ${apiEndpoints.map((e: { url: string; method: string; isSecure: boolean }) => `
            <tr>
              <td style="font-size:12px;word-break:break-all;">${e.url}</td>
              <td>${e.method}</td>
              <td class="${e.isSecure ? 'secure-badge' : 'insecure-badge'}">${e.isSecure ? '✅ HTTPS' : '❌ HTTP'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    ${libraries.length > 0 ? `
    <div class="section">
      <h2>📚 المكتبات المستخدمة (${libraries.length})</h2>
      <div class="lib-grid">
        ${libraries.map((l: { name: string; type: string; version: string }) => `
          <div class="lib-item">
            <span class="lib-name">${l.name}</span>
            <span class="lib-type">${l.type} - ${l.version}</span>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div class="footer">
      <p>تم إنشاء هذا التقرير بواسطة بصيرة AI | Baseera AI</p>
      <p>هذا التقرير للاستخدام التعليمي والاختبار القانوني فقط</p>
      <p>${new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>
  </div>
</body>
</html>`;

    // Save the HTML report
    await db.analysis.update({
      where: { id: analysis.id },
      data: { reportHtml: html },
    });

    return NextResponse.json({
      success: true,
      html,
    });
  } catch (error) {
    console.error('[report] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
