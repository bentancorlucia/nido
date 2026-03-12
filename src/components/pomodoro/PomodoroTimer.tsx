import { motion } from 'framer-motion'
import { usePomodoroStore } from '../../stores/usePomodoroStore'

interface PomodoroTimerProps {
  size?: number
}

export function PomodoroTimer({ size = 280 }: PomodoroTimerProps) {
  const { phase, timeRemaining, totalTime, isRunning, sessionNumber, sessionsPerCycle } =
    usePomodoroStore()

  const progress = totalTime > 0 ? 1 - timeRemaining / totalTime : 0
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60

  const center = size / 2
  const strokeWidth = 6
  const radius = center - strokeWidth * 2
  const circumference = 2 * Math.PI * radius

  const phaseColors = {
    work: { stroke: 'var(--color-primary)', glow: 'rgba(1, 167, 194, 0.25)', bg: 'var(--color-primary-light)' },
    break: { stroke: 'var(--color-accent-dark)', glow: 'rgba(221, 244, 91, 0.25)', bg: 'var(--color-success-bg)' },
    long_break: { stroke: 'var(--color-accent)', glow: 'rgba(221, 244, 91, 0.35)', bg: 'var(--color-success-bg)' },
  }

  const colors = phaseColors[phase]

  const phaseLabels = {
    work: 'Enfoque',
    break: 'Descanso',
    long_break: 'Descanso largo',
  }

  return (
    <div className="ptimer-root" style={{ width: size, height: size }}>
      {/* Ambient glow */}
      {isRunning && (
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="ptimer-glow"
          style={{
            background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
            transform: 'scale(1.15)',
          }}
        />
      )}

      <svg width={size} height={size} className="ptimer-svg">
        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--color-surface-alt)"
          strokeWidth={strokeWidth}
          opacity={0.5}
        />

        {/* Progress ring */}
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - progress) }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            filter: isRunning ? `drop-shadow(0 0 8px ${colors.glow})` : 'none',
          }}
        />

        {/* Tick marks for sessions */}
        {Array.from({ length: sessionsPerCycle }).map((_, i) => {
          const angle = (i / sessionsPerCycle) * 360 - 90
          const rad = (angle * Math.PI) / 180
          const innerR = radius - 12
          const outerR = radius - 6
          const x1 = center + innerR * Math.cos(rad)
          const y1 = center + innerR * Math.sin(rad)
          const x2 = center + outerR * Math.cos(rad)
          const y2 = center + outerR * Math.sin(rad)
          return (
            <line
              key={i}
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={i < sessionNumber ? colors.stroke : 'var(--color-border-strong)'}
              strokeWidth={2}
              strokeLinecap="round"
              opacity={i < sessionNumber ? 0.8 : 0.3}
            />
          )
        })}
      </svg>

      {/* Center content */}
      <div className="ptimer-center">
        <motion.span
          key={timeRemaining}
          className="ptimer-time"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
        </motion.span>
        <p className="ptimer-phase" style={{ color: colors.stroke }}>
          {phaseLabels[phase]}
        </p>
        <p className="ptimer-session">
          Sesión {sessionNumber} de {sessionsPerCycle}
        </p>
      </div>
    </div>
  )
}
