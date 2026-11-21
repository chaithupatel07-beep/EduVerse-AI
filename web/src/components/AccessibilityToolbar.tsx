import React, { useState, useEffect } from 'react';
import speechService from '../services/speechService';
import offlineVaultService from '../services/offlineVaultService';

interface AccessibilityToolbarProps {
  currentLanguage?: 'en' | 'te' | 'hi';
}

export const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({
  currentLanguage = 'en',
}) => {
  const [fontSizeLevel, setFontSizeLevel] = useState<number>(100);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(offlineVaultService.isOnline());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const adjustFontSize = (delta: number) => {
    setFontSizeLevel((prev) => {
      const next = Math.min(130, Math.max(90, prev + delta));
      document.documentElement.style.fontSize = `${next}%`;
      return next;
    });
  };

  const toggleHighContrast = () => {
    setHighContrast((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add('contrast-more');
        document.body.classList.add('bg-slate-900', 'text-amber-300');
      } else {
        document.documentElement.classList.remove('contrast-more');
        document.body.classList.remove('bg-slate-900', 'text-amber-300');
      }
      return next;
    });
  };

  const handleReadAloud = () => {
    if (isSpeaking) {
      speechService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    // Try reading selected text, otherwise read the active main content heading/text
    const selectedText = window.getSelection()?.toString().trim();
    const textToRead =
      selectedText ||
      document.querySelector('main')?.innerText?.slice(0, 500) ||
      'Welcome to EduVerse AI. Learning accessible everywhere.';

    setIsSpeaking(true);
    speechService.speak(
      textToRead,
      currentLanguage,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  return (
    <div
      aria-label="Accessibility and Connectivity Controls"
      className="bg-white/90 backdrop-blur-md dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-full shadow-sm flex items-center space-x-2 text-xs"
    >
      {/* Connectivity Status */}
      <div
        className={`flex items-center space-x-1 px-2 py-0.5 rounded-full font-medium ${
          isOnline
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
        }`}
        title={isOnline ? 'Online: Live AI & Cloud Sync' : 'Offline Vault: Local Study Materials Active'}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}
        />
        <span>{isOnline ? 'Cloud Synced' : 'Offline Vault'}</span>
      </div>

      <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />

      {/* Font Resizing */}
      <div className="flex items-center space-x-1" aria-label="Font Resizing">
        <button
          type="button"
          onClick={() => adjustFontSize(-5)}
          className="px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300"
          title="Decrease font size"
          aria-label="Decrease font size"
        >
          A-
        </button>
        <span className="text-[10px] text-slate-500 font-mono">{fontSizeLevel}%</span>
        <button
          type="button"
          onClick={() => adjustFontSize(5)}
          className="px-1.5 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-300"
          title="Increase font size"
          aria-label="Increase font size"
        >
          A+
        </button>
      </div>

      <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />

      {/* High Contrast Toggle */}
      <button
        type="button"
        onClick={toggleHighContrast}
        className={`px-2 py-0.5 rounded font-medium transition-colors ${
          highContrast
            ? 'bg-amber-400 text-slate-950'
            : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
        }`}
        title="Toggle High Contrast Display Mode"
        aria-label="Toggle High Contrast Display Mode"
      >
        Contrast
      </button>

      <div className="h-3 w-px bg-slate-200 dark:bg-slate-700" />

      {/* Read Aloud Button */}
      <button
        type="button"
        onClick={handleReadAloud}
        className={`flex items-center space-x-1 px-2 py-0.5 rounded font-medium transition-colors ${
          isSpeaking
            ? 'bg-rose-500 text-white animate-pulse'
            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300'
        }`}
        title={isSpeaking ? 'Stop Read Aloud' : 'Read Aloud Page or Selection'}
        aria-label={isSpeaking ? 'Stop Read Aloud' : 'Read Aloud Page or Selection'}
      >
        <span>{isSpeaking ? '⏹ Stop' : '🔊 Read Aloud'}</span>
      </button>
    </div>
  );
};

export default AccessibilityToolbar;
