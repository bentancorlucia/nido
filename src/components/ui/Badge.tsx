import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'info'

interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
  animate?: boolean
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
      className={`badge badge--${variant} ${className}`}
      {...animationProps}
    >
      {children}
    </Component>
  )
}
