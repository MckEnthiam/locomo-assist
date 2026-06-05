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

export async function GET() {
  try {
    const reports = await db.report.findMany({
      orderBy: { generatedAt: "desc" },
    });
    return NextResponse.json(
      reports.map((r) => ({
        id: r.id,
        sessionId: r.sessionId,
        weekNumber: r.weekNumber,
        generatedAt: r.generatedAt.toISOString(),
        pdfUrl: r.pdfUrl,
        summary: r.summary ? JSON.parse(r.summary) : null,
      }))
    );
  } catch (e) {
    console.error("Rapports GET error:", e);
    return NextResponse.json(
      { error: "Erreur de chargement des rapports." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { sessionId?: string };

    let sessionId = body.sessionId;

    // Try to find a completed session
    if (!sessionId) {
      const latest = await db.session.findFirst({
        where: { endedAt: { not: null } },
        orderBy: { endedAt: "desc" },
      });

      if (latest) {
        sessionId = latest.id;
      } else {
        // Fallback: use any session if none are "ended" yet
        const anySession = await db.session.findFirst({
          orderBy: { startedAt: "desc" },
        });
        if (anySession) {
          // Mark it as ended so we can create a report
          await db.session.update({
            where: { id: anySession.id },
            data: {
              endedAt: new Date(),
              totalDuration: 15 * 60, // default 15 min
            },
          });
          sessionId = anySession.id;
        } else {
          return NextResponse.json(
            { error: "Aucune session disponible. Effectuez d'abord une séance d'exercices." },
            { status: 400 }
          );
        }
      }
    }

    // Check if report already exists for this session
    const existing = await db.report.findUnique({ where: { sessionId } });
    if (existing) {
      return NextResponse.json({
        id: existing.id,
        pdfUrl: existing.pdfUrl,
        summary: existing.summary ? JSON.parse(existing.summary) : null,
        message: "Rapport déjà existant pour cette session",
      });
    }

    const session = await db.session.findUnique({
      where: { id: sessionId },
      include: { exercises: { include: { exercise: true } } },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session introuvable" },
        { status: 404 }
      );
    }

    const exerciseRows = session.exercises.map((se) => ({
      name: se.exercise.name,
      avgAmplitude: Math.round(se.avgAmplitude ?? 0),
      peakAmplitude: Math.round(se.peakAmplitude ?? 0),
      reps: se.repsCompleted,
      compensations: se.compensations ? JSON.parse(se.compensations) : { lumbar: 0, shoulder: 0 },
      status: se.status,
    }));

    const totalComp = { lumbar: 0, shoulder: 0 };
    exerciseRows.forEach((row) => {
      const comp = row.compensations as { lumbar: number; shoulder: number };
      totalComp.lumbar += comp.lumbar;
      totalComp.shoulder += comp.shoulder;
    });

    const ampValues = session.exercises
      .map((e) => e.avgAmplitude)
      .filter((v): v is number => v != null);
    const avgAmplitude =
      ampValues.length > 0
        ? Math.round(ampValues.reduce((a, b) => a + b, 0) / ampValues.length)
        : 0;

    let targetReps = 0;
    let completedReps = 0;
    session.exercises.forEach((se) => {
      targetReps += se.exercise.reps * se.exercise.sets;
      completedReps += se.repsCompleted;
    });
    const formScore =
      targetReps > 0
        ? Math.min(100, Math.round((completedReps / targetReps) * 100))
        : 0;

    const weekNumber = getWeekNumber();

    const report = await db.report.create({
      data: {
        sessionId: session.id,
        weekNumber,
        pdfUrl: `/api/rapports/${session.id}/download`,
        summary: JSON.stringify({
          avgAmplitude,
          totalTime: session.totalDuration ?? 15 * 60,
          sessionsCount: 1,
          compensations: totalComp,
          formScore,
          exercises: exerciseRows,
        }),
      },
    });

    return NextResponse.json({
      id: report.id,
      pdfUrl: report.pdfUrl,
      summary: JSON.parse(report.summary),
      message: "Rapport généré avec succès",
    });
  } catch (e) {
    console.error("Rapports POST error:", e);
    return NextResponse.json(
      { error: "Erreur lors de la génération du rapport." },
      { status: 500 }
    );
  }
}
