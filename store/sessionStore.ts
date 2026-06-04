'use client';

import { create } from 'zustand';
import type {
  AngleData,
  CoachMessage,
  CompensationData,
  ExerciseDTO,
  SignalPoint,
} from '@/types';

export type ExerciseLiveStatus = 'idle' | 'active' | 'done';

interface SessionState {
  sessionId: string | null;
  currentExercise: ExerciseDTO | null;
  exerciseQueue: ExerciseDTO[];
  exerciseStatus: ExerciseLiveStatus;
  angles: AngleData;
  signalHistory: SignalPoint[];
  compensations: CompensationData;
  coachMessages: CoachMessage[];
  sessionTimer: number;
  isRecording: boolean;
  lumbarAlertActive: boolean;
  lumbarOverTargetSince: number | null;

  startSession: (sessionId: string, exercises: ExerciseDTO[], current: ExerciseDTO) => void;
  updateAngles: (angles: Partial<AngleData>) => void;
  appendSignal: (point: SignalPoint) => void;
  addCompensation: (type: 'lumbar' | 'shoulder') => void;
  addCoachMessage: (msg: CoachMessage) => void;
  setLumbarAlert: (active: boolean) => void;
  setLumbarOverTargetSince: (ts: number | null) => void;
  tickTimer: () => void;
  setRecording: (v: boolean) => void;
  nextExercise: (exercise: ExerciseDTO) => void;
  endSession: () => void;
  reset: () => void;
}

const defaultAngles: AngleData = {
  shoulderLeft: 0,
  shoulderRight: 0,
  elbowLeft: 0,
  spine: 0,
  hip: 0,
};

const initialState = {
  sessionId: null,
  currentExercise: null,
  exerciseQueue: [] as ExerciseDTO[],
  exerciseStatus: 'idle' as ExerciseLiveStatus,
  angles: defaultAngles,
  signalHistory: [] as SignalPoint[],
  compensations: { lumbar: 0, shoulder: 0 },
  coachMessages: [] as CoachMessage[],
  sessionTimer: 0,
  isRecording: false,
  lumbarAlertActive: false,
  lumbarOverTargetSince: null,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,

  startSession: (sessionId, exercises, current) =>
    set({
      sessionId,
      exerciseQueue: exercises,
      currentExercise: current,
      exerciseStatus: 'active',
      isRecording: true,
      sessionTimer: 0,
      angles: defaultAngles,
      signalHistory: [],
      compensations: { lumbar: 0, shoulder: 0 },
      coachMessages: [],
      lumbarAlertActive: false,
      lumbarOverTargetSince: null,
    }),

  updateAngles: (angles) =>
    set((s) => ({ angles: { ...s.angles, ...angles } })),

  appendSignal: (point) =>
    set((s) => {
      const merged = [...s.signalHistory, point].slice(-120);
      return { signalHistory: merged };
    }),

  addCompensation: (type) =>
    set((s) => ({
      compensations: {
        ...s.compensations,
        [type]: s.compensations[type] + 1,
      },
    })),

  addCoachMessage: (msg) =>
    set((s) => ({
      coachMessages: [...s.coachMessages, msg].slice(-20),
    })),

  setLumbarAlert: (active) => set({ lumbarAlertActive: active }),
  setLumbarOverTargetSince: (ts) => set({ lumbarOverTargetSince: ts }),
  tickTimer: () => set((s) => ({ sessionTimer: s.sessionTimer + 1 })),
  setRecording: (v) => set({ isRecording: v }),

  nextExercise: (exercise) =>
    set({
      currentExercise: exercise,
      exerciseStatus: 'active',
      signalHistory: [],
      lumbarAlertActive: false,
      lumbarOverTargetSince: null,
    }),

  endSession: () =>
    set({
      exerciseStatus: 'done',
      isRecording: false,
    }),

  reset: () => set(initialState),
}));
