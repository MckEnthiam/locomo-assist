export type BodyPart = 'epaule' | 'coude' | 'hanche' | 'colonne' | 'genou';

export type ExerciseStatus = 'pending' | 'active' | 'done' | 'skipped';

export type CoachMessageType = 'info' | 'warn' | 'success';

export type CoachProvider = 'gemini' | 'grok' | 'groq';

export interface TargetAngles {
  shoulderLeft?: number;
  shoulderRight?: number;
  elbowLeft?: number;
  spine?: number;
  hip?: number;
  [key: string]: number | undefined;
}

export interface AngleData {
  shoulderLeft: number;
  shoulderRight: number;
  elbowLeft: number;
  spine: number;
  hip: number;
}

export interface CompensationData {
  lumbar: number;
  shoulder: number;
}

export interface SignalPoint {
  timestamp: number;
  shoulderLeft: number;
  spine: number;
}

export interface CoachMessage {
  id: string;
  text: string;
  type: CoachMessageType;
  timestamp: number;
}

export interface ExerciseDTO {
  id: string;
  name: string;
  description: string;
  bodyPart: string;
  sets: number;
  reps: number;
  targetAngles: TargetAngles;
  refVideoUrl: string | null;
  dayOfWeek?: number | null;
  sortOrder?: number;
}

export interface SessionExerciseDTO {
  id: string;
  sessionId: string;
  exerciseId: string;
  status: ExerciseStatus;
  completedAt: string | null;
  setsCompleted: number;
  repsCompleted: number;
  avgAmplitude: number | null;
  peakAmplitude: number | null;
  compensations: CompensationData | null;
  durationSeconds: number | null;
  exercise: ExerciseDTO;
}

export interface SessionDTO {
  id: string;
  startedAt: string;
  endedAt: string | null;
  weekNumber: number;
  dayType: string | null;
  totalDuration: number | null;
  exercises: SessionExerciseDTO[];
}

export interface ReportSummary {
  avgAmplitude: number;
  totalTime: number;
  sessionsCount: number;
  compensations: CompensationData;
  formScore?: number;
}

export interface ReportDTO {
  id: string;
  sessionId: string;
  weekNumber: number;
  generatedAt: string;
  pdfUrl: string;
  summary: ReportSummary;
}

export interface DashboardStats {
  totalSessions: number;
  avgAmplitudeByJoint: Record<string, number>;
  totalDurationSeconds: number;
  formScore: number;
  amplitudeLast7Days: { date: string; epaule: number; coude: number; hanche: number; colonne: number }[];
}

export interface PlanningDay {
  dayOfWeek: number;
  label: string;
  bodyPart: string;
  exercises: ExerciseDTO[];
  estimatedMinutes: number;
}

export interface ProgressionWeekRow {
  weekNumber: number;
  sessionsCount: number;
  avgAmplitude: number;
  totalTimeSeconds: number;
  compensations: CompensationData;
}

export interface ProgressionChartPoint {
  week: string;
  epaule: number;
  coude: number;
  hanche: number;
  colonne: number;
}
