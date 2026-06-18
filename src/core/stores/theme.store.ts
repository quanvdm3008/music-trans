import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'cute' | 'cosmic' | 'pro';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  cycle: () => void;
}

const CYCLE: ThemeMode[] = ['cosmic', 'cute', 'pro'];

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'cosmic',
      setMode: (mode) => {
        document.documentElement.setAttribute('data-theme', mode);
        set({ mode });
      },
      cycle: () => {
        const idx = CYCLE.indexOf(get().mode);
        const next = CYCLE[(idx + 1) % CYCLE.length];
        document.documentElement.setAttribute('data-theme', next);
        set({ mode: next });
      },
    }),
    { name: 'aurora-studio.theme' },
  ),
);

/** Apply the stored theme on load */
export function initTheme() {
  try {
    const raw = localStorage.getItem('aurora-studio.theme');
    if (raw) {
      const parsed = JSON.parse(raw);
      const mode: ThemeMode = parsed?.state?.mode ?? 'cosmic';
      document.documentElement.setAttribute('data-theme', mode);
    } else {
      document.documentElement.setAttribute('data-theme', 'cosmic');
    }
  } catch {
    document.documentElement.setAttribute('data-theme', 'cosmic');
  }
}
