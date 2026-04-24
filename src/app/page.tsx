'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Upload, FileText, Brain, AlertTriangle, CheckCircle,
  XCircle, ChevronDown, Download, Search, Smartphone, Globe,
  Key, BookOpen, Eye, RefreshCw, Zap, Lock, Unlock, Info,
  ArrowRight, BarChart3, Activity, FileSearch, Sparkles, ShieldCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useHaresStore, type AnalysisData } from '@/lib/store';

// ---------------------------------------------------------------------------
// Status Polling Hook
// ---------------------------------------------------------------------------

function useAnalysisPolling(analysisId: string | null) {
  const { setAnalysisData, setIsAnalyzing } = useHaresStore();

  useEffect(() => {
    if (!analysisId) return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/analyses?id=${analysisId}`);
        const data = await res.json();
        if (data.success) {
          setAnalysisData(data.analysis);
          if (data.analysis.status === 'completed' || data.analysis.status === 'failed') {
            setIsAnalyzing(false);
            return true; // Stop polling
          }
        }
      } catch {
        // Continue polling on error
      }
      return false;
    };

    const interval = setInterval(async () => {
      const shouldStop = await poll();
      if (shouldStop) clearInterval(interval);
    }, 2000);

    // Initial poll
    poll();

    return () => clearInterval(interval);
  }, [analysisId, setAnalysisData, setIsAnalyzing]);
}

// ---------------------------------------------------------------------------
// Landing / Upload Section
// ---------------------------------------------------------------------------

function LandingSection() {
  const { setIsUploading, setIsAnalyzing, setAnalysisId, setError } = useHaresStore();
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setAnalysisId(data.analysisId);
        setIsAnalyzing(true);
      } else {
        setError(data.error || 'فشل في رفع الملف');
      }
    } catch {
      setError('حدث خطأ أثناء رفع الملف');
    } finally {
      setIsUploading(false);
    }
  }, [setIsUploading, setIsAnalyzing, setAnalysisId, setError]);

  const handleDemo = useCallback(async () => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('demo', 'true');

      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setAnalysisId(data.analysisId);
        setIsAnalyzing(true);
      } else {
        setError(data.error || 'فشل في تشغيل التحليل التجريبي');
      }
    } catch {
      setError('حدث خطأ أثناء تشغيل التحليل التجريبي');
    } finally {
      setIsUploading(false);
    }
  }, [setIsUploading, setIsAnalyzing, setAnalysisId, setError]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.apk') || file.name.endsWith('.ipa'))) {
      handleFile(file);
    }
  }, [handleFile]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Shield className="w-9 h-9 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">حَارِس</h1>
            <p className="text-sm text-muted-foreground font-medium">Hares AI</p>
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-3">تحليل ذكي لتطبيقات الهواتف</h2>
        <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
          منصة متقدمة لتحليل تطبيقات Android وشرح النتائج باللغة العربية باستخدام الذكاء الاصطناعي.
          ارفع ملف APK واحصل على تقرير أمني شامل.
        </p>
      </motion.div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-xl"
      >
        <div
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-300 group
            ${dragActive
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 scale-[1.02]'
              : 'border-muted-foreground/25 hover:border-emerald-500/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10'
            }
          `}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".apk,.ipa"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <div className="flex flex-col items-center gap-4">
            <div className={`
              w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300
              ${dragActive
                ? 'bg-emerald-500 text-white scale-110'
                : 'bg-muted text-muted-foreground group-hover:bg-emerald-100 group-hover:text-emerald-600 dark:group-hover:bg-emerald-900/30'
              }
            `}>
              <Upload className="w-10 h-10" />
            </div>
            <div>
              <p className="text-lg font-semibold mb-1">
                {dragActive ? 'أفلت الملف هنا' : 'اسحب ملف APK هنا أو اضغط للاختيار'}
              </p>
              <p className="text-sm text-muted-foreground">
                يدعم ملفات APK فقط (الحد الأقصى 100 ميجابايت)
              </p>
            </div>
          </div>
        </div>

        {/* Demo Button */}
        <div className="mt-6 text-center">
          <Separator className="mb-6" />
          <p className="text-sm text-muted-foreground mb-4">أو جرّب التحليل التجريبي بدون رفع ملف</p>
          <Button
            onClick={handleDemo}
            size="lg"
            className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/20"
          >
            <Sparkles className="w-5 h-5" />
            تحليل تجريبي
          </Button>
        </div>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-20 w-full max-w-3xl"
      >
        {[
          { icon: Search, title: 'تحليل عميق', desc: 'استخراج الصلاحيات والثغرات وAPI endpoints' },
          { icon: Brain, title: 'ذكاء اصطناعي', desc: 'شرح النتائج بالعربي مع توصيات واضحة' },
          { icon: FileText, title: 'تقارير شاملة', desc: 'تقارير HTML مفصلة جاهزة للتحميل' },
        ].map((feat, i) => (
          <div key={i} className="text-center p-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
              <feat.icon className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="font-semibold mb-1">{feat.title}</h3>
            <p className="text-sm text-muted-foreground">{feat.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading / Analysis Progress
// ---------------------------------------------------------------------------

function AnalysisProgress() {
  const { analysisData } = useHaresStore();

  const steps = [
    { label: 'رفع الملف', done: true },
    { label: 'تحليل المكونات', done: analysisData?.status !== 'analyzing' },
    { label: 'تحليل الذكاء الاصطناعي', done: analysisData?.status === 'completed' },
  ];

  const currentStep = analysisData?.status === 'analyzing' ? 1 : analysisData?.status === 'ai-analyzing' ? 2 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] px-4"
    >
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/20 animate-pulse">
        {currentStep <= 1 ? (
          <Search className="w-12 h-12 text-white" />
        ) : (
          <Brain className="w-12 h-12 text-white" />
        )}
      </div>

      <h2 className="text-2xl font-bold mb-2">
        {currentStep <= 1 ? 'جارٍ تحليل التطبيق...' : 'الذكاء الاصطناعي يحلل النتائج...'}
      </h2>
      <p className="text-muted-foreground mb-8">
        {currentStep <= 1 ? 'يتم استخراج المكونات والصلاحيات والثغرات' : 'يتم إنشاء الشرح والتوصيات بالعربية'}
      </p>

      <div className="flex gap-6">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
              ${step.done
                ? 'bg-emerald-500 text-white'
                : i === currentStep
                  ? 'bg-amber-500 text-white animate-pulse'
                  : 'bg-muted text-muted-foreground'
              }
            `}>
              {step.done ? '✓' : i + 1}
            </div>
            <span className={`text-sm ${step.done ? 'font-semibold' : 'text-muted-foreground'}`}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Risk Score Circle
// ---------------------------------------------------------------------------

function RiskScoreCircle({ score }: { score: number }) {
  const color = score >= 60 ? 'text-red-500' : score >= 30 ? 'text-amber-500' : 'text-emerald-500';
  const borderColor = score >= 60 ? 'border-red-500' : score >= 30 ? 'border-amber-500' : 'border-emerald-500';
  const bgColor = score >= 60 ? 'bg-red-50 dark:bg-red-950/20' : score >= 30 ? 'bg-amber-50 dark:bg-amber-950/20' : 'bg-emerald-50 dark:bg-emerald-950/20';
  const label = score >= 60 ? 'خطير' : score >= 30 ? 'يحتاج تحسين' : 'آمن';
  const icon = score >= 60 ? XCircle : score >= 30 ? AlertTriangle : CheckCircle;

  return (
    <div className={`flex flex-col items-center gap-2 p-6 rounded-2xl ${bgColor}`}>
      <div className={`w-28 h-28 rounded-full border-4 ${borderColor} flex flex-col items-center justify-center`}>
        <span className={`text-4xl font-extrabold ${color}`}>{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        {(() => { const Icon = icon; return <Icon className={`w-5 h-5 ${color}`} />; })()}
        <span className={`font-bold text-lg ${color}`}>{label}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Severity Badge
// ---------------------------------------------------------------------------

function SeverityBadge({ severity }: { severity: 'high' | 'medium' | 'low' }) {
  const config = {
    high: { label: 'عالي', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200' },
    medium: { label: 'متوسط', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200' },
    low: { label: 'منخفض', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200' },
  };
  const c = config[severity];
  return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
}

// ---------------------------------------------------------------------------
// Results Dashboard
// ---------------------------------------------------------------------------

function ResultsDashboard() {
  const { analysisData, setActiveTab } = useHaresStore();
  const [reportLoading, setReportLoading] = useState(false);

  if (!analysisData) return null;

  const { appInfo, permissions, risks, apiEndpoints, sensitiveStrings, libraries, aiAnalysis, riskScore } = analysisData;
  const highRisks = risks.filter(r => r.severity === 'high').length;
  const medRisks = risks.filter(r => r.severity === 'medium').length;
  const lowRisks = risks.filter(r => r.severity === 'low').length;
  const highPerms = permissions.filter(p => p.severity === 'high').length;
  const insecureUrls = apiEndpoints.filter(e => !e.isSecure).length;
  const secrets = sensitiveStrings.filter(s => ['API Key', 'Secret', 'Auth Token', 'Password', 'AWS Key', 'Google API Key'].includes(s.type));

  const handleDownloadReport = async () => {
    setReportLoading(true);
    try {
      const res = await fetch(`/api/report?id=${analysisData.id}`);
      const data = await res.json();
      if (data.success && data.html) {
        const blob = new Blob([data.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hares-report-${appInfo.appName || 'app'}.html`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      // Error handling
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">{appInfo.appName}</h1>
              <p className="text-sm text-muted-foreground font-mono">{appInfo.packageName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => useHaresStore.getState().reset()}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              تحليل جديد
            </Button>
            <Button
              onClick={handleDownloadReport}
              disabled={reportLoading}
              className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <Download className="w-4 h-4" />
              {reportLoading ? 'جارٍ التحميل...' : 'تحميل التقرير'}
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-extrabold text-red-600">{highRisks}</div>
              <div className="text-xs text-red-600/70 font-medium">مخاطر عالية</div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-extrabold text-amber-600">{medRisks}</div>
              <div className="text-xs text-amber-600/70 font-medium">مخاطر متوسطة</div>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-extrabold text-emerald-600">{lowRisks}</div>
              <div className="text-xs text-emerald-600/70 font-medium">مخاطر منخفضة</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-extrabold">{permissions.length}</div>
              <div className="text-xs text-muted-foreground font-medium">صلاحيات</div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Main Content with Tabs */}
      <Tabs defaultValue="overview" dir="rtl" onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full flex-wrap h-auto gap-1 p-1 bg-muted/50">
          <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
            <Eye className="w-4 h-4" /> نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-1.5 text-xs sm:text-sm">
            <Brain className="w-4 h-4" /> تحليل AI
          </TabsTrigger>
          <TabsTrigger value="permissions" className="gap-1.5 text-xs sm:text-sm">
            <Lock className="w-4 h-4" /> الصلاحيات
          </TabsTrigger>
          <TabsTrigger value="risks" className="gap-1.5 text-xs sm:text-sm">
            <AlertTriangle className="w-4 h-4" /> المخاطر
          </TabsTrigger>
          <TabsTrigger value="endpoints" className="gap-1.5 text-xs sm:text-sm">
            <Globe className="w-4 h-4" /> API
          </TabsTrigger>
          <TabsTrigger value="strings" className="gap-1.5 text-xs sm:text-sm">
            <Key className="w-4 h-4" /> بيانات حساسة
          </TabsTrigger>
          <TabsTrigger value="libraries" className="gap-1.5 text-xs sm:text-sm">
            <BookOpen className="w-4 h-4" /> المكتبات
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-6 flex flex-col items-center">
                  <RiskScoreCircle score={riskScore} />
                  <Separator className="my-4 w-full" />
                  <div className="w-full space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">اسم التطبيق</span>
                      <span className="font-semibold">{appInfo.appName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">الإصدار</span>
                      <span className="font-semibold">{appInfo.versionName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">SDK الهدف</span>
                      <span className="font-semibold">{appInfo.targetSdk}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">أذونات خطيرة</span>
                      <span className="font-semibold text-red-600">{highPerms}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">اتصالات غير آمنة</span>
                      <span className={`font-semibold ${insecureUrls > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {insecureUrls}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">أسرار مضمّنة</span>
                      <span className={`font-semibold ${secrets.length > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {secrets.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              {/* AI Summary */}
              {aiAnalysis && (
                <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/20 dark:to-teal-950/20">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Brain className="w-5 h-5 text-emerald-600" />
                      ملخص الذكاء الاصطناعي
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm leading-relaxed">{aiAnalysis.executiveSummary}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-emerald-200 dark:border-emerald-800">
                      <span className="text-sm font-semibold">الحكم النهائي:</span>
                      <Badge className={
                        aiAnalysis.overallVerdict === 'آمن'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30'
                          : aiAnalysis.overallVerdict === 'خطير'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30'
                      }>
                        {aiAnalysis.overallVerdict}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Risks */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    أبرز المخاطر
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {risks.slice(0, 4).map((risk) => (
                    <div
                      key={risk.id}
                      className={`
                        p-3 rounded-lg border-r-4
                        ${risk.severity === 'high'
                          ? 'bg-red-50 dark:bg-red-950/20 border-red-500'
                          : risk.severity === 'medium'
                            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500'
                            : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <SeverityBadge severity={risk.severity} />
                        <span className="font-semibold text-sm">{risk.titleAr}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{risk.descriptionAr}</p>
                    </div>
                  ))}
                  {risks.length > 4 && (
                    <p className="text-xs text-muted-foreground text-center">
                      + {risks.length - 4} مخاطر إضافية
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* AI Analysis Tab */}
        <TabsContent value="ai">
          {aiAnalysis && (
            <div className="space-y-6">
              <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-950/20 dark:to-teal-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-emerald-600" />
                    التحليل الكامل بالذكاء الاصطناعي
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="font-bold text-base mb-2 flex items-center gap-2">
                      <Info className="w-4 h-4 text-emerald-600" />
                      الملخص التنفيذي
                    </h3>
                    <p className="text-sm leading-relaxed bg-white/60 dark:bg-black/20 rounded-lg p-4">
                      {aiAnalysis.executiveSummary}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-bold text-base mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      شرح مستوى الخطورة
                    </h3>
                    <p className="text-sm leading-relaxed bg-white/60 dark:bg-black/20 rounded-lg p-4">
                      {aiAnalysis.riskExplanation}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-bold text-base mb-2 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-500" />
                      تحليل الصلاحيات
                    </h3>
                    <p className="text-sm leading-relaxed bg-white/60 dark:bg-black/20 rounded-lg p-4">
                      {aiAnalysis.permissionsAnalysis}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-bold text-base mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-red-500" />
                      التحليل الأمني
                    </h3>
                    <p className="text-sm leading-relaxed bg-white/60 dark:bg-black/20 rounded-lg p-4">
                      {aiAnalysis.securityAnalysis}
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-bold text-base mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-500" />
                      التوصيات
                    </h3>
                    <div className="bg-white/60 dark:bg-black/20 rounded-lg p-4">
                      {(Array.isArray(aiAnalysis.recommendations)
                        ? aiAnalysis.recommendations
                        : aiAnalysis.recommendations.split('\n')
                      ).map((rec: string, i: number) => (
                        <p key={i} className="text-sm leading-relaxed mb-1">
                          {Array.isArray(aiAnalysis.recommendations) ? `${i + 1}. ` : ''}{rec}
                        </p>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-3 p-4 rounded-lg bg-white/60 dark:bg-black/20">
                    <span className="text-lg font-bold">الحكم النهائي:</span>
                    <Badge className={
                      aiAnalysis.overallVerdict === 'آمن'
                        ? 'bg-emerald-100 text-emerald-700 text-lg px-4 py-1'
                        : aiAnalysis.overallVerdict === 'خطير'
                          ? 'bg-red-100 text-red-700 text-lg px-4 py-1'
                          : 'bg-amber-100 text-amber-700 text-lg px-4 py-1'
                    }>
                      {aiAnalysis.overallVerdict}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                الصلاحيات المكتشفة ({permissions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {highPerms} عالية الخطورة
                </Badge>
                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  {permissions.filter(p => p.severity === 'medium').length} متوسطة
                </Badge>
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {permissions.filter(p => p.severity === 'low').length} منخفضة
                </Badge>
              </div>
              <ScrollArea className="max-h-[500px]">
                <div className="space-y-2">
                  {permissions.map((perm, i) => (
                    <div
                      key={i}
                      className={`
                        flex items-center justify-between p-3 rounded-lg
                        ${perm.severity === 'high'
                          ? 'bg-red-50 dark:bg-red-950/20'
                          : perm.severity === 'medium'
                            ? 'bg-amber-50 dark:bg-amber-950/20'
                            : 'bg-muted/50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        {perm.severity === 'high' ? (
                          <Unlock className="w-4 h-4 text-red-500" />
                        ) : (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        )}
                        <div>
                          <span className="font-semibold text-sm">{perm.nameAr}</span>
                          <p className="text-xs text-muted-foreground font-mono">{perm.name}</p>
                        </div>
                      </div>
                      <SeverityBadge severity={perm.severity} />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risks Tab */}
        <TabsContent value="risks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                الثغرات والمخاطر ({risks.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {risks.map((risk) => (
                <div
                  key={risk.id}
                  className={`
                    p-4 rounded-xl border-r-4
                    ${risk.severity === 'high'
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-500'
                      : risk.severity === 'medium'
                        ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-500'
                        : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <SeverityBadge severity={risk.severity} />
                    <span className="font-bold">{risk.titleAr}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{risk.descriptionAr}</p>
                  <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3">
                    <p className="text-sm">
                      <span className="font-semibold text-emerald-600">💡 التوصية: </span>
                      {risk.recommendationAr}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Endpoints Tab */}
        <TabsContent value="endpoints">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                نقاط الاتصال API ({apiEndpoints.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {apiEndpoints.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لم يتم اكتشاف نقاط اتصال</p>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {apiEndpoints.map((ep, i) => (
                      <div
                        key={i}
                        className={`
                          flex items-center justify-between p-3 rounded-lg
                          ${ep.isSecure ? 'bg-muted/50' : 'bg-red-50 dark:bg-red-950/20'}
                        `}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {ep.isSecure ? (
                            <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Unlock className="w-4 h-4 text-red-500 shrink-0" />
                          )}
                          <span className="text-xs font-mono truncate">{ep.url}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 mr-4">
                          <Badge variant="outline" className="text-xs">{ep.method}</Badge>
                          <Badge className={ep.isSecure
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30'
                          }>
                            {ep.isSecure ? '✅ HTTPS' : '❌ HTTP'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sensitive Strings Tab */}
        <TabsContent value="strings">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                بيانات حساسة ({sensitiveStrings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sensitiveStrings.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لم يتم اكتشاف بيانات حساسة</p>
              ) : (
                <ScrollArea className="max-h-[500px]">
                  <div className="space-y-2">
                    {sensitiveStrings.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={
                              ['API Key', 'Secret', 'Auth Token', 'Password', 'AWS Key', 'Google API Key'].includes(s.type)
                                ? 'border-red-300 text-red-600'
                                : 'border-muted'
                            }>
                              {s.type}
                            </Badge>
                            <span className="text-xs text-muted-foreground font-mono">{s.file}</span>
                          </div>
                          <p className="text-xs font-mono truncate max-w-full">{s.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Libraries Tab */}
        <TabsContent value="libraries">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                المكتبات المستخدمة ({libraries.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {libraries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">لم يتم اكتشاف مكتبات</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {libraries.map((lib, i) => (
                    <div key={i} className="p-4 rounded-lg bg-muted/50 text-center">
                      <div className="font-semibold mb-1">{lib.name}</div>
                      <div className="text-xs text-muted-foreground">{lib.type}</div>
                      <Badge variant="outline" className="mt-2 text-xs">{lib.version}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function HaresPage() {
  const { analysisId, analysisData, isUploading, isAnalyzing, error } = useHaresStore();

  // Poll for analysis status
  useAnalysisPolling(analysisId);

  // Determine which section to show
  const showLanding = !analysisId && !isAnalyzing;
  const showProgress = isAnalyzing;
  const showResults = analysisData?.status === 'completed';

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">حَارِس <span className="text-emerald-600">AI</span></span>
          </div>
          {analysisId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => useHaresStore.getState().reset()}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              تحليل جديد
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-6">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl mx-auto mb-6 px-4"
            >
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            </motion.div>
          )}

          {isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center min-h-[40vh]"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center animate-pulse">
                  <Upload className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="text-muted-foreground">جارٍ رفع الملف...</p>
              </div>
            </motion.div>
          )}

          {!isUploading && showLanding && (
            <motion.div key="landing" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
              <LandingSection />
            </motion.div>
          )}

          {!isUploading && showProgress && (
            <motion.div key="progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <AnalysisProgress />
            </motion.div>
          )}

          {!isUploading && showResults && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <ResultsDashboard />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col items-center gap-3 text-xs text-muted-foreground">
          <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>حَارِس AI | Hares AI - تحليل ذكي للتطبيقات</span>
            </div>
            <p>للاستخدام التعليمي والاختبار القانوني فقط</p>
          </div>
          <div className="flex items-center gap-1.5 pt-1 border-t border-border/50 w-full justify-center">
            <span className="text-red-500">&#9829;</span>
            <span>صنع بحب من الإمارات &#x1F1E6;&#x1F1EA; من المطور:</span>
            <a
              href="https://github.com/binnoma"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
            >
              binnoma@
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
