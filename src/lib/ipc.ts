// IPC helper - thin wrapper for renderer-side DB calls

export async function dbQuery<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
  return window.nido.db.query(sql, params) as Promise<T[]>
}

export async function dbGet<T = unknown>(sql: string, params?: unknown[]): Promise<T | undefined> {
  return window.nido.db.get(sql, params) as Promise<T | undefined>
}

export async function dbRun(sql: string, params?: unknown[]) {
  return window.nido.db.run(sql, params)
}

export async function dbGetAll<T = unknown>(table: string): Promise<T[]> {
  return window.nido.db.getAll(table) as Promise<T[]>
}

export async function dbInsert(table: string, data: Record<string, unknown>) {
  return window.nido.db.insert(table, data)
}

export async function dbUpdate(table: string, id: string, data: Record<string, unknown>) {
  return window.nido.db.update(table, id, data)
}

export async function dbDelete(table: string, id: string) {
  return window.nido.db.delete(table, id)
}

export async function getSetting(key: string): Promise<string | null> {
  return window.nido.settings.get(key)
}

export async function setSetting(key: string, value: string): Promise<void> {
  return window.nido.settings.set(key, value)
}
