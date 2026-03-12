import { motion } from 'framer-motion'

interface ProgressBarProps {
  value: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function ProgressBar({ value, size = 'md', showLabel = false, className = '' }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value))

  return (
    <div className={`progress-bar ${className}`}>
      <div className={`progress-bar__track progress-bar__track--${size}`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.1 }}
          className="progress-bar__fill"
        >
          <div className="progress-bar__shimmer" />
        </motion.div>
      </div>
      {showLabel && (
        <span className="progress-bar__label">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  )
}
