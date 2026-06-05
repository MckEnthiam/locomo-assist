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
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const progressions = await db.progression.findMany({
      where: { date: { gte: fourWeeksAgo } },
      orderBy: { date: "asc" },
    });

    const sessions = await db.session.findMany({
      where: { endedAt: { not: null, gte: fourWeeksAgo } },
      include: { exercises: true },
      orderBy: { endedAt: "asc" },
    });

    const currentWeek = getWeekNumber();
    const chartData = [];
    for (let w = 3; w >= 0; w--) {
      const weekNum = currentWeek - w;
      const weekProgressions = progressions.filter(
        (p) => getWeekNumber(p.date) === weekNum
      );
      const avg = (part: string) => {
        const filtered = weekProgressions.filter((p) => p.bodyPart === part);
        if (!filtered.length) return 0;
        return Math.round(
          filtered.reduce((s, p) => s + p.angleDegrees, 0) / filtered.length
        );
      };
      chartData.push({
        week: `S${weekNum}`,
        epaule: avg("epaule"),
        coude: avg("coude"),
        hanche: avg("hanche"),
        colonne: avg("colonne"),
      });
    }

    const weekRows = [];
    for (let w = 3; w >= 0; w--) {
      const weekNum = currentWeek - w;
      const weekSessions = sessions.filter((s) => s.weekNumber === weekNum);
      let ampSum = 0;
      let ampCount = 0;
      let timeSum = 0;
      const comp = { lumbar: 0, shoulder: 0 };

      weekSessions.forEach((s) => {
        timeSum += s.totalDuration ?? 0;
        s.exercises.forEach((se) => {
          if (se.avgAmplitude != null) {
            ampSum += se.avgAmplitude;
            ampCount++;
          }
          if (se.compensations) {
            try {
              const c = JSON.parse(se.compensations) as {
                lumbar: number;
                shoulder: number;
              };
              comp.lumbar += c.lumbar ?? 0;
              comp.shoulder += c.shoulder ?? 0;
            } catch {}
          }
        });
      });

      weekRows.push({
        weekNumber: weekNum,
        sessionsCount: weekSessions.length,
        avgAmplitude: ampCount > 0 ? Math.round(ampSum / ampCount) : 0,
        totalTimeSeconds: timeSum,
        compensations: comp,
      });
    }

    return NextResponse.json({ chartData, weekRows });
  } catch (e) {
    console.error("Progression error:", e);
    return NextResponse.json(
      { error: "Erreur de chargement de la progression." },
      { status: 500 }
    );
  }
}
