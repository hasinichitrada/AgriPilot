import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Printer,
  RotateCcw,
  PlusCircle,
  Volume2,
  VolumeX,
  Pause,
  Play,
  Square,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ShieldCheck,
  Search,
  MapPin,
  Calendar,
  Sparkles,
  Info,
  Building2,
  AlertCircle,
  Loader2,
  Eye,
  Sliders,
  Check,
  Languages
} from 'lucide-react';
import type { ReportData, Language } from '../types/agri.ts';
import { translations } from '../i18n/translations.ts';

interface ReportPageProps {
  report: ReportData;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isTranslating: boolean;
  onAnalyzeAnother: () => void;
  onStartNewConsultation: () => void;
}

export const ReportPage: React.FC<ReportPageProps> = ({
  report,
  language,
  onLanguageChange,
  isTranslating,
  onAnalyzeAnother,
  onStartNewConsultation
}) => {
  const t = translations[language];

  // TTS audio playback states
  const [audioState, setAudioState] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Confidence styling
  const confidenceColors = {
    High: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    Moderate: 'bg-teal-100 text-teal-800 border-teal-300',
    Tentative: 'bg-amber-100 text-amber-900 border-amber-300',
    Low: 'bg-stone-200 text-stone-800 border-stone-300'
  };

  const confidenceBadge = confidenceColors[report.section4_confidence.confidenceLevel] || confidenceColors.Moderate;

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Populate voices on mount
  useEffect(() => {
    const updateVoices = () => {
      if ('speechSynthesis' in window) {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      }
    };

    updateVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // When language changes, stop audio immediately
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setAudioState('idle');
    setVoiceNotice(null);
  }, [language, report]);

  // Find optimal voice for current language
  const getOptimalVoice = (lang: Language): SpeechSynthesisVoice | null => {
    if (!('speechSynthesis' in window) || availableVoices.length === 0) return null;

    if (lang === 'te') {
      const teluguVoice = availableVoices.find(
        (v) => v.lang.startsWith('te') || v.name.toLowerCase().includes('telugu')
      );
      return teluguVoice || null;
    } else {
      const enInVoice = availableVoices.find((v) => v.lang === 'en-IN');
      if (enInVoice) return enInVoice;
      const genericEn = availableVoices.find((v) => v.lang.startsWith('en'));
      return genericEn || null;
    }
  };

  // Start reading the report
  const handlePlayAudio = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    setVoiceNotice(null);

    const targetVoice = getOptimalVoice(language);

    if (language === 'te' && !targetVoice) {
      setVoiceNotice(t.audioNoVoiceNotice);
      // Fallback: still try synthesis with te-IN lang tag, or inform the user
    }

    // Build logical narrative of the entire report
    const narrativeParts: string[] = [
      `${t.reportTitle}.`,
      `${t.sec1_summaryTitle}: ${report.section1_summary.farmerProblemSummary}.`,
      report.section1_summary.visibleImageObservations.length > 0
        ? `${t.sec2_observationsTitle}: ${report.section1_summary.visibleImageObservations.join('. ')}.`
        : '',
      `${t.sec3_whatHappenedTitle}: ${report.section2_whatHappened.possibleIssueOverview}.`,
      `${report.section2_whatHappened.observationsVsInterpretation}.`,
      report.section3_whyHappened.plausibleCauses.length > 0
        ? `${t.sec4_causesTitle}: ` + report.section3_whyHappened.plausibleCauses.map((c, i) => `${i + 1}. ${c.cause}: ${c.explanation}`).join('. ')
        : '',
      `${t.sec5_confidenceTitle}: ${report.section4_confidence.confidenceLevel}. ${report.section4_confidence.confidenceExplanation}.`,
      report.section5_recommendedActions.immediateChecks.length > 0
        ? `${t.sec8_immediateChecksTitle}: ` + report.section5_recommendedActions.immediateChecks.join('. ')
        : '',
      report.section5_recommendedActions.culturalSteps.length > 0
        ? `${t.sec7_recommendedActionsTitle}: ` + report.section5_recommendedActions.culturalSteps.join('. ')
        : '',
      report.section5_recommendedActions.actionsToAvoid.length > 0
        ? `${t.sec9_precautionsAvoidTitle}: ` + report.section5_recommendedActions.actionsToAvoid.join('. ')
        : '',
      report.section5_recommendedActions.monitoringConditions.length > 0
        ? `${t.sec10_monitoringTitle}: ` + report.section5_recommendedActions.monitoringConditions.join('. ')
        : '',
      report.section6_prevention.recommendations.length > 0
        ? `${t.sec11_preventionTitle}: ` + report.section6_prevention.recommendations.join('. ')
        : '',
      `${t.sec12_expertHelpTitle}: ${report.section7_expertHelp.contactThreshold}.`,
      `${t.sec13_limitationsTitle}: ${report.section8_limitations.disclaimer}.`
    ].filter(Boolean);

    const fullNarrative = narrativeParts.join(' ');
    const utterance = new SpeechSynthesisUtterance(fullNarrative);

    utterance.lang = language === 'te' ? 'te-IN' : 'en-IN';
    if (targetVoice) {
      utterance.voice = targetVoice;
    }
    utterance.rate = playbackRate;

    utterance.onstart = () => {
      setAudioState('playing');
    };

    utterance.onend = () => {
      setAudioState('idle');
    };

    utterance.onerror = (e) => {
      console.warn('TTS error:', e);
      setAudioState('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePauseAudio = () => {
    if ('speechSynthesis' in window && audioState === 'playing') {
      window.speechSynthesis.pause();
      setAudioState('paused');
    }
  };

  const handleResumeAudio = () => {
    if ('speechSynthesis' in window && audioState === 'paused') {
      window.speechSynthesis.resume();
      setAudioState('playing');
    }
  };

  const handleStopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setAudioState('idle');
    }
  };

  const handleChangeSpeed = (newSpeed: number) => {
    setPlaybackRate(newSpeed);
    if (audioState === 'playing' || audioState === 'paused') {
      handleStopAudio();
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm mb-6 print-page-break relative overflow-hidden">
        {/* Translating Loading Indicator Overlay */}
        {isTranslating && (
          <div className="absolute inset-0 z-30 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
            <p className="font-bold text-stone-900 text-base">{t.translatingReport}</p>
            <p className="text-xs text-stone-500 mt-1 max-w-md">
              {language === 'te'
                ? 'వ్యవసాయ వాస్తవాలు, సంఖ్యలు మరియు సిఫార్సులను భద్రపరుస్తూ పూర్తి నివేదికను తెలుగులోకి మార్చుతోంది...'
                : 'Preserving all agricultural findings and numbers while translating the report...'}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AgriPilot Diagnostic Advisory</span>
              {report.engineUsed && (
                <span className="text-[10px] opacity-75 font-normal">
                  ({report.engineUsed === 'n8n' ? 'n8n Connected' : 'Gemini AI'})
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {t.reportTitle}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              {t.reportSubtitle}
            </p>
          </div>

          {/* Language Switch & Print Controls */}
          <div className="flex flex-wrap items-center gap-2 no-print self-start sm:self-auto">
            {/* Quick in-report language switch */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
              <button
                onClick={() => onLanguageChange('en')}
                disabled={isTranslating}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Translate report to English"
              >
                English
              </button>
              <button
                onClick={() => onLanguageChange('te')}
                disabled={isTranslating}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  language === 'te'
                    ? 'bg-white text-emerald-800 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Translate report to Telugu"
              >
                తెలుగు
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white transition-colors cursor-pointer shadow-xs"
              title={t.printButton}
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">{t.printButton}</span>
            </button>
          </div>
        </div>

        {/* Audio Player Toolbar */}
        <div className="mt-4 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2">
            {audioState === 'idle' && (
              <button
                onClick={handlePlayAudio}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>{t.audioPlay}</span>
              </button>
            )}

            {audioState === 'playing' && (
              <>
                <button
                  onClick={handlePauseAudio}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                  <span>{t.audioPause}</span>
                </button>
                <button
                  onClick={handleStopAudio}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Square className="w-4 h-4" />
                  <span>{t.audioStop}</span>
                </button>
              </>
            )}

            {audioState === 'paused' && (
              <>
                <button
                  onClick={handleResumeAudio}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  <span>{t.audioResume}</span>
                </button>
                <button
                  onClick={handleStopAudio}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
                >
                  <Square className="w-4 h-4" />
                  <span>{t.audioStop}</span>
                </button>
              </>
            )}

            {audioState !== 'idle' && (
              <span className="text-xs font-semibold text-emerald-800 animate-pulse flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>{audioState === 'playing' ? 'Playing Audio...' : 'Paused'}</span>
              </span>
            )}
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <span className="font-semibold text-stone-500">{t.audioSpeedLabel}:</span>
            {[0.8, 1.0, 1.2].map((s) => (
              <button
                key={s}
                onClick={() => handleChangeSpeed(s)}
                className={`px-2 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                  playbackRate === s
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-200'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Voice Notice (if Telugu voice is not installed in the browser) */}
        {voiceNotice && (
          <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p>{voiceNotice}</p>
          </div>
        )}

        {/* Metadata Badges */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-stone-600">
          {report.cropName && (
            <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-lg">
              <span className="font-semibold text-stone-800">Crop:</span>
              <span>{report.cropName}</span>
            </div>
          )}
          {report.farmerName && (
            <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-lg">
              <span className="font-semibold text-stone-800">Farmer:</span>
              <span>{report.farmerName}</span>
            </div>
          )}
          {report.location && (
            <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-stone-500" />
              <span>{report.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 bg-stone-100 px-3 py-1.5 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-stone-500" />
            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Uploaded Crop Image Preview if present */}
        {report.imageUrl && (
          <div className="mt-6 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 max-h-72 flex items-center justify-center">
            <img
              src={report.imageUrl}
              alt="Analyzed crop specimen"
              className="max-h-72 w-auto object-contain mx-auto"
            />
          </div>
        )}
      </div>

      {/* 13 Structured Agronomy Sections */}
      <div className="space-y-6">
        {/* Section 1: Crop Problem Summary */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm print-page-break">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900">
              {t.sec1_summaryTitle}
            </h2>
          </div>

          <div className="space-y-3 text-sm text-stone-700 leading-relaxed">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <p className="font-semibold text-stone-900 mb-1">
                {t.reportedSymptomsLabel}:
              </p>
              <p>{report.section1_summary.farmerProblemSummary}</p>
            </div>
          </div>
        </section>

        {/* Section 2: Image Observations */}
        {report.section1_summary.visibleImageObservations.length > 0 && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm print-page-break">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                {t.sec2_observationsTitle}
              </h2>
            </div>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-700 text-sm">
              {report.section1_summary.visibleImageObservations.map((obs, idx) => (
                <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="w-2 h-2 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                  <span>{obs}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Section 3: What May Have Happened */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm print-page-break">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900">
              {t.sec3_whatHappenedTitle}
            </h2>
          </div>

          <div className="space-y-4 text-sm text-stone-700 leading-relaxed">
            <p className="text-base text-stone-800 font-medium bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100">
              {report.section2_whatHappened.possibleIssueOverview}
            </p>

            {/* Scientific Distinction */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 text-xs sm:text-sm flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-amber-900 mb-0.5">
                  {t.obsVsInterpLabel}:
                </span>
                <p>{report.section2_whatHappened.observationsVsInterpretation}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Possible Causes Supported by Evidence */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm print-page-break">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900">
              {t.sec4_causesTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {report.section3_whyHappened.plausibleCauses.map((item, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-stone-50 border border-stone-200 hover:border-emerald-200 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h3 className="font-bold text-stone-900 text-base">
                    {item.cause}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-stone-700 mb-3">
                  {item.explanation}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-stone-200">
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 text-emerald-950">
                    <span className="font-bold block text-emerald-900 mb-1">
                      ✓ {t.whyFitsLabel}
                    </span>
                    <p>{item.fittingEvidence}</p>
                  </div>

                  <div className="bg-stone-100 p-3 rounded-xl border border-stone-200 text-stone-800">
                    <span className="font-bold block text-stone-900 mb-1">
                      ? {t.missingEvidenceLabel}
                    </span>
                    <p>{item.missingEvidence}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5: Assessment and Confidence */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm print-page-break">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900">
              {t.sec5_confidenceTitle}
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-stone-50 border border-stone-200">
              <div>
                <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider block">
                  {t.confidenceLevelLabel}
                </span>
                <span className="text-stone-900 font-bold text-base sm:text-lg">
                  {report.section4_confidence.confidenceLevel}
                </span>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${confidenceBadge}`}>
                {report.section4_confidence.confidenceLevel}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              {report.section4_confidence.confidenceExplanation}
            </p>
          </div>
        </section>

        {/* Section 6: Key Uncertainties */}
        {report.section4_confidence.keyUncertainties.length > 0 && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm print-page-break">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
                <Sliders className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                {t.sec6_uncertaintiesTitle}
              </h2>
            </div>

            <ul className="space-y-2 text-xs sm:text-sm text-stone-700">
              {report.section4_confidence.keyUncertainties.map((unc, idx) => (
                <li key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{unc}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Section 8: Immediate Field Checks */}
        {report.section5_recommendedActions.immediateChecks.length > 0 && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm print-page-break">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                {t.sec8_immediateChecksTitle}
              </h2>
            </div>

            <div className="space-y-2">
              {report.section5_recommendedActions.immediateChecks.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs sm:text-sm text-stone-800">
                  <span className="font-bold text-emerald-800 shrink-0">{idx + 1}.</span>
                  <span>{item.replace(/^\d+\.\s*/, '')}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 7: Recommended Field Actions */}
        {report.section5_recommendedActions.culturalSteps.length > 0 && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm print-page-break">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center">
                <Check className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                {t.sec7_recommendedActionsTitle}
              </h2>
            </div>

            <div className="space-y-2">
              {report.section5_recommendedActions.culturalSteps.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-teal-50/50 border border-teal-100 text-xs sm:text-sm text-stone-800">
                  <span className="font-bold text-teal-800 shrink-0">{idx + 1}.</span>
                  <span>{item.replace(/^\d+\.\s*/, '')}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 9: Treatment Precautions & Actions to Avoid */}
        {report.section5_recommendedActions.actionsToAvoid.length > 0 && (
          <section className="bg-rose-50 rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-sm print-page-break">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-rose-950">
                {t.sec9_precautionsAvoidTitle}
              </h2>
            </div>

            <ul className="space-y-2 text-xs sm:text-sm text-rose-900 pl-4 list-disc">
              {report.section5_recommendedActions.actionsToAvoid.map((item, idx) => (
                <li key={idx} className="leading-relaxed">
                  {item.replace(/^\d+\.\s*/, '')}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Section 10: What to Monitor Next */}
        {report.section5_recommendedActions.monitoringConditions.length > 0 && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm print-page-break">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                <Eye className="w-5 h-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                {t.sec10_monitoringTitle}
              </h2>
            </div>

            <div className="space-y-2">
              {report.section5_recommendedActions.monitoringConditions.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/50 border border-amber-100 text-xs sm:text-sm text-stone-800">
                  <span className="font-bold text-amber-800 shrink-0">{idx + 1}.</span>
                  <span>{item.replace(/^\d+\.\s*/, '')}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 11: Prevention and Future Care */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm print-page-break">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900">
              {t.sec11_preventionTitle}
            </h2>
          </div>

          <div className="space-y-2">
            {report.section6_prevention.recommendations.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs sm:text-sm text-stone-800">
                <span className="text-emerald-600 font-bold">✔</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 12: When to Contact an Agricultural Expert */}
        <section className="bg-emerald-50/70 rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-sm print-page-break">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-emerald-950">
              {t.sec12_expertHelpTitle}
            </h2>
          </div>

          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-emerald-900 font-medium">
              {report.section7_expertHelp.contactThreshold}
            </p>

            {report.section7_expertHelp.recommendedOffices.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-emerald-200">
                <span className="font-bold text-xs text-emerald-950 block mb-2">
                  {t.expertOfficesLabel}:
                </span>
                <ul className="space-y-2 text-xs sm:text-sm text-stone-800">
                  {report.section7_expertHelp.recommendedOffices.map((office, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>{office}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Section 13: Sources and Limitations */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm print-page-break">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900">
              {t.sec13_limitationsTitle}
            </h2>
          </div>

          <div className="space-y-3 text-xs text-stone-600">
            {report.section8_limitations.diagnosticLimitations.length > 0 && (
              <div>
                <span className="font-semibold text-stone-800 block mb-1">
                  {language === 'te' ? 'పరిశీలన పరిమితులు:' : 'Diagnostic Limitations:'}
                </span>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  {report.section8_limitations.diagnosticLimitations.map((lim, idx) => (
                    <li key={idx}>{lim}</li>
                  ))}
                </ul>
              </div>
            )}

            {report.section8_limitations.unavailableInfo.length > 0 && (
              <div>
                <span className="font-semibold text-stone-800 block mb-1">
                  {language === 'te' ? 'అందుబాటులో లేని సమాచారం:' : 'Unavailable Information:'}
                </span>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  {report.section8_limitations.unavailableInfo.map((un, idx) => (
                    <li key={idx}>{un}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-3 rounded-xl bg-stone-100 border border-stone-200 text-[11px] text-stone-600 mt-2">
              <span className="font-bold text-stone-800">{t.disclaimerLabel}: </span>
              {report.section8_limitations.disclaimer}
            </div>
          </div>
        </section>
      </div>

      {/* Report Bottom Action Buttons (No-print) */}
      <div className="mt-8 pt-6 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onAnalyzeAnother}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t.analyzeAnotherButton}</span>
          </button>

          <button
            onClick={onStartNewConsultation}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-sm transition-colors cursor-pointer border border-stone-200"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.startNewButton}</span>
          </button>
        </div>

        <button
          onClick={handlePrint}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-sm transition-colors cursor-pointer shadow-md"
        >
          <Printer className="w-4 h-4" />
          <span>{t.printButton}</span>
        </button>
      </div>
    </div>
  );
};
