import { create } from 'zustand'
import type { Page, Theme } from '../types'

export interface Tab {
  id: string
  page: Page
  label: string
}

const PAGE_LABELS: Record<Page, string> = {
  dashboard: 'Dashboard',
  today: 'Hoy',
  kanban: 'Tareas',
  calendar: 'Calendario',
  projects: 'Proyectos',
  faculty: 'Facultad',
  pomodoro: 'Pomodoro',
  settings: 'Configuración',
}

function tabId(): string {
  return crypto.randomUUID().slice(0, 8)
}

interface UIState {
  currentPage: Page
  theme: Theme
  sidebarCollapsed: boolean
  sidebarProjectsExpanded: boolean

  // Tabs
  tabs: Tab[]
  activeTabId: string | null

  setCurrentPage: (page: Page) => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  toggleSidebar: () => void
  toggleSidebarProjects: () => void
  loadTheme: () => Promise<void>

  // Tab actions
  addTab: (page: Page) => void
  closeTab: (tabId: string) => void
  switchTab: (tabId: string) => void
}

export const useUIStore = create<UIState>((set, get) => {
  const initialTab: Tab = { id: tabId(), page: 'dashboard', label: PAGE_LABELS.dashboard }

  return {
    currentPage: 'dashboard',
    theme: 'light',
    sidebarCollapsed: false,
    sidebarProjectsExpanded: true,

    tabs: [initialTab],
    activeTabId: initialTab.id,

    setCurrentPage: (page) => {
      const { tabs, activeTabId } = get()
      // Update the active tab's page
      const updatedTabs = tabs.map((t) =>
        t.id === activeTabId ? { ...t, page, label: PAGE_LABELS[page] } : t
      )
      set({ currentPage: page, tabs: updatedTabs })
    },

    setTheme: (theme) => {
      set({ theme })
      const root = document.documentElement
      root.classList.add('theme-transition')
      root.classList.toggle('dark', theme === 'dark')
      window.nido?.settings.set('theme', JSON.stringify(theme))
      setTimeout(() => root.classList.remove('theme-transition'), 600)
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

    addTab: (page) => {
      const newTab: Tab = { id: tabId(), page, label: PAGE_LABELS[page] }
      set((s) => ({
        tabs: [...s.tabs, newTab],
        activeTabId: newTab.id,
        currentPage: page,
      }))
    },

    closeTab: (closeId) => {
      const { tabs, activeTabId } = get()
      if (tabs.length <= 1) return // Don't close the last tab

      const newTabs = tabs.filter((t) => t.id !== closeId)
      if (activeTabId === closeId) {
        // Switch to adjacent tab
        const closedIndex = tabs.findIndex((t) => t.id === closeId)
        const newActive = newTabs[Math.min(closedIndex, newTabs.length - 1)]
        set({
          tabs: newTabs,
          activeTabId: newActive.id,
          currentPage: newActive.page,
        })
      } else {
        set({ tabs: newTabs })
      }
    },

    switchTab: (tabId) => {
      const tab = get().tabs.find((t) => t.id === tabId)
      if (tab) {
        set({ activeTabId: tabId, currentPage: tab.page })
      }
    },
  }
})
