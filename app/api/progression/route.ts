import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { getWeekNumber } from '@/lib/utils';
import type { CompensationData } from '@/types';

export async function GET() {
  try {
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const progressions = await prisma.progression.findMany({
      where: { date: { gte: fourWeeksAgo } },
      orderBy: { date: 'asc' },
    });

    const sessions = await prisma.session.findMany({
      where: { endedAt: { not: null, gte: fourWeeksAgo } },
      include: { exercises: true },
      orderBy: { endedAt: 'asc' },
    });

    const currentWeek = getWeekNumber();
    const chartData = [];
    for (let w = 3; w >= 0; w--) {
      const weekNum = currentWeek - w;
      const weekProgressions = progressions.filter((p) => getWeekNumber(p.date) === weekNum);
      const avg = (part: string) => {
        const filtered = weekProgressions.filter((p) => p.bodyPart === part);
        if (!filtered.length) return 0;
        return Math.round(
          filtered.reduce((s, p) => s + p.angleDegrees, 0) / filtered.length,
        );
      };
      chartData.push({
        week: `S${weekNum}`,
        epaule: avg('epaule'),
        coude: avg('coude'),
        hanche: avg('hanche'),
        colonne: avg('colonne'),
      });
    }

    const weekRows = [];
    for (let w = 3; w >= 0; w--) {
      const weekNum = currentWeek - w;
      const weekSessions = sessions.filter((s) => s.weekNumber === weekNum);
      let ampSum = 0;
      let ampCount = 0;
      let timeSum = 0;
      const comp: CompensationData = { lumbar: 0, shoulder: 0 };

      weekSessions.forEach((s) => {
        timeSum += s.totalDuration ?? 0;
        s.exercises.forEach((se) => {
          if (se.avgAmplitude != null) {
            ampSum += se.avgAmplitude;
            ampCount++;
          }
          const c = se.compensations as CompensationData | null;
          if (c) {
            comp.lumbar += c.lumbar ?? 0;
            comp.shoulder += c.shoulder ?? 0;
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
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}
