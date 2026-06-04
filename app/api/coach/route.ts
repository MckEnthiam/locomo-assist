import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { getCoachFeedback } from '@/lib/coach';
import type { AngleData, CoachMessage, CompensationData, TargetAngles } from '@/types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      angles: AngleData;
      exercise: { name: string; targetAngles: TargetAngles };
      compensations: CompensationData;
      history: CoachMessage[];
      provider?: 'gemini' | 'grok' | 'groq';
    };

    if (!body.angles || !body.exercise) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const result = await getCoachFeedback(
      {
        angles: body.angles,
        exercise: body.exercise,
        compensations: body.compensations ?? { lumbar: 0, shoulder: 0 },
        history: body.history ?? [],
      },
      body.provider,
    );

    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur coach IA' },
      { status: 500 },
    );
  }
}
