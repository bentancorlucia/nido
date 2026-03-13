import { dialog, BrowserWindow } from 'electron'
import type Database from 'better-sqlite3'
import fs from 'fs'

const EXPORT_TABLES = [
  'projects', 'kanban_columns', 'tasks', 'tags', 'task_tags',
  'events', 'post_its', 'pomodoro_sessions', 'dashboard_layout',
  'settings', 'templates',
]

interface ExportData {
  version: 1
  exported_at: string
  app: 'nido'
  tables: Record<string, unknown[]>
}

export async function exportData(db: Database.Database): Promise<{ success: boolean; path?: string; error?: string }> {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return { success: false, error: 'No hay ventana activa' }

  const result = await dialog.showSaveDialog(win, {
    title: 'Exportar datos de Nido',
    defaultPath: `nido-backup-${new Date().toISOString().split('T')[0]}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })

  if (result.canceled || !result.filePath) {
    return { success: false, error: 'Cancelado' }
  }

  try {
    const data: ExportData = {
      version: 1,
      exported_at: new Date().toISOString(),
      app: 'nido',
      tables: {},
    }

    for (const table of EXPORT_TABLES) {
      data.tables[table] = db.prepare(`SELECT * FROM ${table}`).all()
    }

    fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8')
    return { success: true, path: result.filePath }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function importData(db: Database.Database): Promise<{ success: boolean; error?: string }> {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return { success: false, error: 'No hay ventana activa' }

  const result = await dialog.showOpenDialog(win, {
    title: 'Importar datos a Nido',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile'],
  })

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, error: 'Cancelado' }
  }

  try {
    const raw = fs.readFileSync(result.filePaths[0], 'utf-8')
    const data: ExportData = JSON.parse(raw)

    // Validate
    if (data.app !== 'nido' || data.version !== 1 || !data.tables) {
      return { success: false, error: 'Archivo no válido. Asegurate de que sea un backup de Nido.' }
    }

    // Validate that all tables exist
    for (const table of Object.keys(data.tables)) {
      if (!EXPORT_TABLES.includes(table)) {
        return { success: false, error: `Tabla desconocida: ${table}` }
      }
    }

    // Import in a transaction
    const transaction = db.transaction(() => {
      // Clear existing data (reverse order for foreign keys)
      const clearOrder = [...EXPORT_TABLES].reverse()
      for (const table of clearOrder) {
        db.prepare(`DELETE FROM ${table}`).run()
      }

      // Insert new data
      for (const table of EXPORT_TABLES) {
        const rows = data.tables[table]
        if (!rows || rows.length === 0) continue

        for (const row of rows) {
          const record = row as Record<string, unknown>
          const keys = Object.keys(record)
          const placeholders = keys.map(() => '?').join(', ')
          const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
          db.prepare(sql).run(...keys.map((k) => record[k] ?? null))
        }
      }
    })

    transaction()
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

export async function resetData(db: Database.Database): Promise<{ success: boolean; error?: string }> {
  const win = BrowserWindow.getFocusedWindow()
  if (!win) return { success: false, error: 'No hay ventana activa' }

  const confirm = await dialog.showMessageBox(win, {
    type: 'warning',
    buttons: ['Cancelar', 'Eliminar todo'],
    defaultId: 0,
    title: 'Resetear datos',
    message: '¿Estás segura de que querés eliminar todos los datos?',
    detail: 'Esta acción no se puede deshacer. Se recomienda exportar un backup antes.',
  })

  if (confirm.response !== 1) {
    return { success: false, error: 'Cancelado' }
  }

  try {
    const clearOrder = [...EXPORT_TABLES].reverse()
    db.transaction(() => {
      for (const table of clearOrder) {
        db.prepare(`DELETE FROM ${table}`).run()
      }
    })()
    return { success: true }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}
