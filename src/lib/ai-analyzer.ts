/**
 * Baseera AI - AI Analysis Module
 * Server-side only module that uses z-ai-web-dev-sdk to analyze
 * APK analysis results and generate Arabic explanations and recommendations.
 */

import ZAI from 'z-ai-web-dev-sdk';

// ---------------------------------------------------------------------------
// Types (must match analyzer.ts)
// ---------------------------------------------------------------------------

export interface AppInfo {
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: string;
  minSdk: string;
  targetSdk: string;
}

export interface PermissionFinding {
  name: string;
  nameAr: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

export interface RiskFinding {
  id: string;
  title: string;
  titleAr: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  descriptionAr: string;
  recommendation: string;
  recommendationAr: string;
}

export interface ApiEndpoint {
  url: string;
  method: string;
  isSecure: boolean;
}

export interface SensitiveString {
  type: string;
  value: string;
  file: string;
}

export interface LibraryInfo {
  name: string;
  version: string;
  type: string;
}

export interface AnalysisResult {
  appInfo: AppInfo;
  permissions: PermissionFinding[];
  files: string[];
  libraries: LibraryInfo[];
  apiEndpoints: ApiEndpoint[];
  sensitiveStrings: SensitiveString[];
  risks: RiskFinding[];
  riskScore: number;
}

export interface AIAnalysisResult {
  executiveSummary: string;
  riskExplanation: string;
  permissionsAnalysis: string;
  securityAnalysis: string;
  recommendations: string;
  overallVerdict: string;
}

// ---------------------------------------------------------------------------
// Fallback Analysis (when AI is unavailable)
// ---------------------------------------------------------------------------

function generateFallbackAnalysis(result: AnalysisResult): AIAnalysisResult {
  const score = result.riskScore;
  const highPerms = result.permissions.filter(p => p.severity === 'high');
  const medPerms = result.permissions.filter(p => p.severity === 'medium');
  const insecureUrls = result.apiEndpoints.filter(e => !e.isSecure);

  let verdict = 'آمن';
  let riskLevel = 'منخفض';
  if (score >= 60) {
    verdict = 'خطير';
    riskLevel = 'عالي';
  } else if (score >= 30) {
    verdict = 'يحتاج تحسين';
    riskLevel = 'متوسط';
  }

  const highPermNames = highPerms.map(p => p.nameAr).join('، ');
  const medPermNames = medPerms.map(p => p.nameAr).join('، ');

  return {
    executiveSummary: `تم تحليل تطبيق "${result.appInfo.appName}" (الإصدار ${result.appInfo.versionName}). مستوى الخطورة العام: ${riskLevel}. تم اكتشاف ${result.risks.length} مشكلة أمنية، منها ${result.risks.filter(r => r.severity === 'high').length} مشكلة عالية الخطورة.`,
    riskExplanation: `حصل التطبيق على درجة خطورة ${score}/100. ${score >= 60 ? 'هذا يعني أن التطبيق يحتوي على مخاطر أمنية خطيرة تتطلب اهتمامًا فوريًا.' : score >= 30 ? 'هذا يعني أن التطبيق يحتوي على بعض المخاطر التي ينبغي معالجتها.' : 'هذا يعني أن التطبيق آمن بشكل عام مع مخاطر طفيفة.'}`,
    permissionsAnalysis: `يطلب التطبيق ${result.permissions.length} إذنًا: ${highPerms.length > 0 ? `${highPerms.length} أذونات عالية الخطورة (${highPermNames})` : ''}${medPerms.length > 0 ? `، ${medPerms.length} أذونات متوسطة الخطورة (${medPermNames})` : ''}. ${highPerms.length > 3 ? 'عدد الأذونات الخطيرة مرتفع بشكل مقلق وقد لا يكون جميعها ضروريًا.' : 'معظم الأذونات تبدو مبررة لوظيفة التطبيق.'}`,
    securityAnalysis: `تم اكتشاف ${result.risks.length} مشكلة أمنية. ${insecureUrls.length > 0 ? `يستخدم التطبيق ${insecureUrls.length} اتصال HTTP غير مشفر، مما يعرض البيانات لخطر الاعتراض.` : ''} ${result.sensitiveStrings.filter(s => ['API Key', 'Secret', 'Auth Token', 'Password'].includes(s.type)).length > 0 ? 'تم العثور على بيانات حساسة مضمّنة في الكود يمكن استخراجها بسهولة.' : ''}`,
    recommendations: `1. راجع جميع الأذونات المطلوبة وأزل غير الضرورية\n2. ${insecureUrls.length > 0 ? 'قم بترحيل جميع اتصالات HTTP إلى HTTPS' : 'حافظ على استخدام HTTPS في جميع الاتصالات'}\n3. انقل البيانات الحساسة إلى متغيرات بيئة الخادم\n4. قم بتطبيق مبدأ الامتياز الأقل في الصلاحيات\n5. أضف تشفير إضافي للبيانات الحساسة المخزنة`,
    overallVerdict: verdict,
  };
}

// ---------------------------------------------------------------------------
// Main AI Analysis Function
// ---------------------------------------------------------------------------

export async function analyzeWithAI(result: AnalysisResult): Promise<AIAnalysisResult> {
  try {
    const zai = await ZAI.create();

    const systemPrompt = `أنت خبير أمن سيبراني متخصص في تحليل تطبيقات الهواتف. مهمتك هي تحليل نتائج فحص تطبيق Android وتقديم تقرير شامل باللغة العربية.

يجب أن يكون تحليلك:
1. واضحاً ومفهوماً للمستخدم العادي
2. دقيقاً من الناحية التقنية
3. يحدد المخاطر بوضوح
4. يقدم توصيات عملية وقابلة للتنفيذ

أجب بصيغة JSON فقط بالتنسيق التالي (بدون أي نص إضافي قبل أو بعد JSON):
{
  "executiveSummary": "ملخص تنفيذي من 3-5 أسطر",
  "riskExplanation": "شرح مستوى الخطورة ولماذا",
  "permissionsAnalysis": "تحليل الصلاحيات والمخاطر المرتبطة بها",
  "securityAnalysis": "تحليل أمني شامل للثغرات المكتشفة",
  "recommendations": "توصيات محددة وقابلة للتنفيذ مرقمة",
  "overallVerdict": "حكم نهائي: آمن / يحتاج تحسين / خطير"
}`;

    const userData = {
      appName: result.appInfo.appName,
      packageName: result.appInfo.packageName,
      version: result.appInfo.versionName,
      targetSdk: result.appInfo.targetSdk,
      riskScore: result.riskScore,
      permissions: result.permissions.map(p => ({
        name: p.name,
        nameAr: p.nameAr,
        severity: p.severity,
      })),
      risks: result.risks.map(r => ({
        titleAr: r.titleAr,
        severity: r.severity,
        descriptionAr: r.descriptionAr,
        recommendationAr: r.recommendationAr,
      })),
      apiEndpoints: result.apiEndpoints.map(e => ({
        url: e.url,
        isSecure: e.isSecure,
      })),
      sensitiveStringTypes: result.sensitiveStrings.map(s => s.type),
      libraries: result.libraries.map(l => ({ name: l.name, type: l.type })),
    };

    const userMessage = `قم بتحليل نتائج فحص تطبيق Android التالية وتقديم تقرير أمني شامل بالعربية:\n\n${JSON.stringify(userData, null, 2)}`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      thinking: { type: 'disabled' },
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      console.warn('[ai-analyzer] Empty AI response, using fallback');
      return generateFallbackAnalysis(result);
    }

    // Try to parse JSON from the response
    let parsed: AIAnalysisResult;
    try {
      // Clean potential markdown code blocks
      let cleaned = response.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
      }
      cleaned = cleaned.trim();

      parsed = JSON.parse(cleaned);
    } catch {
      console.warn('[ai-analyzer] Failed to parse AI JSON response, using fallback');
      return generateFallbackAnalysis(result);
    }

    // Validate required fields
    if (!parsed.executiveSummary || !parsed.overallVerdict) {
      console.warn('[ai-analyzer] Incomplete AI response, using fallback');
      return generateFallbackAnalysis(result);
    }

    return parsed;
  } catch (error) {
    console.error('[ai-analyzer] AI analysis failed:', error);
    return generateFallbackAnalysis(result);
  }
}
