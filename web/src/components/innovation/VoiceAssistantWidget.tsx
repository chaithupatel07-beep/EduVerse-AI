import React, { useState } from 'react';
import speechService, { SupportedSpeechLang } from '../../services/speechService';
import { Mic, MicOff, Volume2, Square, Globe } from 'lucide-react';

interface VoiceAssistantWidgetProps {
  currentLanguage: SupportedSpeechLang;
  onTranscriptReady: (transcript: string) => void;
  lastResponseText?: string;
}

export const VoiceAssistantWidget: React.FC<VoiceAssistantWidgetProps> = ({
  currentLanguage,
  onTranscriptReady,
  lastResponseText,
}) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const toggleListening = () => {
    setSpeechError(null);
    if (isListening) {
      speechService.stopListening();
      setIsListening(false);
      return;
    }

    const started = speechService.startListening(
      currentLanguage,
      (res) => {
        if (res.transcript) {
          onTranscriptReady(res.transcript);
        }
      },
      (err) => {
        setSpeechError(err);
        setIsListening(false);
      },
      () => {
        setIsListening(false);
      }
    );

    if (started) {
      setIsListening(true);
    }
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      speechService.stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    if (!lastResponseText) return;

    speechService.speak(
      lastResponseText,
      currentLanguage,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      (err) => {
        setSpeechError(err);
        setIsSpeaking(false);
      }
    );
  };

  return (
    <div className="flex items-center gap-2">
      {/* Voice Input Button */}
      <button
        type="button"
        onClick={toggleListening}
        className={`p-2.5 rounded-xl border transition flex items-center justify-center ${
          isListening
            ? 'bg-rose-500 text-white border-rose-600 animate-pulse ring-2 ring-rose-400/40'
            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm'
        }`}
        title={
          isListening
            ? `Listening in ${currentLanguage === 'te' ? 'Telugu' : currentLanguage === 'hi' ? 'Hindi' : 'English'}... Click to stop`
            : `Click to speak inquiry in ${currentLanguage === 'te' ? 'Telugu' : currentLanguage === 'hi' ? 'Hindi' : 'English'}`
        }
      >
        {isListening ? <MicOff size={16} /> : <Mic size={16} />}
      </button>

      {/* Voice Output / Read-Aloud Button */}
      {lastResponseText && (
        <button
          type="button"
          onClick={toggleSpeaking}
          className={`p-2.5 rounded-xl border transition flex items-center justify-center ${
            isSpeaking
              ? 'bg-indigo-600 text-white border-indigo-700 animate-pulse'
              : 'bg-white hover:bg-slate-50 text-indigo-600 border-slate-200 shadow-sm'
          }`}
          title={isSpeaking ? 'Stop speech playback' : 'Listen to AI answer'}
        >
          {isSpeaking ? <Square size={14} /> : <Volume2 size={16} />}
        </button>
      )}

      {speechError && (
        <span className="text-[10px] text-rose-600 font-semibold max-w-[200px] truncate" title={speechError}>
          {speechError}
        </span>
      )}
    </div>
  );
};

export default VoiceAssistantWidget;
