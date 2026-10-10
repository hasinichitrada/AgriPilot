import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Mic,
  MicOff,
  X,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sparkles,
  CheckCircle,
  FileText,
  Wheat,
  Loader2,
  Check
} from 'lucide-react';
import type { Language, ImageData } from '../types/agri.ts';
import { translations } from '../i18n/translations.ts';
import { processImageFile, formatFileSize } from '../utils/imageUtils.ts';

interface CropAnalysisPageProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onSubmitAnalysis: (formData: {
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
  }) => Promise<void>;
  isLoading: boolean;
  loadingStep: string;
  errorMessage: string | null;
  onClearError: () => void;
  onOpenChat?: () => void;
}

export const CropAnalysisPage: React.FC<CropAnalysisPageProps> = ({
  language,
  onLanguageChange,
  onSubmitAnalysis,
  isLoading,
  loadingStep,
  errorMessage,
  onClearError,
  onOpenChat
}) => {
  const t = translations[language];

  // Core inputs
  const [image, setImage] = useState<ImageData | null>(null);
  const [description, setDescription] = useState('');
  const [reportLanguage, setReportLanguage] = useState<Language>(language);

  // Microphone speech language setting ('te' | 'en' | 'auto')
  const [speechLanguage, setSpeechLanguage] = useState<Language>(language);

  // Optional details
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [farmerName, setFarmerName] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [crop, setCrop] = useState('');
  const [growthStage, setGrowthStage] = useState('');
  const [problemDuration, setProblemDuration] = useState('');
  const [recentPractices, setRecentPractices] = useState('');

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speechSuccess, setSpeechSuccess] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  // References to handle speech accurately without duplicating words
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>('');
  const finalTranscriptRef = useRef<string>('');

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // Keep reportLanguage & speechLanguage synced when app language changes if user didn't explicitly diverge
  useEffect(() => {
    setReportLanguage(language);
    setSpeechLanguage(language);
  }, [language]);

  // Check SpeechRecognition support on mount
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }

    // Cleanup microphone on unmount
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  // Handle Voice Input Toggle with reliable transcription logic
  const toggleListening = () => {
    setSpeechError(null);
    setSpeechSuccess(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setSpeechError(t.micUnavailable);
      return;
    }

    // If currently listening, stop it cleanly
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
      setInterimText('');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Determine speech recognition language (te-IN or en-IN)
      const targetSpeechLocale = speechLanguage === 'te' ? 'te-IN' : 'en-IN';
      recognition.lang = targetSpeechLocale;

      // Save initial text present in text area before microphone started
      baseTextRef.current = description.trim();
      finalTranscriptRef.current = '';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let sessionFinal = '';
        let sessionInterim = '';

        for (let i = 0; i < event.results.length; i++) {
          const res = event.results[i];
          const transcriptPiece = res[0]?.transcript || '';
          if (res.isFinal) {
            sessionFinal += transcriptPiece + ' ';
          } else {
            sessionInterim += transcriptPiece;
          }
        }

        finalTranscriptRef.current = sessionFinal.trim();
        setInterimText(sessionInterim.trim());

        // Construct full text: baseText + all finalized text from session + current interim
        const combinedSpoken = (sessionFinal.trim() + (sessionInterim.trim() ? ' ' + sessionInterim.trim() : '')).trim();

        if (baseTextRef.current) {
          setDescription(combinedSpoken ? `${baseTextRef.current} ${combinedSpoken}` : baseTextRef.current);
        } else {
          setDescription(combinedSpoken);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        setIsListening(false);
        setInterimText('');

        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setSpeechError(t.micPermissionDenied);
        } else if (event.error === 'no-speech') {
          setSpeechError(t.micNoSpeech);
        } else if (event.error === 'audio-capture') {
          setSpeechError(t.micAudioCapture);
        } else if (event.error !== 'aborted') {
          setSpeechError(t.micUnavailable);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimText('');
        // Ensure finalized text is cleanly committed
        const finalSpoken = finalTranscriptRef.current.trim();
        if (finalSpoken) {
          const finalFull = baseTextRef.current
            ? `${baseTextRef.current} ${finalSpoken}`
            : finalSpoken;
          setDescription(finalFull);
          setSpeechSuccess(t.micRecognized);
          setTimeout(() => setSpeechSuccess(null), 3000);
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Speech recognition start failed:', err);
      setIsListening(false);
      setInterimText('');
      setSpeechError(t.micUnavailable);
    }
  };

  // Handle File Selection
  const handleFileChange = async (file: File) => {
    setFileError(null);
    onClearError();
    try {
      const processed = await processImageFile(file);
      setImage(processed);
    } catch (err: any) {
      setFileError(err.message || t.invalidFileType);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleAddSymptomChip = (symptom: string) => {
    setDescription((prev) => {
      const clean = prev.trim();
      if (!clean) return symptom;
      if (clean.includes(symptom)) return clean;
      return `${clean} ${symptom}`;
    });
    onClearError();
  };

  // Optional Geolocation detection helper
  const [detectingLocation, setDetectingLocation] = useState(false);
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude.toFixed(3);
          const lon = pos.coords.longitude.toFixed(3);
          setLocation(`Field Coordinates (${lat}, ${lon})`);
        } finally {
          setDetectingLocation(false);
        }
      },
      (err) => {
        console.warn('Geo error:', err);
        setDetectingLocation(false);
      },
      { timeout: 7000 }
    );
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClearError();

    // Make sure speech is stopped if currently running
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    }

    const hasMessage = Boolean(description.trim());
    const hasImage = Boolean(image && image.data);

    if (!hasMessage && !hasImage) {
      alert(t.validationError);
      return;
    }

    onSubmitAnalysis({
      message: description.trim(),
      image,
      reportLanguage,
      farmerName: farmerName.trim(),
      email: email.trim(),
      location: location.trim(),
      crop: crop.trim(),
      growthStage: growthStage.trim(),
      problemDuration: problemDuration.trim(),
      recentPractices: recentPractices.trim()
    });
  };

  // Popular quick crop selections
  const commonCrops = [
    { en: 'Paddy (Rice)', te: 'వరి' },
    { en: 'Cotton', te: 'పత్తి' },
    { en: 'Chilli', te: 'మిరప' },
    { en: 'Tomato', te: 'టమోటా' },
    { en: 'Maize (Corn)', te: 'మొక్కజొన్న' },
    { en: 'Groundnut', te: 'వేరుశనగ' },
    { en: 'Bengal Gram', te: 'శనగ' },
    { en: 'Mango', te: 'మామిడి' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Page Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
          {t.mainTitle}
        </h2>
        <p className="mt-2 text-stone-600 text-sm sm:text-base max-w-xl mx-auto">
          {t.mainSubtitle}
        </p>
      </div>

      {/* Quick AI Agent Chat Callout Banner */}
      {onOpenChat && (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-emerald-950">
                {language === 'te'
                  ? 'సందేహాలు ఉన్నాయా? మా n8n AI ఏజెంట్‌ను అడగండి'
                  : 'Have farming questions? Ask our n8n AI Agent directly'}
              </p>
              <p className="text-[11px] text-emerald-700">
                {language === 'te'
                  ? 'తెగుళ్ళు, ఎరువులు, సూక్ష్మపోషకాలపై తక్షణ సలహా పొందండి'
                  : 'Get instant interactive guidance on pest control, fertilizers & weather'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenChat}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
          >
            <span>{language === 'te' ? 'AI ఏజెంట్‌తో మాట్లాడండి' : 'Chat with AI Agent'}</span>
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-sm font-medium">
            <p>{errorMessage}</p>
            <p className="text-xs text-rose-600 mt-1">
              {language === 'te'
                ? 'మీరు అప్‌లోడ్ చేసిన ఫోటో మరియు వివరణ భద్రపరచబడ్డాయి. మీరు మళ్లీ సమర్పించవచ్చు.'
                : 'Your uploaded photo and description have been preserved. You can try submitting again.'}
            </p>
          </div>
          <button
            onClick={onClearError}
            className="text-rose-500 hover:text-rose-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Component A: Crop Image Upload */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm transition-all hover:border-emerald-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base sm:text-lg">
                  {t.uploadTitle}
                </h3>
                <p className="text-xs text-stone-500">
                  {t.uploadSubtitle}
                </p>
              </div>
            </div>

            {image && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                <CheckCircle className="w-3.5 h-3.5" />
                Image Ready
              </span>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileChange(e.target.files[0]);
              }
            }}
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
          />

          {!image ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                dragOver
                  ? 'border-emerald-500 bg-emerald-50/60 scale-[1.01]'
                  : 'border-stone-300 hover:border-emerald-400 bg-stone-50/60 hover:bg-emerald-50/30'
              }`}
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-xs">
                <Upload className="w-7 h-7" />
              </div>
              <p className="font-bold text-stone-800 text-sm sm:text-base">
                {t.chooseImage}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                {t.orDragDrop}
              </p>
              <span className="mt-3 text-[11px] text-stone-400 font-medium">
                JPG, PNG, WebP up to 10MB
              </span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-900 flex items-center justify-center max-h-80">
                <img
                  src={image.fullDataUrl}
                  alt="Crop preview"
                  className="max-h-80 w-auto object-contain mx-auto"
                />
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-stone-900/80 hover:bg-stone-900 text-white transition-colors cursor-pointer shadow-md"
                  title={t.removeImage}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200">
                <div className="flex items-center gap-2 truncate">
                  <span className="font-medium truncate max-w-xs">{image.filename}</span>
                  <span className="text-stone-400">•</span>
                  <span>{formatFileSize(image.sizeBytes)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 font-medium transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{t.replaceImage}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-medium transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{t.removeImage}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {fileError && (
            <p className="mt-3 text-xs text-rose-600 font-medium flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{fileError}</span>
            </p>
          )}
        </div>

        {/* Component B & C: Text Description & Voice Input */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-sm transition-all hover:border-emerald-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-700" />
              <label htmlFor="crop-desc" className="font-bold text-stone-900 text-base sm:text-lg">
                {language === 'te' ? 'పంట సమస్య వివరణ' : 'Crop Symptom Description'}
              </label>
            </div>

            {/* Speech Language Selector Pill Toggle */}
            <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
              <span className="text-stone-500 text-[11px] px-1 font-medium hidden sm:inline">
                {language === 'te' ? 'మైక్ భాష:' : 'Mic Language:'}
              </span>
              <button
                type="button"
                onClick={() => setSpeechLanguage('en')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  speechLanguage === 'en'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Transcribe speech in English (en-IN)"
              >
                English (en-IN)
              </button>
              <button
                type="button"
                onClick={() => setSpeechLanguage('te')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  speechLanguage === 'te'
                    ? 'bg-white text-emerald-800 shadow-xs font-bold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                title="Transcribe speech in Telugu (te-IN)"
              >
                తెలుగు (te-IN)
              </button>
            </div>
          </div>

          <div className="relative">
            <textarea
              id="crop-desc"
              rows={5}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                onClearError();
              }}
              placeholder={t.descPlaceholder}
              className="w-full rounded-2xl border border-stone-300 p-4 pb-14 text-sm sm:text-base text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all outline-hidden resize-y leading-relaxed"
            />

            {/* Microphone Button at bottom right of text area */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleListening}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-4 ring-rose-200'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
                title={isListening ? t.micStop : t.micStart}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4 animate-bounce" />
                    <span>{t.micStop}</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>{t.micStart}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Real-time Listening Banner with live recognized speech words */}
          {isListening && (
            <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex flex-col gap-1.5 shadow-xs">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                  <span>{t.micListening}</span>
                </span>
                <span className="text-[11px] bg-emerald-200/60 px-2 py-0.5 rounded-full font-mono">
                  {speechLanguage === 'te' ? 'Locale: te-IN' : 'Locale: en-IN'}
                </span>
              </div>
              {interimText && (
                <p className="text-xs text-emerald-800 font-medium bg-white/70 p-2 rounded-xl border border-emerald-100 italic">
                  {t.micInterimHint} &ldquo;{interimText}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Speech Success Banner */}
          {speechSuccess && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{speechSuccess}</span>
            </div>
          )}

          {/* Speech Error Banner */}
          {speechError && (
            <div className="mt-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">{speechError}</p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  {language === 'te'
                    ? 'మీరు మీ సమస్యను నేరుగా బాక్స్‌లో టైప్ చేయవచ్చు.'
                    : 'You can type your crop symptoms directly in the box above.'}
                </p>
              </div>
            </div>
          )}

          {/* Quick symptom pill suggestions */}
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-xs font-semibold text-stone-600 mb-2">
              {t.quickSymptomsLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {t.quickSymptoms.map((symptom, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddSymptomChip(symptom)}
                  className="px-3 py-1.5 rounded-xl text-xs bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-stone-200 text-stone-700 transition-colors text-left font-medium cursor-pointer"
                >
                  + {symptom}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Component D: Optional Farmer Details (Collapsible) */}
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setShowOptionalDetails(!showOptionalDetails)}
            className="w-full p-6 sm:p-8 flex items-center justify-between text-left hover:bg-stone-50/70 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <Wheat className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-stone-900 text-base sm:text-lg">
                    {t.optionalDetailsTitle}
                  </h3>
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                    Optional
                  </span>
                </div>
                <p className="text-xs text-stone-500">
                  {t.optionalDetailsDesc}
                </p>
              </div>
            </div>

            <div className="p-2 rounded-xl bg-stone-100 text-stone-600">
              {showOptionalDetails ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </button>

          {showOptionalDetails && (
            <div className="px-6 pb-6 sm:px-8 sm:pb-8 pt-2 border-t border-stone-100 space-y-4">
              {/* Farmer Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {t.farmerNameLabel}
                  </label>
                  <input
                    type="text"
                    value={farmerName}
                    onChange={(e) => setFarmerName(e.target.value)}
                    placeholder={t.farmerNamePlaceholder}
                    className="w-full rounded-xl border border-stone-300 p-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {t.emailLabel}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.emailPlaceholder}
                    className="w-full rounded-xl border border-stone-300 p-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden"
                  />
                </div>
              </div>

              {/* Location with GPS helper */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-stone-700">
                    {t.locationLabel}
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{detectingLocation ? 'Detecting...' : 'Use GPS'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t.locationPlaceholder}
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden"
                />
              </div>

              {/* Crop Name & Quick Crop Chips */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t.cropLabel}
                </label>
                <input
                  type="text"
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  placeholder={t.cropPlaceholder}
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden mb-2"
                />
                <div className="flex flex-wrap gap-1.5">
                  {commonCrops.map((c, i) => {
                    const label = language === 'te' ? c.te : c.en;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCrop(label)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                          crop === label
                            ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                            : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Crop Growth Stage & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {t.growthStageLabel}
                  </label>
                  <select
                    value={growthStage}
                    onChange={(e) => setGrowthStage(e.target.value)}
                    className="w-full rounded-xl border border-stone-300 p-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden bg-white"
                  >
                    <option value="">{t.growthStagePlaceholder}</option>
                    <option value="Seedling / నారు దశ">Seedling / నారు దశ</option>
                    <option value="Vegetative / శాఖీయ దశ">Vegetative / శాఖీయ దశ</option>
                    <option value="Flowering / పూత దశ">Flowering / పూత దశ</option>
                    <option value="Fruiting / కాయ దశ">Fruiting / కాయ దశ</option>
                    <option value="Maturity & Harvest / కోత దశ">Maturity & Harvest / కోత దశ</option>
                    <option value="Not Sure / తెలియదు">Not Sure / తెలియదు</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {t.problemDurationLabel}
                  </label>
                  <input
                    type="text"
                    value={problemDuration}
                    onChange={(e) => setProblemDuration(e.target.value)}
                    placeholder={t.problemDurationPlaceholder}
                    className="w-full rounded-xl border border-stone-300 p-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden"
                  />
                </div>
              </div>

              {/* Recent Practices */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  {t.recentPracticesLabel}
                </label>
                <input
                  type="text"
                  value={recentPractices}
                  onChange={(e) => setRecentPractices(e.target.value)}
                  placeholder={t.recentPracticesPlaceholder}
                  className="w-full rounded-xl border border-stone-300 p-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* Component E: Language Selection for Final Report */}
        <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-stone-900 text-sm sm:text-base">
              {t.reportLangLabel}
            </h4>
            <p className="text-xs text-stone-500">
              {language === 'te'
                ? 'తుది నివేదికను ఈ భాషలో తయారు చేస్తాము (వివరణ భాష అలాగే భద్రపరచబడుతుంది)'
                : 'The AI will generate all 13 report sections in this language.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setReportLanguage('en');
                onLanguageChange('en');
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                reportLanguage === 'en'
                  ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-300'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              English Report
            </button>
            <button
              type="button"
              onClick={() => {
                setReportLanguage('te');
                onLanguageChange('te');
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                reportLanguage === 'te'
                  ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-300 font-bold'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              తెలుగు నివేదిక
            </button>
          </div>
        </div>

        {/* Section 3: Prominent "Analyze My Crop" Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || (!description.trim() && !image)}
            className={`w-full py-5 rounded-2xl text-lg sm:text-xl font-bold flex items-center justify-center gap-3 transition-all cursor-pointer shadow-lg ${
              isLoading || (!description.trim() && !image)
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-emerald-600/30 hover:shadow-emerald-600/40 transform hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>{loadingStep || t.analyzingButton}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                <span>{t.analyzeButton}</span>
              </>
            )}
          </button>

          {/* Helper hint below button */}
          {!image && !description.trim() && (
            <p className="text-center text-xs text-stone-500 mt-2">
              {t.validationError}
            </p>
          )}

          {isLoading && (
            <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm text-center animate-pulse">
              🌾 {loadingStep || 'Analyzing visible symptoms, checking scientific agronomy guidelines, and preparing your report...'}
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
