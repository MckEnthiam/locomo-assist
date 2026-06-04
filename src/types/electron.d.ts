import type {
  ExerciseDTO,
  MedecinDTO,
  ParametresDTO,
  ReportDTO,
  SessionDTO,
  SyncResult,
} from './index';

export interface ElectronAPI {
  db: {
    getExercises: (dayOfWeek?: number) => Promise<ExerciseDTO[]>;
    getSessions: () => Promise<SessionDTO[]>;
    getActiveSession: () => Promise<SessionDTO | null>;
    createSession: (data: {
      dayOfWeek?: number;
      exerciseIds?: string[];
    }) => Promise<SessionDTO>;
    updateSessionExercise: (id: string, data: Record<string, unknown>) => Promise<{ ok: boolean }>;
    endSession: (id: string, data: { totalDuration?: number }) => Promise<SessionDTO>;
    getProgression: (days?: number) => Promise<{
      chartData: import('./index').ProgressionChartPoint[];
      weekRows: import('./index').ProgressionWeekRow[];
    }>;
    getRapports: () => Promise<ReportDTO[]>;
    getStats: () => Promise<Record<string, unknown>>;
    getMedecin: () => Promise<MedecinDTO | null>;
    saveMedecin: (data: Record<string, string | undefined>) => Promise<{ ok: boolean }>;
    getParametres: () => Promise<ParametresDTO | null>;
    saveParametres: (data: Record<string, unknown>) => Promise<{ ok: boolean }>;
  };
  pdf: {
    generate: (sessionId?: string) => Promise<{ success: boolean; path: string; error?: string }>;
    open: (filePath: string) => Promise<{ ok: boolean }>;
  };
  sync: {
    push: () => Promise<SyncResult>;
    getStatus: () => Promise<{ lastSyncAt: string | null; pendingCount: number }>;
  };
  system: {
    getResourcePath: (filename: string) => Promise<string>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
