"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.progression = exports.parametres = exports.medecin = exports.rapports = exports.sessionExercises = exports.sessions = exports.exercises = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
exports.exercises = (0, sqlite_core_1.sqliteTable)('exercises', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    name: (0, sqlite_core_1.text)('name').notNull(),
    description: (0, sqlite_core_1.text)('description').notNull(),
    bodyPart: (0, sqlite_core_1.text)('body_part').notNull(),
    sets: (0, sqlite_core_1.integer)('sets').notNull(),
    reps: (0, sqlite_core_1.integer)('reps').notNull(),
    targetAngles: (0, sqlite_core_1.text)('target_angles').notNull(),
    refVideoPath: (0, sqlite_core_1.text)('ref_video_path'),
    dayOfWeek: (0, sqlite_core_1.integer)('day_of_week'),
    sortOrder: (0, sqlite_core_1.integer)('sort_order').notNull().default(0),
    createdAt: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).notNull(),
});
exports.sessions = (0, sqlite_core_1.sqliteTable)('sessions', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    startedAt: (0, sqlite_core_1.integer)('started_at', { mode: 'timestamp' }).notNull(),
    endedAt: (0, sqlite_core_1.integer)('ended_at', { mode: 'timestamp' }),
    weekNumber: (0, sqlite_core_1.integer)('week_number').notNull(),
    dayType: (0, sqlite_core_1.text)('day_type'),
    totalDuration: (0, sqlite_core_1.integer)('total_duration'),
    syncedAt: (0, sqlite_core_1.integer)('synced_at', { mode: 'timestamp' }),
});
exports.sessionExercises = (0, sqlite_core_1.sqliteTable)('session_exercises', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    sessionId: (0, sqlite_core_1.text)('session_id')
        .notNull()
        .references(() => exports.sessions.id, { onDelete: 'cascade' }),
    exerciseId: (0, sqlite_core_1.text)('exercise_id')
        .notNull()
        .references(() => exports.exercises.id),
    status: (0, sqlite_core_1.text)('status').notNull().default('pending'),
    completedAt: (0, sqlite_core_1.integer)('completed_at', { mode: 'timestamp' }),
    setsCompleted: (0, sqlite_core_1.integer)('sets_completed').notNull().default(0),
    repsCompleted: (0, sqlite_core_1.integer)('reps_completed').notNull().default(0),
    avgAmplitude: (0, sqlite_core_1.real)('avg_amplitude'),
    peakAmplitude: (0, sqlite_core_1.real)('peak_amplitude'),
    compensations: (0, sqlite_core_1.text)('compensations'),
    signalData: (0, sqlite_core_1.text)('signal_data'),
    coachMessages: (0, sqlite_core_1.text)('coach_messages'),
    durationSeconds: (0, sqlite_core_1.integer)('duration_seconds'),
});
exports.rapports = (0, sqlite_core_1.sqliteTable)('rapports', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    sessionId: (0, sqlite_core_1.text)('session_id').notNull().unique(),
    weekNumber: (0, sqlite_core_1.integer)('week_number').notNull(),
    generatedAt: (0, sqlite_core_1.integer)('generated_at', { mode: 'timestamp' }).notNull(),
    pdfPath: (0, sqlite_core_1.text)('pdf_path').notNull(),
    supabaseUrl: (0, sqlite_core_1.text)('supabase_url'),
    summary: (0, sqlite_core_1.text)('summary').notNull(),
});
exports.medecin = (0, sqlite_core_1.sqliteTable)('medecin', {
    id: (0, sqlite_core_1.text)('id').primaryKey().default('singleton'),
    nom: (0, sqlite_core_1.text)('nom'),
    prenom: (0, sqlite_core_1.text)('prenom'),
    email: (0, sqlite_core_1.text)('email'),
    telephone: (0, sqlite_core_1.text)('telephone'),
    specialite: (0, sqlite_core_1.text)('specialite'),
    hopital: (0, sqlite_core_1.text)('hopital'),
});
exports.parametres = (0, sqlite_core_1.sqliteTable)('parametres', {
    id: (0, sqlite_core_1.text)('id').primaryKey().default('singleton'),
    langue: (0, sqlite_core_1.text)('langue').notNull().default('fr'),
    voixCoach: (0, sqlite_core_1.text)('voix_coach').notNull().default('fr-FR'),
    vitesseTts: (0, sqlite_core_1.real)('vitesse_tts').notNull().default(1),
    coachVocalEnabled: (0, sqlite_core_1.integer)('coach_vocal_enabled', { mode: 'boolean' }).notNull().default(true),
    seuilCompensation: (0, sqlite_core_1.integer)('seuil_compensation').notNull().default(15),
    frequenceCoach: (0, sqlite_core_1.integer)('frequence_coach').notNull().default(8),
    autoSync: (0, sqlite_core_1.integer)('auto_sync', { mode: 'boolean' }).notNull().default(true),
    nomPatient: (0, sqlite_core_1.text)('nom_patient'),
    zoneReeducation: (0, sqlite_core_1.text)('zone_reeducation').notNull().default('epaule'),
    lastSyncAt: (0, sqlite_core_1.integer)('last_sync_at', { mode: 'timestamp' }),
});
exports.progression = (0, sqlite_core_1.sqliteTable)('progression', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    date: (0, sqlite_core_1.integer)('date', { mode: 'timestamp' }).notNull(),
    bodyPart: (0, sqlite_core_1.text)('body_part').notNull(),
    angleDegrees: (0, sqlite_core_1.real)('angle_degrees').notNull(),
    exerciseId: (0, sqlite_core_1.text)('exercise_id').notNull(),
});
