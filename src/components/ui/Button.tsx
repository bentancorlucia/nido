import { type ButtonHTMLAttributes, type ReactNode } from 'react'
import { motion } from 'framer-motion'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  variant?: Variant
  size?: Size
  children: ReactNode
  icon?: ReactNode
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-primary to-primary-hover text-text-on-primary shadow-sm hover:shadow-md',
  secondary:
    'border border-border-strong text-primary hover:bg-primary-light/40 bg-transparent hover:border-primary/25',
  danger:
    'bg-gradient-to-r from-danger to-danger-hover text-text-on-danger shadow-sm hover:shadow-md',
  ghost:
    'text-text-secondary hover:text-text-primary hover:bg-surface-alt/40 bg-transparent',
}

const sizeStyles: Record<Size, string> = {
  sm: 'text-[12px] px-3 py-1.5 gap-1.5 rounded-lg',
  md: 'text-[13px] px-4 py-2 gap-2 rounded-xl',
  lg: 'text-[14px] px-5 py-2.5 gap-2.5 rounded-xl',
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-200 cursor-pointer tracking-tight
        disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled}
      {...props}
    >
      {icon}
      {children}
    </motion.button>
  )
}
