import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Repeat, X } from 'lucide-react'
import { Toggle } from '../ui/Toggle'
import { buildRecurrenceRule, recurrenceLabel } from '../../lib/recurrence'
import type { Task } from '../../types'

type RecurrenceType = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekdays' | 'custom'

interface RecurrenceConfigProps {
  task: Task
  onSave: (data: Partial<Task>) => void
}

const WEEK_DAYS = [
  { label: 'D', value: 0 },
  { label: 'L', value: 1 },
  { label: 'M', value: 2 },
  { label: 'M', value: 3 },
  { label: 'J', value: 4 },
  { label: 'V', value: 5 },
  { label: 'S', value: 6 },
]

function parseExistingRule(rule: string | null): {
  type: RecurrenceType
  weekDays: number[]
  monthDay: number
  customInterval: number
  customUnit: 'days' | 'weeks'
} {
  const defaults = { type: 'daily' as RecurrenceType, weekDays: [] as number[], monthDay: 1, customInterval: 2, customUnit: 'days' as const }
  if (!rule) return defaults

  const [t, param] = rule.split(':')
  switch (t) {
    case 'daily': return { ...defaults, type: 'daily' }
    case 'weekdays': return { ...defaults, type: 'weekdays' }
    case 'weekly': return { ...defaults, type: 'weekly', weekDays: param ? param.split(',').map(Number) : [] }
    case 'monthly': return { ...defaults, type: 'monthly', monthDay: param ? parseInt(param) : 1 }
    case 'yearly': return { ...defaults, type: 'yearly' }
    case 'custom': {
      const match = param?.match(/every_(\d+)_(days|weeks)/)
      return {
        ...defaults,
        type: 'custom',
        customInterval: match ? parseInt(match[1]) : 2,
        customUnit: (match?.[2] as 'days' | 'weeks') ?? 'days',
      }
    }
    default: return defaults
  }
}

export function RecurrenceConfig({ task, onSave }: RecurrenceConfigProps) {
  const isRecurring = task.is_recurring === 1
  const parsed = parseExistingRule(task.recurrence_rule)

  const [type, setType] = useState<RecurrenceType>(parsed.type)
  const [weekDays, setWeekDays] = useState<number[]>(parsed.weekDays)
  const [monthDay, setMonthDay] = useState(parsed.monthDay)
  const [customInterval, setCustomInterval] = useState(parsed.customInterval)
  const [customUnit, setCustomUnit] = useState<'days' | 'weeks'>(parsed.customUnit)
  const [endDate, setEndDate] = useState(task.recurrence_end ?? '')

  const toggleRecurring = (enabled: boolean) => {
    if (enabled) {
      const rule = buildRecurrenceRule(type, { weekDays, monthDay, customInterval, customUnit })
      onSave({
        is_recurring: 1,
        recurrence_rule: rule,
        recurrence_end: endDate || null,
      })
    } else {
      onSave({
        is_recurring: 0,
        recurrence_rule: null,
        recurrence_end: null,
      })
    }
  }

  const updateRule = (newType?: RecurrenceType, opts?: Record<string, unknown>) => {
    const t = newType ?? type
    const wd = (opts?.weekDays as number[]) ?? weekDays
    const md = (opts?.monthDay as number) ?? monthDay
    const ci = (opts?.customInterval as number) ?? customInterval
    const cu = (opts?.customUnit as 'days' | 'weeks') ?? customUnit

    const rule = buildRecurrenceRule(t, { weekDays: wd, monthDay: md, customInterval: ci, customUnit: cu })
    onSave({ recurrence_rule: rule })
  }

  const typeOptions: { value: RecurrenceType; label: string }[] = [
    { value: 'daily', label: 'Diaria' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensual' },
    { value: 'yearly', label: 'Anual' },
    { value: 'weekdays', label: 'Días hábiles' },
    { value: 'custom', label: 'Personalizado' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-[11px] text-text-muted uppercase tracking-wider font-medium flex items-center gap-1.5">
          <Repeat size={12} />
          Recurrencia
        </label>
        <Toggle checked={isRecurring} onChange={toggleRecurring} />
      </div>

      <AnimatePresence>
        {isRecurring && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-3"
          >
            {/* Current rule label */}
            {task.recurrence_rule && (
              <p className="text-[12px] text-primary font-medium">
                {recurrenceLabel(task.recurrence_rule)}
              </p>
            )}

            {/* Type selector */}
            <div className="flex gap-1.5 flex-wrap">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setType(opt.value)
                    updateRule(opt.value)
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    type === opt.value
                      ? 'ring-2 ring-primary/30 bg-primary-light/50 text-primary'
                      : 'bg-surface-alt/30 text-text-secondary hover:bg-surface-alt/60'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Weekly: day selection */}
            {type === 'weekly' && (
              <div className="flex gap-1.5">
                {WEEK_DAYS.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => {
                      const next = weekDays.includes(day.value)
                        ? weekDays.filter((d) => d !== day.value)
                        : [...weekDays, day.value].sort()
                      setWeekDays(next)
                      updateRule('weekly', { weekDays: next })
                    }}
                    className={`w-7 h-7 rounded-lg text-[11px] font-semibold transition-all ${
                      weekDays.includes(day.value)
                        ? 'bg-primary text-white'
                        : 'bg-surface-alt/30 text-text-muted hover:bg-surface-alt/60'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            )}

            {/* Monthly: day picker */}
            {type === 'monthly' && (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-text-secondary">Día</span>
                <input
                  type="number"
                  value={monthDay}
                  onChange={(e) => {
                    const val = Math.min(31, Math.max(1, parseInt(e.target.value) || 1))
                    setMonthDay(val)
                    updateRule('monthly', { monthDay: val })
                  }}
                  className="w-14 px-2 py-1 rounded-lg glass text-[12px] text-text-primary outline-none font-mono text-center"
                  min={1}
                  max={31}
                />
                <span className="text-[12px] text-text-muted">de cada mes</span>
              </div>
            )}

            {/* Custom interval */}
            {type === 'custom' && (
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-text-secondary">Cada</span>
                <input
                  type="number"
                  value={customInterval}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 2)
                    setCustomInterval(val)
                    updateRule('custom', { customInterval: val })
                  }}
                  className="w-14 px-2 py-1 rounded-lg glass text-[12px] text-text-primary outline-none font-mono text-center"
                  min={1}
                />
                <select
                  value={customUnit}
                  onChange={(e) => {
                    const val = e.target.value as 'days' | 'weeks'
                    setCustomUnit(val)
                    updateRule('custom', { customUnit: val })
                  }}
                  className="px-2 py-1 rounded-lg glass text-[12px] text-text-primary outline-none"
                >
                  <option value="days">días</option>
                  <option value="weeks">semanas</option>
                </select>
              </div>
            )}

            {/* End date */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-text-muted">Finaliza:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  onSave({ recurrence_end: e.target.value || null })
                }}
                className="text-[12px] bg-transparent outline-none text-text-primary"
              />
              {endDate && (
                <button
                  onClick={() => {
                    setEndDate('')
                    onSave({ recurrence_end: null })
                  }}
                  className="p-0.5 text-text-muted hover:text-text-primary"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
