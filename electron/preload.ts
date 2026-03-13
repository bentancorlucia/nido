import { contextBridge, ipcRenderer } from 'electron'

export interface NidoAPI {
  db: {
    query: (sql: string, params?: unknown[]) => Promise<unknown[]>
    run: (sql: string, params?: unknown[]) => Promise<{ changes: number; lastInsertRowid: number }>
    get: (sql: string, params?: unknown[]) => Promise<unknown | undefined>
    getAll: (table: string) => Promise<unknown[]>
    insert: (table: string, data: Record<string, unknown>) => Promise<unknown>
    update: (table: string, id: string, data: Record<string, unknown>) => Promise<unknown>
    delete: (table: string, id: string) => Promise<void>
  }
  settings: {
    get: (key: string) => Promise<string | null>
    set: (key: string, value: string) => Promise<void>
  }
  google: {
    connect: () => Promise<boolean>
    disconnect: () => Promise<void>
    isConnected: () => Promise<boolean>
    getCalendars: () => Promise<{ id: string; summary: string; backgroundColor: string }[]>
    setCalendars: (ids: string[]) => Promise<void>
    getSelectedCalendars: () => Promise<string[]>
    syncNow: () => Promise<{ imported: number; exported: number; errors: string[] }>
    getLastSync: () => Promise<string | null>
  }
  data: {
    export: () => Promise<{ success: boolean; path?: string; error?: string }>
    import: () => Promise<{ success: boolean; error?: string }>
    reset: () => Promise<{ success: boolean; error?: string }>
  }
  notifications: {
    sendPomodoro: (phase: 'work' | 'break' | 'long_break') => Promise<void>
    onNotification: (callback: (data: { type: string; message?: string; variant?: string; [key: string]: unknown }) => void) => () => void
  }
  platform: string
}

const api: NidoAPI = {
  db: {
    query: (sql, params) => ipcRenderer.invoke('db:query', sql, params),
    run: (sql, params) => ipcRenderer.invoke('db:run', sql, params),
    get: (sql, params) => ipcRenderer.invoke('db:get', sql, params),
    getAll: (table) => ipcRenderer.invoke('db:getAll', table),
    insert: (table, data) => ipcRenderer.invoke('db:insert', table, data),
    update: (table, id, data) => ipcRenderer.invoke('db:update', table, id, data),
    delete: (table, id) => ipcRenderer.invoke('db:delete', table, id),
  },
  settings: {
    get: (key) => ipcRenderer.invoke('settings:get', key),
    set: (key, value) => ipcRenderer.invoke('settings:set', key, value),
  },
  google: {
    connect: () => ipcRenderer.invoke('google:connect'),
    disconnect: () => ipcRenderer.invoke('google:disconnect'),
    isConnected: () => ipcRenderer.invoke('google:isConnected'),
    getCalendars: () => ipcRenderer.invoke('google:getCalendars'),
    setCalendars: (ids) => ipcRenderer.invoke('google:setCalendars', ids),
    getSelectedCalendars: () => ipcRenderer.invoke('google:getSelectedCalendars'),
    syncNow: () => ipcRenderer.invoke('google:syncNow'),
    getLastSync: () => ipcRenderer.invoke('google:getLastSync'),
  },
  data: {
    export: () => ipcRenderer.invoke('data:export'),
    import: () => ipcRenderer.invoke('data:import'),
    reset: () => ipcRenderer.invoke('data:reset'),
  },
  notifications: {
    sendPomodoro: (phase) => ipcRenderer.invoke('notifications:pomodoro', phase),
    onNotification: (callback) => {
      const handler = (_event: Electron.IpcRendererEvent, data: { type: string; [key: string]: unknown }) => callback(data as { type: string; message?: string; variant?: string })
      ipcRenderer.on('nido:notification', handler)
      return () => ipcRenderer.removeListener('nido:notification', handler)
    },
  },
  platform: process.platform,
}

contextBridge.exposeInMainWorld('nido', api)
