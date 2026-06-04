import { prisma } from '@/lib/prisma';
import { toExerciseDTO, toSessionDTO } from '@/lib/serialize';
import { DAY_BODY_PARTS } from '@/lib/utils';

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function getDashboardStats() {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const completedSessions = await prisma.session.count({
    where: { endedAt: { not: null } },
  });

  const durationAgg = await prisma.session.aggregate({
    _sum: { totalDuration: true },
    where: { endedAt: { not: null } },
  });

  const recentExercises = await prisma.sessionExercise.findMany({
    where: { status: 'done', completedAt: { gte: sevenDaysAgo } },
    include: { exercise: true },
  });

  const jointSums: Record<string, { sum: number; count: number }> = {
    epaule: { sum: 0, count: 0 },
    coude: { sum: 0, count: 0 },
    hanche: { sum: 0, count: 0 },
    colonne: { sum: 0, count: 0 },
  };

  recentExercises.forEach((se) => {
    const part = se.exercise.bodyPart;
    if (se.avgAmplitude != null && jointSums[part]) {
      jointSums[part].sum += se.avgAmplitude;
      jointSums[part].count += 1;
    }
  });

  const avgAmplitudeByJoint: Record<string, number> = {};
  Object.entries(jointSums).forEach(([k, v]) => {
    avgAmplitudeByJoint[k] = v.count > 0 ? Math.round(v.sum / v.count) : 0;
  });

  const amplitudeByDay: Record<
    string,
    { epaule: number[]; coude: number[]; hanche: number[]; colonne: number[] }
  > = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    amplitudeByDay[d.toISOString().slice(0, 10)] = {
      epaule: [],
      coude: [],
      hanche: [],
      colonne: [],
    };
  }

  recentExercises.forEach((se) => {
    if (!se.completedAt || se.avgAmplitude == null) return;
    const key = se.completedAt.toISOString().slice(0, 10);
    const bucket = amplitudeByDay[key];
    if (!bucket) return;
    const part = se.exercise.bodyPart as keyof typeof bucket;
    if (Array.isArray(bucket[part])) bucket[part].push(se.avgAmplitude);
  });

  const amplitudeLast7Days = Object.entries(amplitudeByDay).map(([date, vals]) => ({
    date,
    epaule: vals.epaule.length
      ? Math.round(vals.epaule.reduce((a, b) => a + b, 0) / vals.epaule.length)
      : 0,
    coude: vals.coude.length
      ? Math.round(vals.coude.reduce((a, b) => a + b, 0) / vals.coude.length)
      : 0,
    hanche: vals.hanche.length
      ? Math.round(vals.hanche.reduce((a, b) => a + b, 0) / vals.hanche.length)
      : 0,
    colonne: vals.colonne.length
      ? Math.round(vals.colonne.reduce((a, b) => a + b, 0) / vals.colonne.length)
      : 0,
  }));

  const lastThreeSessions = await prisma.session.findMany({
    where: { endedAt: { not: null } },
    orderBy: { endedAt: 'desc' },
    take: 3,
    include: { exercises: { include: { exercise: true } } },
  });

  let targetReps = 0;
  let completedReps = 0;
  lastThreeSessions.forEach((s) => {
    s.exercises.forEach((se) => {
      targetReps += se.exercise.reps * se.exercise.sets;
      completedReps += se.repsCompleted;
    });
  });
  const formScore =
    targetReps > 0 ? Math.min(100, Math.round((completedReps / targetReps) * 100)) : 0;

  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const todaySession = await prisma.session.findFirst({
    where: { startedAt: { gte: todayStart, lte: todayEnd } },
    orderBy: { startedAt: 'desc' },
    include: { exercises: { include: { exercise: true }, orderBy: { id: 'asc' } } },
  });

  const activeSession = await prisma.session.findFirst({
    where: { endedAt: null },
    orderBy: { startedAt: 'desc' },
    include: { exercises: { include: { exercise: true }, orderBy: { id: 'asc' } } },
  });

  const jsDay = now.getDay();
  const dayOfWeek = jsDay === 0 ? 1 : jsDay;
  const todayExercises = await prisma.exercise.findMany({
    where: { dayOfWeek },
    orderBy: { sortOrder: 'asc' },
  });

  return {
    totalSessions: completedSessions,
    avgAmplitudeByJoint,
    totalDurationSeconds: durationAgg._sum.totalDuration ?? 0,
    formScore,
    amplitudeLast7Days,
    todaySession: todaySession ? toSessionDTO(todaySession) : null,
    activeSession: activeSession ? toSessionDTO(activeSession) : null,
    todayExercises: todayExercises.map(toExerciseDTO),
    dayType: DAY_BODY_PARTS[dayOfWeek] ?? 'Session du jour',
  };
}
