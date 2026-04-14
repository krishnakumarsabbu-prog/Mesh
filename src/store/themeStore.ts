import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeId = 'graphite' | 'aurora' | 'frost';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  preview: string[];
}

export const THEMES: ThemeDefinition[] = [
  {
    id: 'graphite',
    name: 'Graphite Neon',
    description: 'Graphite + Neon Observability',
    preview: ['#0F1115', '#161B22', '#00E599', '#3B82F6'],
  },
  {
    id: 'aurora',
    name: 'Aurora Dark',
    description: 'Aurora Gradient Dark',
    preview: ['#0D1117', '#1A1B2E', '#7C3AED', '#00E599'],
  },
  {
    id: 'frost',
    name: 'Executive Frost',
    description: 'Pearl Glass Light',
    preview: ['#F7F8FA', '#EEF1F5', '#00B87A', '#2563EB'],
  },
];

interface ThemeStore {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'graphite',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'healthmesh-theme',
    }
  )
);
