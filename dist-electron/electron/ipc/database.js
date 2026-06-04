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
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDatabaseHandlers = registerDatabaseHandlers;
const electron_1 = require("electron");
const drizzle_orm_1 = require("drizzle-orm");
const crypto_1 = require("crypto");
const schema = __importStar(require("../../drizzle/schema"));
const db_1 = require("../services/db");
const db_helpers_1 = require("../services/db-helpers");
function startOfDay(d) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
}
function endOfDay(d) {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
}
function registerDatabaseHandlers() {
    const db = () => (0, db_1.getDb)();
    electron_1.ipcMain.handle('db:getExercises', async (_, dayOfWeek) => {
        const rows = dayOfWeek
            ? await db()
                .select()
                .from(schema.exercises)
                .where((0, drizzle_orm_1.eq)(schema.exercises.dayOfWeek, dayOfWeek))
                .orderBy(schema.exercises.sortOrder)
            : await db().select().from(schema.exercises).orderBy(schema.exercises.dayOfWeek);
        return rows.map(db_helpers_1.mapExercise);
    });
    electron_1.ipcMain.handle('db:getSessions', async () => {
        const sessions = await db()
            .select()
            .from(schema.sessions)
            .orderBy((0, drizzle_orm_1.desc)(schema.sessions.startedAt))
            .limit(20);
        const result = [];
        for (const s of sessions) {
            const ses = await db()
                .select()
                .from(schema.sessionExercises)
                .where((0, drizzle_orm_1.eq)(schema.sessionExercises.sessionId, s.id));
            const exercises = [];
            for (const se of ses) {
                const [ex] = await db()
                    .select()
                    .from(schema.exercises)
                    .where((0, drizzle_orm_1.eq)(schema.exercises.id, se.exerciseId));
                if (ex)
                    exercises.push((0, db_helpers_1.mapSessionExercise)(se, (0, db_helpers_1.mapExercise)(ex)));
            }
            result.push((0, db_helpers_1.mapSession)(s, exercises));
        }
        return result;
    });
    electron_1.ipcMain.handle('db:createSession', async (_, data) => {
        const now = new Date();
        const jsDay = now.getDay();
        const dayOfWeek = data.dayOfWeek ?? (jsDay === 0 ? 1 : jsDay);
        let exerciseRows;
        if (data.exerciseIds?.length) {
            exerciseRows = await db()
                .select()
                .from(schema.exercises)
                .where((0, drizzle_orm_1.inArray)(schema.exercises.id, data.exerciseIds));
        }
        else {
            exerciseRows = await db()
                .select()
                .from(schema.exercises)
                .where((0, drizzle_orm_1.eq)(schema.exercises.dayOfWeek, dayOfWeek))
                .orderBy(schema.exercises.sortOrder);
        }
        if (exerciseRows.length === 0)
            throw new Error('Aucun exercice pour cette session');
        const sessionId = (0, crypto_1.randomUUID)();
        await db().insert(schema.sessions).values({
            id: sessionId,
            startedAt: now,
            weekNumber: (0, db_helpers_1.getWeekNumber)(now),
            dayType: db_helpers_1.DAY_BODY_PARTS[dayOfWeek] ?? `Jour ${dayOfWeek}`,
        });
        for (let i = 0; i < exerciseRows.length; i++) {
            await db().insert(schema.sessionExercises).values({
                id: (0, crypto_1.randomUUID)(),
                sessionId,
                exerciseId: exerciseRows[i].id,
                status: i === 0 ? 'active' : 'pending',
            });
        }
        const ses = await db()
            .select()
            .from(schema.sessionExercises)
            .where((0, drizzle_orm_1.eq)(schema.sessionExercises.sessionId, sessionId));
        const exercises = [];
        for (const se of ses) {
            const ex = exerciseRows.find((e) => e.id === se.exerciseId);
            exercises.push((0, db_helpers_1.mapSessionExercise)(se, (0, db_helpers_1.mapExercise)(ex)));
        }
        const [session] = await db()
            .select()
            .from(schema.sessions)
            .where((0, drizzle_orm_1.eq)(schema.sessions.id, sessionId));
        return (0, db_helpers_1.mapSession)(session, exercises);
    });
    electron_1.ipcMain.handle('db:updateSessionExercise', async (_, id, payload) => {
        await db()
            .update(schema.sessionExercises)
            .set({
            status: payload.status,
            completedAt: payload.completedAt ? new Date(payload.completedAt) : new Date(),
            setsCompleted: payload.setsCompleted,
            repsCompleted: payload.repsCompleted,
            avgAmplitude: payload.avgAmplitude,
            peakAmplitude: payload.peakAmplitude,
            compensations: payload.compensations
                ? JSON.stringify(payload.compensations)
                : undefined,
            signalData: payload.signalData ? JSON.stringify(payload.signalData) : undefined,
            coachMessages: payload.coachMessages
                ? JSON.stringify(payload.coachMessages)
                : undefined,
            durationSeconds: payload.durationSeconds,
        })
            .where((0, drizzle_orm_1.eq)(schema.sessionExercises.id, id));
        if (payload.avgAmplitude != null) {
            const [se] = await db()
                .select()
                .from(schema.sessionExercises)
                .where((0, drizzle_orm_1.eq)(schema.sessionExercises.id, id));
            if (se) {
                const [ex] = await db()
                    .select()
                    .from(schema.exercises)
                    .where((0, drizzle_orm_1.eq)(schema.exercises.id, se.exerciseId));
                if (ex) {
                    await db().insert(schema.progression).values({
                        id: (0, crypto_1.randomUUID)(),
                        date: new Date(),
                        bodyPart: ex.bodyPart,
                        angleDegrees: payload.avgAmplitude,
                        exerciseId: ex.id,
                    });
                }
            }
        }
        return { ok: true };
    });
    electron_1.ipcMain.handle('db:endSession', async (_, sessionId, payload) => {
        const [session] = await db()
            .select()
            .from(schema.sessions)
            .where((0, drizzle_orm_1.eq)(schema.sessions.id, sessionId));
        if (!session)
            throw new Error('Session introuvable');
        const duration = payload.totalDuration ??
            Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
        await db()
            .update(schema.sessions)
            .set({ endedAt: new Date(), totalDuration: duration })
            .where((0, drizzle_orm_1.eq)(schema.sessions.id, sessionId));
        const [updated] = await db()
            .select()
            .from(schema.sessions)
            .where((0, drizzle_orm_1.eq)(schema.sessions.id, sessionId));
        const ses = await db()
            .select()
            .from(schema.sessionExercises)
            .where((0, drizzle_orm_1.eq)(schema.sessionExercises.sessionId, sessionId));
        const exercises = [];
        for (const se of ses) {
            const [ex] = await db()
                .select()
                .from(schema.exercises)
                .where((0, drizzle_orm_1.eq)(schema.exercises.id, se.exerciseId));
            if (ex)
                exercises.push((0, db_helpers_1.mapSessionExercise)(se, (0, db_helpers_1.mapExercise)(ex)));
        }
        return (0, db_helpers_1.mapSession)(updated, exercises);
    });
    electron_1.ipcMain.handle('db:getActiveSession', async () => {
        const [active] = await db()
            .select()
            .from(schema.sessions)
            .where((0, drizzle_orm_1.isNull)(schema.sessions.endedAt))
            .orderBy((0, drizzle_orm_1.desc)(schema.sessions.startedAt))
            .limit(1);
        if (!active)
            return null;
        const ses = await db()
            .select()
            .from(schema.sessionExercises)
            .where((0, drizzle_orm_1.eq)(schema.sessionExercises.sessionId, active.id));
        const exercises = [];
        for (const se of ses) {
            const [ex] = await db()
                .select()
                .from(schema.exercises)
                .where((0, drizzle_orm_1.eq)(schema.exercises.id, se.exerciseId));
            if (ex)
                exercises.push((0, db_helpers_1.mapSessionExercise)(se, (0, db_helpers_1.mapExercise)(ex)));
        }
        return (0, db_helpers_1.mapSession)(active, exercises);
    });
    electron_1.ipcMain.handle('db:getStats', async () => {
        const now = new Date();
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const allSessions = await db().select().from(schema.sessions);
        const completedSessions = allSessions.filter((s) => s.endedAt != null).length;
        const totalDurationSeconds = allSessions
            .filter((s) => s.endedAt != null)
            .reduce((sum, s) => sum + (s.totalDuration ?? 0), 0);
        const doneExercises = await db()
            .select()
            .from(schema.sessionExercises)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema.sessionExercises.status, 'done'), (0, drizzle_orm_1.gte)(schema.sessionExercises.completedAt, sevenDaysAgo)));
        const jointSums = {
            epaule: { sum: 0, count: 0 },
            coude: { sum: 0, count: 0 },
            hanche: { sum: 0, count: 0 },
            colonne: { sum: 0, count: 0 },
        };
        for (const se of doneExercises) {
            const [ex] = await db()
                .select()
                .from(schema.exercises)
                .where((0, drizzle_orm_1.eq)(schema.exercises.id, se.exerciseId));
            if (ex && se.avgAmplitude != null && jointSums[ex.bodyPart]) {
                jointSums[ex.bodyPart].sum += se.avgAmplitude;
                jointSums[ex.bodyPart].count += 1;
            }
        }
        const avgAmplitudeByJoint = {};
        Object.entries(jointSums).forEach(([k, v]) => {
            avgAmplitudeByJoint[k] = v.count > 0 ? Math.round(v.sum / v.count) : 0;
        });
        const amplitudeByDay = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            amplitudeByDay[d.toISOString().slice(0, 10)] = {
                epaule: [],
                coude: [],
                hanche: [],
                colonne: [],
            };
        }
        for (const se of doneExercises) {
            if (!se.completedAt || se.avgAmplitude == null)
                continue;
            const key = se.completedAt.toISOString().slice(0, 10);
            const bucket = amplitudeByDay[key];
            if (!bucket)
                continue;
            const [ex] = await db()
                .select()
                .from(schema.exercises)
                .where((0, drizzle_orm_1.eq)(schema.exercises.id, se.exerciseId));
            if (!ex)
                continue;
            const part = ex.bodyPart;
            if (Array.isArray(bucket[part]))
                bucket[part].push(se.avgAmplitude);
        }
        const amplitudeLast7Days = Object.entries(amplitudeByDay).map(([date, vals]) => ({
            date,
            epaule: vals.epaule.length
                ? Math.round(vals.epaule.reduce((a, b) => a + b, 0) / vals.epaule.length)
                : 0,
            coude: vals.coude.length
                ? Math.round(vals.coude.reduce((a, b) => a + b, 0) / vals.coude.length)
                : 0,
            hanche: vals.hanche.length
                ? Math.round(vals.hanche.reduce((a, b) => a + b, 0) / vals.hanche.length)
                : 0,
            colonne: vals.colonne.length
                ? Math.round(vals.colonne.reduce((a, b) => a + b, 0) / vals.colonne.length)
                : 0,
        }));
        const ended = allSessions
            .filter((s) => s.endedAt != null)
            .sort((a, b) => (b.endedAt.getTime() > a.endedAt.getTime() ? 1 : -1))
            .slice(0, 3);
        let targetReps = 0;
        let completedReps = 0;
        for (const s of ended) {
            const ses = await db()
                .select()
                .from(schema.sessionExercises)
                .where((0, drizzle_orm_1.eq)(schema.sessionExercises.sessionId, s.id));
            for (const se of ses) {
                const [ex] = await db()
                    .select()
                    .from(schema.exercises)
                    .where((0, drizzle_orm_1.eq)(schema.exercises.id, se.exerciseId));
                if (ex) {
                    targetReps += ex.reps * ex.sets;
                    completedReps += se.repsCompleted;
                }
            }
        }
        const formScore = targetReps > 0 ? Math.min(100, Math.round((completedReps / targetReps) * 100)) : 0;
        const todayStart = startOfDay(now);
        const todayEnd = endOfDay(now);
        const todaySessions = allSessions.filter((s) => s.startedAt >= todayStart && s.startedAt <= todayEnd);
        const todaySession = todaySessions.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0];
        const [active] = await db()
            .select()
            .from(schema.sessions)
            .where((0, drizzle_orm_1.isNull)(schema.sessions.endedAt))
            .orderBy((0, drizzle_orm_1.desc)(schema.sessions.startedAt))
            .limit(1);
        const jsDay = now.getDay();
        const dayOfWeek = jsDay === 0 ? 1 : jsDay;
        const todayExercises = await db()
            .select()
            .from(schema.exercises)
            .where((0, drizzle_orm_1.eq)(schema.exercises.dayOfWeek, dayOfWeek))
            .orderBy(schema.exercises.sortOrder);
        async function sessionWithExercises(s) {
            if (!s)
                return null;
            const ses = await db()
                .select()
                .from(schema.sessionExercises)
                .where((0, drizzle_orm_1.eq)(schema.sessionExercises.sessionId, s.id));
            const exercises = [];
            for (const se of ses) {
                const [ex] = await db()
                    .select()
                    .from(schema.exercises)
                    .where((0, drizzle_orm_1.eq)(schema.exercises.id, se.exerciseId));
                if (ex)
                    exercises.push((0, db_helpers_1.mapSessionExercise)(se, (0, db_helpers_1.mapExercise)(ex)));
            }
            return (0, db_helpers_1.mapSession)(s, exercises);
        }
        return {
            totalSessions: completedSessions,
            avgAmplitudeByJoint,
            totalDurationSeconds,
            formScore,
            amplitudeLast7Days,
            todaySession: await sessionWithExercises(todaySession ?? null),
            activeSession: await sessionWithExercises(active ?? null),
            todayExercises: todayExercises.map(db_helpers_1.mapExercise),
            dayType: db_helpers_1.DAY_BODY_PARTS[dayOfWeek] ?? 'Session du jour',
        };
    });
    electron_1.ipcMain.handle('db:getProgression', async (_, days = 28) => {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const progressions = await db()
            .select()
            .from(schema.progression)
            .where((0, drizzle_orm_1.gte)(schema.progression.date, since));
        const sessions = await db()
            .select()
            .from(schema.sessions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.isNotNull)(schema.sessions.endedAt), (0, drizzle_orm_1.gte)(schema.sessions.endedAt, since)));
        const currentWeek = (0, db_helpers_1.getWeekNumber)();
        const chartData = [];
        for (let w = 3; w >= 0; w--) {
            const weekNum = currentWeek - w;
            const weekProgressions = progressions.filter((p) => (0, db_helpers_1.getWeekNumber)(p.date) === weekNum);
            const avg = (part) => {
                const filtered = weekProgressions.filter((p) => p.bodyPart === part);
                if (!filtered.length)
                    return 0;
                return Math.round(filtered.reduce((s, p) => s + p.angleDegrees, 0) / filtered.length);
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
            const comp = { lumbar: 0, shoulder: 0 };
            for (const s of weekSessions) {
                timeSum += s.totalDuration ?? 0;
                const ses = await db()
                    .select()
                    .from(schema.sessionExercises)
                    .where((0, drizzle_orm_1.eq)(schema.sessionExercises.sessionId, s.id));
                for (const se of ses) {
                    if (se.avgAmplitude != null) {
                        ampSum += se.avgAmplitude;
                        ampCount++;
                    }
                    const c = (0, db_helpers_1.parseJson)(se.compensations, {});
                    comp.lumbar += c.lumbar ?? 0;
                    comp.shoulder += c.shoulder ?? 0;
                }
            }
            weekRows.push({
                weekNumber: weekNum,
                sessionsCount: weekSessions.length,
                avgAmplitude: ampCount > 0 ? Math.round(ampSum / ampCount) : 0,
                totalTimeSeconds: timeSum,
                compensations: comp,
            });
        }
        return { chartData, weekRows };
    });
    electron_1.ipcMain.handle('db:getRapports', async () => {
        const rows = await db()
            .select()
            .from(schema.rapports)
            .orderBy((0, drizzle_orm_1.desc)(schema.rapports.generatedAt));
        return rows.map(db_helpers_1.mapReport);
    });
    electron_1.ipcMain.handle('db:getMedecin', async () => {
        const [row] = await db()
            .select()
            .from(schema.medecin)
            .where((0, drizzle_orm_1.eq)(schema.medecin.id, 'singleton'));
        return row ?? null;
    });
    electron_1.ipcMain.handle('db:saveMedecin', async (_, data) => {
        const existing = await db()
            .select()
            .from(schema.medecin)
            .where((0, drizzle_orm_1.eq)(schema.medecin.id, 'singleton'));
        if (existing.length === 0) {
            await db().insert(schema.medecin).values({ id: 'singleton', ...data });
        }
        else {
            await db()
                .update(schema.medecin)
                .set(data)
                .where((0, drizzle_orm_1.eq)(schema.medecin.id, 'singleton'));
        }
        return { ok: true };
    });
    electron_1.ipcMain.handle('db:getParametres', async () => {
        const [row] = await db()
            .select()
            .from(schema.parametres)
            .where((0, drizzle_orm_1.eq)(schema.parametres.id, 'singleton'));
        return row ?? null;
    });
    electron_1.ipcMain.handle('db:saveParametres', async (_, data) => {
        const existing = await db()
            .select()
            .from(schema.parametres)
            .where((0, drizzle_orm_1.eq)(schema.parametres.id, 'singleton'));
        if (existing.length === 0) {
            await db().insert(schema.parametres).values({ id: 'singleton', ...data });
        }
        else {
            await db()
                .update(schema.parametres)
                .set(data)
                .where((0, drizzle_orm_1.eq)(schema.parametres.id, 'singleton'));
        }
        return { ok: true };
    });
}
