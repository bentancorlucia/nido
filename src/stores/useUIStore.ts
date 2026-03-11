import { create } from 'zustand'
import type { Page, Theme } from '../types'

interface UIState {
  currentPage: Page
  theme: Theme
  sidebarCollapsed: boolean
  sidebarProjectsExpanded: boolean
  setCurrentPage: (page: Page) => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  toggleSidebar: () => void
  toggleSidebarProjects: () => void
  loadTheme: () => Promise<void>
}

export const useUIStore = create<UIState>((set, get) => ({
  currentPage: 'dashboard',
  theme: 'light',
  sidebarCollapsed: false,
  sidebarProjectsExpanded: true,

  setCurrentPage: (page) => set({ currentPage: page }),

  setTheme: (theme) => {
    set({ theme })
    document.documentElement.classList.toggle('dark', theme === 'dark')
    window.nido?.settings.set('theme', JSON.stringify(theme))
  },

  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light'
    get().setTheme(newTheme)
  },

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  toggleSidebarProjects: () => set((s) => ({ sidebarProjectsExpanded: !s.sidebarProjectsExpanded })),

  loadTheme: async () => {
    try {
      const raw = await window.nido.settings.get('theme')
      const theme: Theme = raw ? JSON.parse(raw) : 'light'
      set({ theme })
      document.documentElement.classList.toggle('dark', theme === 'dark')
    } catch {
      // Default to light
    }
  },
}))
