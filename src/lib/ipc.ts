import type {
  ExerciseDTO,
  MedecinDTO,
  ParametresDTO,
  ProgressionChartPoint,
  ProgressionWeekRow,
  ReportDTO,
  SessionDTO,
  SyncResult,
} from '@/types';

function api() {
  if (!window.electronAPI) {
    throw new Error('API Electron indisponible');
  }
  return window.electronAPI;
}

export async function getExercises(dayOfWeek?: number): Promise<ExerciseDTO[]> {
  return api().db.getExercises(dayOfWeek);
}

export async function getActiveSession(): Promise<SessionDTO | null> {
  return api().db.getActiveSession();
}

export async function createSession(data: {
  dayOfWeek?: number;
  exerciseIds?: string[];
}): Promise<SessionDTO> {
  return api().db.createSession(data);
}

export async function updateSessionExercise(
  id: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await api().db.updateSessionExercise(id, payload);
}

export async function endSession(
  sessionId: string,
  totalDuration: number,
): Promise<SessionDTO> {
  return api().db.endSession(sessionId, { totalDuration });
}

export async function getDashboardStats(): Promise<{
  totalSessions: number;
  avgAmplitudeByJoint: Record<string, number>;
  totalDurationSeconds: number;
  formScore: number;
  amplitudeLast7Days: {
    date: string;
    epaule: number;
    coude: number;
    hanche: number;
    colonne: number;
  }[];
  todaySession: SessionDTO | null;
  activeSession: SessionDTO | null;
  todayExercises: ExerciseDTO[];
  dayType: string;
}> {
  return api().db.getStats() as ReturnType<typeof getDashboardStats> extends Promise<infer T>
    ? T
    : never;
}

export async function getProgression(days = 28): Promise<{
  chartData: ProgressionChartPoint[];
  weekRows: ProgressionWeekRow[];
}> {
  return api().db.getProgression(days);
}

export async function getRapports(): Promise<ReportDTO[]> {
  return api().db.getRapports();
}

export async function generatePdf(sessionId?: string) {
  return api().pdf.generate(sessionId);
}

export async function openPdf(filePath: string) {
  return api().pdf.open(filePath);
}

export async function getMedecin(): Promise<MedecinDTO | null> {
  return api().db.getMedecin();
}

export async function saveMedecin(data: Record<string, string | undefined>) {
  return api().db.saveMedecin(data);
}

export async function getParametres(): Promise<ParametresDTO | null> {
  return api().db.getParametres();
}

export async function saveParametres(data: Record<string, unknown>) {
  return api().db.saveParametres(data);
}

export async function pushSync(): Promise<SyncResult> {
  return api().sync.push();
}

export async function getSyncStatus() {
  return api().sync.getStatus();
}

export async function getResourcePath(filename: string): Promise<string> {
  return api().system.getResourcePath(filename);
}
