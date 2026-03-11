import { ipcMain } from 'electron'
import type Database from 'better-sqlite3'

const ALLOWED_TABLES = [
  'projects', 'kanban_columns', 'tasks', 'tags', 'task_tags',
  'events', 'post_its', 'pomodoro_sessions', 'dashboard_layout',
  'settings', 'templates',
]

function validateTable(table: string) {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error(`Table "${table}" is not allowed`)
  }
}

export function registerIpcHandlers(db: Database.Database) {
  ipcMain.handle('db:query', (_event, sql: string, params?: unknown[]) => {
    const stmt = db.prepare(sql)
    return params ? stmt.all(...params) : stmt.all()
  })

  ipcMain.handle('db:run', (_event, sql: string, params?: unknown[]) => {
    const stmt = db.prepare(sql)
    const result = params ? stmt.run(...params) : stmt.run()
    return { changes: result.changes, lastInsertRowid: Number(result.lastInsertRowid) }
  })

  ipcMain.handle('db:get', (_event, sql: string, params?: unknown[]) => {
    const stmt = db.prepare(sql)
    return params ? stmt.get(...params) : stmt.get()
  })

  ipcMain.handle('db:getAll', (_event, table: string) => {
    validateTable(table)
    return db.prepare(`SELECT * FROM ${table}`).all()
  })

  ipcMain.handle('db:insert', (_event, table: string, data: Record<string, unknown>) => {
    validateTable(table)
    const keys = Object.keys(data)
    const placeholders = keys.map(() => '?').join(', ')
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
    const result = db.prepare(sql).run(...Object.values(data))
    return { changes: result.changes, lastInsertRowid: Number(result.lastInsertRowid) }
  })

  ipcMain.handle('db:update', (_event, table: string, id: string, data: Record<string, unknown>) => {
    validateTable(table)
    const sets = Object.keys(data).map((k) => `${k} = ?`).join(', ')
    const sql = `UPDATE ${table} SET ${sets} WHERE id = ?`
    const result = db.prepare(sql).run(...Object.values(data), id)
    return { changes: result.changes }
  })

  ipcMain.handle('db:delete', (_event, table: string, id: string) => {
    validateTable(table)
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id)
  })

  // Settings shortcuts
  ipcMain.handle('settings:get', (_event, key: string) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
    return row?.value ?? null
  })

  ipcMain.handle('settings:set', (_event, key: string, value: string) => {
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, value)
  })
}
