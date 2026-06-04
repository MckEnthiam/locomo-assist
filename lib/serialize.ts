import type { Prisma } from '@prisma/client';
import type {
  CompensationData,
  ExerciseDTO,
  SessionDTO,
  SessionExerciseDTO,
  TargetAngles,
} from '@/types';

export function parseTargetAngles(json: Prisma.JsonValue): TargetAngles {
  if (typeof json === 'object' && json !== null && !Array.isArray(json)) {
    return json as TargetAngles;
  }
  return {};
}

export function parseCompensations(json: Prisma.JsonValue | null): CompensationData | null {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return null;
  const o = json as Record<string, number>;
  return {
    lumbar: o.lumbar ?? 0,
    shoulder: o.shoulder ?? 0,
  };
}

export function toExerciseDTO(exercise: {
  id: string;
  name: string;
  description: string;
  bodyPart: string;
  sets: number;
  reps: number;
  targetAngles: Prisma.JsonValue;
  refVideoUrl: string | null;
  dayOfWeek?: number | null;
  sortOrder?: number;
}): ExerciseDTO {
  return {
    id: exercise.id,
    name: exercise.name,
    description: exercise.description,
    bodyPart: exercise.bodyPart,
    sets: exercise.sets,
    reps: exercise.reps,
    targetAngles: parseTargetAngles(exercise.targetAngles),
    refVideoUrl: exercise.refVideoUrl,
    dayOfWeek: exercise.dayOfWeek,
    sortOrder: exercise.sortOrder,
  };
}

export function toSessionDTO(session: {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  weekNumber: number;
  dayType: string | null;
  totalDuration: number | null;
  exercises: Array<{
    id: string;
    sessionId: string;
    exerciseId: string;
    status: string;
    completedAt: Date | null;
    setsCompleted: number;
    repsCompleted: number;
    avgAmplitude: number | null;
    peakAmplitude: number | null;
    compensations: Prisma.JsonValue | null;
    durationSeconds: number | null;
    exercise: Parameters<typeof toExerciseDTO>[0];
  }>;
}): SessionDTO {
  return {
    id: session.id,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt?.toISOString() ?? null,
    weekNumber: session.weekNumber,
    dayType: session.dayType,
    totalDuration: session.totalDuration,
    exercises: session.exercises.map((se): SessionExerciseDTO => ({
      id: se.id,
      sessionId: se.sessionId,
      exerciseId: se.exerciseId,
      status: se.status as SessionExerciseDTO['status'],
      completedAt: se.completedAt?.toISOString() ?? null,
      setsCompleted: se.setsCompleted,
      repsCompleted: se.repsCompleted,
      avgAmplitude: se.avgAmplitude,
      peakAmplitude: se.peakAmplitude,
      compensations: parseCompensations(se.compensations),
      durationSeconds: se.durationSeconds,
      exercise: toExerciseDTO(se.exercise),
    })),
  };
}
