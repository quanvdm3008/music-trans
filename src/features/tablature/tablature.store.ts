import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TuningId = 'standard' | 'dropD' | 'violin';

interface TablatureState {
  tuning: TuningId;
  capo: number; // 0–7
  zoom: number; // 0.7 – 1.6
  setTuning: (t: TuningId) => void;
  setCapo: (capo: number) => void;
  setZoom: (zoom: number) => void;
}

export const useTablatureStore = create<TablatureState>()(
  persist(
    (set) => ({
      tuning: 'standard',
      capo: 0,
      zoom: 1,
      setTuning: (tuning) => set({ tuning }),
      setCapo: (capo) => set({ capo: Math.max(0, Math.min(7, capo)) }),
      setZoom: (zoom) => set({ zoom: Math.max(0.7, Math.min(1.6, zoom)) }),
    }),
    { name: 'skyscore.tablature' },
  ),
);

export const TUNINGS: { id: TuningId; label: string }[] = [
  { id: 'standard', label: 'Guitar Chuẩn (E A D G B e)' },
  { id: 'dropD', label: 'Guitar Drop D (D A D G B e)' },
  { id: 'violin', label: 'Violin (G D A E)' },
];
