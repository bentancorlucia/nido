import { motion } from 'framer-motion'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className="toggle">
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`toggle__track ${checked ? 'toggle__track--checked' : ''} ${disabled ? 'toggle__track--disabled' : ''}`}
      >
        <motion.div
          animate={{ x: checked ? 20 : 3 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`toggle__thumb ${checked ? 'toggle__thumb--checked' : ''}`}
        />
      </button>
      {label && <span className="toggle__label">{label}</span>}
    </label>
  )
}
