'use client';

let frenchVoice: SpeechSynthesisVoice | null = null;

function pickFrenchVoice(): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.startsWith('fr')) ??
    voices.find((v) => v.lang.includes('FR')) ??
    null
  );
}

export function initTtsVoices(): void {
  if (typeof window === 'undefined') return;
  frenchVoice = pickFrenchVoice();
  window.speechSynthesis.onvoiceschanged = () => {
    frenchVoice = pickFrenchVoice();
  };
}

export function speakFrench(text: string): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  if (!frenchVoice) frenchVoice = pickFrenchVoice();
  if (frenchVoice) utterance.voice = frenchVoice;
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeech(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}
