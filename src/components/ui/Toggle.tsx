import { motion } from 'framer-motion'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, disabled }: ToggleProps) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer select-none">
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative w-11 h-[26px] rounded-full transition-all duration-300
          ${checked
            ? 'bg-gradient-to-r from-primary to-[#38CFEA] shadow-glow'
            : 'bg-surface-alt border border-border-strong'
          }
          ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        `}
      >
        <motion.div
          animate={{ x: checked ? 20 : 3 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={`
            absolute top-[3px] w-5 h-5 rounded-full shadow-sm
            ${checked ? 'bg-white' : 'bg-text-muted/40'}
            transition-colors duration-200
          `}
        />
      </button>
      {label && <span className="text-[13.5px] text-text-primary">{label}</span>}
    </label>
  )
}
