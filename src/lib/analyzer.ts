/**
 * Baseera AI - APK Analysis Engine
 * Server-side only module for parsing and analyzing Android APK files.
 *
 * APK files are ZIP archives containing compiled resources, a binary
 * AndroidManifest.xml, DEX bytecode, and native libraries. Because the
 * manifest is stored in Android's binary XML format we take a pragmatic
 * approach: we extract the raw bytes and search for known string patterns
 * (package names, permission identifiers, etc.) using regex. When full
 * extraction is not possible we fall back to a demo/simulation mode that
 * returns realistic mock data so the platform can still be demonstrated.
 */

import AdmZip from 'adm-zip';
import { readFileSync } from 'fs';

// ---------------------------------------------------------------------------
// Types
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

// ---------------------------------------------------------------------------
// Dangerous Permissions Map (Arabic descriptions)
// ---------------------------------------------------------------------------

interface PermissionMeta {
  nameAr: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
}

const DANGEROUS_PERMISSIONS: Record<string, PermissionMeta> = {
  'android.permission.READ_CONTACTS': {
    nameAr: 'قراءة جهات الاتصال',
    severity: 'high',
    description: 'Allows the app to read all contact data on your device',
  },
  'android.permission.WRITE_CONTACTS': {
    nameAr: 'كتابة جهات الاتصال',
    severity: 'high',
    description: 'Allows the app to modify your contact data',
  },
  'android.permission.READ_CALL_LOG': {
    nameAr: 'قراءة سجل المكالمات',
    severity: 'high',
    description: 'Allows the app to read your call history',
  },
  'android.permission.READ_PHONE_STATE': {
    nameAr: 'قراءة حالة الهاتف',
    severity: 'high',
    description: 'Allows the app to access phone state including call status and device ID',
  },
  'android.permission.CALL_PHONE': {
    nameAr: 'الاتصال المباشر',
    severity: 'high',
    description: 'Allows the app to make phone calls without your confirmation',
  },
  'android.permission.READ_SMS': {
    nameAr: 'قراءة الرسائل',
    severity: 'high',
    description: 'Allows the app to read your SMS messages',
  },
  'android.permission.SEND_SMS': {
    nameAr: 'إرسال الرسائل',
    severity: 'high',
    description: 'Allows the app to send SMS messages, potentially costing you money',
  },
  'android.permission.RECEIVE_SMS': {
    nameAr: 'استقبال الرسائل',
    severity: 'high',
    description: 'Allows the app to receive and process SMS messages',
  },
  'android.permission.READ_CALENDAR': {
    nameAr: 'قراءة التقويم',
    severity: 'medium',
    description: 'Allows the app to read your calendar events',
  },
  'android.permission.CAMERA': {
    nameAr: 'الكاميرا',
    severity: 'medium',
    description: 'Allows the app to access the device camera',
  },
  'android.permission.RECORD_AUDIO': {
    nameAr: 'تسجيل الصوت',
    severity: 'high',
    description: 'Allows the app to record audio using the microphone',
  },
  'android.permission.ACCESS_FINE_LOCATION': {
    nameAr: 'الموقع الدقيق',
    severity: 'high',
    description: 'Allows the app to access your precise GPS location',
  },
  'android.permission.ACCESS_COARSE_LOCATION': {
    nameAr: 'الموقع التقريبي',
    severity: 'medium',
    description: 'Allows the app to access your approximate location',
  },
  'android.permission.READ_EXTERNAL_STORAGE': {
    nameAr: 'قراءة التخزين',
    severity: 'medium',
    description: 'Allows the app to read from external storage',
  },
  'android.permission.WRITE_EXTERNAL_STORAGE': {
    nameAr: 'كتابة التخزين',
    severity: 'medium',
    description: 'Allows the app to write to external storage',
  },
  'android.permission.REQUEST_INSTALL_PACKAGES': {
    nameAr: 'تثبيت تطبيقات',
    severity: 'high',
    description: 'Allows the app to install other applications',
  },
  'android.permission.SYSTEM_ALERT_WINDOW': {
    nameAr: 'نوافذ فوق التطبيقات',
    severity: 'medium',
    description: 'Allows the app to draw over other applications',
  },
  'android.permission.READ_PHONE_NUMBERS': {
    nameAr: 'قراءة أرقام الهاتف',
    severity: 'high',
    description: 'Allows the app to read phone numbers from the device',
  },
  'android.permission.PROCESS_OUTGOING_CALLS': {
    nameAr: 'مراقبة المكالمات الصادرة',
    severity: 'high',
    description: 'Allows the app to monitor outgoing calls',
  },
  'android.permission.BODY_SENSORS': {
    nameAr: 'مستشعرات الجسم',
    severity: 'medium',
    description: 'Allows the app to access body sensor data like heart rate',
  },
};

// ---------------------------------------------------------------------------
// Known Library Signatures
// ---------------------------------------------------------------------------

interface LibrarySignature {
  pattern: RegExp;
  name: string;
  type: string;
}

const KNOWN_LIBRARIES: LibrarySignature[] = [
  { pattern: /firebase/i, name: 'Firebase', type: 'Analytics' },
  { pattern: /google.*analytics/i, name: 'Google Analytics', type: 'Analytics' },
  { pattern: /facebook.*sdk/i, name: 'Facebook SDK', type: 'Social' },
  { pattern: /crashlytics/i, name: 'Crashlytics', type: 'Crash Reporting' },
  { pattern: /okhttp/i, name: 'OkHttp', type: 'Networking' },
  { pattern: /retrofit/i, name: 'Retrofit', type: 'Networking' },
  { pattern: /glide/i, name: 'Glide', type: 'Image Loading' },
  { pattern: /picasso/i, name: 'Picasso', type: 'Image Loading' },
  { pattern: /volley/i, name: 'Volley', type: 'Networking' },
  { pattern: /rxjava/i, name: 'RxJava', type: 'Reactive' },
  { pattern: /dagger/i, name: 'Dagger', type: 'Dependency Injection' },
  { pattern: /hilt/i, name: 'Hilt', type: 'Dependency Injection' },
  { pattern: /room/i, name: 'Room', type: 'Database' },
  { pattern: /sqlcipher/i, name: 'SQLCipher', type: 'Encryption' },
  { pattern: /exoplayer/i, name: 'ExoPlayer', type: 'Media' },
  { pattern: /workmanager/i, name: 'WorkManager', type: 'Background' },
  { pattern: /leakcanary/i, name: 'LeakCanary', type: 'Debugging' },
  { pattern: /timber/i, name: 'Timber', type: 'Logging' },
  { pattern: /moshi/i, name: 'Moshi', type: 'JSON Parsing' },
  { pattern: /gson/i, name: 'Gson', type: 'JSON Parsing' },
  { pattern: /jackson/i, name: 'Jackson', type: 'JSON Parsing' },
  { pattern: /protobuf/i, name: 'Protocol Buffers', type: 'Serialization' },
  { pattern: /stripe/i, name: 'Stripe', type: 'Payment' },
  { pattern: /paypal/i, name: 'PayPal', type: 'Payment' },
  { pattern: /amplify/i, name: 'AWS Amplify', type: 'Cloud' },
  { pattern: /sentry/i, name: 'Sentry', type: 'Crash Reporting' },
  { pattern: /mixpanel/i, name: 'Mixpanel', type: 'Analytics' },
  { pattern: /adjust/i, name: 'Adjust', type: 'Attribution' },
  { pattern: /apps-flyer|appsflyer/i, name: 'AppsFlyer', type: 'Attribution' },
  { pattern: /branch\.io/i, name: 'Branch', type: 'Deep Linking' },
];

// ---------------------------------------------------------------------------
// Sensitive String Patterns
// ---------------------------------------------------------------------------

interface SensitivePattern {
  type: string;
  pattern: RegExp;
  isSecret: boolean; // true = counts as "hardcoded secret" for scoring
}

const SENSITIVE_PATTERNS: SensitivePattern[] = [
  // URLs
  {
    type: 'URL',
    pattern: /https?:\/\/[^\s"'<>{}\\]+/gi,
    isSecret: false,
  },
  // API Key patterns
  {
    type: 'API Key',
    pattern: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?([A-Za-z0-9_\-]{20,})["']?/gi,
    isSecret: true,
  },
  // Secret / Token patterns
  {
    type: 'Secret',
    pattern: /(?:secret|client[_-]?secret|app[_-]?secret)\s*[:=]\s*["']?([A-Za-z0-9_\-]{16,})["']?/gi,
    isSecret: true,
  },
  // Bearer / Auth tokens
  {
    type: 'Auth Token',
    pattern: /(?:bearer|auth[_-]?token|access[_-]?token|refresh[_-]?token)\s*[:=]\s*["']?([A-Za-z0-9_\-\.]{16,})["']?/gi,
    isSecret: true,
  },
  // Passwords
  {
    type: 'Password',
    pattern: /(?:password|passwd|pass)\s*[:=]\s*["']([^"']{4,})["']/gi,
    isSecret: true,
  },
  // Email addresses
  {
    type: 'Email',
    pattern: /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g,
    isSecret: false,
  },
  // IP addresses
  {
    type: 'IP Address',
    pattern: /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    isSecret: false,
  },
  // Base64 strings (long ones, likely encoded data)
  {
    type: 'Base64',
    pattern: /["']([A-Za-z0-9+/]{40,}={0,2})["']/g,
    isSecret: false,
  },
  // AWS keys
  {
    type: 'AWS Key',
    pattern: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/g,
    isSecret: true,
  },
  // Google API keys
  {
    type: 'Google API Key',
    pattern: /AIza[0-9A-Za-z_\-]{35}/g,
    isSecret: true,
  },
];

// ---------------------------------------------------------------------------
// Helper: extract readable ASCII strings from a Buffer
// ---------------------------------------------------------------------------

function extractStringsFromBuffer(buffer: Buffer, minLength = 6): string[] {
  const strings: string[] = [];
  let current = '';

  for (let i = 0; i < buffer.length; i++) {
    const byte = buffer[i];
    // Accept printable ASCII and common whitespace
    if (byte >= 0x20 && byte <= 0x7e) {
      current += String.fromCharCode(byte);
    } else {
      if (current.length >= minLength) {
        strings.push(current);
      }
      current = '';
    }
  }
  if (current.length >= minLength) {
    strings.push(current);
  }

  return strings;
}

// ---------------------------------------------------------------------------
// Helper: extract UTF-8 strings from a Buffer (including Arabic text)
// ---------------------------------------------------------------------------

function extractUtf8StringsFromBuffer(buffer: Buffer, minLength = 4): string[] {
  const strings: string[] = [];

  try {
    const text = buffer.toString('utf-8');
    // Split on non-printable / control characters but keep Arabic range
    const parts = text.split(/[\x00-\x08\x0e-\x1f]+/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.length >= minLength) {
        strings.push(trimmed);
      }
    }
  } catch {
    // Fall back to ASCII extraction
    return extractStringsFromBuffer(buffer, minLength);
  }

  return strings;
}

// ---------------------------------------------------------------------------
// Binary AndroidManifest.xml Parsing (simplified)
// ---------------------------------------------------------------------------

/**
 * Android's binary XML format stores strings in a string pool chunk.
 * We extract the string pool which contains all attribute values and
 * text content. From there we can find package names, permissions,
 * SDK versions, etc.
 */
function parseBinaryManifest(manifestBuffer: Buffer): {
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: string;
  minSdk: string;
  targetSdk: string;
  permissions: string[];
  activities: string[];
  services: string[];
  receivers: string[];
  providers: string[];
} {
  const result = {
    packageName: '',
    appName: '',
    versionName: '',
    versionCode: '',
    minSdk: '',
    targetSdk: '',
    permissions: [] as string[],
    activities: [] as string[],
    services: [] as string[],
    receivers: [] as string[],
    providers: [] as string[],
  };

  try {
    // ---- Extract all readable strings from the binary manifest ----
    const allStrings = extractUtf8StringsFromBuffer(manifestBuffer, 3);

    // ---- Package name ----
    // Look for typical Java package name patterns
    const packagePattern = /^com\.|[a-z]+\.[a-z]+\.[a-z]+/;
    for (const s of allStrings) {
      if (
        packagePattern.test(s) &&
        !s.includes('permission') &&
        !s.includes('android') &&
        s.split('.').length >= 3 &&
        !result.packageName
      ) {
        result.packageName = s;
        break;
      }
    }

    // Broader search: look in the first 500 strings for a package name
    if (!result.packageName) {
      for (const s of allStrings.slice(0, 500)) {
        if (/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){2,}$/.test(s)) {
          result.packageName = s;
          break;
        }
      }
    }

    // ---- Permissions ----
    for (const s of allStrings) {
      if (s.startsWith('android.permission.')) {
        if (!result.permissions.includes(s)) {
          result.permissions.push(s);
        }
      }
    }

    // ---- Activities, Services, Receivers, Providers ----
    for (const s of allStrings) {
      // Activity names typically end with "Activity" or are fully qualified class names
      if (/Activity$/i.test(s) && s.includes('.')) {
        if (!result.activities.includes(s)) {
          result.activities.push(s);
        }
      }
      if (/Service$/i.test(s) && s.includes('.')) {
        if (!result.services.includes(s)) {
          result.services.push(s);
        }
      }
      if (/Receiver$/i.test(s) && s.includes('.')) {
        if (!result.receivers.includes(s)) {
          result.receivers.push(s);
        }
      }
      if (/Provider$/i.test(s) && s.includes('.')) {
        if (!result.providers.includes(s)) {
          result.providers.push(s);
        }
      }
    }

    // ---- SDK versions ----
    // Look for minSdkVersion / targetSdkVersion strings near numbers
    for (let i = 0; i < allStrings.length; i++) {
      const s = allStrings[i];
      if (/minSdkVersion/i.test(s) || /min.?sdk/i.test(s)) {
        // Next string might be the version number
        const next = allStrings[i + 1];
        if (next && /^\d+$/.test(next)) {
          result.minSdk = next;
        }
      }
      if (/targetSdkVersion/i.test(s) || /target.?sdk/i.test(s)) {
        const next = allStrings[i + 1];
        if (next && /^\d+$/.test(next)) {
          result.targetSdk = next;
        }
      }
    }

    // ---- Version info ----
    // Binary XML stores these as attributes; try to find them near known labels
    for (let i = 0; i < allStrings.length; i++) {
      const s = allStrings[i];
      if (/versionName/i.test(s)) {
        const next = allStrings[i + 1];
        if (next && !next.includes('android') && next.length < 30) {
          result.versionName = next;
        }
      }
      if (/versionCode/i.test(s)) {
        const next = allStrings[i + 1];
        if (next && /^\d+$/.test(next)) {
          result.versionCode = next;
        }
      }
    }

    // ---- Also try the raw string extraction (ASCII only) ----
    const asciiStrings = extractStringsFromBuffer(manifestBuffer, 4);
    for (const s of asciiStrings) {
      if (s.startsWith('android.permission.') && !result.permissions.includes(s)) {
        result.permissions.push(s);
      }
    }

    // Try to find package name from ASCII strings if not found yet
    if (!result.packageName) {
      for (const s of asciiStrings) {
        if (/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){2,}$/.test(s)) {
          result.packageName = s;
          break;
        }
      }
    }
  } catch (error) {
    console.error('[analyzer] Error parsing binary manifest:', error);
  }

  return result;
}

// ---------------------------------------------------------------------------
// Sensitive String Scanner
// ---------------------------------------------------------------------------

function scanForSensitiveStrings(
  fileName: string,
  content: string
): { findings: SensitiveString[]; secretCount: number } {
  const findings: SensitiveString[] = [];
  let secretCount = 0;

  for (const sp of SENSITIVE_PATTERNS) {
    // Reset lastIndex for patterns with global flag
    sp.pattern.lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = sp.pattern.exec(content)) !== null) {
      const value = match[1] || match[0];

      // Deduplicate by value
      if (findings.some((f) => f.value === value && f.type === sp.type)) {
        continue;
      }

      findings.push({
        type: sp.type,
        value: value.length > 200 ? value.slice(0, 200) + '...' : value,
        file: fileName,
      });

      if (sp.isSecret) {
        secretCount++;
      }
    }
  }

  return { findings, secretCount };
}

// ---------------------------------------------------------------------------
// Library Detection
// ---------------------------------------------------------------------------

function detectLibraries(files: string[]): LibraryInfo[] {
  const libraries: LibraryInfo[] = [];
  const found = new Set<string>();

  for (const file of files) {
    for (const lib of KNOWN_LIBRARIES) {
      if (!found.has(lib.name) && lib.pattern.test(file)) {
        // Try to extract version from the path
        const versionMatch = file.match(/(\d+\.\d+[\.\d]*)/);
        libraries.push({
          name: lib.name,
          version: versionMatch ? versionMatch[1] : 'unknown',
          type: lib.type,
        });
        found.add(lib.name);
      }
    }
  }

  return libraries;
}

// ---------------------------------------------------------------------------
// Risk Score Calculation
// ---------------------------------------------------------------------------

function calculateRiskScore(
  permissions: PermissionFinding[],
  sensitiveStringsCount: number,
  secretCount: number,
  insecureUrlCount: number
): number {
  let score = 0;

  // Dangerous permissions
  for (const perm of permissions) {
    if (perm.severity === 'high') {
      score += 15;
    } else if (perm.severity === 'medium') {
      score += 8;
    }
  }

  // Sensitive strings
  score += Math.min(sensitiveStringsCount * 5, 30);

  // Hardcoded secrets
  score += Math.min(secretCount * 20, 40);

  // Insecure URLs
  score += Math.min(insecureUrlCount * 10, 20);

  return Math.min(score, 100);
}

// ---------------------------------------------------------------------------
// Risk Finding Generation
// ---------------------------------------------------------------------------

function generateRiskFindings(
  permissions: PermissionFinding[],
  sensitiveStrings: SensitiveString[],
  apiEndpoints: ApiEndpoint[],
  libraries: LibraryInfo[],
  appInfo: AppInfo
): RiskFinding[] {
  const risks: RiskFinding[] = [];
  let riskId = 1;

  // High severity permissions
  const highPerms = permissions.filter((p) => p.severity === 'high');
  if (highPerms.length > 0) {
    risks.push({
      id: `RISK-${riskId++}`,
      title: 'Dangerous Permissions Detected',
      titleAr: 'أذونات خطيرة مكتشفة',
      severity: 'high',
      description: `The application requests ${highPerms.length} high-severity permission(s) that can access sensitive user data: ${highPerms.map((p) => p.nameAr).join(', ')}`,
      descriptionAr: `يطلب التطبيق ${highPerms.length} إذن(أذونات) عالية الخطورة يمكنها الوصول إلى بيانات المستخدم الحساسة: ${highPerms.map((p) => p.nameAr).join('، ')}`,
      recommendation: 'Review if all requested permissions are necessary for the app functionality. Remove unused permissions and implement least-privilege principle.',
      recommendationAr: 'راجع ما إذا كانت جميع الأذونات المطلوبة ضرورية لوظيفة التطبيق. قم بإزالة الأذونات غير المستخدمة وتطبيق مبدأ الامتياز الأقل.',
    });
  }

  // Hardcoded secrets
  const secrets = sensitiveStrings.filter((s) =>
    ['API Key', 'Secret', 'Auth Token', 'Password', 'AWS Key', 'Google API Key'].includes(s.type)
  );
  if (secrets.length > 0) {
    risks.push({
      id: `RISK-${riskId++}`,
      title: 'Hardcoded Secrets Found',
      titleAr: 'أسرار مضمّنة في الكود',
      severity: 'high',
      description: `Found ${secrets.length} hardcoded secret(s) in the application binary. This includes API keys, tokens, or passwords that could be extracted by attackers.`,
      descriptionAr: `تم العثور على ${secrets.length} سر(أسرار) مضمّن(ة) في الكود الثنائي للتطبيق. يشمل ذلك مفاتيح API أو رموز أو كلمات مرور يمكن للمهاجمين استخراجها.`,
      recommendation: 'Move all secrets to server-side environment variables or use a secure secrets management service. Never hardcode sensitive values in client applications.',
      recommendationAr: 'انقل جميع الأسرار إلى متغيرات بيئة الخادم أو استخدم خدمة إدارة أسرار آمنة. لا تقم أبدًا بتضمين قيم حساسة في تطبيقات العميل.',
    });
  }

  // Insecure HTTP endpoints
  const insecureEndpoints = apiEndpoints.filter((e) => !e.isSecure);
  if (insecureEndpoints.length > 0) {
    risks.push({
      id: `RISK-${riskId++}`,
      title: 'Insecure HTTP Endpoints',
      titleAr: 'نقاط اتصال HTTP غير آمنة',
      severity: 'high',
      description: `Found ${insecureEndpoints.length} insecure HTTP endpoint(s). Data transmitted over HTTP can be intercepted by attackers (man-in-the-middle attacks).`,
      descriptionAr: `تم العثور على ${insecureEndpoints.length} نقطة اتصال HTTP غير آمنة. يمكن للمهاجمين اعتراض البيانات المرسلة عبر HTTP (هجمات الوسيط).`,
      recommendation: 'Migrate all endpoints to HTTPS and implement certificate pinning for sensitive communications.',
      recommendationAr: 'قم بترحيل جميع نقاط الاتصال إلى HTTPS وتطبيق تثبيت الشهادة للاتصالات الحساسة.',
    });
  }

  // Tracking / analytics libraries
  const trackingLibs = libraries.filter((l) =>
    ['Analytics', 'Attribution', 'Social'].includes(l.type)
  );
  if (trackingLibs.length >= 2) {
    risks.push({
      id: `RISK-${riskId++}`,
      title: 'Multiple Tracking Libraries',
      titleAr: 'مكتبات تتبع متعددة',
      severity: 'medium',
      description: `The app includes ${trackingLibs.length} tracking/analytics libraries (${trackingLibs.map((l) => l.name).join(', ')}), which may collect user behavior data without explicit consent.`,
      descriptionAr: `يتضمن التطبيق ${trackingLibs.length} مكتبة تتبع/تحليلات (${trackingLibs.map((l) => l.name).join('، ')})، والتي قد تجمع بيانات سلوك المستخدم دون موافقة صريحة.`,
      recommendation: 'Minimize the number of tracking libraries and ensure proper user consent is obtained before collecting analytics data, in compliance with privacy regulations.',
      recommendationAr: 'قلل عدد مكتبات التتبع وتأكد من الحصول على موافقة المستخدم المناسبة قبل جمع بيانات التحليلات، وفقًا للوائح الخصوصية.',
    });
  }

  // Low target SDK
  if (appInfo.targetSdk && parseInt(appInfo.targetSdk) < 28) {
    risks.push({
      id: `RISK-${riskId++}`,
      title: 'Outdated Target SDK',
      titleAr: 'حزمة تطوير الهدف قديمة',
      severity: 'medium',
      description: `The app targets SDK version ${appInfo.targetSdk}, which is outdated. Google Play requires targetSdkVersion 33+ for new submissions.`,
      descriptionAr: `يستهدف التطبيق إصدار SDK ${appInfo.targetSdk}، وهو قديم. يتطلب Google Play إصدار targetSdkVersion 33+ للطلبات الجديدة.`,
      recommendation: 'Update the targetSdkVersion to the latest stable version to benefit from security improvements and meet store requirements.',
      recommendationAr: 'قم بتحديث targetSdkVersion إلى أحدث إصدار مستقر للاستفادة من تحسينات الأمان وتلبية متطلبات المتجر.',
    });
  }

  // Medium severity permissions
  const medPerms = permissions.filter((p) => p.severity === 'medium');
  if (medPerms.length > 0) {
    risks.push({
      id: `RISK-${riskId++}`,
      title: 'Moderate-Risk Permissions',
      titleAr: 'أذونات متوسطة المخاطر',
      severity: 'medium',
      description: `The app requests ${medPerms.length} medium-severity permission(s): ${medPerms.map((p) => p.nameAr).join(', ')}. While less critical, these still require justification.`,
      descriptionAr: `يطلب التطبيق ${medPerms.length} إذن(أذونات) متوسطة الخطورة: ${medPerms.map((p) => p.nameAr).join('، ')}. ورغم أنها أقل خطورة، إلا أنها لا تزال تتطلب تبريرًا.`,
      recommendation: 'Ensure each permission is necessary and provide clear user-facing explanations when requesting them at runtime.',
      recommendationAr: 'تأكد من ضرورة كل إذن وقدم تفسيرات واضحة للمستخدم عند طلبها في وقت التشغيل.',
    });
  }

  // Base64 / potential encoded data
  const base64Strings = sensitiveStrings.filter((s) => s.type === 'Base64');
  if (base64Strings.length > 3) {
    risks.push({
      id: `RISK-${riskId++}`,
      title: 'Potential Encoded Secrets',
      titleAr: 'أسرار مشفرة محتملة',
      severity: 'low',
      description: `Found ${base64Strings.length} Base64-encoded strings that may contain hidden sensitive data. Base64 is encoding, not encryption, and can be easily decoded.`,
      descriptionAr: `تم العثور على ${base64Strings.length} سلسلة مشفرة بـ Base64 قد تحتوي على بيانات حساسة مخفية. Base64 هو ترميز وليس تشفير، ويمكن فك ترميزه بسهولة.`,
      recommendation: 'Replace Base64 encoding with proper encryption if the data is sensitive. Do not rely on encoding for security.',
      recommendationAr: 'استبدل ترميز Base64 بتشفير مناسب إذا كانت البيانات حساسة. لا تعتمد على الترميز للأمان.',
    });
  }

  // INSTALL_PACKAGES permission
  if (permissions.some((p) => p.name === 'android.permission.REQUEST_INSTALL_PACKAGES')) {
    risks.push({
      id: `RISK-${riskId++}`,
      title: 'App Installation Permission',
      titleAr: 'إذن تثبيت التطبيقات',
      severity: 'high',
      description: 'The app can install other applications on the device. This is a highly sensitive capability that could be abused to install malware.',
      descriptionAr: 'يمكن للتطبيق تثبيت تطبيقات أخرى على الجهاز. هذه قدرة حساسة للغاية يمكن إساءة استخدامها لتثبيت برامج ضارة.',
      recommendation: 'Only use this permission if the app is an app store or updater. Implement proper verification of packages before installation.',
      recommendationAr: 'استخدم هذا الإذن فقط إذا كان التطبيق متجر تطبيقات أو أداة تحديث. قم بتطبيق التحقق المناسب من الحزم قبل التثبيت.',
    });
  }

  return risks;
}

// ---------------------------------------------------------------------------
// Main Analysis Function
// ---------------------------------------------------------------------------

export async function analyzeApk(filePath: string): Promise<AnalysisResult> {
  console.log(`[analyzer] Starting analysis of: ${filePath}`);

  // Read the APK file
  const buffer = readFileSync(filePath);
  const zip = new AdmZip(buffer);

  const zipEntries = zip.getEntries();
  const fileList = zipEntries.map((e) => e.entryName);

  // ---- Parse AndroidManifest.xml ----
  let manifestData = {
    packageName: '',
    appName: '',
    versionName: '',
    versionCode: '',
    minSdk: '',
    targetSdk: '',
    permissions: [] as string[],
    activities: [] as string[],
    services: [] as string[],
    receivers: [] as string[],
    providers: [] as string[],
  };

  const manifestEntry = zipEntries.find(
    (e) => e.entryName === 'AndroidManifest.xml'
  );

  if (manifestEntry) {
    const manifestBuffer = manifestEntry.getData();
    manifestData = parseBinaryManifest(manifestBuffer);
  } else {
    console.warn('[analyzer] AndroidManifest.xml not found in APK');
  }

  // ---- Try to extract app name from resources ----
  let appName = manifestData.appName;
  if (!appName) {
    // Try to find app_label or app_name from resource files
    const resourceEntry = zipEntries.find(
      (e) =>
        e.entryName === 'res/values/strings.xml' ||
        e.entryName === 'res/values-ar/strings.xml'
    );
    if (resourceEntry) {
      try {
        const resContent = resourceEntry.getData().toString('utf-8');
        const nameMatch = resContent.match(
          /name\s*=\s*"app_name"[^>]*>([^<]+)</i
        );
        if (nameMatch) {
          appName = nameMatch[1];
        }
      } catch {
        // ignore
      }
    }
  }

  // If we still don't have an app name, derive from package name
  if (!appName && manifestData.packageName) {
    const parts = manifestData.packageName.split('.');
    appName = parts[parts.length - 1]
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/^\w/, (c) => c.toUpperCase());
  }

  const appInfo: AppInfo = {
    packageName: manifestData.packageName || 'unknown',
    appName: appName || 'Unknown App',
    versionName: manifestData.versionName || '1.0',
    versionCode: manifestData.versionCode || '1',
    minSdk: manifestData.minSdk || '21',
    targetSdk: manifestData.targetSdk || '33',
  };

  // ---- Map permissions ----
  const permissions: PermissionFinding[] = manifestData.permissions.map(
    (permName) => {
      const meta = DANGEROUS_PERMISSIONS[permName];
      if (meta) {
        return {
          name: permName,
          nameAr: meta.nameAr,
          severity: meta.severity,
          description: meta.description,
        };
      }
      // Unknown / non-dangerous permission
      return {
        name: permName,
        nameAr: permName.split('.').pop() || permName,
        severity: 'low' as const,
        description: 'Standard or unknown permission',
      };
    }
  );

  // ---- Scan for sensitive strings ----
  const allSensitiveStrings: SensitiveString[] = [];
  let totalSecretCount = 0;

  // Scan DEX files and resource files
  const scannableExtensions = ['.dex', '.xml', '.properties', '.json', '.txt', '.cfg'];
  const scannableEntries = zipEntries.filter((e) => {
    const name = e.entryName.toLowerCase();
    return (
      !e.isDirectory &&
      (scannableExtensions.some((ext) => name.endsWith(ext)) ||
        name.includes('meta-inf') ||
        name.includes('assets/'))
    );
  });

  for (const entry of scannableEntries) {
    try {
      const content = entry.getData().toString('utf-8');
      const { findings, secretCount } = scanForSensitiveStrings(
        entry.entryName,
        content
      );
      allSensitiveStrings.push(...findings);
      totalSecretCount += secretCount;
    } catch {
      // Skip files that can't be decoded as UTF-8
    }
  }

  // Also scan the manifest for URLs / secrets
  if (manifestEntry) {
    try {
      const manifestContent = manifestEntry.getData().toString('utf-8');
      const { findings, secretCount } = scanForSensitiveStrings(
        'AndroidManifest.xml',
        manifestContent
      );
      allSensitiveStrings.push(...findings);
      totalSecretCount += secretCount;
    } catch {
      // ignore
    }
  }

  // Deduplicate sensitive strings by type+value
  const seenSensitive = new Set<string>();
  const sensitiveStrings = allSensitiveStrings.filter((s) => {
    const key = `${s.type}:${s.value}`;
    if (seenSensitive.has(key)) return false;
    seenSensitive.add(key);
    return true;
  });

  // ---- Extract API endpoints ----
  const apiEndpoints: ApiEndpoint[] = [];
  const seenUrls = new Set<string>();

  for (const s of sensitiveStrings) {
    if (s.type === 'URL') {
      const url = s.value;
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        apiEndpoints.push({
          url,
          method: 'GET', // Default; we can't determine method from static analysis
          isSecure: url.startsWith('https://'),
        });
      }
    }
  }

  // ---- Detect libraries ----
  const libraries = detectLibraries(fileList);

  // ---- Calculate risk score ----
  const insecureUrlCount = apiEndpoints.filter((e) => !e.isSecure).length;
  const riskScore = calculateRiskScore(
    permissions,
    sensitiveStrings.filter(
      (s) => !['URL', 'Email'].includes(s.type)
    ).length,
    totalSecretCount,
    insecureUrlCount
  );

  // ---- Generate risk findings ----
  const risks = generateRiskFindings(
    permissions,
    sensitiveStrings,
    apiEndpoints,
    libraries,
    appInfo
  );

  console.log(
    `[analyzer] Analysis complete. Risk score: ${riskScore}, Permissions: ${permissions.length}, Risks: ${risks.length}`
  );

  return {
    appInfo,
    permissions,
    files: fileList.slice(0, 500), // Cap at 500 files for performance
    libraries,
    apiEndpoints,
    sensitiveStrings: sensitiveStrings.slice(0, 200), // Cap findings
    risks,
    riskScore,
  };
}

// ---------------------------------------------------------------------------
// Demo / Simulation Analysis
// ---------------------------------------------------------------------------

export function generateDemoAnalysis(): AnalysisResult {
  const appInfo: AppInfo = {
    packageName: 'com.example.shoppingapp',
    appName: 'تسوّق بلس',
    versionName: '3.2.1',
    versionCode: '321',
    minSdk: '23',
    targetSdk: '34',
  };

  const permissions: PermissionFinding[] = [
    {
      name: 'android.permission.READ_CONTACTS',
      nameAr: 'قراءة جهات الاتصال',
      severity: 'high',
      description: 'Allows the app to read all contact data on your device',
    },
    {
      name: 'android.permission.ACCESS_FINE_LOCATION',
      nameAr: 'الموقع الدقيق',
      severity: 'high',
      description: 'Allows the app to access your precise GPS location',
    },
    {
      name: 'android.permission.CAMERA',
      nameAr: 'الكاميرا',
      severity: 'medium',
      description: 'Allows the app to access the device camera',
    },
    {
      name: 'android.permission.READ_EXTERNAL_STORAGE',
      nameAr: 'قراءة التخزين',
      severity: 'medium',
      description: 'Allows the app to read from external storage',
    },
    {
      name: 'android.permission.WRITE_EXTERNAL_STORAGE',
      nameAr: 'كتابة التخزين',
      severity: 'medium',
      description: 'Allows the app to write to external storage',
    },
    {
      name: 'android.permission.RECORD_AUDIO',
      nameAr: 'تسجيل الصوت',
      severity: 'high',
      description: 'Allows the app to record audio using the microphone',
    },
    {
      name: 'android.permission.READ_PHONE_STATE',
      nameAr: 'قراءة حالة الهاتف',
      severity: 'high',
      description: 'Allows the app to access phone state including call status and device ID',
    },
    {
      name: 'android.permission.REQUEST_INSTALL_PACKAGES',
      nameAr: 'تثبيت تطبيقات',
      severity: 'high',
      description: 'Allows the app to install other applications',
    },
    {
      name: 'android.permission.INTERNET',
      nameAr: 'الإنترنت',
      severity: 'low',
      description: 'Standard or unknown permission',
    },
    {
      name: 'android.permission.ACCESS_NETWORK_STATE',
      nameAr: 'حالة الشبكة',
      severity: 'low',
      description: 'Standard or unknown permission',
    },
    {
      name: 'android.permission.ACCESS_COARSE_LOCATION',
      nameAr: 'الموقع التقريبي',
      severity: 'medium',
      description: 'Allows the app to access your approximate location',
    },
    {
      name: 'android.permission.SYSTEM_ALERT_WINDOW',
      nameAr: 'نوافذ فوق التطبيقات',
      severity: 'medium',
      description: 'Allows the app to draw over other applications',
    },
  ];

  const files: string[] = [
    'AndroidManifest.xml',
    'classes.dex',
    'classes2.dex',
    'resources.arsc',
    'res/layout/activity_main.xml',
    'res/layout/fragment_home.xml',
    'res/layout/fragment_cart.xml',
    'res/layout/fragment_profile.xml',
    'res/values/strings.xml',
    'res/values-ar/strings.xml',
    'res/drawable/ic_launcher.png',
    'res/mipmap-hdpi/ic_launcher.png',
    'res/mipmap-mdpi/ic_launcher.png',
    'res/mipmap-xhdpi/ic_launcher.png',
    'res/mipmap-xxhdpi/ic_launcher.png',
    'assets/config.json',
    'assets/certificates/root_ca.pem',
    'lib/armeabi-v7a/libnative.so',
    'lib/arm64-v8a/libnative.so',
    'META-INF/MANIFEST.MF',
    'META-INF/CERT.SF',
    'META-INF/CERT.RSA',
    'com/example/shoppingapp/MainActivity.class',
    'com/example/shoppingapp/CartFragment.class',
    'com/example/shoppingapp/ProfileFragment.class',
    'com/example/shoppingapp/network/ApiClient.class',
    'com/example/shoppingapp/network/ApiService.class',
    'com/example/shoppingapp/utils/CryptoHelper.class',
    'com/example/shoppingapp/tracking/AnalyticsManager.class',
    'com/google/firebase/analytics/',
    'com/google/firebase/messaging/',
    'com/facebook/ads/',
    'com/adjust/sdk/',
    'okhttp3/',
    'retrofit2/',
  ];

  const libraries: LibraryInfo[] = [
    { name: 'Firebase', version: '20.3.0', type: 'Analytics' },
    { name: 'Facebook SDK', version: '15.2.0', type: 'Social' },
    { name: 'OkHttp', version: '4.11.0', type: 'Networking' },
    { name: 'Retrofit', version: '2.9.0', type: 'Networking' },
    { name: 'Glide', version: '4.15.1', type: 'Image Loading' },
    { name: 'Adjust', version: '4.33.0', type: 'Attribution' },
    { name: 'Gson', version: '2.10.1', type: 'JSON Parsing' },
    { name: 'Dagger', version: '2.48', type: 'Dependency Injection' },
    { name: 'SQLCipher', version: '4.5.6', type: 'Encryption' },
  ];

  const apiEndpoints: ApiEndpoint[] = [
    {
      url: 'https://api.shoppingapp.example.com/v2/products',
      method: 'GET',
      isSecure: true,
    },
    {
      url: 'https://api.shoppingapp.example.com/v2/cart',
      method: 'POST',
      isSecure: true,
    },
    {
      url: 'https://api.shoppingapp.example.com/v2/user/profile',
      method: 'GET',
      isSecure: true,
    },
    {
      url: 'http://tracking.shoppingapp.example.com/events',
      method: 'POST',
      isSecure: false,
    },
    {
      url: 'http://ads.shoppingapp.example.com/impression',
      method: 'POST',
      isSecure: false,
    },
    {
      url: 'https://firebase.googleapis.com/v1/projects/shop/messages:send',
      method: 'POST',
      isSecure: true,
    },
    {
      url: 'https://graph.facebook.com/v16.0/',
      method: 'GET',
      isSecure: true,
    },
  ];

  const sensitiveStrings: SensitiveString[] = [
    {
      type: 'Google API Key',
      value: 'AIzaSyDxJ3kLmN4oP8qR2sT5uV1wX6yZ0aBcDeF',
      file: 'assets/config.json',
    },
    {
      type: 'API Key',
      value: 'api_key=REDACTED_STRIPE_KEY_EXAMPLE',
      file: 'com/example/shoppingapp/network/ApiClient.class',
    },
    {
      type: 'Secret',
      value: 'client_secret=cs_9a8b7c6d5e4f3g2h1i0j',
      file: 'assets/config.json',
    },
    {
      type: 'Auth Token',
      value: 'bearer_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
      file: 'com/example/shoppingapp/network/ApiService.class',
    },
    {
      type: 'URL',
      value: 'http://tracking.shoppingapp.example.com/events',
      file: 'com/example/shoppingapp/tracking/AnalyticsManager.class',
    },
    {
      type: 'URL',
      value: 'http://ads.shoppingapp.example.com/impression',
      file: 'com/facebook/ads/AdManager.class',
    },
    {
      type: 'Email',
      value: 'dev@shoppingapp.example.com',
      file: 'assets/config.json',
    },
    {
      type: 'IP Address',
      value: '192.168.1.100',
      file: 'assets/config.json',
    },
    {
      type: 'Base64',
      value: 'c2hvcHBpbmctYXBwLXNlY3JldC1rZXktMjAyNA==',
      file: 'com/example/shoppingapp/utils/CryptoHelper.class',
    },
    {
      type: 'Password',
      value: 'db_password=Sh0pp1ng$ecure',
      file: 'assets/config.json',
    },
  ];

  const risks: RiskFinding[] = [
    {
      id: 'RISK-1',
      title: 'Dangerous Permissions Detected',
      titleAr: 'أذونات خطيرة مكتشفة',
      severity: 'high',
      description:
        'The application requests 5 high-severity permission(s) that can access sensitive user data: قراءة جهات الاتصال، الموقع الدقيق، تسجيل الصوت، قراءة حالة الهاتف، تثبيت تطبيقات',
      descriptionAr:
        'يطلب التطبيق 5 أذونات عالية الخطورة يمكنها الوصول إلى بيانات المستخدم الحساسة: قراءة جهات الاتصال، الموقع الدقيق، تسجيل الصوت، قراءة حالة الهاتف، تثبيت تطبيقات',
      recommendation:
        'Review if all requested permissions are necessary for the app functionality. Remove unused permissions and implement least-privilege principle.',
      recommendationAr:
        'راجع ما إذا كانت جميع الأذونات المطلوبة ضرورية لوظيفة التطبيق. قم بإزالة الأذونات غير المستخدمة وتطبيق مبدأ الامتياز الأقل.',
    },
    {
      id: 'RISK-2',
      title: 'Hardcoded Secrets Found',
      titleAr: 'أسرار مضمّنة في الكود',
      severity: 'high',
      description:
        'Found 5 hardcoded secret(s) in the application binary. This includes API keys, tokens, or passwords that could be extracted by attackers.',
      descriptionAr:
        'تم العثور على 5 أسرار مضمّنة في الكود الثنائي للتطبيق. يشمل ذلك مفاتيح API أو رموز أو كلمات مرور يمكن للمهاجمين استخراجها.',
      recommendation:
        'Move all secrets to server-side environment variables or use a secure secrets management service. Never hardcode sensitive values in client applications.',
      recommendationAr:
        'انقل جميع الأسرار إلى متغيرات بيئة الخادم أو استخدم خدمة إدارة أسرار آمنة. لا تقم أبدًا بتضمين قيم حساسة في تطبيقات العميل.',
    },
    {
      id: 'RISK-3',
      title: 'Insecure HTTP Endpoints',
      titleAr: 'نقاط اتصال HTTP غير آمنة',
      severity: 'high',
      description:
        'Found 2 insecure HTTP endpoint(s). Data transmitted over HTTP can be intercepted by attackers (man-in-the-middle attacks).',
      descriptionAr:
        'تم العثور على 2 نقطة اتصال HTTP غير آمنة. يمكن للمهاجمين اعتراض البيانات المرسلة عبر HTTP (هجمات الوسيط).',
      recommendation:
        'Migrate all endpoints to HTTPS and implement certificate pinning for sensitive communications.',
      recommendationAr:
        'قم بترحيل جميع نقاط الاتصال إلى HTTPS وتطبيق تثبيت الشهادة للاتصالات الحساسة.',
    },
    {
      id: 'RISK-4',
      title: 'Multiple Tracking Libraries',
      titleAr: 'مكتبات تتبع متعددة',
      severity: 'medium',
      description:
        'The app includes 3 tracking/analytics libraries (Firebase, Facebook SDK, Adjust), which may collect user behavior data without explicit consent.',
      descriptionAr:
        'يتضمن التطبيق 3 مكتبات تتبع/تحليلات (Firebase، Facebook SDK، Adjust)، والتي قد تجمع بيانات سلوك المستخدم دون موافقة صريحة.',
      recommendation:
        'Minimize the number of tracking libraries and ensure proper user consent is obtained before collecting analytics data, in compliance with privacy regulations.',
      recommendationAr:
        'قلل عدد مكتبات التتبع وتأكد من الحصول على موافقة المستخدم المناسبة قبل جمع بيانات التحليلات، وفقًا للوائح الخصوصية.',
    },
    {
      id: 'RISK-5',
      title: 'App Installation Permission',
      titleAr: 'إذن تثبيت التطبيقات',
      severity: 'high',
      description:
        'The app can install other applications on the device. This is a highly sensitive capability that could be abused to install malware.',
      descriptionAr:
        'يمكن للتطبيق تثبيت تطبيقات أخرى على الجهاز. هذه قدرة حساسة للغاية يمكن إساءة استخدامها لتثبيت برامج ضارة.',
      recommendation:
        'Only use this permission if the app is an app store or updater. Implement proper verification of packages before installation.',
      recommendationAr:
        'استخدم هذا الإذن فقط إذا كان التطبيق متجر تطبيقات أو أداة تحديث. قم بتطبيق التحقق المناسب من الحزم قبل التثبيت.',
    },
    {
      id: 'RISK-6',
      title: 'Moderate-Risk Permissions',
      titleAr: 'أذونات متوسطة المخاطر',
      severity: 'medium',
      description:
        'The app requests 4 medium-severity permission(s): الكاميرا، قراءة التخزين، كتابة التخزين، الموقع التقريبي. While less critical, these still require justification.',
      descriptionAr:
        'يطلب التطبيق 4 أذونات متوسطة الخطورة: الكاميرا، قراءة التخزين، كتابة التخزين، الموقع التقريبي. ورغم أنها أقل خطورة، إلا أنها لا تزال تتطلب تبريرًا.',
      recommendation:
        'Ensure each permission is necessary and provide clear user-facing explanations when requesting them at runtime.',
      recommendationAr:
        'تأكد من ضرورة كل إذن وقدم تفسيرات واضحة للمستخدم عند طلبها في وقت التشغيل.',
    },
    {
      id: 'RISK-7',
      title: 'Potential Encoded Secrets',
      titleAr: 'أسرار مشفرة محتملة',
      severity: 'low',
      description:
        'Found 1 Base64-encoded string that may contain hidden sensitive data. Base64 is encoding, not encryption, and can be easily decoded.',
      descriptionAr:
        'تم العثور على 1 سلسلة مشفرة بـ Base64 قد تحتوي على بيانات حساسة مخفية. Base64 هو ترميز وليس تشفير، ويمكن فك ترميزه بسهولة.',
      recommendation:
        'Replace Base64 encoding with proper encryption if the data is sensitive. Do not rely on encoding for security.',
      recommendationAr:
        'استبدل ترميز Base64 بتشفير مناسب إذا كانت البيانات حساسة. لا تعتمد على الترميز للأمان.',
    },
  ];

  // Calculate score based on demo data
  const highPerms = permissions.filter((p) => p.severity === 'high').length;
  const medPerms = permissions.filter((p) => p.severity === 'medium').length;
  const secretCount = sensitiveStrings.filter((s) =>
    ['API Key', 'Secret', 'Auth Token', 'Password', 'AWS Key', 'Google API Key'].includes(s.type)
  ).length;
  const insecureUrls = apiEndpoints.filter((e) => !e.isSecure).length;
  const otherSensitive = sensitiveStrings.filter(
    (s) => !['URL', 'Email'].includes(s.type) && !['API Key', 'Secret', 'Auth Token', 'Password', 'AWS Key', 'Google API Key'].includes(s.type)
  ).length;

  const riskScore = Math.min(
    highPerms * 15 + medPerms * 8 + Math.min(otherSensitive * 5, 30) + Math.min(secretCount * 20, 40) + Math.min(insecureUrls * 10, 20),
    100
  );

  return {
    appInfo,
    permissions,
    files,
    libraries,
    apiEndpoints,
    sensitiveStrings,
    risks,
    riskScore,
  };
}
