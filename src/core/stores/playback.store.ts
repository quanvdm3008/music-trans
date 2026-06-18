import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { InstrumentId } from '../audio/player';

/**
 * Shared playback *preferences* (the audio engine itself stays in the
 * transcription workspace via Web Audio handles — we don't churn that here).
 * This holds the UI-facing selections so the toolbar and right panel agree.
 */
interface PlaybackState {
  instrument: InstrumentId;
  loop: boolean;
  speed: number; // user practice-speed multiplier (1 = play exactly as notated)
  setInstrument: (id: InstrumentId) => void;
  toggleLoop: () => void;
  setSpeed: (speed: number) => void;
}

export const usePlaybackStore = create<PlaybackState>()(
  persist(
    (set) => ({
      instrument: 'piano',
      loop: false,
      speed: 1,
      setInstrument: (instrument) => set({ instrument }),
      toggleLoop: () => set((s) => ({ loop: !s.loop })),
      setSpeed: (speed) => set({ speed }),
    }),
    { name: 'skyscore.playback.v2' },
  ),
);
