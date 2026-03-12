import { useState, useEffect, useCallback, useRef } from 'react'
import Fuse from 'fuse.js'
import { dbQuery } from '../lib/ipc'
import type { Task, Project, CalendarEvent, PostIt, Tag } from '../types'

export type SearchResultType = 'task' | 'project' | 'event' | 'postit' | 'tag'

export interface SearchItem {
  type: SearchResultType
  id: string
  title: string
  description?: string | null
  meta?: string
}

const fuseOptions: Fuse.IFuseOptions<SearchItem> = {
  keys: [
    { name: 'title', weight: 2 },
    { name: 'description', weight: 1 },
    { name: 'meta', weight: 0.5 },
  ],
  threshold: 0.3,
  includeScore: true,
  includeMatches: true,
}

export function useSearch() {
  const [items, setItems] = useState<SearchItem[]>([])
  const [results, setResults] = useState<Fuse.FuseResult<SearchItem>[]>([])
  const [query, setQuery] = useState('')
  const fuseRef = useRef<Fuse<SearchItem> | null>(null)

  // Build index from all entities
  const buildIndex = useCallback(async () => {
    const allItems: SearchItem[] = []

    const [tasks, projects, events, postIts, tags] = await Promise.all([
      dbQuery<Task>('SELECT id, title, description FROM tasks WHERE is_archived = 0 LIMIT 500'),
      dbQuery<Project>('SELECT id, name, description FROM projects WHERE is_archived = 0 AND is_template = 0'),
      dbQuery<CalendarEvent>('SELECT id, title, description FROM events LIMIT 200'),
      dbQuery<PostIt>('SELECT id, content FROM post_its'),
      dbQuery<Tag>('SELECT id, name FROM tags'),
    ])

    for (const t of tasks) {
      allItems.push({ type: 'task', id: t.id, title: t.title, description: t.description })
    }
    for (const p of projects) {
      allItems.push({ type: 'project', id: p.id, title: p.name, description: p.description })
    }
    for (const e of events) {
      allItems.push({ type: 'event', id: e.id, title: e.title, description: e.description })
    }
    for (const p of postIts) {
      allItems.push({ type: 'postit', id: p.id, title: p.content.slice(0, 60) || 'Post-it vacío', description: p.content })
    }
    for (const t of tags) {
      allItems.push({ type: 'tag', id: t.id, title: t.name })
    }

    setItems(allItems)
    fuseRef.current = new Fuse(allItems, fuseOptions)
  }, [])

  useEffect(() => {
    buildIndex()
  }, [buildIndex])

  const search = useCallback((q: string) => {
    setQuery(q)
    if (!q.trim()) {
      setResults([])
      return
    }
    if (fuseRef.current) {
      setResults(fuseRef.current.search(q, { limit: 20 }))
    }
  }, [])

  const refresh = useCallback(() => {
    buildIndex()
  }, [buildIndex])

  return { query, results, search, refresh, items }
}
