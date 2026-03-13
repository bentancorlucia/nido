import { create } from 'zustand'
import type { ToastNotification } from '../types'

interface NotificationState {
  toasts: ToastNotification[]
  addToast: (message: string, variant?: ToastNotification['variant']) => void
  removeToast: (id: string) => void
  initListener: () => () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  toasts: [],

  addToast: (message, variant = 'info') => {
    const id = crypto.randomUUID()
    const toast: ToastNotification = { id, message, variant, timestamp: Date.now() }
    set((s) => ({ toasts: [...s.toasts, toast] }))

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      get().removeToast(id)
    }, 5000)
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },

  initListener: () => {
    const cleanup = window.nido.notifications.onNotification((data) => {
      if (data.type === 'toast' && data.message) {
        get().addToast(data.message, (data.variant as ToastNotification['variant']) || 'info')
      } else if (data.type === 'event_upcoming') {
        const title = (data as Record<string, unknown>).title as string
        const mins = (data as Record<string, unknown>).minutes as number
        get().addToast(`"${title}" comienza en ${mins} min`, 'warning')
      } else if (data.type === 'task_deadline') {
        const title = (data as Record<string, unknown>).title as string
        const mins = (data as Record<string, unknown>).minutes as number
        get().addToast(`Deadline: "${title}" en ${mins} min`, 'warning')
      } else if (data.type === 'task_overdue') {
        const title = (data as Record<string, unknown>).title as string
        get().addToast(`Vencida: "${title}"`, 'error')
      } else if (data.type === 'pomodoro') {
        const body = (data as Record<string, unknown>).body as string
        get().addToast(body, 'success')
      }
    })
    return cleanup
  },
}))
