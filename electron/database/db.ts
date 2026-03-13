import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

export function initDatabase(): Database.Database {
  if (db) return db

  const userDataPath = app.getPath('userData')
  const dbDir = path.join(userDataPath, 'data')

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true })
  }

  const dbPath = path.join(dbDir, 'nido.db')
  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  createTables(db)
  runMigrations(db)

  return db
}

function createTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      parent_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      color TEXT,
      icon TEXT,
      is_archived INTEGER DEFAULT 0,
      is_template INTEGER DEFAULT 0,
      template_name TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS kanban_columns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      color TEXT,
      sort_order INTEGER DEFAULT 0,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      column_id TEXT REFERENCES kanban_columns(id) ON DELETE SET NULL,
      parent_task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
      priority TEXT CHECK(priority IN ('alta', 'media', 'baja')) DEFAULT 'media',
      is_important INTEGER DEFAULT 0,
      due_date TEXT,
      due_time TEXT,
      estimated_minutes INTEGER,
      actual_minutes INTEGER DEFAULT 0,
      is_completed INTEGER DEFAULT 0,
      completed_at TEXT,
      is_archived INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      is_recurring INTEGER DEFAULT 0,
      recurrence_rule TEXT,
      recurrence_end TEXT,
      recurrence_parent TEXT REFERENCES tasks(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_tags (
      task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
      tag_id TEXT REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (task_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      start_datetime TEXT NOT NULL,
      end_datetime TEXT NOT NULL,
      is_all_day INTEGER DEFAULT 0,
      color TEXT,
      location TEXT,
      event_type TEXT DEFAULT 'evento',
      project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
      is_recurring INTEGER DEFAULT 0,
      recurrence_rule TEXT,
      recurrence_end TEXT,
      google_event_id TEXT,
      google_calendar_id TEXT,
      last_synced TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS post_its (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      color TEXT DEFAULT '#A8E8F0',
      linked_task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
      position_x REAL DEFAULT 0,
      position_y REAL DEFAULT 0,
      width REAL DEFAULT 200,
      height REAL DEFAULT 200,
      z_index INTEGER DEFAULT 0,
      is_pinned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pomodoro_sessions (
      id TEXT PRIMARY KEY,
      task_id TEXT REFERENCES tasks(id) ON DELETE SET NULL,
      duration_minutes INTEGER DEFAULT 25,
      break_minutes INTEGER DEFAULT 5,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      was_completed INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dashboard_layout (
      id TEXT PRIMARY KEY,
      widget_type TEXT NOT NULL,
      grid_x INTEGER DEFAULT 0,
      grid_y INTEGER DEFAULT 0,
      grid_w INTEGER DEFAULT 1,
      grid_h INTEGER DEFAULT 1,
      is_visible INTEGER DEFAULT 1,
      config TEXT
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      structure TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS semesters (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY,
      semester_id TEXT NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#01A7C2',
      professor TEXT,
      description TEXT,
      schedule TEXT,
      attendance_threshold REAL DEFAULT 75,
      approval_threshold REAL DEFAULT 60,
      final_grade REAL,
      final_status TEXT CHECK(final_status IN ('en_curso', 'aprobada', 'desaprobada', 'libre')) DEFAULT 'en_curso',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS subject_projects (
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      PRIMARY KEY (subject_id, project_id)
    );

    CREATE TABLE IF NOT EXISTS class_instances (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      status TEXT CHECK(status IN ('pendiente', 'asisti', 'falte', 'cancelada')) DEFAULT 'pendiente',
      is_manual INTEGER DEFAULT 0,
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS grade_categories (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      weight REAL NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS grades (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL REFERENCES grade_categories(id) ON DELETE CASCADE,
      subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      score REAL,
      max_score REAL DEFAULT 10,
      date TEXT,
      note TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)
}

function runMigrations(db: Database.Database) {
  try {
    db.exec(`ALTER TABLE events ADD COLUMN event_type TEXT DEFAULT 'evento'`)
  } catch {
    // Column already exists
  }
}

export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized')
  return db
}
