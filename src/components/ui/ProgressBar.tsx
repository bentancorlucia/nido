import { motion } from 'framer-motion'

interface ProgressBarProps {
  value: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

const sizeStyles = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

export function ProgressBar({ value, size = 'md', showLabel = false, className = '' }: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value))

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`flex-1 rounded-full bg-surface-alt/40 overflow-hidden ${sizeStyles[size]} shadow-inner`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${clampedValue}%` }}
          transition={{ type: 'spring', stiffness: 80, damping: 18, delay: 0.1 }}
          className="h-full rounded-full bg-gradient-to-r from-primary via-[#38CFEA] to-accent relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 animate-shimmer" />
        </motion.div>
      </div>
      {showLabel && (
        <span className="text-[11px] font-semibold text-text-secondary font-mono min-w-[3ch] text-right tabular-nums">
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  )
}
