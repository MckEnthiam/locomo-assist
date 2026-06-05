"use client";

import { create } from "zustand";

export interface SignalPoint {
  timestamp: number;
  shoulderLeft: number;
  spine: number;
}

export interface CoachMessage {
  id: string;
  text: string;
  type: "info" | "warn" | "success";
  timestamp: number;
}

interface SessionState {
  sessionId: string | null;
  isLive: boolean;
  angles: Record<string, number>;
  signalHistory: SignalPoint[];
  compensations: { lumbar: number; shoulder: number };
  coachMessages: CoachMessage[];
  timer: number;
  lumbarAlert: boolean;
  currentStep: number;
  exerciseCount: number;

  startLive: (exerciseCount: number) => void;
  stopLive: () => void;
  updateAngles: (angles: Record<string, number>) => void;
  addSignalPoint: (point: SignalPoint) => void;
  addCompensation: (type: "lumbar" | "shoulder") => void;
  addCoachMessage: (msg: CoachMessage) => void;
  tick: () => void;
  setLumbarAlert: (v: boolean) => void;
  nextStep: () => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessionId: null,
  isLive: false,
  angles: { shoulderLeft: 0, shoulderRight: 0, elbowLeft: 0, spine: 0, hip: 0 },
  signalHistory: [],
  compensations: { lumbar: 0, shoulder: 0 },
  coachMessages: [],
  timer: 0,
  lumbarAlert: false,
  currentStep: 0,
  exerciseCount: 5,

  startLive: (exerciseCount) =>
    set({
      isLive: true,
      sessionId: `demo-${Date.now()}`,
      timer: 0,
      angles: { shoulderLeft: 0, shoulderRight: 0, elbowLeft: 0, spine: 0, hip: 0 },
      signalHistory: [],
      compensations: { lumbar: 0, shoulder: 0 },
      coachMessages: [],
      lumbarAlert: false,
      currentStep: 0,
      exerciseCount,
    }),

  stopLive: () =>
    set({
      isLive: false,
      timer: 0,
      signalHistory: [],
      coachMessages: [],
      lumbarAlert: false,
    }),

  updateAngles: (angles) =>
    set((s) => ({ angles: { ...s.angles, ...angles } })),

  addSignalPoint: (point) =>
    set((s) => ({
      signalHistory: [...s.signalHistory, point].slice(-120),
    })),

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

  tick: () => set((s) => ({ timer: s.timer + 1 })),

  setLumbarAlert: (v) => set({ lumbarAlert: v }),

  nextStep: () =>
    set((s) => ({
      currentStep: Math.min(s.currentStep + 1, s.exerciseCount - 1),
      signalHistory: [],
      compensations: { lumbar: 0, shoulder: 0 },
      lumbarAlert: false,
    })),

  reset: () =>
    set({
      sessionId: null,
      isLive: false,
      timer: 0,
      signalHistory: [],
      coachMessages: [],
      lumbarAlert: false,
      currentStep: 0,
    }),
}));
