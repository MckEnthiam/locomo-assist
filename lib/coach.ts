import type { AngleData, CoachMessage, CompensationData, ExerciseDTO, TargetAngles } from '@/types';

const SYSTEM_PROMPT = `Tu es un coach kinésithérapeute virtuel. 
Tu observes les angles articulaires d'un patient en temps réel pendant sa rééducation.
Réponds UNIQUEMENT avec un message court (max 20 mots), direct, en français.
Ton ton est encourageant mais précis. Jamais de formules de politesse.
Si tout est correct → encourage. Si déviation → corrige avec précision (quel angle, combien de degrés).
Format de réponse : texte brut uniquement, pas de markdown.`;

export type CoachProviderKey = 'gemini' | 'grok' | 'groq';

const PROVIDERS = {
  gemini: {
    model: 'gemini-2.0-flash',
    apiUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    apiKeyEnv: 'GEMINI_API_KEY',
  },
  grok: {
    model: 'grok-3-mini',
    apiUrl: 'https://api.x.ai/v1/chat/completions',
    apiKeyEnv: 'XAI_API_KEY',
  },
  groq: {
    model: 'llama-3.3-70b-versatile',
    apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
    apiKeyEnv: 'GROQ_API_KEY',
  },
} as const;

export interface CoachParams {
  exercise: Pick<ExerciseDTO, 'name' | 'targetAngles'>;
  angles: AngleData;
  compensations: CompensationData;
  history: CoachMessage[];
}

function buildPrompt(params: CoachParams): string {
  return `Exercice: ${params.exercise.name}
Angles actuels: ${JSON.stringify(params.angles)}
Angles cibles: ${JSON.stringify(params.exercise.targetAngles)}
Compensations détectées: ${JSON.stringify(params.compensations)}
Derniers messages envoyés: ${params.history
    .slice(-3)
    .map((m) => m.text)
    .join(' | ')}`;
}

async function callGemini(
  config: { model: string; apiUrl: string; apiKey: string },
  userContent: string,
): Promise<string> {
  const res = await fetch(`${config.apiUrl}/${config.model}:generateContent?key=${config.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: 'user', parts: [{ text: userContent }] }],
      generationConfig: { maxOutputTokens: 150 },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${err}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Réponse Gemini vide');
  return text.trim();
}

async function callOpenAICompatible(
  config: { model: string; apiUrl: string; apiKey: string },
  userContent: string,
): Promise<string> {
  const res = await fetch(config.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: 150,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error: ${err}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Réponse API vide');
  return text.trim();
}

const ADAPTERS = {
  gemini: callGemini,
  grok: callOpenAICompatible,
  groq: callOpenAICompatible,
} as const;

export function inferMessageType(
  angles: AngleData,
  targets: TargetAngles,
  compensations: CompensationData,
): 'info' | 'warn' | 'success' {
  if (compensations.lumbar > 0 || compensations.shoulder > 0) return 'warn';
  const keys = Object.keys(targets) as (keyof AngleData)[];
  const outOfTarget = keys.some((key) => {
    const t = targets[key as string];
    if (t === undefined) return false;
    return Math.abs((angles[key] ?? 0) - t) > 10;
  });
  if (outOfTarget) return 'warn';
  return 'success';
}

export async function getCoachFeedback(
  params: CoachParams,
  provider?: CoachProviderKey,
): Promise<{ message: string; type: 'info' | 'warn' | 'success' }> {
  const selected = provider ?? (process.env.COACH_PROVIDER as CoachProviderKey) ?? 'gemini';
  const config = PROVIDERS[selected];
  if (!config) throw new Error(`Provider inconnu : ${selected}`);

  const apiKey = process.env[config.apiKeyEnv];
  if (!apiKey) throw new Error(`Clé API manquante : ${config.apiKeyEnv}`);

  const message = await ADAPTERS[selected]({ ...config, apiKey }, buildPrompt(params));
  const type = inferMessageType(params.angles, params.exercise.targetAngles, params.compensations);
  return { message, type };
}
