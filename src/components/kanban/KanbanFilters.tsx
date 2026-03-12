import { motion } from 'framer-motion'
import { X, Search, ArrowUpDown } from 'lucide-react'
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
  { value: 'alta', label: 'Alta', cls: 'kfilter__dot--alta' },
  { value: 'media', label: 'Media', cls: 'kfilter__dot--media' },
  { value: 'baja', label: 'Baja', cls: 'kfilter__dot--baja' },
]

export function KanbanFilters() {
  const { filters, setFilters, resetFilters, sortBy, setSortBy } = useTaskStore()
  const { tags, loadTags } = useTagStore()

  useEffect(() => {
    loadTags()
  }, [])

  const hasFilters = filters.search || filters.priority || filters.important || filters.overdue || filters.tags.length > 0

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="kfilters"
    >
      <div className="kfilters__inner">
        {/* Search */}
        <div className="kfilters__search">
          <Search size={13} />
          <input
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            placeholder="Buscar tareas..."
          />
        </div>

        <div className="kfilters__divider" />

        {/* Priority */}
        <div className="kfilters__group">
          {priorityOptions.map((p) => (
            <button
              key={p.value}
              onClick={() => setFilters({ priority: filters.priority === p.value ? null : p.value })}
              className={`kfilters__chip${filters.priority === p.value ? ' kfilters__chip--active' : ''}`}
            >
              <span className={`kfilters__dot ${p.cls}`} />
              {p.label}
            </button>
          ))}
        </div>

        <div className="kfilters__divider" />

        {/* Quick toggles */}
        <button
          onClick={() => setFilters({ important: filters.important === true ? null : true })}
          className={`kfilters__chip${filters.important === true ? ' kfilters__chip--star' : ''}`}
        >
          Importantes
        </button>
        <button
          onClick={() => setFilters({ overdue: filters.overdue === true ? null : true })}
          className={`kfilters__chip${filters.overdue === true ? ' kfilters__chip--danger' : ''}`}
        >
          Vencidas
        </button>

        {/* Tags */}
        {tags.length > 0 && (
          <>
            <div className="kfilters__divider" />
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
                className={`kfilters__tag${filters.tags.includes(tag.id) ? ' kfilters__tag--active' : ''}`}
                style={{
                  '--tag-color': tag.color,
                  '--tag-bg': tag.color + '25',
                } as React.CSSProperties}
              >
                {tag.name}
              </button>
            ))}
          </>
        )}

        <div className="kfilters__spacer" />

        {/* Sort */}
        <div className="kfilters__sort">
          <ArrowUpDown size={11} />
          {sortOptions.map((s) => (
            <button
              key={s.value}
              onClick={() => setSortBy(s.value)}
              className={`kfilters__sort-btn${sortBy === s.value ? ' kfilters__sort-btn--active' : ''}`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Reset */}
        {hasFilters && (
          <button onClick={resetFilters} className="kfilters__reset" title="Limpiar filtros">
            <X size={13} />
          </button>
        )}
      </div>
    </motion.div>
  )
}
