import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  getDay,
  setDate,
  setMonth,
  isAfter,
  parseISO,
  format,
} from 'date-fns'

/**
 * Calculates the next occurrence date based on a recurrence rule.
 *
 * Rule formats:
 * - "daily"
 * - "weekly:1,3,5"         (days of week, 0=sunday..6=saturday)
 * - "monthly:15"            (day of month)
 * - "yearly:3-15"           (month-day)
 * - "weekdays"              (mon-fri)
 * - "custom:every_N_days"
 * - "custom:every_N_weeks"
 */
export function calculateNextOccurrence(
  rule: string,
  currentDate: Date
): Date | null {
  if (!rule) return null

  const [type, param] = rule.split(':')

  switch (type) {
    case 'daily':
      return addDays(currentDate, 1)

    case 'weekly': {
      if (!param) return addWeeks(currentDate, 1)
      const targetDays = param.split(',').map(Number)
      // Find next target day after currentDate
      for (let i = 1; i <= 7; i++) {
        const candidate = addDays(currentDate, i)
        if (targetDays.includes(getDay(candidate))) {
          return candidate
        }
      }
      return addWeeks(currentDate, 1)
    }

    case 'monthly': {
      const dayOfMonth = param ? parseInt(param) : currentDate.getDate()
      let next = addMonths(currentDate, 1)
      next = setDate(next, Math.min(dayOfMonth, daysInMonth(next)))
      return next
    }

    case 'yearly': {
      if (!param) return addYears(currentDate, 1)
      const [monthStr, dayStr] = param.split('-')
      const month = parseInt(monthStr) - 1 // 0-indexed
      const day = parseInt(dayStr)
      let next = new Date(currentDate.getFullYear() + 1, month, day)
      // If the target date hasn't passed this year, use this year
      const thisYear = new Date(currentDate.getFullYear(), month, day)
      if (isAfter(thisYear, currentDate)) {
        next = thisYear
      }
      return next
    }

    case 'weekdays': {
      let candidate = addDays(currentDate, 1)
      while (getDay(candidate) === 0 || getDay(candidate) === 6) {
        candidate = addDays(candidate, 1)
      }
      return candidate
    }

    case 'custom': {
      if (!param) return null
      const match = param.match(/every_(\d+)_(days|weeks)/)
      if (!match) return null
      const n = parseInt(match[1])
      return match[2] === 'weeks' ? addWeeks(currentDate, n) : addDays(currentDate, n)
    }

    default:
      return null
  }
}

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

/**
 * Generates the data for the next instance of a recurring task.
 * Returns the fields to create a new task, or null if recurrence has ended.
 */
export function generateNextInstanceData(task: {
  title: string
  description: string | null
  project_id: string | null
  column_id: string | null
  priority: string
  is_important: number
  estimated_minutes: number | null
  due_date: string | null
  is_recurring: number
  recurrence_rule: string | null
  recurrence_end: string | null
  recurrence_parent: string | null
  id: string
}): Record<string, unknown> | null {
  if (!task.is_recurring || !task.recurrence_rule) return null

  const currentDueDate = task.due_date ? parseISO(task.due_date) : new Date()
  const nextDate = calculateNextOccurrence(task.recurrence_rule, currentDueDate)

  if (!nextDate) return null

  // Check if recurrence has ended
  if (task.recurrence_end) {
    const endDate = parseISO(task.recurrence_end)
    if (isAfter(nextDate, endDate)) return null
  }

  const nextDueDateStr = format(nextDate, 'yyyy-MM-dd')

  return {
    title: task.title,
    description: task.description,
    project_id: task.project_id,
    column_id: task.column_id,
    priority: task.priority,
    is_important: task.is_important,
    estimated_minutes: task.estimated_minutes,
    due_date: nextDueDateStr,
    is_recurring: 1,
    recurrence_rule: task.recurrence_rule,
    recurrence_end: task.recurrence_end,
    recurrence_parent: task.recurrence_parent ?? task.id,
  }
}

/** Human-readable label for a recurrence rule */
export function recurrenceLabel(rule: string | null): string {
  if (!rule) return ''
  const [type, param] = rule.split(':')

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  switch (type) {
    case 'daily':
      return 'Todos los días'
    case 'weekly': {
      if (!param) return 'Cada semana'
      const days = param.split(',').map(Number)
      return `Semanal: ${days.map((d) => dayNames[d]).join(', ')}`
    }
    case 'monthly':
      return `Mensual (día ${param ?? '?'})`
    case 'yearly':
      return `Anual (${param ?? ''})`
    case 'weekdays':
      return 'Días hábiles (Lun-Vie)'
    case 'custom': {
      if (!param) return 'Personalizado'
      const match = param.match(/every_(\d+)_(days|weeks)/)
      if (!match) return 'Personalizado'
      const unit = match[2] === 'weeks' ? 'semanas' : 'días'
      return `Cada ${match[1]} ${unit}`
    }
    default:
      return rule
  }
}

/** Build a recurrence rule string from UI selections */
export function buildRecurrenceRule(
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekdays' | 'custom',
  options?: {
    weekDays?: number[]
    monthDay?: number
    yearDate?: string // "M-D"
    customInterval?: number
    customUnit?: 'days' | 'weeks'
  }
): string {
  switch (type) {
    case 'daily':
      return 'daily'
    case 'weekly':
      return options?.weekDays?.length
        ? `weekly:${options.weekDays.join(',')}`
        : 'weekly'
    case 'monthly':
      return `monthly:${options?.monthDay ?? 1}`
    case 'yearly':
      return `yearly:${options?.yearDate ?? '1-1'}`
    case 'weekdays':
      return 'weekdays'
    case 'custom': {
      const n = options?.customInterval ?? 2
      const unit = options?.customUnit ?? 'days'
      return `custom:every_${n}_${unit}`
    }
  }
}
