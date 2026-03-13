import { BrowserWindow } from 'electron'
import { google, calendar_v3 } from 'googleapis'
import type Database from 'better-sqlite3'

const SCOPES = ['https://www.googleapis.com/auth/calendar']

// Users must place their own credentials in settings:
// google_client_id and google_client_secret
// These come from Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID (Desktop)

interface GoogleTokens {
  access_token: string
  refresh_token: string
  expiry_date: number
  token_type: string
  scope: string
}

interface SyncResult {
  imported: number
  exported: number
  errors: string[]
}

function getCredentials(db: Database.Database): { clientId: string; clientSecret: string } | null {
  const clientId = (db.prepare('SELECT value FROM settings WHERE key = ?').get('google_client_id') as { value: string } | undefined)?.value
  const clientSecret = (db.prepare('SELECT value FROM settings WHERE key = ?').get('google_client_secret') as { value: string } | undefined)?.value
  if (!clientId || !clientSecret) return null
  return { clientId, clientSecret }
}

function getTokens(db: Database.Database): GoogleTokens | null {
  const raw = (db.prepare('SELECT value FROM settings WHERE key = ?').get('google_tokens') as { value: string } | undefined)?.value
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveTokens(db: Database.Database, tokens: GoogleTokens) {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('google_tokens', JSON.stringify(tokens))
}

function createOAuth2Client(db: Database.Database) {
  const creds = getCredentials(db)
  if (!creds) throw new Error('Google credentials not configured')

  const oauth2 = new google.auth.OAuth2(
    creds.clientId,
    creds.clientSecret,
    'http://localhost:47831/callback'
  )

  const tokens = getTokens(db)
  if (tokens) {
    oauth2.setCredentials(tokens)
  }

  oauth2.on('tokens', (newTokens) => {
    const existing = getTokens(db)
    const merged: GoogleTokens = {
      access_token: newTokens.access_token || existing?.access_token || '',
      refresh_token: newTokens.refresh_token || existing?.refresh_token || '',
      expiry_date: newTokens.expiry_date || existing?.expiry_date || 0,
      token_type: newTokens.token_type || 'Bearer',
      scope: newTokens.scope || SCOPES.join(' '),
    }
    saveTokens(db, merged)
  })

  return oauth2
}

export async function connectGoogle(db: Database.Database): Promise<boolean> {
  const creds = getCredentials(db)
  if (!creds) throw new Error('Configurá google_client_id y google_client_secret en Ajustes primero')

  const oauth2 = createOAuth2Client(db)
  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  })

  return new Promise((resolve, reject) => {
    // Create a simple HTTP server to catch the callback
    const http = require('http')
    const url = require('url')

    const server = http.createServer(async (req: { url?: string }, res: { writeHead: (code: number, headers: Record<string, string>) => void; end: (body: string) => void }) => {
      try {
        const parsed = url.parse(req.url || '', true)
        if (parsed.pathname === '/callback' && parsed.query.code) {
          const code = parsed.query.code as string
          const { tokens } = await oauth2.getToken(code)
          saveTokens(db, tokens as GoogleTokens)
          oauth2.setCredentials(tokens)

          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end('<html><body style="font-family:system-ui;text-align:center;padding:60px"><h2>Conectado con Google Calendar</h2><p>Podés cerrar esta ventana.</p></body></html>')

          server.close()
          resolve(true)
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' })
        res.end('Error durante autenticación')
        server.close()
        reject(err)
      }
    })

    server.listen(47831, () => {
      // Open auth URL in a BrowserWindow
      const authWindow = new BrowserWindow({
        width: 600,
        height: 700,
        title: 'Conectar Google Calendar',
        autoHideMenuBar: true,
      })
      authWindow.loadURL(authUrl)

      authWindow.on('closed', () => {
        // If window closed without completing auth
        server.close()
      })
    })

    server.on('error', (err: Error) => {
      reject(err)
    })

    // Timeout after 3 minutes
    setTimeout(() => {
      server.close()
      reject(new Error('Timeout de autenticación'))
    }, 180000)
  })
}

export async function disconnectGoogle(db: Database.Database): Promise<void> {
  const oauth2 = createOAuth2Client(db)
  const tokens = getTokens(db)

  if (tokens?.access_token) {
    try {
      await oauth2.revokeToken(tokens.access_token)
    } catch {
      // Token may already be invalid, that's fine
    }
  }

  db.prepare('DELETE FROM settings WHERE key = ?').run('google_tokens')
  db.prepare('DELETE FROM settings WHERE key = ?').run('google_calendar_ids')
  db.prepare('DELETE FROM settings WHERE key = ?').run('google_last_sync')
}

export function isGoogleConnected(db: Database.Database): boolean {
  const tokens = getTokens(db)
  return tokens !== null && !!tokens.refresh_token
}

export async function getGoogleCalendars(db: Database.Database): Promise<{ id: string; summary: string; backgroundColor: string }[]> {
  const oauth2 = createOAuth2Client(db)
  const calendar = google.calendar({ version: 'v3', auth: oauth2 })

  const res = await calendar.calendarList.list()
  return (res.data.items || []).map((cal) => ({
    id: cal.id || '',
    summary: cal.summary || '',
    backgroundColor: cal.backgroundColor || '#4285f4',
  }))
}

export function getSelectedCalendarIds(db: Database.Database): string[] {
  const raw = (db.prepare('SELECT value FROM settings WHERE key = ?').get('google_calendar_ids') as { value: string } | undefined)?.value
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function setSelectedCalendarIds(db: Database.Database, ids: string[]): void {
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('google_calendar_ids', JSON.stringify(ids))
}

export async function syncNow(db: Database.Database): Promise<SyncResult> {
  const result: SyncResult = { imported: 0, exported: 0, errors: [] }

  const calendarIds = getSelectedCalendarIds(db)
  if (calendarIds.length === 0) {
    result.errors.push('No hay calendarios seleccionados')
    return result
  }

  const oauth2 = createOAuth2Client(db)
  const calendar = google.calendar({ version: 'v3', auth: oauth2 })

  // Fetch calendar colors and event color palette
  const calendarColorMap: Record<string, string> = {}
  const eventColorMap: Record<string, string> = {}
  try {
    const calList = await calendar.calendarList.list()
    for (const cal of calList.data.items || []) {
      if (cal.id && cal.backgroundColor) {
        calendarColorMap[cal.id] = cal.backgroundColor
      }
    }
    const colorsRes = await calendar.colors.get()
    if (colorsRes.data.event) {
      for (const [colorId, colorDef] of Object.entries(colorsRes.data.event)) {
        if (colorDef.background) eventColorMap[colorId] = colorDef.background
      }
    }
  } catch {
    // Non-critical: colors will fall back to defaults
  }

  // Time range: 3 months back, 6 months forward
  const timeMin = new Date()
  timeMin.setMonth(timeMin.getMonth() - 3)
  const timeMax = new Date()
  timeMax.setMonth(timeMax.getMonth() + 6)

  // --- IMPORT: Google → Nido ---
  for (const calId of calendarIds) {
    try {
      const res = await calendar.events.list({
        calendarId: calId,
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 500,
      })

      const calColor = calendarColorMap[calId] || null
      const gEvents = res.data.items || []
      for (const ge of gEvents) {
        if (!ge.id || !ge.summary) continue
        try {
          // Event-specific color takes priority, then calendar color
          const eventColor = (ge.colorId && eventColorMap[ge.colorId]) || calColor
          await importGoogleEvent(db, ge, calId, eventColor)
          result.imported++
        } catch (err) {
          result.errors.push(`Import error: ${ge.summary} - ${(err as Error).message}`)
        }
      }
    } catch (err) {
      result.errors.push(`Calendar ${calId}: ${(err as Error).message}`)
    }
  }

  // --- EXPORT: Nido → Google ---
  const localEvents = db.prepare(
    `SELECT * FROM events WHERE google_event_id IS NOT NULL AND google_calendar_id IS NOT NULL AND last_synced < updated_at`
  ).all() as Array<{
    id: string; title: string; description: string | null; start_datetime: string; end_datetime: string
    is_all_day: number; location: string | null; google_event_id: string; google_calendar_id: string
  }>

  for (const le of localEvents) {
    try {
      await exportNidoEvent(db, calendar, le)
      result.exported++
    } catch (err) {
      result.errors.push(`Export error: ${le.title} - ${(err as Error).message}`)
    }
  }

  // Update last sync timestamp
  const now = new Date().toISOString()
  db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('google_last_sync', now)

  return result
}

async function importGoogleEvent(
  db: Database.Database,
  ge: calendar_v3.Schema$Event,
  calendarId: string,
  eventColor: string | null
) {
  const googleEventId = ge.id!
  const existing = db.prepare('SELECT * FROM events WHERE google_event_id = ?').get(googleEventId) as { id: string; updated_at: string } | undefined

  const isAllDay = !ge.start?.dateTime
  const startDt = ge.start?.dateTime || (ge.start?.date ? `${ge.start.date}T00:00:00` : '')
  // Google Calendar uses exclusive end dates for all-day events:
  // a single-day event on March 15 has end.date = "2026-03-16"
  // Keep as-is; the store uses < comparison for all-day events
  let endDt = ''
  if (ge.end?.dateTime) {
    endDt = ge.end.dateTime
  } else if (ge.end?.date) {
    endDt = `${ge.end.date}T00:00:00`
  }

  if (!startDt || !endDt) return

  const now = new Date().toISOString()
  const googleUpdated = ge.updated ? new Date(ge.updated).toISOString() : now

  if (existing) {
    // Always keep color in sync with Google
    if (eventColor) {
      db.prepare('UPDATE events SET color = ? WHERE id = ?').run(eventColor, existing.id)
    }
    // Last-write-wins: only full-update if Google event is newer
    if (googleUpdated > existing.updated_at) {
      db.prepare(`UPDATE events SET title = ?, description = ?, start_datetime = ?, end_datetime = ?,
        is_all_day = ?, color = ?, location = ?, google_calendar_id = ?, last_synced = ?, updated_at = ?
        WHERE google_event_id = ?`).run(
        ge.summary || 'Sin título',
        ge.description || null,
        startDt,
        endDt,
        isAllDay ? 1 : 0,
        eventColor,
        ge.location || null,
        calendarId,
        now,
        now,
        googleEventId
      )
    }
  } else {
    // Insert new event
    const id = crypto.randomUUID()
    db.prepare(`INSERT INTO events (id, title, description, start_datetime, end_datetime,
      is_all_day, color, location, google_event_id, google_calendar_id, last_synced, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
      id,
      ge.summary || 'Sin título',
      ge.description || null,
      startDt,
      endDt,
      isAllDay ? 1 : 0,
      eventColor,
      ge.location || null,
      googleEventId,
      calendarId,
      now,
      now,
      now
    )
  }
}

async function exportNidoEvent(
  db: Database.Database,
  calendar: calendar_v3.Calendar,
  le: {
    id: string; title: string; description: string | null; start_datetime: string; end_datetime: string
    is_all_day: number; location: string | null; google_event_id: string; google_calendar_id: string
  }
) {
  const now = new Date().toISOString()
  const eventBody: calendar_v3.Schema$Event = {
    summary: le.title,
    description: le.description || undefined,
    location: le.location || undefined,
    start: le.is_all_day
      ? { date: le.start_datetime.split('T')[0] }
      : { dateTime: le.start_datetime },
    end: le.is_all_day
      ? { date: le.end_datetime.split('T')[0] }
      : { dateTime: le.end_datetime },
  }

  await calendar.events.update({
    calendarId: le.google_calendar_id,
    eventId: le.google_event_id,
    requestBody: eventBody,
  })

  db.prepare('UPDATE events SET last_synced = ? WHERE id = ?').run(now, le.id)
}

// Auto-sync timer
let syncInterval: ReturnType<typeof setInterval> | null = null

export function startAutoSync(db: Database.Database, intervalMs = 5 * 60 * 1000) {
  stopAutoSync()
  if (isGoogleConnected(db)) {
    syncInterval = setInterval(() => {
      syncNow(db).catch(console.error)
    }, intervalMs)
  }
}

export function stopAutoSync() {
  if (syncInterval) {
    clearInterval(syncInterval)
    syncInterval = null
  }
}
