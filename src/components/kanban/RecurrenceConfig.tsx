import { useState } from 'react'
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

const miniInput: React.CSSProperties = {
  width: 56,
  padding: '6px 8px',
  borderRadius: 8,
  border: '1.5px solid var(--color-border)',
  backgroundColor: 'var(--color-surface-solid)',
  fontSize: 12,
  fontFamily: 'var(--font-mono)',
  fontWeight: 500,
  color: 'var(--color-text-primary)',
  outline: 'none',
  textAlign: 'center',
  boxShadow: 'var(--shadow-inner)',
}

const miniSelect: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 8,
  border: '1.5px solid var(--color-border)',
  backgroundColor: 'var(--color-surface-solid)',
  fontSize: 12,
  fontWeight: 500,
  fontFamily: 'var(--font-sans)',
  color: 'var(--color-text-primary)',
  outline: 'none',
  cursor: 'pointer',
  boxShadow: 'var(--shadow-inner)',
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
    { value: 'weekdays', label: 'D\u00edas h\u00e1biles' },
    { value: 'custom', label: 'Personalizado' },
  ]

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <label style={{
          fontSize: 10,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-display)',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
        }}>
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
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
              {/* Current rule label */}
              {task.recurrence_rule && (
                <p style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-primary)',
                  margin: 0,
                }}>
                  {recurrenceLabel(task.recurrence_rule)}
                </p>
              )}

              {/* Type selector */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {typeOptions.map((opt) => (
                  <TypeChip
                    key={opt.value}
                    label={opt.label}
                    isActive={type === opt.value}
                    onClick={() => {
                      setType(opt.value)
                      updateRule(opt.value)
                    }}
                  />
                ))}
              </div>

              {/* Weekly: day selection */}
              {type === 'weekly' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  {WEEK_DAYS.map((day) => (
                    <DayChip
                      key={day.value}
                      label={day.label}
                      isActive={weekDays.includes(day.value)}
                      onClick={() => {
                        const next = weekDays.includes(day.value)
                          ? weekDays.filter((d) => d !== day.value)
                          : [...weekDays, day.value].sort()
                        setWeekDays(next)
                        updateRule('weekly', { weekDays: next })
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Monthly: day picker */}
              {type === 'monthly' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>D\u00eda</span>
                  <input
                    type="number"
                    value={monthDay}
                    onChange={(e) => {
                      const val = Math.min(31, Math.max(1, parseInt(e.target.value) || 1))
                      setMonthDay(val)
                      updateRule('monthly', { monthDay: val })
                    }}
                    style={miniInput}
                    min={1}
                    max={31}
                  />
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>de cada mes</span>
                </div>
              )}

              {/* Custom interval */}
              {type === 'custom' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Cada</span>
                  <input
                    type="number"
                    value={customInterval}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 2)
                      setCustomInterval(val)
                      updateRule('custom', { customInterval: val })
                    }}
                    style={miniInput}
                    min={1}
                  />
                  <select
                    value={customUnit}
                    onChange={(e) => {
                      const val = e.target.value as 'days' | 'weeks'
                      setCustomUnit(val)
                      updateRule('custom', { customUnit: val })
                    }}
                    style={miniSelect}
                  >
                    <option value="days">d\u00edas</option>
                    <option value="weeks">semanas</option>
                  </select>
                </div>
              )}

              {/* End date */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 500 }}>Finaliza:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value)
                    onSave({ recurrence_end: e.target.value || null })
                  }}
                  style={{
                    fontSize: 12,
                    backgroundColor: 'transparent',
                    outline: 'none',
                    border: 'none',
                    color: 'var(--color-text-primary)',
                    fontWeight: 500,
                    fontFamily: 'var(--font-sans)',
                    cursor: 'pointer',
                  }}
                />
                {endDate && (
                  <ClearDateButton onClick={() => {
                    setEndDate('')
                    onSave({ recurrence_end: null })
                  }} />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* Local sub-components */

function TypeChip({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '5px 12px',
        borderRadius: 8,
        border: isActive ? '1.5px solid var(--color-primary)' : '1.5px solid var(--color-border)',
        cursor: 'pointer',
        fontSize: 11,
        fontWeight: isActive ? 600 : 500,
        fontFamily: 'var(--font-sans)',
        backgroundColor: isActive ? 'var(--color-primary-light)' : (hover ? 'var(--color-surface-alt)' : 'var(--color-surface-solid)'),
        color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
        transition: 'all 150ms ease',
      }}
    >
      {label}
    </button>
  )
}

function DayChip({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 30,
        height: 30,
        borderRadius: 8,
        border: 'none',
        cursor: 'pointer',
        fontSize: 11,
        fontWeight: 600,
        fontFamily: 'var(--font-sans)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isActive ? 'var(--color-primary)' : (hover ? 'var(--color-surface-alt)' : 'var(--color-surface-solid)'),
        color: isActive ? 'white' : 'var(--color-text-muted)',
        transition: 'all 150ms ease',
        boxShadow: isActive ? '0 2px 8px rgba(1, 167, 194, 0.3)' : 'none',
      }}
    >
      {label}
    </button>
  )
}

function ClearDateButton({ onClick }: { onClick: () => void }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: 3,
        borderRadius: 6,
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: hover ? 'var(--color-surface-alt)' : 'transparent',
        color: hover ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
        transition: 'all 150ms ease',
      }}
    >
      <X size={11} />
    </button>
  )
}
