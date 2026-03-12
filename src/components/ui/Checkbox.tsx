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
    <label className="checkbox">
      <button
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`checkbox__box ${checked ? 'checkbox__box--checked' : ''} ${disabled ? 'checkbox__box--disabled' : ''}`}
      >
        {checked && (
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          >
            <Check size={12} strokeWidth={3} className="checkbox__icon" />
          </motion.div>
        )}
      </button>
      {label && (
        <motion.span
          animate={{
            color: checked ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
          }}
          className={`checkbox__label ${checked ? 'checkbox__label--checked' : ''}`}
        >
          {label}
        </motion.span>
      )}
    </label>
  )
}
