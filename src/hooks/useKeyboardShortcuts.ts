import { useEffect } from 'react'
import { useUIStore } from '../stores/useUIStore'
import { usePomodoroStore } from '../stores/usePomodoroStore'
import type { Page } from '../types'

interface ShortcutHandlers {
  onOpenSearch: () => void
  onNewTask?: () => void
  onNewEvent?: () => void
  onNewPostIt?: () => void
}

/**
 * Global keyboard shortcuts for the app.
 * Detects platform (Mac vs Win) and maps Meta/Ctrl accordingly.
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  const { setCurrentPage, toggleSidebar, toggleTheme } = useUIStore()
  const { isRunning, start, pause } = usePomodoroStore()

  useEffect(() => {
    function isInputFocused(): boolean {
      const el = document.activeElement
      if (!el) return false
      const tag = el.tagName.toLowerCase()
      return tag === 'input' || tag === 'textarea' || (el as HTMLElement).isContentEditable
    }

    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey

      // Cmd+K — always works, even in inputs
      if (mod && e.key === 'k') {
        e.preventDefault()
        handlers.onOpenSearch()
        return
      }

      // Escape — always works
      if (e.key === 'Escape') {
        // Let the command palette handle its own close
        return
      }

      // Skip remaining shortcuts if an input is focused
      if (isInputFocused()) return

      // Cmd+N — new task
      if (mod && !e.shiftKey && e.key === 'n') {
        e.preventDefault()
        setCurrentPage('kanban')
        handlers.onNewTask?.()
        return
      }

      // Cmd+Shift+N — new event
      if (mod && e.shiftKey && e.key === 'N') {
        e.preventDefault()
        setCurrentPage('calendar')
        handlers.onNewEvent?.()
        return
      }

      // Cmd+E — new post-it
      if (mod && e.key === 'e') {
        e.preventDefault()
        setCurrentPage('dashboard')
        handlers.onNewPostIt?.()
        return
      }

      // Cmd+P — toggle pomodoro
      if (mod && e.key === 'p') {
        e.preventDefault()
        if (isRunning) pause()
        else start()
        return
      }

      // Cmd+B — toggle sidebar
      if (mod && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
        return
      }

      // Cmd+D — toggle theme
      if (mod && e.key === 'd') {
        e.preventDefault()
        toggleTheme()
        return
      }

      // Cmd+1..5 — navigate pages
      const pageMap: Record<string, Page> = {
        '1': 'dashboard',
        '2': 'today',
        '3': 'kanban',
        '4': 'calendar',
        '5': 'projects',
      }

      if (mod && pageMap[e.key]) {
        e.preventDefault()
        setCurrentPage(pageMap[e.key])
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers, setCurrentPage, toggleSidebar, toggleTheme, isRunning, start, pause])
}
