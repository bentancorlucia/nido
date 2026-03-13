import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  parentId: text('parent_id').references((): ReturnType<typeof text> => projects.id, { onDelete: 'cascade' }),
  color: text('color'),
  icon: text('icon'),
  isArchived: integer('is_archived', { mode: 'boolean' }).default(false),
  isTemplate: integer('is_template', { mode: 'boolean' }).default(false),
  templateName: text('template_name'),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
})

export const kanbanColumns = sqliteTable('kanban_columns', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  color: text('color'),
  sortOrder: integer('sort_order').default(0),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
})

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  columnId: text('column_id').references(() => kanbanColumns.id, { onDelete: 'set null' }),
  parentTaskId: text('parent_task_id'),
  priority: text('priority', { enum: ['alta', 'media', 'baja'] }).default('media'),
  isImportant: integer('is_important', { mode: 'boolean' }).default(false),
  dueDate: text('due_date'),
  dueTime: text('due_time'),
  estimatedMinutes: integer('estimated_minutes'),
  actualMinutes: integer('actual_minutes').default(0),
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false),
  completedAt: text('completed_at'),
  isArchived: integer('is_archived', { mode: 'boolean' }).default(false),
  sortOrder: integer('sort_order').default(0),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false),
  recurrenceRule: text('recurrence_rule'),
  recurrenceEnd: text('recurrence_end'),
  recurrenceParent: text('recurrence_parent'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
})

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  color: text('color').notNull(),
})

export const taskTags = sqliteTable('task_tags', {
  taskId: text('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  tagId: text('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
})

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  startDatetime: text('start_datetime').notNull(),
  endDatetime: text('end_datetime').notNull(),
  isAllDay: integer('is_all_day', { mode: 'boolean' }).default(false),
  color: text('color'),
  location: text('location'),
  eventType: text('event_type', { enum: ['evento', 'parcial', 'reunion', 'entrega', 'hito'] }).default('evento'),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'set null' }),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false),
  recurrenceRule: text('recurrence_rule'),
  recurrenceEnd: text('recurrence_end'),
  googleEventId: text('google_event_id'),
  googleCalendarId: text('google_calendar_id'),
  lastSynced: text('last_synced'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
})

export const postIts = sqliteTable('post_its', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  color: text('color').default('#A8E8F0'),
  linkedTaskId: text('linked_task_id').references(() => tasks.id, { onDelete: 'set null' }),
  positionX: real('position_x').default(0),
  positionY: real('position_y').default(0),
  width: real('width').default(200),
  height: real('height').default(200),
  zIndex: integer('z_index').default(0),
  isPinned: integer('is_pinned', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
})

export const pomodoroSessions = sqliteTable('pomodoro_sessions', {
  id: text('id').primaryKey(),
  taskId: text('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  durationMinutes: integer('duration_minutes').default(25),
  breakMinutes: integer('break_minutes').default(5),
  startedAt: text('started_at').notNull(),
  endedAt: text('ended_at'),
  wasCompleted: integer('was_completed', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
})

export const dashboardLayout = sqliteTable('dashboard_layout', {
  id: text('id').primaryKey(),
  widgetType: text('widget_type').notNull(),
  gridX: integer('grid_x').default(0),
  gridY: integer('grid_y').default(0),
  gridW: integer('grid_w').default(1),
  gridH: integer('grid_h').default(1),
  isVisible: integer('is_visible', { mode: 'boolean' }).default(true),
  config: text('config'),
})

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value'),
})

export const templates = sqliteTable('templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  structure: text('structure').notNull(),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
})

export const semesters = sqliteTable('semesters', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
})

export const subjects = sqliteTable('subjects', {
  id: text('id').primaryKey(),
  semesterId: text('semester_id').references(() => semesters.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  color: text('color').default('#01A7C2'),
  professor: text('professor'),
  description: text('description'),
  schedule: text('schedule'),
  attendanceThreshold: real('attendance_threshold').default(75),
  approvalThreshold: real('approval_threshold').default(60),
  finalGrade: real('final_grade'),
  finalStatus: text('final_status', { enum: ['en_curso', 'aprobada', 'desaprobada', 'libre'] }).default('en_curso'),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
})

export const subjectProjects = sqliteTable('subject_projects', {
  subjectId: text('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  projectId: text('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
})

export const classInstances = sqliteTable('class_instances', {
  id: text('id').primaryKey(),
  subjectId: text('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  date: text('date').notNull(),
  startTime: text('start_time'),
  endTime: text('end_time'),
  status: text('status', { enum: ['pendiente', 'asisti', 'falte', 'cancelada'] }).default('pendiente'),
  isManual: integer('is_manual', { mode: 'boolean' }).default(false),
  note: text('note'),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
  updatedAt: text('updated_at').default('CURRENT_TIMESTAMP'),
})

export const gradeCategories = sqliteTable('grade_categories', {
  id: text('id').primaryKey(),
  subjectId: text('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  weight: real('weight').notNull(),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
})

export const grades = sqliteTable('grades', {
  id: text('id').primaryKey(),
  categoryId: text('category_id').references(() => gradeCategories.id, { onDelete: 'cascade' }).notNull(),
  subjectId: text('subject_id').references(() => subjects.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  score: real('score'),
  maxScore: real('max_score').default(10),
  date: text('date'),
  note: text('note'),
  sortOrder: integer('sort_order').default(0),
  createdAt: text('created_at').default('CURRENT_TIMESTAMP'),
})
