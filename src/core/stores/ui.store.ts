import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** How the workspace renders the result: piano sheet, guitar tab, or violin tab. */
export type ViewMode = 'sheet' | 'tab' | 'violin';

interface UiState {
  viewMode: ViewMode;
  sidebarCollapsed: boolean;
  setViewMode: (mode: ViewMode) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      viewMode: 'sheet',
      sidebarCollapsed: false,
      setViewMode: (viewMode) => set({ viewMode }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: 'skyscore.ui.v3' },
  ),
);

export const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: 'sheet', label: '🎹 Piano Sheet' },
  { id: 'tab', label: '🎸 Guitar Tab' },
  { id: 'violin', label: '🎻 Violin Tab' },
];
