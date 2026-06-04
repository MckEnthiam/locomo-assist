import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const exercises = sqliteTable('exercises', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  bodyPart: text('body_part').notNull(),
  sets: integer('sets').notNull(),
  reps: integer('reps').notNull(),
  targetAngles: text('target_angles').notNull(),
  refVideoPath: text('ref_video_path'),
  dayOfWeek: integer('day_of_week'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  startedAt: integer('started_at', { mode: 'timestamp' }).notNull(),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  weekNumber: integer('week_number').notNull(),
  dayType: text('day_type'),
  totalDuration: integer('total_duration'),
  syncedAt: integer('synced_at', { mode: 'timestamp' }),
});

export const sessionExercises = sqliteTable('session_exercises', {
  id: text('id').primaryKey(),
  sessionId: text('session_id')
    .notNull()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  exerciseId: text('exercise_id')
    .notNull()
    .references(() => exercises.id),
  status: text('status').notNull().default('pending'),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  setsCompleted: integer('sets_completed').notNull().default(0),
  repsCompleted: integer('reps_completed').notNull().default(0),
  avgAmplitude: real('avg_amplitude'),
  peakAmplitude: real('peak_amplitude'),
  compensations: text('compensations'),
  signalData: text('signal_data'),
  coachMessages: text('coach_messages'),
  durationSeconds: integer('duration_seconds'),
});

export const rapports = sqliteTable('rapports', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().unique(),
  weekNumber: integer('week_number').notNull(),
  generatedAt: integer('generated_at', { mode: 'timestamp' }).notNull(),
  pdfPath: text('pdf_path').notNull(),
  supabaseUrl: text('supabase_url'),
  summary: text('summary').notNull(),
});

export const medecin = sqliteTable('medecin', {
  id: text('id').primaryKey().default('singleton'),
  nom: text('nom'),
  prenom: text('prenom'),
  email: text('email'),
  telephone: text('telephone'),
  specialite: text('specialite'),
  hopital: text('hopital'),
});

export const parametres = sqliteTable('parametres', {
  id: text('id').primaryKey().default('singleton'),
  langue: text('langue').notNull().default('fr'),
  voixCoach: text('voix_coach').notNull().default('fr-FR'),
  vitesseTts: real('vitesse_tts').notNull().default(1),
  coachVocalEnabled: integer('coach_vocal_enabled', { mode: 'boolean' }).notNull().default(true),
  seuilCompensation: integer('seuil_compensation').notNull().default(15),
  frequenceCoach: integer('frequence_coach').notNull().default(8),
  autoSync: integer('auto_sync', { mode: 'boolean' }).notNull().default(true),
  nomPatient: text('nom_patient'),
  zoneReeducation: text('zone_reeducation').notNull().default('epaule'),
  lastSyncAt: integer('last_sync_at', { mode: 'timestamp' }),
});

export const progression = sqliteTable('progression', {
  id: text('id').primaryKey(),
  date: integer('date', { mode: 'timestamp' }).notNull(),
  bodyPart: text('body_part').notNull(),
  angleDegrees: real('angle_degrees').notNull(),
  exerciseId: text('exercise_id').notNull(),
});
