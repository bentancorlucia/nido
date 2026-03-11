import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-[13px] font-display font-medium text-text-secondary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3.5 py-2 rounded-xl border text-[13px]
            bg-surface-solid/30 text-text-primary placeholder:text-text-muted/40
            border-border hover:border-border-strong
            focus:border-border-focus focus:ring-2 focus:ring-border-focus/10
            focus:bg-surface-solid/50
            outline-none transition-all duration-200
            ${error ? 'border-danger focus:border-danger focus:ring-danger/12' : ''}
            ${className}
          `}
          {...props}
        />
        {error && <span className="text-[11px] text-danger font-medium mt-0.5">{error}</span>}
      </div>
    )
  }
)

Input.displayName = 'Input'
