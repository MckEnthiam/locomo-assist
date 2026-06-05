export interface LocalUser {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string | null;
  birthDate?: string | null;
  condition?: string | null;
  avatar?: string | null;
  createdAt: string;
}

export interface ExerciseItem {
  id: string;
  name: string;
  description: string;
  bodyPart: string;
  sets: number;
  reps: number;
  dayOfWeek: number;
  sortOrder: number;
}

export interface LocalSession {
  id: string;
  startedAt: string;
  endedAt: string;
  totalDurationSeconds: number;
  weekNumber: number;
  dayType: string;
  exerciseName: string;
  bodyPart: string;
  avgAmplitude: number;
  peakAmplitude: number;
  compensations: { lumbar: number; shoulder: number };
  formScore: number;
}

export interface DashboardData {
  totalSessions: number;
  avgAmplitudeByJoint: Record<string, number>;
  totalDurationSeconds: number;
  formScore: number;
  amplitudeLast7Days: Array<{ date: string; epaule: number; coude: number; hanche: number; colonne: number }>;
  todayExercises: Array<{ id: string; name: string; sets: number; reps: number; bodyPart: string }>;
  dayType: string;
}

export interface ProgressionData {
  chartData: Array<{ week: string; epaule: number; coude: number; hanche: number; colonne: number }>;
  weekRows: Array<{ weekNumber: number; sessionsCount: number; avgAmplitude: number; totalTimeSeconds: number; compensations: { lumbar: number; shoulder: number } }>;
}

export interface ReportSummary {
  avgAmplitude: number;
  totalTime: number;
  sessionsCount: number;
  compensations: { lumbar: number; shoulder: number };
  formScore: number;
  exercises: Array<{ name: string; avgAmplitude: number; peakAmplitude: number; reps: number; status: string }>;
}

export interface ReportItem {
  id: string;
  sessionId: string;
  weekNumber: number;
  generatedAt: string;
  pdfUrl: string;
  summary: ReportSummary;
}

const USER_KEY = "locomo-user";
const SESSIONS_KEY = "locomo-sessions";
const REPORTS_KEY = "locomo-reports";
const EXERCISES_KEY = "locomo-exercises";

const DEFAULT_USER: LocalUser = {
  id: "demo-user-001",
  name: "Patient Démo",
  email: "demo@locomo.com",
  role: "PATIENT",
  phone: "+228 90 12 34 56",
  birthDate: "1985-03-15",
  condition: "Rééducation post-AVC épaule gauche - Phase 2",
  avatar: null,
  createdAt: new Date().toISOString(),
};

const DEFAULT_EXERCISES: ExerciseItem[] = [
  {
    id: "fe-1",
    name: "Flexion avant épaule",
    description: "Glissez l'avant-bras vers le haut en gardant le coude contre le corps.",
    bodyPart: "epaule",
    sets: 3,
    reps: 12,
    dayOfWeek: 1,
    sortOrder: 1,
  },
  {
    id: "re-1",
    name: "Rotation externe épaule",
    description: "Pivotez l'avant-bras vers l'extérieur en gardant le coude stable.",
    bodyPart: "epaule",
    sets: 3,
    reps: 15,
    dayOfWeek: 2,
    sortOrder: 1,
  },
  {
    id: "ab-1",
    name: "Abduction latérale",
    description: "Élevez le bras sur le côté jusqu'à hauteur d'épaule.",
    bodyPart: "epaule",
    sets: 3,
    reps: 10,
    dayOfWeek: 3,
    sortOrder: 1,
  },
  {
    id: "pc-1",
    name: "Pendule Codman",
    description: "Penchez-vous en avant, laissez le bras pendre et faites de petits cercles.",
    bodyPart: "epaule",
    sets: 2,
    reps: 20,
    dayOfWeek: 4,
    sortOrder: 1,
  },
  {
    id: "mh-1",
    name: "Mobilisation hanche",
    description: "Allongé sur le côté, effectuez des rotations lentes de hanche.",
    bodyPart: "hanche",
    sets: 3,
    reps: 12,
    dayOfWeek: 5,
    sortOrder: 1,
  },
];

const FALLBACK_DASHBOARD: DashboardData = {
  totalSessions: 5,
  avgAmplitudeByJoint: { epaule: 96, coude: 45, hanche: 38, colonne: 22 },
  totalDurationSeconds: 6000,
  formScore: 35,
  amplitudeLast7Days: [
    { date: "2026-05-30", epaule: 78, coude: 0, hanche: 0, colonne: 0 },
    { date: "2026-05-31", epaule: 82, coude: 0, hanche: 0, colonne: 0 },
    { date: "2026-06-01", epaule: 96, coude: 40, hanche: 30, colonne: 18 },
    { date: "2026-06-02", epaule: 106, coude: 48, hanche: 35, colonne: 22 },
    { date: "2026-06-03", epaule: 90, coude: 45, hanche: 38, colonne: 20 },
    { date: "2026-06-04", epaule: 102, coude: 50, hanche: 42, colonne: 25 },
    { date: "2026-06-05", epaule: 88, coude: 47, hanche: 36, colonne: 21 },
  ],
  todayExercises: [
    { id: "fe-1", name: "Flexion avant épaule", sets: 3, reps: 12, bodyPart: "epaule" },
    { id: "re-1", name: "Rotation externe épaule", sets: 3, reps: 15, bodyPart: "epaule" },
    { id: "mh-1", name: "Mobilisation hanche", sets: 3, reps: 12, bodyPart: "hanche" },
  ],
  dayType: "Épaule et Hanche",
};

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getWeekNumber(d: Date = new Date()): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function loadUser(): LocalUser {
  return safeParse(localStorage.getItem(USER_KEY), DEFAULT_USER);
}

export function saveUser(user: LocalUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function loadExercises(): ExerciseItem[] {
  return safeParse(localStorage.getItem(EXERCISES_KEY), DEFAULT_EXERCISES);
}

export function getTodayExercises(): Array<{ id: string; name: string; sets: number; reps: number; bodyPart: string }> {
  const exercises = loadExercises();
  const jsDay = new Date().getDay();
  const dayOfWeek = jsDay === 0 ? 1 : jsDay;
  return exercises
    .filter((ex) => ex.dayOfWeek === dayOfWeek)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((ex) => ({ id: ex.id, name: ex.name, sets: ex.sets, reps: ex.reps, bodyPart: ex.bodyPart }));
}

export function loadSessions(): LocalSession[] {
  return safeParse(localStorage.getItem(SESSIONS_KEY), [] as LocalSession[]);
}

export function saveSession(session: LocalSession) {
  const sessions = loadSessions();
  const next = [session, ...sessions].slice(0, 50);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
}

export function loadReports(): ReportItem[] {
  return safeParse(localStorage.getItem(REPORTS_KEY), [] as ReportItem[]);
}

export function saveReport(report: ReportItem) {
  const reports = loadReports();
  localStorage.setItem(REPORTS_KEY, JSON.stringify([report, ...reports].slice(0, 30)));
}

export function getDashboardData(): DashboardData {
  const sessions = loadSessions();
  if (!sessions.length) {
    return FALLBACK_DASHBOARD;
  }

  const totalSessions = sessions.length;
  const totalDurationSeconds = sessions.reduce((sum, session) => sum + session.totalDurationSeconds, 0);
  const formScore = Math.round(
    sessions.reduce((sum, session) => sum + session.formScore, 0) / totalSessions
  );

  const jointTotals: Record<string, { sum: number; count: number }> = {
    epaule: { sum: 0, count: 0 },
    coude: { sum: 0, count: 0 },
    hanche: { sum: 0, count: 0 },
    colonne: { sum: 0, count: 0 },
  };
  sessions.forEach((session) => {
    if (session.avgAmplitude > 0) {
      const part = session.bodyPart;
      if (jointTotals[part]) {
        jointTotals[part].sum += session.avgAmplitude;
        jointTotals[part].count += 1;
      }
    }
  });

  const avgAmplitudeByJoint: Record<string, number> = {
    epaule: jointTotals.epaule.count ? Math.round(jointTotals.epaule.sum / jointTotals.epaule.count) : 0,
    coude: jointTotals.coude.count ? Math.round(jointTotals.coude.sum / jointTotals.coude.count) : 0,
    hanche: jointTotals.hanche.count ? Math.round(jointTotals.hanche.sum / jointTotals.hanche.count) : 0,
    colonne: jointTotals.colonne.count ? Math.round(jointTotals.colonne.sum / jointTotals.colonne.count) : 0,
  };

  const todayExercises = getTodayExercises();
  const jsDay = new Date().getDay();
  const dayType = todayExercises[0]?.bodyPart === "epaule" ? "Épaule et Hanche" : "Rééducation";

  const last7days: Record<string, { epaule: number[]; coude: number[]; hanche: number[]; colonne: number[] }> = {};
  for (let i = 6; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    last7days[date.toISOString().slice(0, 10)] = {
      epaule: [],
      coude: [],
      hanche: [],
      colonne: [],
    };
  }

  sessions.forEach((session) => {
    const day = session.endedAt.slice(0, 10);
    const bucket = last7days[day];
    if (!bucket) return;
    if (session.bodyPart === "epaule") bucket.epaule.push(session.avgAmplitude);
    if (session.bodyPart === "coude") bucket.coude.push(session.avgAmplitude);
    if (session.bodyPart === "hanche") bucket.hanche.push(session.avgAmplitude);
    if (session.bodyPart === "colonne") bucket.colonne.push(session.avgAmplitude);
  });

  const amplitudeLast7Days = Object.entries(last7days).map(([date, values]) => ({
    date,
    epaule: values.epaule.length ? Math.round(values.epaule.reduce((sum, v) => sum + v, 0) / values.epaule.length) : 0,
    coude: values.coude.length ? Math.round(values.coude.reduce((sum, v) => sum + v, 0) / values.coude.length) : 0,
    hanche: values.hanche.length ? Math.round(values.hanche.reduce((sum, v) => sum + v, 0) / values.hanche.length) : 0,
    colonne: values.colonne.length ? Math.round(values.colonne.reduce((sum, v) => sum + v, 0) / values.colonne.length) : 0,
  }));

  return {
    totalSessions,
    avgAmplitudeByJoint,
    totalDurationSeconds,
    formScore,
    amplitudeLast7Days,
    todayExercises,
    dayType,
  };
}

export function getProgressionData(): ProgressionData {
  const sessions = loadSessions();
  if (!sessions.length) {
    return {
      chartData: [
        { week: "S20", epaule: 72, coude: 38, hanche: 30, colonne: 15 },
        { week: "S21", epaule: 80, coude: 42, hanche: 33, colonne: 17 },
        { week: "S22", epaule: 88, coude: 45, hanche: 36, colonne: 20 },
        { week: "S23", epaule: 96, coude: 48, hanche: 40, colonne: 22 },
      ],
      weekRows: [
        { weekNumber: 20, sessionsCount: 1, avgAmplitude: 72, totalTimeSeconds: 600, compensations: { lumbar: 2, shoulder: 3 } },
        { weekNumber: 21, sessionsCount: 2, avgAmplitude: 80, totalTimeSeconds: 1200, compensations: { lumbar: 1, shoulder: 2 } },
        { weekNumber: 22, sessionsCount: 3, avgAmplitude: 88, totalTimeSeconds: 1800, compensations: { lumbar: 1, shoulder: 1 } },
        { weekNumber: 23, sessionsCount: 5, avgAmplitude: 96, totalTimeSeconds: 3000, compensations: { lumbar: 0, shoulder: 1 } },
      ],
    };
  }

  const currentWeek = getWeekNumber();
  const weeks = Array.from({ length: 4 }, (_, idx) => currentWeek - 3 + idx);

  const chartData = weeks.map((weekNum) => {
    const weekSessions = sessions.filter((session) => session.weekNumber === weekNum);
    const avg = weekSessions.length
      ? Math.round(weekSessions.reduce((sum, s) => sum + s.avgAmplitude, 0) / weekSessions.length)
      : 0;
    return {
      week: `S${weekNum}`,
      epaule: avg,
      coude: avg,
      hanche: avg,
      colonne: avg,
    };
  });

  const weekRows = weeks.map((weekNum) => {
    const weekSessions = sessions.filter((session) => session.weekNumber === weekNum);
    return {
      weekNumber: weekNum,
      sessionsCount: weekSessions.length,
      avgAmplitude: weekSessions.length
        ? Math.round(weekSessions.reduce((sum, s) => sum + s.avgAmplitude, 0) / weekSessions.length)
        : 0,
      totalTimeSeconds: weekSessions.reduce((sum, s) => sum + s.totalDurationSeconds, 0),
      compensations: {
        lumbar: weekSessions.reduce((sum, s) => sum + s.compensations.lumbar, 0),
        shoulder: weekSessions.reduce((sum, s) => sum + s.compensations.shoulder, 0),
      },
    };
  });

  return { chartData, weekRows };
}

export function getReports(): ReportItem[] {
  const reports = loadReports();
  if (reports.length) return reports;

  return [
    {
      id: "report-1",
      sessionId: "session-1",
      weekNumber: getWeekNumber(new Date(Date.now() - 7 * 86400000)),
      generatedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      pdfUrl: "",
      summary: {
        avgAmplitude: 85,
        totalTime: 900,
        sessionsCount: 1,
        compensations: { lumbar: 1, shoulder: 2 },
        formScore: 82,
        exercises: [
          { name: "Flexion avant épaule", avgAmplitude: 88, peakAmplitude: 105, reps: 36, status: "done" },
          { name: "Rotation externe épaule", avgAmplitude: 82, peakAmplitude: 98, reps: 45, status: "done" },
        ],
      },
    },
    {
      id: "report-2",
      sessionId: "session-2",
      weekNumber: getWeekNumber(new Date()),
      generatedAt: new Date().toISOString(),
      pdfUrl: "",
      summary: {
        avgAmplitude: 92,
        totalTime: 1500,
        sessionsCount: 2,
        compensations: { lumbar: 0, shoulder: 1 },
        formScore: 90,
        exercises: [
          { name: "Flexion avant épaule", avgAmplitude: 95, peakAmplitude: 110, reps: 36, status: "done" },
          { name: "Rotation externe épaule", avgAmplitude: 89, peakAmplitude: 102, reps: 45, status: "done" },
          { name: "Abduction latérale", avgAmplitude: 92, peakAmplitude: 108, reps: 30, status: "done" },
        ],
      },
    },
  ];
}

export function generateReportFromLatestSession() {
  const sessions = loadSessions();
  const latest = sessions[0];
  if (!latest) {
    return null;
  }

  const report: ReportItem = {
    id: createId("report"),
    sessionId: latest.id,
    weekNumber: latest.weekNumber,
    generatedAt: new Date().toISOString(),
    pdfUrl: "",
    summary: {
      avgAmplitude: latest.avgAmplitude,
      totalTime: latest.totalDurationSeconds,
      sessionsCount: 1,
      compensations: latest.compensations,
      formScore: latest.formScore,
      exercises: [
        {
          name: latest.exerciseName,
          avgAmplitude: latest.avgAmplitude,
          peakAmplitude: latest.peakAmplitude,
          reps: latest.formScore > 0 ? latest.formScore : 0,
          status: "done",
        },
      ],
    },
  };

  saveReport(report);
  return report;
}

export function createSessionRecord(params: {
  exerciseName: string;
  bodyPart: string;
  totalDurationSeconds: number;
  avgAmplitude: number;
  peakAmplitude: number;
  compensations: { lumbar: number; shoulder: number };
  formScore: number;
}): LocalSession {
  const now = new Date();
  return {
    id: createId("session"),
    startedAt: now.toISOString(),
    endedAt: now.toISOString(),
    totalDurationSeconds: params.totalDurationSeconds,
    weekNumber: getWeekNumber(now),
    dayType: `${params.bodyPart} session`,
    exerciseName: params.exerciseName,
    bodyPart: params.bodyPart,
    avgAmplitude: params.avgAmplitude,
    peakAmplitude: params.peakAmplitude,
    compensations: params.compensations,
    formScore: params.formScore,
  };
}
