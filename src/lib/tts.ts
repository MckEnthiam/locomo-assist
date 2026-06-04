let frenchVoice: SpeechSynthesisVoice | null = null;

function pickFrenchVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => v.lang.startsWith('fr')) ?? null;
}

export function initTtsVoices(): void {
  frenchVoice = pickFrenchVoice();
  window.speechSynthesis.onvoiceschanged = () => {
    frenchVoice = pickFrenchVoice();
  };
}

export function speak(text: string, lang = 'fr-FR', rate = 1.0): void {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = rate;
  if (!frenchVoice) frenchVoice = pickFrenchVoice();
  if (frenchVoice) utterance.voice = frenchVoice;
  window.speechSynthesis.speak(utterance);
}

export function speakFrench(text: string, rate = 1.0): void {
  speak(text, 'fr-FR', rate);
}

export function stopSpeech(): void {
  window.speechSynthesis?.cancel();
}
