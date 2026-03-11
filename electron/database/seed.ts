import type Database from 'better-sqlite3'
import { randomUUID } from 'crypto'

export function runSeed(db: Database.Database) {
  const hasSettings = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number }
  if (hasSettings.count > 0) return

  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
  const seedSettings: [string, string][] = [
    ['theme', '"light"'],
    ['pomodoro_work_minutes', '25'],
    ['pomodoro_break_minutes', '5'],
    ['pomodoro_long_break_minutes', '15'],
    ['pomodoro_auto_start', 'false'],
    ['pomodoro_sound', 'true'],
    ['reduce_animations', 'false'],
    ['google_calendar_connected', 'false'],
    ['google_calendar_ids', '[]'],
    ['semester_start_month', '3'],
    ['semester_end_month', '7'],
  ]

  const seedTransaction = db.transaction(() => {
    for (const [key, value] of seedSettings) {
      insertSetting.run(key, value)
    }

    // Default tags
    const insertTag = db.prepare('INSERT OR IGNORE INTO tags (id, name, color) VALUES (?, ?, ?)')
    insertTag.run(randomUUID(), 'facultad', 'tag-cyan')
    insertTag.run(randomUUID(), 'personal', 'tag-forest')
    insertTag.run(randomUUID(), 'urgente', 'tag-berry')

    // Default templates
    const insertTemplate = db.prepare('INSERT OR IGNORE INTO templates (id, name, description, structure) VALUES (?, ?, ?, ?)')

    insertTemplate.run(
      randomUUID(),
      'Nueva Materia',
      'Estructura para organizar una materia universitaria con teóricos, prácticos, parciales y final.',
      JSON.stringify({
        name: '{{nombre_materia}}',
        children: [
          { name: 'Teóricos', tasks: ['Resumen Tema 1', 'Resumen Tema 2'] },
          { name: 'Prácticos', tasks: ['Práctico 1', 'Práctico 2'] },
          {
            name: 'Parciales',
            children: [
              { name: 'Parcial 1', tasks: ['Estudiar', 'Hacer ejercicios', 'Repasar'] },
              { name: 'Parcial 2', tasks: ['Estudiar', 'Hacer ejercicios', 'Repasar'] },
            ],
          },
          { name: 'Final', tasks: ['Estudiar', 'Integrar temas', 'Repasar'] },
        ],
      })
    )

    insertTemplate.run(
      randomUUID(),
      'Semestre Completo',
      'Estructura para organizar un semestre completo con múltiples materias.',
      JSON.stringify({
        name: 'Semestre {{periodo}}',
        children: [],
      })
    )

    insertTemplate.run(
      randomUUID(),
      'Proyecto Personal',
      'Estructura básica para un proyecto personal con planificación, desarrollo y revisión.',
      JSON.stringify({
        name: '{{nombre_proyecto}}',
        children: [
          { name: 'Planificación', tasks: ['Definir objetivos', 'Research', 'Timeline'] },
          { name: 'Desarrollo', tasks: [] },
          { name: 'Revisión', tasks: ['Testing', 'Feedback', 'Ajustes finales'] },
        ],
      })
    )

    // Default dashboard layout
    const insertWidget = db.prepare(
      'INSERT INTO dashboard_layout (id, widget_type, grid_x, grid_y, grid_w, grid_h, is_visible, config) VALUES (?, ?, ?, ?, ?, ?, 1, NULL)'
    )
    insertWidget.run(randomUUID(), 'today', 0, 0, 4, 2)
    insertWidget.run(randomUUID(), 'deadlines', 4, 0, 4, 2)
    insertWidget.run(randomUUID(), 'progress', 8, 0, 4, 2)
    insertWidget.run(randomUUID(), 'postits', 0, 2, 6, 3)
    insertWidget.run(randomUUID(), 'mini_calendar', 6, 2, 3, 3)
    insertWidget.run(randomUUID(), 'pomodoro', 9, 2, 3, 3)
  })

  seedTransaction()
}
