export const dynamic = 'force-dynamic';

import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSupabaseAdmin } from '@/lib/supabase';
import { generateServerPdf } from '@/lib/server-pdf';
import { parseCompensations } from '@/lib/serialize';
import type { CoachMessage, CompensationData } from '@/types';

function formScoreFromSession(
  exercises: Array<{ repsCompleted: number; exercise: { reps: number; sets: number } }>,
): number {
  let target = 0;
  let done = 0;
  exercises.forEach((se) => {
    target += se.exercise.reps * se.exercise.sets;
    done += se.repsCompleted;
  });
  return target > 0 ? Math.min(100, Math.round((done / target) * 100)) : 0;
}

export async function GET() {
  try {
    const reports = await prisma.report.findMany({
      orderBy: { generatedAt: 'desc' },
      include: { session: true },
    });
    return NextResponse.json(
      reports.map((r) => ({
        id: r.id,
        sessionId: r.sessionId,
        weekNumber: r.weekNumber,
        generatedAt: r.generatedAt.toISOString(),
        pdfUrl: r.pdfUrl,
        summary: r.summary,
      })),
    );
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
      sessionId?: string;
      chartPngBase64?: string;
    };

    let sessionId = body.sessionId;
    if (!sessionId) {
      const latest = await prisma.session.findFirst({
        where: { endedAt: { not: null } },
        orderBy: { endedAt: 'desc' },
      });
      if (!latest) {
        return NextResponse.json({ error: 'Aucune session terminée' }, { status: 400 });
      }
      sessionId = latest.id;
    }

    const existing = await prisma.report.findUnique({ where: { sessionId } });
    if (existing) {
      return NextResponse.json({
        id: existing.id,
        pdfUrl: existing.pdfUrl,
        summary: existing.summary,
      });
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { exercises: { include: { exercise: true } } },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session introuvable' }, { status: 404 });
    }

    const coachWarnings: string[] = [];
    const totalComp: CompensationData = { lumbar: 0, shoulder: 0 };

    const exerciseRows = session.exercises.map((se) => {
      const comp = parseCompensations(se.compensations) ?? { lumbar: 0, shoulder: 0 };
      totalComp.lumbar += comp.lumbar;
      totalComp.shoulder += comp.shoulder;

      const messages = (se.coachMessages as CoachMessage[] | null) ?? [];
      messages
        .filter((m) => m.type === 'warn')
        .forEach((m) => coachWarnings.push(`${se.exercise.name}: ${m.text}`));

      return {
        name: se.exercise.name,
        avgAmplitude: Math.round(se.avgAmplitude ?? 0),
        peakAmplitude: Math.round(se.peakAmplitude ?? 0),
        reps: se.repsCompleted,
        compensations: `Lombaire: ${comp.lumbar}, Épaule: ${comp.shoulder}`,
        status: se.status,
      };
    });

    const formScore = formScoreFromSession(session.exercises);
    const completedCount = session.exercises.filter((e) => e.status === 'done').length;

    const pdfBuffer = await generateServerPdf({
      weekNumber: session.weekNumber,
      formScore,
      totalDurationSeconds: session.totalDuration ?? 0,
      completedCount,
      totalCount: session.exercises.length,
      exercises: exerciseRows,
      coachWarnings,
      chartPngBase64: body.chartPngBase64,
    });

    const fileName = `rapport-${session.id}-${Date.now()}.pdf`;
    const supabase = getSupabaseAdmin();
    const { error: uploadError } = await supabase.storage
      .from('rapports')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload Supabase: ${uploadError.message}`);
    }

    const { data: publicUrl } = supabase.storage.from('rapports').getPublicUrl(fileName);

    const ampValues = session.exercises
      .map((e) => e.avgAmplitude)
      .filter((v): v is number => v != null);
    const avgAmplitude =
      ampValues.length > 0
        ? Math.round(ampValues.reduce((a, b) => a + b, 0) / ampValues.length)
        : 0;

    const report = await prisma.report.create({
      data: {
        sessionId: session.id,
        weekNumber: session.weekNumber,
        pdfUrl: publicUrl.publicUrl,
        summary: {
          avgAmplitude,
          totalTime: session.totalDuration ?? 0,
          sessionsCount: 1,
          compensations: { ...totalComp },
          formScore,
        } as Prisma.InputJsonValue,
      },
    });

    return NextResponse.json({
      id: report.id,
      pdfUrl: report.pdfUrl,
      summary: report.summary,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erreur génération rapport' },
      { status: 500 },
    );
  }
}
