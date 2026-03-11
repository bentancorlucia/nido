import { create } from 'zustand'
import { dbQuery, dbInsert, dbUpdate, dbDelete } from '../lib/ipc'
import type { Tag } from '../types'

function uuid(): string {
  return crypto.randomUUID()
}

export const TAG_COLORS = [
  { name: 'cyan', bg: '#D4F2F8', text: '#016A7A' },
  { name: 'lime', bg: '#F0FACC', text: '#5A6B10' },
  { name: 'berry', bg: '#F2D4E0', text: '#7E1946' },
  { name: 'forest', bg: '#D0E4DA', text: '#304B42' },
  { name: 'lavender', bg: '#E8DAF0', text: '#6B3A80' },
  { name: 'amber', bg: '#FDF3DC', text: '#8A6410' },
  { name: 'coral', bg: '#F8DCD4', text: '#A04030' },
  { name: 'slate', bg: '#D8E0DC', text: '#3A5048' },
] as const

interface TagState {
  tags: Tag[]
  loading: boolean
  loadTags: () => Promise<void>
  createTag: (name: string, color: string) => Promise<Tag>
  updateTag: (id: string, data: Partial<Tag>) => Promise<void>
  deleteTag: (id: string) => Promise<void>
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  loading: false,

  loadTags: async () => {
    set({ loading: true })
    const tags = await dbQuery<Tag>('SELECT * FROM tags ORDER BY name ASC')
    set({ tags, loading: false })
  },

  createTag: async (name, color) => {
    const id = uuid()
    const tag: Tag = { id, name, color }
    await dbInsert('tags', { ...tag })
    await get().loadTags()
    return tag
  },

  updateTag: async (id, data) => {
    const cleanData: Record<string, unknown> = { ...data }
    delete cleanData.id
    await dbUpdate('tags', id, cleanData)
    await get().loadTags()
  },

  deleteTag: async (id) => {
    await dbDelete('tags', id)
    await get().loadTags()
  },
}))
