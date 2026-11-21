import React, { useState, useEffect } from 'react';
import { languageService, LANGUAGES, SupportedLanguage } from '../services/languageService';
import { Globe } from 'lucide-react';
import api from '../services/api';

export const LanguageSelector: React.FC = () => {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>(languageService.getCurrentLanguage());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<SupportedLanguage>;
      setCurrentLang(customEvent.detail);
    };

    window.addEventListener('languageChange', handleLangChange);
    return () => window.removeEventListener('languageChange', handleLangChange);
  }, []);

  const handleSelect = async (lang: SupportedLanguage) => {
    languageService.setLanguage(lang);
    setCurrentLang(lang);
    setIsOpen(false);

    // Sync preference to backend if authenticated
    try {
      await api.post('/ai/language-preference', { language: lang });
    } catch {
      // Ignored for unauthenticated or offline states
    }
  };

  const selectedInfo = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 transition shadow-sm"
        title="Switch Language (English / తెలుగు / हिंदी)"
      >
        <Globe className="w-3.5 h-3.5 text-indigo-400" />
        <span>{selectedInfo.flag}</span>
        <span className="font-medium">{selectedInfo.native}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-44 rounded-xl shadow-xl bg-slate-900 border border-slate-700 py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-1 text-[10px] font-semibold tracking-wider text-slate-400 uppercase border-b border-slate-800 mb-1">
            Choose Language
          </div>
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => handleSelect(l.code)}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition ${
                currentLang === l.code
                  ? 'bg-indigo-600/20 text-indigo-400 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm">{l.flag}</span>
                <span>{l.native}</span>
              </div>
              <span className="text-[10px] text-slate-400">{l.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
