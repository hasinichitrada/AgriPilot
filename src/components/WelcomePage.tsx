import React from 'react';
import { ArrowRight, Camera, Mic, ShieldAlert, Sparkles, Sprout, CheckCircle2, Leaf, HeartHandshake, MessageSquare } from 'lucide-react';
import type { Language } from '../types/agri.ts';
import { translations } from '../i18n/translations.ts';

interface WelcomePageProps {
  language: Language;
  onContinue: () => void;
  onSelectLanguage: (lang: Language) => void;
  onOpenChat?: () => void;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({
  language,
  onContinue,
  onSelectLanguage,
  onOpenChat
}) => {
  const t = translations[language];

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-hidden bg-gradient-to-b from-emerald-50/70 via-stone-50 to-emerald-50/30">
      {/* Decorative background leaf patterns */}
      <div className="absolute top-10 right-4 w-72 h-72 bg-emerald-200/25 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-12 left-4 w-80 h-80 bg-teal-200/20 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Hero Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 w-full flex-1 flex flex-col justify-center">
        {/* Subtle pill badge */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium shadow-xs">
            <Leaf className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>AI-Powered Agronomy & Plant Diagnostics • తెలుగు & English</span>
          </div>
        </div>

        {/* Hero Title & Branding */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-600/25 mb-6 ring-8 ring-emerald-100">
            <Sprout className="w-12 h-12 sm:w-14 sm:h-14 stroke-[2.2]" />
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-stone-900 tracking-tight leading-tight">
            {t.appName}
          </h1>
          <p className="mt-3 text-xl sm:text-2xl font-bold text-emerald-700">
            {t.tagline}
          </p>
          <p className="mt-4 text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
            {t.heroDescription}
          </p>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-14">
          <button
            onClick={onContinue}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 sm:py-4.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-lg font-bold shadow-lg shadow-emerald-600/30 hover:shadow-emerald-600/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer focus:outline-hidden focus:ring-4 focus:ring-emerald-300"
          >
            <span>{t.continueButton}</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-4 sm:py-4.5 rounded-2xl bg-white hover:bg-emerald-50 border-2 border-emerald-600 text-emerald-800 text-base font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <span>{language === 'te' ? 'AI ఏజెంట్‌తో మాట్లాడండి' : 'Chat with AI Agent'}</span>
            </button>
          )}

          {/* Quick language switch toggle */}
          <div className="flex items-center gap-2 text-xs text-stone-500 sm:ml-2">
            <span>భాష / Language:</span>
            <button
              onClick={() => onSelectLanguage('en')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                language === 'en'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              English
            </button>
            <button
              onClick={() => onSelectLanguage('te')}
              className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer ${
                language === 'te'
                  ? 'bg-emerald-700 text-white'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              తెలుగు
            </button>
          </div>
        </div>

        {/* Feature Cards Grid (Clean green and white color palette) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white/90 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <Camera className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-2">
              {t.welcomeFeatures[0].title}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {t.welcomeFeatures[0].desc}
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white/90 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-2">
              {t.welcomeFeatures[1].title}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {t.welcomeFeatures[1].desc}
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white/90 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-stone-900 mb-2">
              {t.welcomeFeatures[2].title}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {t.welcomeFeatures[2].desc}
            </p>
          </div>
        </div>

        {/* Agricultural assurance badge */}
        <div className="mt-12 text-center text-xs text-stone-500 flex items-center justify-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>No technical jargon required • Calibrated advice with local Krishi Vigyan Kendra (KVK) support</span>
        </div>
      </div>

      {/* Footer minimal info */}
      <footer className="py-4 border-t border-emerald-100 bg-white/50 text-center text-xs text-stone-500">
        AgriPilot — Empowering farmers across India with AI agronomy guidance
      </footer>
    </div>
  );
};
