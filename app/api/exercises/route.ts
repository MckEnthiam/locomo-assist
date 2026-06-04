import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { toExerciseDTO } from '@/lib/serialize';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dayOfWeek = searchParams.get('dayOfWeek');

    const exercises = await prisma.exercise.findMany({
      where: dayOfWeek ? { dayOfWeek: parseInt(dayOfWeek, 10) } : undefined,
      orderBy: [{ dayOfWeek: 'asc' }, { sortOrder: 'asc' }],
    });

    return NextResponse.json(exercises.map(toExerciseDTO));
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}
