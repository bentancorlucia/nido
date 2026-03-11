import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer select-none group">
      <button
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          w-[18px] h-[18px] rounded-[5px] border-[1.5px] flex items-center justify-center
          transition-all duration-200 flex-shrink-0
          ${checked
            ? 'bg-gradient-to-br from-accent to-accent-dark border-accent-dark shadow-sm'
            : 'border-border-strong hover:border-primary bg-surface-solid/30 group-hover:shadow-sm'
          }
          ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        `}
      >
        {checked && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <Check size={12} strokeWidth={3} className="text-text-on-accent" />
          </motion.div>
        )}
      </button>
      {label && (
        <motion.span
          animate={{
            color: checked ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
          }}
          className={`text-[13.5px] ${checked ? 'line-through decoration-text-muted/40' : ''}`}
        >
          {label}
        </motion.span>
      )}
    </label>
  )
}
