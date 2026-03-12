import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Flame } from 'lucide-react'
import { usePomodoroStore } from '../../stores/usePomodoroStore'

export function PomodoroWidget() {
  const {
    phase,
    isRunning,
    timeRemaining,
    totalTime,
    sessionNumber,
    sessionsPerCycle,
    sessionsToday,
    start,
    pause,
    reset,
    tick,
    loadSettings,
    loadStats,
  } = usePomodoroStore()

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    loadSettings()
    loadStats()
  }, [])

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(tick, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isRunning, tick])

  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const progress = totalTime > 0 ? ((totalTime - timeRemaining) / totalTime) * 100 : 0

  const phaseLabel = phase === 'work' ? 'Enfoque' : phase === 'break' ? 'Descanso' : 'Descanso largo'
  const isWork = phase === 'work'
  const ringColor = isWork ? 'var(--color-primary)' : 'var(--color-accent-dark)'

  const size = 140
  const strokeWidth = 7
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className="pomodoro-container">
      {/* Timer ring */}
      <div className="pomodoro-ring-wrap">
        <svg width={size} height={size} className="pomodoro-svg">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="pomodoro-ring-bg"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="pomodoro-ring-progress"
            style={{ stroke: ringColor }}
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference - (progress / 100) * circumference }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </svg>

        <div className="pomodoro-time-overlay">
          <span className="pomodoro-time-text">
            {String(minutes).padStart(2, '0')}
            <span className="pomodoro-time-separator">:</span>
            {String(seconds).padStart(2, '0')}
          </span>
          <span
            className="pomodoro-phase-label"
            style={{ color: isWork ? 'var(--color-primary)' : 'var(--color-accent-dark)' }}
          >
            {phaseLabel}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="pomodoro-controls">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          onClick={reset}
          className="pomodoro-reset-btn"
        >
          <RotateCcw size={14} />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.92 }}
          onClick={isRunning ? pause : start}
          className="pomodoro-play-btn"
          style={{
            background: isWork
              ? 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))'
              : 'linear-gradient(135deg, var(--color-accent-dark), var(--color-accent))',
            boxShadow: isWork
              ? '0 4px 14px rgba(1, 167, 194, 0.3)'
              : '0 4px 14px rgba(184, 204, 58, 0.3)',
          }}
        >
          {isRunning ? <Pause size={18} /> : <Play size={18} className="pomodoro-play-icon-offset" />}
        </motion.button>
      </div>

      {/* Stats */}
      <div className="pomodoro-stats">
        <span className="pomodoro-stat-badge">
          Sesión {sessionNumber}/{sessionsPerCycle}
        </span>
        <span className="pomodoro-stat-badge">
          <Flame size={11} className="pomodoro-flame-icon" />
          {sessionsToday} hoy
        </span>
      </div>
    </div>
  )
}
