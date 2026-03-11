import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, RotateCcw, Timer } from 'lucide-react'
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
  const phaseColor = phase === 'work' ? 'text-primary' : 'text-accent-dark'
  const ringColor = phase === 'work' ? 'stroke-primary' : 'stroke-accent'

  // SVG ring params
  const size = 80
  const strokeWidth = 4
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      {/* Timer ring */}
      <div className="relative">
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className="stroke-surface-alt"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            className={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: circumference - (progress / 100) * circumference }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-mono font-bold text-text-primary leading-none">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
          <span className={`text-[9px] font-medium mt-0.5 ${phaseColor}`}>{phaseLabel}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={reset}
          className="w-7 h-7 rounded-full bg-surface-alt flex items-center justify-center hover:bg-border transition-colors"
        >
          <RotateCcw size={12} className="text-text-muted" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.93 }}
          onClick={isRunning ? pause : start}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-hover text-white flex items-center justify-center shadow-sm"
        >
          {isRunning ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
        </motion.button>
      </div>

      {/* Session info */}
      <div className="flex items-center gap-3 text-[10px] text-text-muted">
        <span className="flex items-center gap-1">
          <Timer size={10} />
          Sesión {sessionNumber}/{sessionsPerCycle}
        </span>
        <span>{sessionsToday} hoy</span>
      </div>
    </div>
  )
}
