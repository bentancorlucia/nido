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
  platform: process.platform,
}

contextBridge.exposeInMainWorld('nido', api)
