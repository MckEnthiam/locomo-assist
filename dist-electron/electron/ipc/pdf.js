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
exports.registerPdfHandlers = registerPdfHandlers;
const electron_1 = require("electron");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const electron_2 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const crypto_1 = require("crypto");
const schema = __importStar(require("../../drizzle/schema"));
const db_1 = require("../services/db");
const pdf_generator_1 = require("../services/pdf-generator");
const db_helpers_1 = require("../services/db-helpers");
function rapportsDir() {
    return path_1.default.join(electron_2.app.getPath('documents'), 'LocomoAssist', 'rapports');
}
function registerPdfHandlers() {
    electron_1.ipcMain.handle('pdf:generate', async (_, sessionId) => {
        try {
            const db = (0, db_1.getDb)();
            let targetSessionId = sessionId;
            if (!targetSessionId) {
                const [ended] = await db
                    .select()
                    .from(schema.sessions)
                    .where((0, drizzle_orm_1.isNotNull)(schema.sessions.endedAt))
                    .orderBy((0, drizzle_orm_1.desc)(schema.sessions.endedAt))
                    .limit(1);
                if (!ended)
                    throw new Error('Aucune session terminée');
                targetSessionId = ended.id;
            }
            const existing = await db
                .select()
                .from(schema.rapports)
                .where((0, drizzle_orm_1.eq)(schema.rapports.sessionId, targetSessionId));
            if (existing[0]) {
                return { success: true, path: existing[0].pdfPath };
            }
            const [session] = await db
                .select()
                .from(schema.sessions)
                .where((0, drizzle_orm_1.eq)(schema.sessions.id, targetSessionId));
            if (!session)
                throw new Error('Session introuvable');
            const ses = await db
                .select()
                .from(schema.sessionExercises)
                .where((0, drizzle_orm_1.eq)(schema.sessionExercises.sessionId, targetSessionId));
            const [param] = await db
                .select()
                .from(schema.parametres)
                .where((0, drizzle_orm_1.eq)(schema.parametres.id, 'singleton'));
            const [med] = await db
                .select()
                .from(schema.medecin)
                .where((0, drizzle_orm_1.eq)(schema.medecin.id, 'singleton'));
            const coachWarnings = [];
            const exerciseRows = [];
            let targetReps = 0;
            let completedReps = 0;
            const totalComp = { lumbar: 0, shoulder: 0 };
            for (const se of ses) {
                const [ex] = await db
                    .select()
                    .from(schema.exercises)
                    .where((0, drizzle_orm_1.eq)(schema.exercises.id, se.exerciseId));
                if (!ex)
                    continue;
                targetReps += ex.reps * ex.sets;
                completedReps += se.repsCompleted;
                const comp = (0, db_helpers_1.parseJson)(se.compensations, {});
                totalComp.lumbar += comp.lumbar ?? 0;
                totalComp.shoulder += comp.shoulder ?? 0;
                coachWarnings.push(...(0, pdf_generator_1.extractCoachWarnings)(se.coachMessages, ex.name));
                exerciseRows.push({
                    name: ex.name,
                    avgAmplitude: Math.round(se.avgAmplitude ?? 0),
                    peakAmplitude: Math.round(se.peakAmplitude ?? 0),
                    reps: se.repsCompleted,
                    compensations: `Lombaire: ${comp.lumbar ?? 0}, Épaule: ${comp.shoulder ?? 0}`,
                    status: se.status,
                });
            }
            const formScore = targetReps > 0 ? Math.min(100, Math.round((completedReps / targetReps) * 100)) : 0;
            const fileName = `rapport-${targetSessionId}-${Date.now()}.pdf`;
            const pdfPath = path_1.default.join(rapportsDir(), fileName);
            const logoPath = path_1.default.join(electron_2.app.getAppPath(), 'public', 'logo.png');
            const devLogo = path_1.default.join(__dirname, '../../public/logo.png');
            await (0, pdf_generator_1.generatePdfToPath)(pdfPath, {
                weekNumber: session.weekNumber,
                formScore,
                totalDurationSeconds: session.totalDuration ?? 0,
                patientName: param?.nomPatient ?? 'Patient',
                medecinLabel: med
                    ? `${med.prenom ?? ''} ${med.nom ?? ''} — ${med.specialite ?? ''}`.trim()
                    : 'Non renseigné',
                exercises: exerciseRows,
                coachWarnings,
                logoPath: fs_1.default.existsSync(logoPath) ? logoPath : devLogo,
            });
            const ampValues = ses
                .map((row) => row.avgAmplitude)
                .filter((v) => v != null);
            const avgAmplitude = ampValues.length > 0
                ? Math.round(ampValues.reduce((a, b) => a + b, 0) / ampValues.length)
                : 0;
            await db.insert(schema.rapports).values({
                id: (0, crypto_1.randomUUID)(),
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
        }
        catch (e) {
            return {
                success: false,
                path: '',
                error: e instanceof Error ? e.message : 'Erreur PDF',
            };
        }
    });
    electron_1.ipcMain.handle('pdf:open', async (_, filePath) => {
        await electron_1.shell.openPath(filePath);
        return { ok: true };
    });
}
