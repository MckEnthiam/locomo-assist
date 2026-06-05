import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const exercises = await db.exercise.findMany({
      orderBy: [{ dayOfWeek: 'asc' }, { sortOrder: 'asc' }],
    });

    const parsed = exercises.map((e) => ({
      ...e,
      targetAngles: JSON.parse(e.targetAngles),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Exercises error:', error);
    return NextResponse.json({ error: 'Erreur de chargement des exercices.' }, { status: 500 });
  }
}
