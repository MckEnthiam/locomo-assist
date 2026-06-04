import { createClient } from '@supabase/supabase-js';
import { eq, isNull } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../../drizzle/schema';
import { parseJson } from './db-helpers';

export interface SyncResult {
  success: number;
  failed: number;
  errors: string[];
  lastSyncAt: string | null;
}

export async function pushToSupabase(
  db: BetterSQLite3Database<typeof schema>,
): Promise<SyncResult> {
  const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  if (!url || !serviceKey) {
    return {
      success: 0,
      failed: 0,
      errors: ['Configuration Supabase manquante'],
      lastSyncAt: null,
    };
  }

  const supabase = createClient(url, serviceKey);
  const unsynced = await db
    .select()
    .from(schema.sessions)
    .where(isNull(schema.sessions.syncedAt));

  for (const session of unsynced) {
    try {
      const ses = await db
        .select()
        .from(schema.sessionExercises)
        .where(eq(schema.sessionExercises.sessionId, session.id));

      const { error: sessionError } = await supabase.from('sessions').upsert({
        id: session.id,
        started_at: session.startedAt.toISOString(),
        ended_at: session.endedAt?.toISOString() ?? null,
        week_number: session.weekNumber,
        total_duration: session.totalDuration,
      });
      if (sessionError) throw sessionError;

      for (const se of ses) {
        const { error: seError } = await supabase.from('session_exercises').upsert({
          id: se.id,
          session_id: se.sessionId,
          exercise_id: se.exerciseId,
          status: se.status,
          sets_completed: se.setsCompleted,
          reps_completed: se.repsCompleted,
          avg_amplitude: se.avgAmplitude,
          peak_amplitude: se.peakAmplitude,
        });
        if (seError) throw seError;
      }

      const [report] = await db
        .select()
        .from(schema.rapports)
        .where(eq(schema.rapports.sessionId, session.id));

      if (report && fs.existsSync(report.pdfPath)) {
        const fileName = path.basename(report.pdfPath);
        const buffer = fs.readFileSync(report.pdfPath);
        const { error: uploadError } = await supabase.storage
          .from('rapports')
          .upload(fileName, buffer, { contentType: 'application/pdf', upsert: true });
        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage.from('rapports').getPublicUrl(fileName);
        await db
          .update(schema.rapports)
          .set({ supabaseUrl: publicUrl.publicUrl })
          .where(eq(schema.rapports.id, report.id));
      }

      await db
        .update(schema.sessions)
        .set({ syncedAt: new Date() })
        .where(eq(schema.sessions.id, session.id));
      success++;
    } catch (e) {
      failed++;
      errors.push(e instanceof Error ? e.message : 'Erreur sync');
    }
  }

  const now = new Date();
  await db
    .update(schema.parametres)
    .set({ lastSyncAt: now })
    .where(eq(schema.parametres.id, 'singleton'));

  const [param] = await db
    .select()
    .from(schema.parametres)
    .where(eq(schema.parametres.id, 'singleton'));

  return {
    success,
    failed,
    errors,
    lastSyncAt: param?.lastSyncAt?.toISOString() ?? now.toISOString(),
  };
}

export async function getSyncStatus(db: BetterSQLite3Database<typeof schema>) {
  const [param] = await db
    .select()
    .from(schema.parametres)
    .where(eq(schema.parametres.id, 'singleton'));
  const pending = await db
    .select()
    .from(schema.sessions)
    .where(isNull(schema.sessions.syncedAt));
  return {
    lastSyncAt: param?.lastSyncAt?.toISOString() ?? null,
    pendingCount: pending.length,
  };
}
