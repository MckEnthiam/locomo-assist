import type { AngleData, CoachMessage, CompensationData, ExerciseDTO } from '@/types';

const MIN_INTERVAL_MS = 8000;
let lastCallAt = 0;

export async function getCoachMessage(
  angles: AngleData,
  exercise: ExerciseDTO,
  compensations: CompensationData,
  history: CoachMessage[],
): Promise<{ text: string; type: 'info' | 'warn' | 'success' }> {
  const now = Date.now();
  if (now - lastCallAt < MIN_INTERVAL_MS) {
    return getStaticFeedback(angles, exercise, compensations);
  }
  lastCallAt = now;

  if (!navigator.onLine) {
    return getStaticFeedback(angles, exercise, compensations);
  }

  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    return getStaticFeedback(angles, exercise, compensations);
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 60,
        messages: [
          {
            role: 'system',
            content: `Tu es un coach kinésithérapeute virtuel.
Réponds UNIQUEMENT avec un message court (max 20 mots), direct, en français.
Ton ton est encourageant mais précis. Jamais de formules de politesse.
Si tout est correct → encourage. Si déviation → corrige avec précision.
Format : texte brut uniquement.`,
          },
          {
            role: 'user',
            content: `Exercice: ${exercise.name}
Angles actuels: ${JSON.stringify(angles)}
Angles cibles: ${JSON.stringify(exercise.targetAngles)}
Compensations: ${JSON.stringify(compensations)}
Derniers messages: ${history
              .slice(-2)
              .map((m) => m.text)
              .join(' | ')}`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error('API Groq indisponible');
    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('Réponse vide');
    const type =
      compensations.lumbar > 0 || compensations.shoulder > 0 ? 'warn' : 'success';
    return { text, type };
  } catch {
    return getStaticFeedback(angles, exercise, compensations);
  }
}

export function getStaticFeedback(
  angles: AngleData,
  exercise: ExerciseDTO,
  compensations: CompensationData,
): { text: string; type: 'info' | 'warn' | 'success' } {
  if (compensations.lumbar > 0) {
    return { text: 'Compensation lombaire — contractez les abdominaux.', type: 'warn' };
  }
  const targets = exercise.targetAngles;
  const target = targets.shoulderLeft ?? targets.shoulder ?? 90;
  const diff = Math.abs(angles.shoulderLeft - target);
  if (diff > 15) {
    return { text: `Épaule gauche : ajustez de ${Math.round(diff)}°.`, type: 'warn' };
  }
  return { text: 'Bonne exécution. Continuez ce rythme.', type: 'success' };
}
