import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BreadcrumbItem } from '@/types';

export type AppTheme = 'ivory' | 'dark';

interface UIStore {
  sidebarCollapsed: boolean;
  breadcrumbs: BreadcrumbItem[];
  pageTitle: string;
  theme: AppTheme;
  toggleSidebar: () => void;
  setSidebarCollapsed: (val: boolean) => void;
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  setPageTitle: (title: string) => void;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
}

function applyTheme(theme: AppTheme) {
  if (typeof document === 'undefined') return;
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      breadcrumbs: [],
      pageTitle: 'Dashboard',
      theme: 'ivory',
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (val) => set({ sidebarCollapsed: val }),
      setBreadcrumbs: (items) => set({ breadcrumbs: items }),
      setPageTitle: (title) => set({ pageTitle: title }),
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const next = get().theme === 'ivory' ? 'dark' : 'ivory';
        applyTheme(next);
        set({ theme: next });
      },
    }),
    {
      name: 'healthmesh-ui',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) applyTheme(state.theme);
      },
    }
  )
);
