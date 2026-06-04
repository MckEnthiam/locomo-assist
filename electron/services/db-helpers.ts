import type {
  CompensationData,
  ExerciseDTO,
  ReportDTO,
  SessionDTO,
  SessionExerciseDTO,
  TargetAngles,
} from '../../src/types';

export function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function mapExercise(row: {
  id: string;
  name: string;
  description: string;
  bodyPart: string;
  sets: number;
  reps: number;
  targetAngles: string;
  refVideoPath: string | null;
  dayOfWeek: number | null;
  sortOrder: number;
}): ExerciseDTO {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    bodyPart: row.bodyPart,
    sets: row.sets,
    reps: row.reps,
    targetAngles: parseJson<TargetAngles>(row.targetAngles, {}),
    refVideoPath: row.refVideoPath,
    refVideoUrl: null,
    dayOfWeek: row.dayOfWeek,
    sortOrder: row.sortOrder,
  };
}

export function mapSessionExercise(
  se: {
    id: string;
    sessionId: string;
    exerciseId: string;
    status: string;
    completedAt: Date | null;
    setsCompleted: number;
    repsCompleted: number;
    avgAmplitude: number | null;
    peakAmplitude: number | null;
    compensations: string | null;
    durationSeconds: number | null;
  },
  exercise: ExerciseDTO,
): SessionExerciseDTO {
  return {
    id: se.id,
    sessionId: se.sessionId,
    exerciseId: se.exerciseId,
    status: se.status as SessionExerciseDTO['status'],
    completedAt: se.completedAt ? se.completedAt.toISOString() : null,
    setsCompleted: se.setsCompleted,
    repsCompleted: se.repsCompleted,
    avgAmplitude: se.avgAmplitude,
    peakAmplitude: se.peakAmplitude,
    compensations: parseJson<CompensationData | null>(se.compensations, null),
    durationSeconds: se.durationSeconds,
    exercise,
  };
}

export function mapSession(
  session: {
    id: string;
    startedAt: Date;
    endedAt: Date | null;
    weekNumber: number;
    dayType: string | null;
    totalDuration: number | null;
  },
  exercises: SessionExerciseDTO[],
): SessionDTO {
  return {
    id: session.id,
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt ? session.endedAt.toISOString() : null,
    weekNumber: session.weekNumber,
    dayType: session.dayType,
    totalDuration: session.totalDuration,
    exercises,
  };
}

export function mapReport(row: {
  id: string;
  sessionId: string;
  weekNumber: number;
  generatedAt: Date;
  pdfPath: string;
  supabaseUrl: string | null;
  summary: string;
}): ReportDTO {
  const summary = parseJson(row.summary, {
    avgAmplitude: 0,
    totalTime: 0,
    sessionsCount: 1,
    compensations: { lumbar: 0, shoulder: 0 },
  });
  return {
    id: row.id,
    sessionId: row.sessionId,
    weekNumber: row.weekNumber,
    generatedAt: row.generatedAt.toISOString(),
    pdfPath: row.pdfPath,
    pdfUrl: row.supabaseUrl ?? `file://${row.pdfPath}`,
    summary,
  };
}

export function getWeekNumber(date: Date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export const DAY_BODY_PARTS: Record<number, string> = {
  1: 'Épaule — flexion',
  2: 'Épaule — rotation',
  3: 'Épaule — abduction',
  4: 'Épaule — pendule',
  5: 'Hanche — mobilisation',
};
