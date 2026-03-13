import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Repeat } from 'lucide-react'
import { Toggle } from '../ui/Toggle'
import { buildRecurrenceRule, recurrenceLabel } from '../../lib/recurrence'
import type { Task } from '../../types'

type IntervalUnit = 'day' | 'week' | 'month' | 'year'
type EndMode = 'never' | 'on' | 'after'

interface RecurrenceConfigProps {
  task: Task
  onSave: (data: Partial<Task>) => void
}

const WEEK_DAYS = [
  { label: 'Do', value: 0 },
  { label: 'Lu', value: 1 },
  { label: 'Ma', value: 2 },
  { label: 'Mi', value: 3 },
  { label: 'Ju', value: 4 },
  { label: 'Vi', value: 5 },
  { label: 'Sa', value: 6 },
]

const UNIT_OPTIONS: { value: IntervalUnit; label: string; labelPlural: string }[] = [
  { value: 'day', label: 'día', labelPlural: 'días' },
  { value: 'week', label: 'semana', labelPlural: 'semanas' },
  { value: 'month', label: 'mes', labelPlural: 'meses' },
  { value: 'year', label: 'año', labelPlural: 'años' },
]

function parseExistingRule(rule: string | null, endDate: string | null): {
  interval: number
  unit: IntervalUnit
  weekDays: number[]
  monthDay: number
  endMode: EndMode
  endDateVal: string
  afterCount: number
} {
  const defaults = {
    interval: 1,
    unit: 'week' as IntervalUnit,
    weekDays: [] as number[],
    monthDay: 1,
    endMode: 'never' as EndMode,
    endDateVal: '',
    afterCount: 4,
  }

  if (endDate) {
    defaults.endMode = 'on'
    defaults.endDateVal = endDate
  }

  if (!rule) return defaults

  const [t, param] = rule.split(':')
  switch (t) {
    case 'daily':
      return { ...defaults, interval: 1, unit: 'day' }
    case 'weekdays':
      return { ...defaults, interval: 1, unit: 'week', weekDays: [1, 2, 3, 4, 5] }
    case 'weekly':
      return {
        ...defaults,
        interval: 1,
        unit: 'week',
        weekDays: param ? param.split(',').map(Number) : [],
      }
    case 'monthly':
      return { ...defaults, interval: 1, unit: 'month', monthDay: param ? parseInt(param) : 1 }
    case 'yearly':
      return { ...defaults, interval: 1, unit: 'year' }
    case 'custom': {
      const match = param?.match(/every_(\d+)_(days|weeks|months|years)/)
      if (!match) return defaults
      const unitMap: Record<string, IntervalUnit> = { days: 'day', weeks: 'week', months: 'month', years: 'year' }
      return {
        ...defaults,
        interval: parseInt(match[1]),
        unit: unitMap[match[2]] ?? 'day',
      }
    }
    default:
      return defaults
  }
}

function buildRule(interval: number, unit: IntervalUnit, weekDays: number[], monthDay: number): string {
  if (interval === 1) {
    switch (unit) {
      case 'day': return buildRecurrenceRule('daily')
      case 'week': return buildRecurrenceRule('weekly', { weekDays })
      case 'month': return buildRecurrenceRule('monthly', { monthDay })
      case 'year': return buildRecurrenceRule('yearly')
    }
  }
  const unitMap: Record<IntervalUnit, 'days' | 'weeks' | 'months' | 'years'> = {
    day: 'days', week: 'weeks', month: 'months', year: 'years',
  }
  return buildRecurrenceRule('custom', { customInterval: interval, customUnit: unitMap[unit] })
}

export function RecurrenceConfig({ task, onSave }: RecurrenceConfigProps) {
  const isRecurring = task.is_recurring === 1
  const parsed = parseExistingRule(task.recurrence_rule, task.recurrence_end ?? null)

  const [interval, setInterval] = useState(parsed.interval)
  const [unit, setUnit] = useState<IntervalUnit>(parsed.unit)
  const [weekDays, setWeekDays] = useState<number[]>(parsed.weekDays)
  const [monthDay, setMonthDay] = useState(parsed.monthDay)
  const [endMode, setEndMode] = useState<EndMode>(parsed.endMode)
  const [endDateVal, setEndDateVal] = useState(parsed.endDateVal)
  const [afterCount, setAfterCount] = useState(parsed.afterCount)

  const toggleRecurring = (enabled: boolean) => {
    if (enabled) {
      const rule = buildRule(interval, unit, weekDays, monthDay)
      onSave({
        is_recurring: 1,
        recurrence_rule: rule,
        recurrence_end: endMode === 'on' ? endDateVal || null : null,
      })
    } else {
      onSave({ is_recurring: 0, recurrence_rule: null, recurrence_end: null })
    }
  }

  const saveRule = (
    newInterval?: number,
    newUnit?: IntervalUnit,
    newWeekDays?: number[],
    newMonthDay?: number,
    newEndMode?: EndMode,
    newEndDate?: string,
  ) => {
    const i = newInterval ?? interval
    const u = newUnit ?? unit
    const wd = newWeekDays ?? weekDays
    const md = newMonthDay ?? monthDay
    const em = newEndMode ?? endMode
    const ed = newEndDate ?? endDateVal

    const rule = buildRule(i, u, wd, md)
    onSave({
      recurrence_rule: rule,
      recurrence_end: em === 'on' ? ed || null : null,
    })
  }

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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
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

              {/* ─── Every N [unit] ─── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={fieldLabel}>Cada</span>
                <input
                  type="number"
                  value={interval}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 1)
                    setInterval(val)
                    saveRule(val)
                  }}
                  min={1}
                  style={numberInput}
                />
                <select
                  value={unit}
                  onChange={(e) => {
                    const val = e.target.value as IntervalUnit
                    setUnit(val)
                    saveRule(undefined, val)
                  }}
                  style={selectInput}
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {interval > 1 ? opt.labelPlural : opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ─── Day of week chips (only for week unit) ─── */}
              {unit === 'week' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={fieldLabel}>En</span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {WEEK_DAYS.map((day) => {
                      const active = weekDays.includes(day.value)
                      return (
                        <button
                          key={day.value}
                          onClick={() => {
                            const next = active
                              ? weekDays.filter((d) => d !== day.value)
                              : [...weekDays, day.value].sort()
                            setWeekDays(next)
                            saveRule(undefined, undefined, next)
                          }}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            border: active ? '2px solid var(--color-primary)' : '1.5px solid var(--color-border)',
                            cursor: 'pointer',
                            fontSize: 11,
                            fontWeight: 600,
                            fontFamily: 'var(--font-sans)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: active ? 'var(--color-primary-light)' : 'transparent',
                            color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            transition: 'all 150ms ease',
                            padding: 0,
                          }}
                        >
                          {day.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ─── Day of month (only for month unit) ─── */}
              {unit === 'month' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={fieldLabel}>Día</span>
                  <input
                    type="number"
                    value={monthDay}
                    onChange={(e) => {
                      const val = Math.min(31, Math.max(1, parseInt(e.target.value) || 1))
                      setMonthDay(val)
                      saveRule(undefined, undefined, undefined, val)
                    }}
                    style={numberInput}
                    min={1}
                    max={31}
                  />
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>de cada mes</span>
                </div>
              )}

              {/* ─── Ends ─── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={fieldLabel}>Finaliza</span>

                {/* Never */}
                <RadioRow
                  active={endMode === 'never'}
                  onClick={() => {
                    setEndMode('never')
                    saveRule(undefined, undefined, undefined, undefined, 'never')
                  }}
                >
                  <span style={radioText}>Nunca</span>
                </RadioRow>

                {/* On date */}
                <RadioRow
                  active={endMode === 'on'}
                  onClick={() => {
                    setEndMode('on')
                    saveRule(undefined, undefined, undefined, undefined, 'on', endDateVal)
                  }}
                >
                  <span style={radioText}>El</span>
                  <input
                    type="date"
                    value={endDateVal}
                    onFocus={() => {
                      if (endMode !== 'on') {
                        setEndMode('on')
                        saveRule(undefined, undefined, undefined, undefined, 'on', endDateVal)
                      }
                    }}
                    onChange={(e) => {
                      setEndDateVal(e.target.value)
                      setEndMode('on')
                      saveRule(undefined, undefined, undefined, undefined, 'on', e.target.value)
                    }}
                    style={dateInput}
                  />
                </RadioRow>

                {/* After N times */}
                <RadioRow
                  active={endMode === 'after'}
                  onClick={() => {
                    setEndMode('after')
                    // "after" is informational — we don't persist count yet
                  }}
                >
                  <span style={radioText}>Después de</span>
                  <input
                    type="number"
                    value={afterCount}
                    onFocus={() => {
                      if (endMode !== 'after') setEndMode('after')
                    }}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value) || 1)
                      setAfterCount(val)
                      setEndMode('after')
                    }}
                    style={{ ...numberInput, width: 48 }}
                    min={1}
                  />
                  <span style={radioText}>veces</span>
                </RadioRow>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── Shared styles ─── */

const fieldLabel: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-sans)',
  minWidth: 36,
}

const radioText: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: 'var(--color-text-secondary)',
  fontFamily: 'var(--font-sans)',
}

const numberInput: React.CSSProperties = {
  width: 52,
  padding: '6px 8px',
  borderRadius: 8,
  border: '1.5px solid var(--color-border)',
  backgroundColor: 'var(--color-surface-solid)',
  fontSize: 13,
  fontFamily: 'var(--font-mono)',
  fontWeight: 500,
  color: 'var(--color-text-primary)',
  outline: 'none',
  textAlign: 'center',
}

const selectInput: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 8,
  border: '1.5px solid var(--color-border)',
  backgroundColor: 'var(--color-surface-solid)',
  fontSize: 13,
  fontWeight: 500,
  fontFamily: 'var(--font-sans)',
  color: 'var(--color-text-primary)',
  outline: 'none',
  cursor: 'pointer',
}

const dateInput: React.CSSProperties = {
  padding: '5px 10px',
  borderRadius: 8,
  border: '1.5px solid var(--color-border)',
  backgroundColor: 'var(--color-surface-solid)',
  fontSize: 13,
  fontWeight: 500,
  fontFamily: 'var(--font-sans)',
  color: 'var(--color-text-primary)',
  outline: 'none',
  cursor: 'pointer',
}

/* ─── Sub-components ─── */

function RadioRow({ active, onClick, children }: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        cursor: 'pointer',
        paddingLeft: 2,
      }}
    >
      <div style={{
        width: 18,
        height: 18,
        borderRadius: '50%',
        border: active ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        transition: 'border-color 150ms ease',
      }}>
        {active && (
          <div style={{
            width: 9,
            height: 9,
            borderRadius: '50%',
            backgroundColor: 'var(--color-primary)',
          }} />
        )}
      </div>
      {children}
    </div>
  )
}
