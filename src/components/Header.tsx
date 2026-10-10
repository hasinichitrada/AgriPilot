import React from 'react';
import { Sprout, Settings2, Globe, Sparkles, MessageSquare } from 'lucide-react';
import type { Language } from '../types/agri.ts';
import { translations } from '../i18n/translations.ts';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenSettings: () => void;
  onReset: () => void;
  onOpenChat?: () => void;
  isUsingN8n: boolean;
  n8nStatus: 'idle' | 'connected' | 'error';
  currentPage: 'welcome' | 'analysis' | 'report';
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  onOpenSettings,
  onReset,
  onOpenChat,
  isUsingN8n,
  n8nStatus,
  currentPage
}) => {
  const t = translations[language];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-xs no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={onReset}
          className="flex items-center gap-3 text-left group focus:outline-hidden"
          title="AgriPilot Home"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Sprout className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xl tracking-tight text-emerald-950 font-sans">
                AgriPilot
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                AI Companion
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">
              {t.tagline}
            </p>
          </div>
        </button>

        {/* Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Direct Chat with n8n AI Agent button */}
          {onOpenChat && (
            <button
              onClick={onOpenChat}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
              title="Chat with n8n AI Agent"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{language === 'te' ? 'AI ఏజెంట్' : 'Ask AI Agent'}</span>
            </button>
          )}

          {/* n8n / AI engine indicator badge */}
          <button
            onClick={onOpenChat || onOpenSettings}
            className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              isUsingN8n
                ? n8nStatus === 'connected'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
            }`}
            title="n8n AI Agent (Click to chat)"
          >
            {isUsingN8n ? (
              <>
                <span className={`w-2 h-2 rounded-full ${n8nStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>n8n AI Agent Active</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>AgriPilot AI Engine</span>
              </>
            )}
          </button>

          {/* Settings mobile icon button */}
          <button
            onClick={onOpenSettings}
            className="md:hidden p-2 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
            title="Engine Settings"
            aria-label="Settings"
          >
            <Settings2 className="w-5 h-5" />
          </button>

          {/* Language Selector */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                language === 'en'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              English
            </button>
            <button
              onClick={() => onLanguageChange('te')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                language === 'te'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              తెలుగు
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
