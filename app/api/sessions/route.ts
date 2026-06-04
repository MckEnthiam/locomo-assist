import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { toSessionDTO } from '@/lib/serialize';
import { getWeekNumber, DAY_BODY_PARTS } from '@/lib/utils';

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');

    if (scope === 'dashboard') {
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
        where: {
          status: 'done',
          completedAt: { gte: sevenDaysAgo },
        },
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

      return NextResponse.json({
        totalSessions: completedSessions,
        avgAmplitudeByJoint,
        totalDurationSeconds: durationAgg._sum.totalDuration ?? 0,
        formScore,
        amplitudeLast7Days,
        todaySession: todaySession ? toSessionDTO(todaySession) : null,
        activeSession: activeSession ? toSessionDTO(activeSession) : null,
        todayExercises,
        dayType: DAY_BODY_PARTS[dayOfWeek] ?? 'Session du jour',
      });
    }

    if (scope === 'active') {
      const active = await prisma.session.findFirst({
        where: { endedAt: null },
        include: { exercises: { include: { exercise: true }, orderBy: { id: 'asc' } } },
      });
      return NextResponse.json(active ? toSessionDTO(active) : null);
    }

    const sessions = await prisma.session.findMany({
      orderBy: { startedAt: 'desc' },
      take: 20,
      include: { exercises: { include: { exercise: true } } },
    });
    return NextResponse.json(sessions.map(toSessionDTO));
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string;
      sessionId?: string;
      exerciseIds?: string[];
      dayOfWeek?: number;
      sessionExerciseId?: string;
      payload?: Record<string, unknown>;
    };

    if (body.action === 'complete-exercise' && body.sessionExerciseId) {
      const payload = body.payload ?? {};
      const updated = await prisma.sessionExercise.update({
        where: { id: body.sessionExerciseId },
        data: {
          status: 'done',
          completedAt: new Date(),
          setsCompleted: (payload.setsCompleted as number) ?? undefined,
          repsCompleted: (payload.repsCompleted as number) ?? undefined,
          avgAmplitude: (payload.avgAmplitude as number) ?? undefined,
          peakAmplitude: (payload.peakAmplitude as number) ?? undefined,
          compensations: payload.compensations ?? undefined,
          signalData: payload.signalData ?? undefined,
          coachMessages: payload.coachMessages ?? undefined,
          durationSeconds: (payload.durationSeconds as number) ?? undefined,
        },
        include: { exercise: true },
      });

      if (updated.avgAmplitude != null) {
        await prisma.progression.create({
          data: {
            bodyPart: updated.exercise.bodyPart,
            angleDegrees: updated.avgAmplitude,
            exerciseId: updated.exerciseId,
          },
        });
      }

      return NextResponse.json({ ok: true, sessionExerciseId: updated.id });
    }

    if (body.action === 'end' && body.sessionId) {
      const session = await prisma.session.findUnique({
        where: { id: body.sessionId },
        include: { exercises: true },
      });
      if (!session) {
        return NextResponse.json({ error: 'Session introuvable' }, { status: 404 });
      }

      const duration =
        (body.payload?.totalDuration as number) ??
        Math.floor((Date.now() - session.startedAt.getTime()) / 1000);

      const ended = await prisma.session.update({
        where: { id: body.sessionId },
        data: { endedAt: new Date(), totalDuration: duration },
        include: { exercises: { include: { exercise: true } } },
      });

      return NextResponse.json(toSessionDTO(ended));
    }

    const dayOfWeek =
      body.dayOfWeek ??
      (() => {
        const js = new Date().getDay();
        return js === 0 ? 1 : js;
      })();

    const exercises = body.exerciseIds?.length
      ? await prisma.exercise.findMany({ where: { id: { in: body.exerciseIds } } })
      : await prisma.exercise.findMany({ where: { dayOfWeek }, orderBy: { sortOrder: 'asc' } });

    if (exercises.length === 0) {
      return NextResponse.json({ error: 'Aucun exercice pour cette session' }, { status: 400 });
    }

    const weekNumber = getWeekNumber();
    const session = await prisma.session.create({
      data: {
        weekNumber,
        dayType: DAY_BODY_PARTS[dayOfWeek] ?? `Jour ${dayOfWeek}`,
        exercises: {
          create: exercises.map((ex, idx) => ({
            exerciseId: ex.id,
            status: idx === 0 ? 'active' : 'pending',
          })),
        },
      },
      include: { exercises: { include: { exercise: true }, orderBy: { id: 'asc' } } },
    });

    return NextResponse.json(toSessionDTO(session), { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}
