import { motion } from 'framer-motion'
import { Flame, Clock, Target } from 'lucide-react'
import { usePomodoroStore } from '../../stores/usePomodoroStore'
import { FadeIn } from '../../lib/animations'

export function PomodoroStats() {
  const { sessionsToday, totalFocusToday, streak, weeklyData } = usePomodoroStore()

  const maxCount = Math.max(1, ...weeklyData.map((d) => d.count))

  return (
    <div className="space-y-4">
      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        <FadeIn delay={0.05}>
          <div className="glass rounded-xl p-3.5 text-center">
            <div className="w-8 h-8 rounded-lg bg-primary-light/60 flex items-center justify-center mx-auto mb-2">
              <Target size={16} className="text-primary" />
            </div>
            <p className="text-2xl font-mono font-bold text-text-primary tabular-nums">{sessionsToday}</p>
            <p className="text-[11px] text-text-muted mt-0.5">Sesiones hoy</p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="glass rounded-xl p-3.5 text-center">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center mx-auto mb-2">
              <Clock size={16} className="text-accent-dark" />
            </div>
            <p className="text-2xl font-mono font-bold text-text-primary tabular-nums">{totalFocusToday}</p>
            <p className="text-[11px] text-text-muted mt-0.5">Min enfoque</p>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="glass rounded-xl p-3.5 text-center">
            <div className="w-8 h-8 rounded-lg bg-danger-light/60 flex items-center justify-center mx-auto mb-2">
              <Flame size={16} className="text-danger" />
            </div>
            <p className="text-2xl font-mono font-bold text-text-primary tabular-nums">{streak}</p>
            <p className="text-[11px] text-text-muted mt-0.5">Días de racha</p>
          </div>
        </FadeIn>
      </div>

      {/* Weekly chart */}
      <FadeIn delay={0.2}>
        <div className="glass rounded-xl p-4">
          <p className="section-label mb-3">Historial semanal</p>
          <div className="flex items-end justify-between gap-2 h-24">
            {weeklyData.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(4, (item.count / maxCount) * 80)}px` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.1 + i * 0.05 }}
                  className="w-full max-w-[28px] rounded-md"
                  style={{
                    background: item.count > 0
                      ? 'linear-gradient(to top, var(--color-primary), var(--color-primary-hover))'
                      : 'var(--color-surface-alt)',
                  }}
                />
                <span className="text-[10px] text-text-muted font-medium">{item.day}</span>
                {item.count > 0 && (
                  <span className="text-[9px] text-primary font-mono font-semibold -mt-1">{item.count}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
