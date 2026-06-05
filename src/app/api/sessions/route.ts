import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

function getWeekNumber(d: Date = new Date()): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const DAY_BODY_PARTS: Record<number, string> = {
  1: "Épaule — flexion",
  2: "Épaule — rotation",
  3: "Épaule — abduction",
  4: "Épaule — pendule",
  5: "Hanche — mobilisation",
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");

    if (scope === "dashboard") {
      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const completedSessions = await db.session.count({
        where: { endedAt: { not: null } },
      });

      const durationAgg = await db.session.aggregate({
        _sum: { totalDuration: true },
        where: { endedAt: { not: null } },
      });

      const recentExercises = await db.sessionExercise.findMany({
        where: { status: "done", completedAt: { gte: sevenDaysAgo } },
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

      const amplitudeLast7Days = Object.entries(amplitudeByDay).map(
        ([date, vals]) => ({
          date,
          epaule:
            vals.epaule.length > 0
              ? Math.round(vals.epaule.reduce((a, b) => a + b, 0) / vals.epaule.length)
              : 0,
          coude:
            vals.coude.length > 0
              ? Math.round(vals.coude.reduce((a, b) => a + b, 0) / vals.coude.length)
              : 0,
          hanche:
            vals.hanche.length > 0
              ? Math.round(vals.hanche.reduce((a, b) => a + b, 0) / vals.hanche.length)
              : 0,
          colonne:
            vals.colonne.length > 0
              ? Math.round(vals.colonne.reduce((a, b) => a + b, 0) / vals.colonne.length)
              : 0,
        })
      );

      const lastThreeSessions = await db.session.findMany({
        where: { endedAt: { not: null } },
        orderBy: { endedAt: "desc" },
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
        targetReps > 0
          ? Math.min(100, Math.round((completedReps / targetReps) * 100))
          : 0;

      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const todaySession = await db.session.findFirst({
        where: { startedAt: { gte: todayStart, lte: todayEnd } },
        orderBy: { startedAt: "desc" },
        include: {
          exercises: { include: { exercise: true }, orderBy: { id: "asc" } },
        },
      });

      const activeSession = await db.session.findFirst({
        where: { endedAt: null },
        orderBy: { startedAt: "desc" },
        include: {
          exercises: { include: { exercise: true }, orderBy: { id: "asc" } },
        },
      });

      const jsDay = now.getDay();
      const dayOfWeek = jsDay === 0 ? 1 : jsDay;
      const todayExercises = await db.exercise.findMany({
        where: { dayOfWeek },
        orderBy: { sortOrder: "asc" },
      });

      return NextResponse.json({
        totalSessions: completedSessions,
        avgAmplitudeByJoint,
        totalDurationSeconds: durationAgg._sum.totalDuration ?? 0,
        formScore,
        amplitudeLast7Days,
        todaySession: todaySession
          ? {
              ...todaySession,
              exercises: todaySession.exercises.map((se) => ({
                ...se,
                targetAngles: JSON.parse(se.exercise.targetAngles),
                compensations: se.compensations
                  ? JSON.parse(se.compensations)
                  : null,
              })),
            }
          : null,
        activeSession: activeSession
          ? {
              ...activeSession,
              exercises: activeSession.exercises.map((se) => ({
                ...se,
                targetAngles: JSON.parse(se.exercise.targetAngles),
                compensations: se.compensations
                  ? JSON.parse(se.compensations)
                  : null,
              })),
            }
          : null,
        todayExercises: todayExercises.map((e) => ({
          ...e,
          targetAngles: JSON.parse(e.targetAngles),
        })),
        dayType: DAY_BODY_PARTS[dayOfWeek] ?? "Session du jour",
      });
    }

    if (scope === "active") {
      const active = await db.session.findFirst({
        where: { endedAt: null },
        include: {
          exercises: { include: { exercise: true }, orderBy: { id: "asc" } },
        },
      });
      if (!active) return NextResponse.json(null);
      return NextResponse.json({
        ...active,
        exercises: active.exercises.map((se) => ({
          ...se,
          exercise: { ...se.exercise, targetAngles: JSON.parse(se.exercise.targetAngles) },
          compensations: se.compensations ? JSON.parse(se.compensations) : null,
        })),
      });
    }

    const sessions = await db.session.findMany({
      orderBy: { startedAt: "desc" },
      take: 20,
      include: { exercises: { include: { exercise: true } } },
    });
    return NextResponse.json(
      sessions.map((s) => ({
        ...s,
        exercises: s.exercises.map((se) => ({
          ...se,
          exercise: {
            ...se.exercise,
            targetAngles: JSON.parse(se.exercise.targetAngles),
          },
          compensations: se.compensations
            ? JSON.parse(se.compensations)
            : null,
        })),
      }))
    );
  } catch (e) {
    console.error("Sessions GET error:", e);
    return NextResponse.json(
      { error: "Erreur de chargement des sessions." },
      { status: 500 }
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

    if (body.action === "complete-exercise" && body.sessionExerciseId) {
      const payload = body.payload ?? {};
      await db.sessionExercise.update({
        where: { id: body.sessionExerciseId },
        data: {
          status: "done",
          completedAt: new Date(),
          setsCompleted: (payload.setsCompleted as number) ?? 0,
          repsCompleted: (payload.repsCompleted as number) ?? 0,
          avgAmplitude: (payload.avgAmplitude as number) ?? null,
          peakAmplitude: (payload.peakAmplitude as number) ?? null,
          compensations: payload.compensations
            ? JSON.stringify(payload.compensations)
            : null,
          signalData: payload.signalData
            ? JSON.stringify(payload.signalData)
            : null,
          coachMessages: payload.coachMessages
            ? JSON.stringify(payload.coachMessages)
            : null,
          durationSeconds: (payload.durationSeconds as number) ?? null,
        },
      });

      return NextResponse.json({
        ok: true,
        sessionExerciseId: body.sessionExerciseId,
      });
    }

    if (body.action === "end" && body.sessionId) {
      const session = await db.session.findUnique({
        where: { id: body.sessionId },
        include: { exercises: true },
      });
      if (!session) {
        return NextResponse.json(
          { error: "Session introuvable" },
          { status: 404 }
        );
      }
      const duration =
        (body.payload?.totalDuration as number) ??
        Math.floor((Date.now() - session.startedAt.getTime()) / 1000);

      await db.session.update({
        where: { id: body.sessionId },
        data: { endedAt: new Date(), totalDuration: duration },
      });

      return NextResponse.json({ ok: true });
    }

    const dayOfWeek =
      body.dayOfWeek ??
      (() => {
        const js = new Date().getDay();
        return js === 0 ? 1 : js;
      })();

    const exercises = body.exerciseIds?.length
      ? await db.exercise.findMany({
          where: { id: { in: body.exerciseIds } },
        })
      : await db.exercise.findMany({
          where: { dayOfWeek },
          orderBy: { sortOrder: "asc" },
        });

    if (exercises.length === 0) {
      return NextResponse.json(
        { error: "Aucun exercice pour cette session" },
        { status: 400 }
      );
    }

    const weekNumber = getWeekNumber();
    const session = await db.session.create({
      data: {
        weekNumber,
        dayType: DAY_BODY_PARTS[dayOfWeek] ?? `Jour ${dayOfWeek}`,
        exercises: {
          create: exercises.map((ex, idx) => ({
            exerciseId: ex.id,
            status: idx === 0 ? "active" : "pending",
          })),
        },
      },
      include: {
        exercises: { include: { exercise: true }, orderBy: { id: "asc" } },
      },
    });

    return NextResponse.json(
      {
        ...session,
        exercises: session.exercises.map((se) => ({
          ...se,
          exercise: {
            ...se.exercise,
            targetAngles: JSON.parse(se.exercise.targetAngles),
          },
        })),
      },
      { status: 201 }
    );
  } catch (e) {
    console.error("Sessions POST error:", e);
    return NextResponse.json(
      { error: "Erreur de création de session." },
      { status: 500 }
    );
  }
}
