export const dynamic = 'force-dynamic';

import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { SessionLive } from '@/components/session/SessionLive';
import { prisma } from '@/lib/prisma';
import { toExerciseDTO, toSessionDTO } from '@/lib/serialize';

interface PageProps {
  params: { exerciseId: string };
}

export default async function SessionPage({ params }: PageProps) {
  const exercise = await prisma.exercise.findUnique({ where: { id: params.exerciseId } });
  if (!exercise) notFound();

  let session = await prisma.session.findFirst({
    where: { endedAt: null },
    include: { exercises: { include: { exercise: true }, orderBy: { id: 'asc' } } },
  });

  if (!session) {
    redirect('/planning');
  }

  const allExercises = session.exercises.map((se) => toExerciseDTO(se.exercise));

  return (
    <AppShell title="Session live" subtitle={exercise.name}>
      <SessionLive
        session={toSessionDTO(session)}
        initialExercise={toExerciseDTO(exercise)}
        allExercises={allExercises}
      />
    </AppShell>
  );
}
