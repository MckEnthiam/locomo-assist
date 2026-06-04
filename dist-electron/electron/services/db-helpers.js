"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DAY_BODY_PARTS = void 0;
exports.parseJson = parseJson;
exports.mapExercise = mapExercise;
exports.mapSessionExercise = mapSessionExercise;
exports.mapSession = mapSession;
exports.mapReport = mapReport;
exports.getWeekNumber = getWeekNumber;
function parseJson(raw, fallback) {
    if (!raw)
        return fallback;
    try {
        return JSON.parse(raw);
    }
    catch {
        return fallback;
    }
}
function mapExercise(row) {
    return {
        id: row.id,
        name: row.name,
        description: row.description,
        bodyPart: row.bodyPart,
        sets: row.sets,
        reps: row.reps,
        targetAngles: parseJson(row.targetAngles, {}),
        refVideoPath: row.refVideoPath,
        refVideoUrl: null,
        dayOfWeek: row.dayOfWeek,
        sortOrder: row.sortOrder,
    };
}
function mapSessionExercise(se, exercise) {
    return {
        id: se.id,
        sessionId: se.sessionId,
        exerciseId: se.exerciseId,
        status: se.status,
        completedAt: se.completedAt ? se.completedAt.toISOString() : null,
        setsCompleted: se.setsCompleted,
        repsCompleted: se.repsCompleted,
        avgAmplitude: se.avgAmplitude,
        peakAmplitude: se.peakAmplitude,
        compensations: parseJson(se.compensations, null),
        durationSeconds: se.durationSeconds,
        exercise,
    };
}
function mapSession(session, exercises) {
    return {
        id: session.id,
        startedAt: session.startedAt.toISOString(),
        endedAt: session.endedAt ? session.endedAt.toISOString() : null,
        weekNumber: session.weekNumber,
        dayType: session.dayType,
        totalDuration: session.totalDuration,
        exercises,
    };
}
function mapReport(row) {
    const summary = parseJson(row.summary, {
        avgAmplitude: 0,
        totalTime: 0,
        sessionsCount: 1,
        compensations: { lumbar: 0, shoulder: 0 },
    });
    return {
        id: row.id,
        sessionId: row.sessionId,
        weekNumber: row.weekNumber,
        generatedAt: row.generatedAt.toISOString(),
        pdfPath: row.pdfPath,
        pdfUrl: row.supabaseUrl ?? `file://${row.pdfPath}`,
        summary,
    };
}
function getWeekNumber(date = new Date()) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
exports.DAY_BODY_PARTS = {
    1: 'Épaule — flexion',
    2: 'Épaule — rotation',
    3: 'Épaule — abduction',
    4: 'Épaule — pendule',
    5: 'Hanche — mobilisation',
};
