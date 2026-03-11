import { motion } from 'framer-motion'
import { X, Search } from 'lucide-react'
import { useTaskStore, type SortOption } from '../../stores/useTaskStore'
import { useTagStore } from '../../stores/useTagStore'
import { useEffect } from 'react'

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'sort_order', label: 'Manual' },
  { value: 'due_date', label: 'Fecha' },
  { value: 'priority', label: 'Prioridad' },
  { value: 'title', label: 'Nombre' },
  { value: 'created_at', label: 'Creación' },
]

const priorityOptions = [
  { value: 'alta', label: 'Alta', color: 'bg-priority-alta' },
  { value: 'media', label: 'Media', color: 'bg-priority-media' },
  { value: 'baja', label: 'Baja', color: 'bg-priority-baja' },
]

export function KanbanFilters() {
  const { filters, setFilters, resetFilters, sortBy, setSortBy } = useTaskStore()
  const { tags, loadTags } = useTagStore()

  useEffect(() => {
    loadTags()
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="px-8 py-3 border-b border-border flex flex-wrap items-center gap-2.5 overflow-hidden"
    >
      {/* Search */}
      <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl glass min-w-[200px]">
        <Search size={13} className="text-text-muted" />
        <input
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          placeholder="Buscar tareas..."
          className="text-[12.5px] bg-transparent outline-none text-text-primary placeholder:text-text-muted/45 flex-1"
        />
      </div>

      {/* Priority filter */}
      <div className="flex items-center gap-1.5">
        {priorityOptions.map((p) => (
          <button
            key={p.value}
            onClick={() => setFilters({ priority: filters.priority === p.value ? null : p.value })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
              filters.priority === p.value
                ? 'bg-primary-light/50 text-primary ring-1 ring-primary/15'
                : 'text-text-muted hover:bg-surface-alt/50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${p.color}`} />
            {p.label}
          </button>
        ))}
      </div>

      {/* Important filter */}
      <button
        onClick={() => setFilters({ important: filters.important === true ? null : true })}
        className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
          filters.important === true
            ? 'bg-accent/15 text-accent-dark ring-1 ring-accent/15'
            : 'text-text-muted hover:bg-surface-alt/50'
        }`}
      >
        ⭐ Importantes
      </button>

      {/* Overdue filter */}
      <button
        onClick={() => setFilters({ overdue: filters.overdue === true ? null : true })}
        className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
          filters.overdue === true
            ? 'bg-danger-light/50 text-danger ring-1 ring-danger/15'
            : 'text-text-muted hover:bg-surface-alt/50'
        }`}
      >
        Vencidas
      </button>

      {/* Tag filters */}
      {tags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => {
            const current = filters.tags
            const next = current.includes(tag.id)
              ? current.filter((t) => t !== tag.id)
              : [...current, tag.id]
            setFilters({ tags: next })
          }}
          className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all ${
            filters.tags.includes(tag.id)
              ? 'ring-1 ring-primary/15'
              : 'opacity-50 hover:opacity-100'
          }`}
          style={{
            backgroundColor: tag.color + '30',
            color: tag.color,
          }}
        >
          {tag.name}
        </button>
      ))}

      <div className="flex-1" />

      {/* Sort */}
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mr-1">Ordenar:</span>
        {sortOptions.map((s) => (
          <button
            key={s.value}
            onClick={() => setSortBy(s.value)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              sortBy === s.value
                ? 'bg-primary-light/50 text-primary'
                : 'text-text-muted hover:bg-surface-alt/50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Reset */}
      <button
        onClick={resetFilters}
        className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-light/40 transition-colors"
        title="Limpiar filtros"
      >
        <X size={13} />
      </button>
    </motion.div>
  )
}
