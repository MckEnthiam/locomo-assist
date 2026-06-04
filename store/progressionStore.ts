'use client';

import { create } from 'zustand';
import type { ProgressionChartPoint, ProgressionWeekRow } from '@/types';

interface ProgressionState {
  chartData: ProgressionChartPoint[];
  weekRows: ProgressionWeekRow[];
  loading: boolean;
  error: string | null;
  fetchProgression: () => Promise<void>;
}

export const useProgressionStore = create<ProgressionState>((set) => ({
  chartData: [],
  weekRows: [],
  loading: false,
  error: null,

  fetchProgression: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/progression');
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Erreur chargement progression');
      }
      const data = (await res.json()) as {
        chartData: ProgressionChartPoint[];
        weekRows: ProgressionWeekRow[];
      };
      set({ chartData: data.chartData, weekRows: data.weekRows, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Erreur inconnue',
      });
    }
  },
}));
