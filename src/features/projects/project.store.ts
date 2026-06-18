import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, ProjectDraft } from './project.types';

interface ProjectState {
  projects: Project[];
  query: string;
  setQuery: (query: string) => void;
  createProject: (draft: ProjectDraft) => Project;
  updateProject: (id: string, patch: Partial<ProjectDraft>) => void;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
}

function newId(): string {
  return (
    globalThis.crypto?.randomUUID?.() ?? `p_${Date.now()}_${Math.random().toString(36).slice(2)}`
  );
}

/**
 * Local CRUD for projects, persisted to localStorage. No backend in Phase 1 —
 * this is the single source of truth for the Projects + Dashboard pages.
 */
export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      query: '',
      setQuery: (query) => set({ query }),

      createProject: (draft) => {
        const now = Date.now();
        const project: Project = { id: newId(), createdAt: now, updatedAt: now, ...draft };
        set((s) => ({ projects: [project, ...s.projects] }));
        return project;
      },

      updateProject: (id, patch) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p,
          ),
        })),

      renameProject: (id, name) =>
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id ? { ...p, name, updatedAt: Date.now() } : p,
          ),
        })),

      deleteProject: (id) =>
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

      getProject: (id) => get().projects.find((p) => p.id === id),
    }),
    { name: 'skyscore.projects' },
  ),
);
