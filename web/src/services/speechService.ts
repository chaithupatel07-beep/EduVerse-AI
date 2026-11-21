/**
 * EduVerse AI - Multilingual Speech Recognition & Synthesis Service (Phase 6.5)
 * Handles Speech-to-Text (STT) and Text-to-Speech (TTS) for Telugu, Hindi, and English.
 */

export interface SpeechRecognitionResultState {
  transcript: string;
  isFinal: boolean;
}

export type SupportedSpeechLang = 'te' | 'hi' | 'en';

export const LANG_BCP47_MAP: Record<SupportedSpeechLang, string> = {
  te: 'te-IN',
  hi: 'hi-IN',
  en: 'en-US',
};

class SpeechService {
  private recognition: any = null;
  private isListening: boolean = false;
  private synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
      }
    }
  }

  public isSTTSupported(): boolean {
    return this.recognition !== null;
  }

  public isTTSSupported(): boolean {
    return this.synth !== null;
  }

  /**
   * Start listening for voice input in Telugu, Hindi, or English.
   */
  public startListening(
    lang: SupportedSpeechLang = 'en',
    onResult: (result: SpeechRecognitionResultState) => void,
    onError: (errorMsg: string) => void,
    onEnd: () => void
  ): boolean {
    if (!this.recognition) {
      onError('Speech recognition is not supported in this browser. Please use text input or Chrome/Edge.');
      return false;
    }

    if (this.isListening) {
      this.stopListening();
    }

    try {
      this.recognition.lang = LANG_BCP47_MAP[lang] || 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        let transcript = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }

        onResult({ transcript, isFinal });
      };

      this.recognition.onerror = (event: any) => {
        this.isListening = false;
        let message = `Microphone error: ${event.error}`;
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          message = 'Microphone permission denied. Please allow microphone access in your browser settings.';
        } else if (event.error === 'no-speech') {
          message = 'No speech detected. Please speak clearly into your microphone.';
        }
        onError(message);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        onEnd();
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      this.isListening = false;
      onError(`Failed to start microphone: ${err.message || 'Unknown error'}`);
      return false;
    }
  }

  /**
   * Stop speech recognition.
   */
  public stopListening(): void {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignored
      }
      this.isListening = false;
    }
  }

  /**
   * Speak response text using Text-to-Speech in the selected language.
   */
  public speak(
    text: string,
    lang: SupportedSpeechLang = 'en',
    onStart?: () => void,
    onEnd?: () => void,
    onError?: (err: string) => void
  ): void {
    if (!this.synth) {
      onError?.('Text-to-speech is not supported in this browser.');
      return;
    }

    this.stopSpeaking();

    // Clean markdown symbols for cleaner pronunciation
    const cleanText = text
      .replace(/[#*`_~>[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = LANG_BCP47_MAP[lang] || 'en-US';
    utterance.rate = 0.95; // Slightly slower for clear educational delivery
    utterance.pitch = 1.0;

    // Pick best matching voice if available
    const voices = this.synth.getVoices();
    const targetLangCode = LANG_BCP47_MAP[lang];
    const matchedVoice = voices.find((v) => v.lang === targetLangCode || v.lang.startsWith(lang));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      this.currentUtterance = null;
      onEnd?.();
    };

    utterance.onerror = (e) => {
      this.currentUtterance = null;
      onError?.(`Speech synthesis error: ${e.error}`);
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  }

  /**
   * Stop currently playing text-to-speech audio.
   */
  public stopSpeaking(): void {
    if (this.synth) {
      this.synth.cancel();
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}

export const speechService = new SpeechService();
export default speechService;
