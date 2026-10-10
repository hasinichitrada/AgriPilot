import React, { useState, useEffect } from 'react';
import type { Language, ImageData, ReportData, AnalysisRequest } from './types/agri.ts';
import { Header } from './components/Header.tsx';
import { WelcomePage } from './components/WelcomePage.tsx';
import { CropAnalysisPage } from './components/CropAnalysisPage.tsx';
import { ReportPage } from './components/ReportPage.tsx';
import { N8nSettingsModal } from './components/N8nSettingsModal.tsx';
import { AgriPilotChat } from './components/AgriPilotChat.tsx';
import { translations } from './i18n/translations.ts';

const DEFAULT_N8N_URL = 'https://darahasini.app.n8n.cloud/webhook/90b085a3-07b9-4933-8ca8-a7d1054e9dfb/chat';

export default function App() {
  const [currentPage, setCurrentPage] = useState<'welcome' | 'analysis' | 'report'>('welcome');
  const [language, setLanguage] = useState<Language>('en');
  const [report, setReport] = useState<ReportData | null>(null);
  const [reportCache, setReportCache] = useState<{ en?: ReportData; te?: ReportData }>({});
  const [isTranslatingReport, setIsTranslatingReport] = useState(false);

  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // n8n configuration
  const [n8nWebhookUrl, setN8nWebhookUrl] = useState(() => {
    const stored = localStorage.getItem('agripilot_n8n_url');
    if (!stored || stored.includes('agripilot-chat')) {
      localStorage.setItem('agripilot_n8n_url', DEFAULT_N8N_URL);
      return DEFAULT_N8N_URL;
    }
    return stored;
  });
  const [useBuiltinAI, setUseBuiltinAI] = useState(() => {
    const stored = localStorage.getItem('agripilot_use_builtin');
    return stored === 'true'; // Default to false (use n8n by default)
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [n8nStatus, setN8nStatus] = useState<'idle' | 'connected' | 'error'>('connected');

  // Handle centralized language change across the entire application
  const handleLanguageChange = async (newLang: Language) => {
    setLanguage(newLang);
    setErrorMessage(null);

    // If report is currently open, translate entire report dynamically
    if (report && report.language !== newLang) {
      if (reportCache[newLang]) {
        setReport(reportCache[newLang]!);
        return;
      }

      setIsTranslatingReport(true);
      try {
        const res = await fetch('/api/translate-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            report,
            targetLanguage: newLang
          })
        });

        if (!res.ok) {
          throw new Error('Failed to translate report.');
        }

        const translated: ReportData = await res.json();
        setReport(translated);
        setReportCache((prev) => ({
          ...prev,
          [report.language]: report,
          [newLang]: translated
        }));
      } catch (err: any) {
        console.warn('Report dynamic translation failed:', err);
        setErrorMessage(translations[newLang].translationError);
      } finally {
        setIsTranslatingReport(false);
      }
    }
  };

  // Check health / default n8n on mount
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.defaultN8nConfigured && !n8nWebhookUrl) {
          // n8n configured on server env
          setN8nStatus('connected');
        }
      })
      .catch(() => {});
  }, [n8nWebhookUrl]);

  const handleSaveN8nUrl = (url: string) => {
    setN8nWebhookUrl(url);
    localStorage.setItem('agripilot_n8n_url', url);
    if (url.trim()) {
      setUseBuiltinAI(false);
      localStorage.setItem('agripilot_use_builtin', 'false');
    }
  };

  const handleToggleUseBuiltinAI = (useBuiltin: boolean) => {
    setUseBuiltinAI(useBuiltin);
    localStorage.setItem('agripilot_use_builtin', String(useBuiltin));
  };

  const handleAnalysisSubmit = async (formData: {
    message: string;
    image: ImageData | null;
    reportLanguage: Language;
    farmerName: string;
    email: string;
    location: string;
    crop: string;
    growthStage: string;
    problemDuration: string;
    recentPractices: string;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);

    const isTe = formData.reportLanguage === 'te';

    // Step sequence messages
    const steps = isTe
      ? [
          'లక్షణాలు మరియు ఫోటో డేటాను విశ్లేషిస్తోంది...',
          'కనిపించే మార్పులను మరియు తెగుళ్ళ సంకేతాలను గుర్తిస్తోంది...',
          'వ్యవసాయ మార్గదర్శకాలు మరియు నిపుణుల సలహాలను సిద్ధం చేస్తోంది...',
          'తుది పంట ఆరోగ్య నివేదికను రూపొందిస్తోంది...'
        ]
      : [
          'Analyzing crop symptoms and image observations...',
          'Evaluating visible signs, leaves, and stems...',
          'Cross-referencing agronomic guidelines and KVK recommendations...',
          'Preparing your personalized 8-section crop health report...'
        ];

    setLoadingStep(steps[0]);

    const stepTimer1 = setTimeout(() => setLoadingStep(steps[1]), 2500);
    const stepTimer2 = setTimeout(() => setLoadingStep(steps[2]), 5500);
    const stepTimer3 = setTimeout(() => setLoadingStep(steps[3]), 8500);

    try {
      const payload: AnalysisRequest = {
        action: 'analyze_crop',
        farmerName: formData.farmerName || undefined,
        email: formData.email || undefined,
        location: formData.location || undefined,
        crop: formData.crop || undefined,
        growthStage: formData.growthStage || undefined,
        problemDuration: formData.problemDuration || undefined,
        recentPractices: formData.recentPractices || undefined,
        language: formData.reportLanguage,
        message: formData.message,
        conversationId: `conv-${Date.now()}`,
        image: formData.image ? {
          data: formData.image.data,
          mimeType: formData.image.mimeType,
          filename: formData.image.filename,
          sizeBytes: formData.image.sizeBytes
        } : undefined,
        n8nWebhookUrl: !useBuiltinAI && n8nWebhookUrl.trim() ? n8nWebhookUrl.trim() : undefined,
        useBuiltinAI
      };

      const response = await fetch('/api/analyze-crop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Server returned error (${response.status}: ${response.statusText})`
        );
      }

      const reportData: ReportData = await response.json();

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      setReport(reportData);
      setReportCache({ [reportData.language]: reportData });
      setLanguage(reportData.language);
      setCurrentPage('report');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      console.error('Analysis failed:', err);
      setErrorMessage(
        err.message || translations[language].backendError
      );
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-800 font-sans">
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReset={() => setCurrentPage('welcome')}
        onOpenChat={() => setIsChatOpen(true)}
        isUsingN8n={!useBuiltinAI && Boolean(n8nWebhookUrl.trim())}
        n8nStatus={n8nStatus}
        currentPage={currentPage}
      />

      <main className="flex-1">
        {currentPage === 'welcome' && (
          <WelcomePage
            language={language}
            onContinue={() => {
              setCurrentPage('analysis');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSelectLanguage={handleLanguageChange}
            onOpenChat={() => setIsChatOpen(true)}
          />
        )}

        {currentPage === 'analysis' && (
          <CropAnalysisPage
            language={language}
            onLanguageChange={handleLanguageChange}
            onSubmitAnalysis={handleAnalysisSubmit}
            isLoading={isLoading}
            loadingStep={loadingStep}
            errorMessage={errorMessage}
            onClearError={() => setErrorMessage(null)}
            onOpenChat={() => setIsChatOpen(true)}
          />
        )}

        {currentPage === 'report' && report && (
          <ReportPage
            report={report}
            language={language}
            onLanguageChange={handleLanguageChange}
            isTranslating={isTranslatingReport}
            onAnalyzeAnother={() => {
              setCurrentPage('analysis');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onStartNewConsultation={() => {
              setReport(null);
              setReportCache({});
              setCurrentPage('analysis');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      <N8nSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        n8nWebhookUrl={n8nWebhookUrl}
        onSaveN8nUrl={handleSaveN8nUrl}
        useBuiltinAI={useBuiltinAI}
        onToggleUseBuiltinAI={handleToggleUseBuiltinAI}
        language={language}
      />

      {/* Floating Interactive AgriPilot AI Chatbot connected to n8n */}
      <AgriPilotChat
        language={language}
        onLanguageChange={handleLanguageChange}
        selectedCrop={report?.cropName}
        isOpen={isChatOpen}
        onOpenChange={setIsChatOpen}
      />
    </div>
  );
}
