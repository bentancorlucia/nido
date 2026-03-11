import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'info'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
  animate?: boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-alt/50 text-text-secondary border border-border',
  success: 'bg-success-bg text-accent-dark border border-accent/12',
  danger: 'bg-danger-light text-danger border border-danger/8',
  warning: 'bg-warning-light text-warning border border-warning/8',
  info: 'bg-primary-light text-primary border border-primary/8',
}

export function Badge({ children, variant = 'default', className = '', animate = false }: BadgeProps) {
  const Component = animate ? motion.span : 'span'
  const animationProps = animate
    ? {
        initial: { scale: 0.8, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { type: 'spring' as const, stiffness: 500, damping: 30 },
      }
    : {}

  return (
    <Component
      className={`
        inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold tracking-wide
        rounded-full whitespace-nowrap leading-relaxed
        ${variantStyles[variant]}
        ${className}
      `}
      {...animationProps}
    >
      {children}
    </Component>
  )
}
