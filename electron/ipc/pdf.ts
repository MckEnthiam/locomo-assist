import { ipcMain, shell } from 'electron';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
import { desc, eq, isNotNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import * as schema from '../../drizzle/schema';
import { getDb } from '../services/db';
import { extractCoachWarnings, generatePdfToPath } from '../services/pdf-generator';
import { mapExercise, parseJson } from '../services/db-helpers';

function rapportsDir(): string {
  return path.join(app.getPath('documents'), 'LocomoAssist', 'rapports');
}

export function registerPdfHandlers(): void {
  ipcMain.handle('pdf:generate', async (_, sessionId?: string) => {
    try {
      const db = getDb();
      let targetSessionId = sessionId;
      if (!targetSessionId) {
        const [ended] = await db
          .select()
          .from(schema.sessions)
          .where(isNotNull(schema.sessions.endedAt))
          .orderBy(desc(schema.sessions.endedAt))
          .limit(1);
        if (!ended) throw new Error('Aucune session terminée');
        targetSessionId = ended.id;
      }

      const existing = await db
        .select()
        .from(schema.rapports)
        .where(eq(schema.rapports.sessionId, targetSessionId));
      if (existing[0]) {
        return { success: true, path: existing[0].pdfPath };
      }

      const [session] = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.id, targetSessionId));
      if (!session) throw new Error('Session introuvable');

      const ses = await db
        .select()
        .from(schema.sessionExercises)
        .where(eq(schema.sessionExercises.sessionId, targetSessionId));

      const [param] = await db
        .select()
        .from(schema.parametres)
        .where(eq(schema.parametres.id, 'singleton'));
      const [med] = await db
        .select()
        .from(schema.medecin)
        .where(eq(schema.medecin.id, 'singleton'));

      const coachWarnings: string[] = [];
      const exerciseRows = [];
      let targetReps = 0;
      let completedReps = 0;
      const totalComp = { lumbar: 0, shoulder: 0 };

      for (const se of ses) {
        const [ex] = await db
          .select()
          .from(schema.exercises)
          .where(eq(schema.exercises.id, se.exerciseId));
        if (!ex) continue;
        targetReps += ex.reps * ex.sets;
        completedReps += se.repsCompleted;
        const comp = parseJson<{ lumbar?: number; shoulder?: number }>(se.compensations, {});
        totalComp.lumbar += comp.lumbar ?? 0;
        totalComp.shoulder += comp.shoulder ?? 0;
        coachWarnings.push(...extractCoachWarnings(se.coachMessages, ex.name));
        exerciseRows.push({
          name: ex.name,
          avgAmplitude: Math.round(se.avgAmplitude ?? 0),
          peakAmplitude: Math.round(se.peakAmplitude ?? 0),
          reps: se.repsCompleted,
          compensations: `Lombaire: ${comp.lumbar ?? 0}, Épaule: ${comp.shoulder ?? 0}`,
          status: se.status,
        });
      }

      const formScore =
        targetReps > 0 ? Math.min(100, Math.round((completedReps / targetReps) * 100)) : 0;
      const fileName = `rapport-${targetSessionId}-${Date.now()}.pdf`;
      const pdfPath = path.join(rapportsDir(), fileName);
      const logoPath = path.join(app.getAppPath(), 'public', 'logo.png');
      const devLogo = path.join(__dirname, '../../public/logo.png');

      await generatePdfToPath(pdfPath, {
        weekNumber: session.weekNumber,
        formScore,
        totalDurationSeconds: session.totalDuration ?? 0,
        patientName: param?.nomPatient ?? 'Patient',
        medecinLabel: med
          ? `${med.prenom ?? ''} ${med.nom ?? ''} — ${med.specialite ?? ''}`.trim()
          : 'Non renseigné',
        exercises: exerciseRows,
        coachWarnings,
        logoPath: fs.existsSync(logoPath) ? logoPath : devLogo,
      });

      const ampValues = ses
        .map((row) => row.avgAmplitude)
        .filter((v): v is number => v != null);
      const avgAmplitude =
        ampValues.length > 0
          ? Math.round(ampValues.reduce((a: number, b: number) => a + b, 0) / ampValues.length)
          : 0;

      await db.insert(schema.rapports).values({
        id: randomUUID(),
        sessionId: targetSessionId,
        weekNumber: session.weekNumber,
        generatedAt: new Date(),
        pdfPath,
        summary: JSON.stringify({
          avgAmplitude,
          totalTime: session.totalDuration ?? 0,
          sessionsCount: 1,
          compensations: totalComp,
          formScore,
        }),
      });

      return { success: true, path: pdfPath };
    } catch (e) {
      return {
        success: false,
        path: '',
        error: e instanceof Error ? e.message : 'Erreur PDF',
      };
    }
  });

  ipcMain.handle('pdf:open', async (_, filePath: string) => {
    await shell.openPath(filePath);
    return { ok: true };
  });
}
