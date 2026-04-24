/**
 * Hares AI - Global State Management
 * Zustand store for managing analysis state across the app
 */

import { create } from 'zustand';

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

export interface AIAnalysisResult {
  executiveSummary: string;
  riskExplanation: string;
  permissionsAnalysis: string;
  securityAnalysis: string;
  recommendations: string;
  overallVerdict: string;
}

export interface AnalysisData {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: 'uploading' | 'analyzing' | 'ai-analyzing' | 'completed' | 'failed';
  appInfo: AppInfo;
  permissions: PermissionFinding[];
  files: string[];
  libraries: LibraryInfo[];
  apiEndpoints: ApiEndpoint[];
  sensitiveStrings: SensitiveString[];
  risks: RiskFinding[];
  riskScore: number;
  aiAnalysis: AIAnalysisResult;
  createdAt: string;
  updatedAt: string;
}

interface HaresState {
  // Current analysis
  analysisId: string | null;
  analysisData: AnalysisData | null;
  isUploading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  activeTab: string;

  // Actions
  setAnalysisId: (id: string | null) => void;
  setAnalysisData: (data: AnalysisData | null) => void;
  setIsUploading: (val: boolean) => void;
  setIsAnalyzing: (val: boolean) => void;
  setError: (err: string | null) => void;
  setActiveTab: (tab: string) => void;
  reset: () => void;
}

export const useHaresStore = create<HaresState>((set) => ({
  analysisId: null,
  analysisData: null,
  isUploading: false,
  isAnalyzing: false,
  error: null,
  activeTab: 'overview',

  setAnalysisId: (id) => set({ analysisId: id }),
  setAnalysisData: (data) => set({ analysisData: data }),
  setIsUploading: (val) => set({ isUploading: val }),
  setIsAnalyzing: (val) => set({ isAnalyzing: val }),
  setError: (err) => set({ error: err }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  reset: () =>
    set({
      analysisId: null,
      analysisData: null,
      isUploading: false,
      isAnalyzing: false,
      error: null,
      activeTab: 'overview',
    }),
}));
