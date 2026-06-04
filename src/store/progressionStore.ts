import { create } from 'zustand';
import { getProgression } from '@/lib/ipc';
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
      const data = await getProgression(28);
      set({ chartData: data.chartData, weekRows: data.weekRows, loading: false });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Erreur inconnue',
      });
    }
  },
}));
