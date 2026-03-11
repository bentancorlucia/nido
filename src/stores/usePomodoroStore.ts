import { create } from 'zustand'
import { dbQuery, dbInsert, getSetting, setSetting } from '../lib/ipc'
import type { PomodoroSession, Task } from '../types'

function uuid(): string {
  return crypto.randomUUID()
}

type PomodoroPhase = 'work' | 'break' | 'long_break'

interface PomodoroState {
  // Timer state
  phase: PomodoroPhase
  isRunning: boolean
  timeRemaining: number // seconds
  totalTime: number // seconds for current phase
  sessionNumber: number // current session in cycle (1-based)
  sessionsPerCycle: number

  // Settings
  workMinutes: number
  breakMinutes: number
  longBreakMinutes: number
  autoStart: boolean
  soundEnabled: boolean

  // Task association
  selectedTaskId: string | null
  selectedTask: Task | null

  // Stats
  sessionsToday: number
  totalFocusToday: number // minutes
  streak: number // consecutive days
  weeklyData: { day: string; count: number }[]

  // Session tracking
  currentSessionId: string | null
  currentSessionStart: string | null

  // Actions
  loadSettings: () => Promise<void>
  loadStats: () => Promise<void>
  loadWeeklyData: () => Promise<void>

  selectTask: (task: Task | null) => void

  start: () => void
  pause: () => void
  reset: () => void
  skip: () => void
  tick: () => void

  completePhase: () => Promise<void>

  updateSetting: (key: string, value: number | boolean) => Promise<void>
}

export const usePomodoroStore = create<PomodoroState>((set, get) => ({
  phase: 'work',
  isRunning: false,
  timeRemaining: 25 * 60,
  totalTime: 25 * 60,
  sessionNumber: 1,
  sessionsPerCycle: 4,

  workMinutes: 25,
  breakMinutes: 5,
  longBreakMinutes: 15,
  autoStart: false,
  soundEnabled: true,

  selectedTaskId: null,
  selectedTask: null,

  sessionsToday: 0,
  totalFocusToday: 0,
  streak: 0,
  weeklyData: [],

  currentSessionId: null,
  currentSessionStart: null,

  loadSettings: async () => {
    try {
      const work = await getSetting('pomodoro_work_minutes')
      const brk = await getSetting('pomodoro_break_minutes')
      const longBrk = await getSetting('pomodoro_long_break_minutes')
      const auto = await getSetting('pomodoro_auto_start')
      const sound = await getSetting('pomodoro_sound')

      const workMin = work ? JSON.parse(work) : 25
      const breakMin = brk ? JSON.parse(brk) : 5
      const longBreakMin = longBrk ? JSON.parse(longBrk) : 15

      set({
        workMinutes: workMin,
        breakMinutes: breakMin,
        longBreakMinutes: longBreakMin,
        autoStart: auto ? JSON.parse(auto) : false,
        soundEnabled: sound ? JSON.parse(sound) : true,
        timeRemaining: workMin * 60,
        totalTime: workMin * 60,
      })
    } catch {
      // Use defaults
    }
  },

  loadStats: async () => {
    const today = new Date().toISOString().split('T')[0]

    // Sessions completed today
    const todayRows = await dbQuery<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM pomodoro_sessions
       WHERE was_completed = 1 AND date(started_at) = ?`,
      [today]
    )
    const sessionsToday = todayRows[0]?.cnt ?? 0

    // Total focus minutes today
    const focusRows = await dbQuery<{ total: number }>(
      `SELECT COALESCE(SUM(duration_minutes), 0) as total FROM pomodoro_sessions
       WHERE was_completed = 1 AND date(started_at) = ?`,
      [today]
    )
    const totalFocusToday = focusRows[0]?.total ?? 0

    // Streak: consecutive days with at least one completed session
    let streak = 0
    const checkDate = new Date()
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0]
      const rows = await dbQuery<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM pomodoro_sessions
         WHERE was_completed = 1 AND date(started_at) = ?`,
        [dateStr]
      )
      if ((rows[0]?.cnt ?? 0) > 0) {
        streak++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        break
      }
    }

    set({ sessionsToday, totalFocusToday, streak })
  },

  loadWeeklyData: async () => {
    const data: { day: string; count: number }[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      const rows = await dbQuery<{ cnt: number }>(
        `SELECT COUNT(*) as cnt FROM pomodoro_sessions
         WHERE was_completed = 1 AND date(started_at) = ?`,
        [dateStr]
      )
      const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
      data.push({ day: dayNames[d.getDay()], count: rows[0]?.cnt ?? 0 })
    }
    set({ weeklyData: data })
  },

  selectTask: (task) => {
    set({ selectedTaskId: task?.id ?? null, selectedTask: task })
  },

  start: () => {
    const { phase, workMinutes, currentSessionId } = get()
    const now = new Date().toISOString()

    if (!currentSessionId && phase === 'work') {
      const id = uuid()
      set({ currentSessionId: id, currentSessionStart: now })
    }

    set({ isRunning: true })
  },

  pause: () => {
    set({ isRunning: false })
  },

  reset: () => {
    const { phase, workMinutes, breakMinutes, longBreakMinutes } = get()
    let time: number
    if (phase === 'work') time = workMinutes * 60
    else if (phase === 'long_break') time = longBreakMinutes * 60
    else time = breakMinutes * 60

    set({
      isRunning: false,
      timeRemaining: time,
      totalTime: time,
      currentSessionId: null,
      currentSessionStart: null,
    })
  },

  skip: () => {
    get().completePhase()
  },

  tick: () => {
    const { timeRemaining, isRunning } = get()
    if (!isRunning) return

    if (timeRemaining <= 1) {
      set({ timeRemaining: 0, isRunning: false })
      get().completePhase()
    } else {
      set({ timeRemaining: timeRemaining - 1 })
    }
  },

  completePhase: async () => {
    const {
      phase,
      sessionNumber,
      sessionsPerCycle,
      workMinutes,
      breakMinutes,
      longBreakMinutes,
      autoStart,
      soundEnabled,
      selectedTaskId,
      currentSessionId,
      currentSessionStart,
    } = get()

    // Play sound
    if (soundEnabled) {
      try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = phase === 'work' ? 800 : 600
        osc.type = 'sine'
        gain.gain.setValueAtTime(0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
        osc.start()
        osc.stop(ctx.currentTime + 0.8)
      } catch {
        // Audio not available
      }
    }

    if (phase === 'work') {
      // Save completed work session
      if (currentSessionId && currentSessionStart) {
        await dbInsert('pomodoro_sessions', {
          id: currentSessionId,
          task_id: selectedTaskId,
          duration_minutes: workMinutes,
          break_minutes: breakMinutes,
          started_at: currentSessionStart,
          ended_at: new Date().toISOString(),
          was_completed: 1,
          created_at: new Date().toISOString(),
        })

        // Update task actual_minutes
        if (selectedTaskId) {
          const tasks = await dbQuery<{ actual_minutes: number }>(
            'SELECT actual_minutes FROM tasks WHERE id = ?',
            [selectedTaskId]
          )
          if (tasks[0]) {
            const newMinutes = (tasks[0].actual_minutes ?? 0) + workMinutes
            await window.nido.db.update('tasks', selectedTaskId, {
              actual_minutes: newMinutes,
              updated_at: new Date().toISOString(),
            })
          }
        }
      }

      // Determine next phase
      const isLongBreak = sessionNumber % sessionsPerCycle === 0
      const nextPhase: PomodoroPhase = isLongBreak ? 'long_break' : 'break'
      const nextTime = isLongBreak ? longBreakMinutes * 60 : breakMinutes * 60

      set({
        phase: nextPhase,
        timeRemaining: nextTime,
        totalTime: nextTime,
        isRunning: autoStart,
        currentSessionId: null,
        currentSessionStart: null,
      })

      // Reload stats
      await get().loadStats()
      await get().loadWeeklyData()
    } else {
      // Break finished, start next work session
      const nextSession = phase === 'long_break' ? 1 : sessionNumber + 1
      set({
        phase: 'work',
        timeRemaining: workMinutes * 60,
        totalTime: workMinutes * 60,
        sessionNumber: nextSession,
        isRunning: autoStart,
      })
    }
  },

  updateSetting: async (key, value) => {
    await setSetting(key, JSON.stringify(value))
    const settingMap: Record<string, string> = {
      pomodoro_work_minutes: 'workMinutes',
      pomodoro_break_minutes: 'breakMinutes',
      pomodoro_long_break_minutes: 'longBreakMinutes',
      pomodoro_auto_start: 'autoStart',
      pomodoro_sound: 'soundEnabled',
    }
    const stateKey = settingMap[key]
    if (stateKey) {
      set({ [stateKey]: value } as Partial<PomodoroState>)

      // If changing work minutes while in work phase and not running, update timer
      if (key === 'pomodoro_work_minutes' && get().phase === 'work' && !get().isRunning) {
        set({ timeRemaining: (value as number) * 60, totalTime: (value as number) * 60 })
      }
    }
  },
}))
