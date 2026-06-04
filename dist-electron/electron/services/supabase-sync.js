"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pushToSupabase = pushToSupabase;
exports.getSyncStatus = getSyncStatus;
const supabase_js_1 = require("@supabase/supabase-js");
const drizzle_orm_1 = require("drizzle-orm");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const schema = __importStar(require("../../drizzle/schema"));
async function pushToSupabase(db) {
    const url = process.env.VITE_SUPABASE_URL ?? process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const errors = [];
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
    const supabase = (0, supabase_js_1.createClient)(url, serviceKey);
    const unsynced = await db
        .select()
        .from(schema.sessions)
        .where((0, drizzle_orm_1.isNull)(schema.sessions.syncedAt));
    for (const session of unsynced) {
        try {
            const ses = await db
                .select()
                .from(schema.sessionExercises)
                .where((0, drizzle_orm_1.eq)(schema.sessionExercises.sessionId, session.id));
            const { error: sessionError } = await supabase.from('sessions').upsert({
                id: session.id,
                started_at: session.startedAt.toISOString(),
                ended_at: session.endedAt?.toISOString() ?? null,
                week_number: session.weekNumber,
                total_duration: session.totalDuration,
            });
            if (sessionError)
                throw sessionError;
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
                if (seError)
                    throw seError;
            }
            const [report] = await db
                .select()
                .from(schema.rapports)
                .where((0, drizzle_orm_1.eq)(schema.rapports.sessionId, session.id));
            if (report && fs_1.default.existsSync(report.pdfPath)) {
                const fileName = path_1.default.basename(report.pdfPath);
                const buffer = fs_1.default.readFileSync(report.pdfPath);
                const { error: uploadError } = await supabase.storage
                    .from('rapports')
                    .upload(fileName, buffer, { contentType: 'application/pdf', upsert: true });
                if (uploadError)
                    throw uploadError;
                const { data: publicUrl } = supabase.storage.from('rapports').getPublicUrl(fileName);
                await db
                    .update(schema.rapports)
                    .set({ supabaseUrl: publicUrl.publicUrl })
                    .where((0, drizzle_orm_1.eq)(schema.rapports.id, report.id));
            }
            await db
                .update(schema.sessions)
                .set({ syncedAt: new Date() })
                .where((0, drizzle_orm_1.eq)(schema.sessions.id, session.id));
            success++;
        }
        catch (e) {
            failed++;
            errors.push(e instanceof Error ? e.message : 'Erreur sync');
        }
    }
    const now = new Date();
    await db
        .update(schema.parametres)
        .set({ lastSyncAt: now })
        .where((0, drizzle_orm_1.eq)(schema.parametres.id, 'singleton'));
    const [param] = await db
        .select()
        .from(schema.parametres)
        .where((0, drizzle_orm_1.eq)(schema.parametres.id, 'singleton'));
    return {
        success,
        failed,
        errors,
        lastSyncAt: param?.lastSyncAt?.toISOString() ?? now.toISOString(),
    };
}
async function getSyncStatus(db) {
    const [param] = await db
        .select()
        .from(schema.parametres)
        .where((0, drizzle_orm_1.eq)(schema.parametres.id, 'singleton'));
    const pending = await db
        .select()
        .from(schema.sessions)
        .where((0, drizzle_orm_1.isNull)(schema.sessions.syncedAt));
    return {
        lastSyncAt: param?.lastSyncAt?.toISOString() ?? null,
        pendingCount: pending.length,
    };
}
