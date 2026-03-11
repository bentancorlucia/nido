import { create } from 'zustand'
import { dbQuery, dbInsert, dbUpdate, dbDelete } from '../lib/ipc'
import type { PostIt } from '../types'

function uuid(): string {
  return crypto.randomUUID()
}

const POST_IT_COLORS = [
  { name: 'cyan', value: '#A8E8F0' },
  { name: 'lime', value: '#EEFAAA' },
  { name: 'rose', value: '#E8A0BC' },
  { name: 'mint', value: '#A0D4B8' },
  { name: 'lavender', value: '#E0D4EA' },
  { name: 'peach', value: '#F8D0B0' },
]

interface PostItState {
  postIts: PostIt[]
  loading: boolean
  colors: typeof POST_IT_COLORS

  loadPostIts: () => Promise<void>
  createPostIt: (content?: string, color?: string) => Promise<PostIt>
  updatePostIt: (id: string, data: Partial<PostIt>) => Promise<void>
  deletePostIt: (id: string) => Promise<void>
  movePostIt: (id: string, x: number, y: number) => Promise<void>
  resizePostIt: (id: string, w: number, h: number) => Promise<void>
  bringToFront: (id: string) => Promise<void>
  togglePin: (id: string) => Promise<void>
}

export const usePostItStore = create<PostItState>((set, get) => ({
  postIts: [],
  loading: false,
  colors: POST_IT_COLORS,

  loadPostIts: async () => {
    set({ loading: true })
    const postIts = await dbQuery<PostIt>(
      'SELECT * FROM post_its ORDER BY is_pinned DESC, z_index DESC'
    )
    set({ postIts, loading: false })
  },

  createPostIt: async (content = '', color?: string) => {
    const id = uuid()
    const now = new Date().toISOString()

    // Find max z_index
    const { postIts } = get()
    const maxZ = postIts.reduce((max, p) => Math.max(max, p.z_index), 0)

    // Random position within a reasonable area
    const x = 20 + Math.random() * 200
    const y = 20 + Math.random() * 200

    // Random color from palette if not specified
    const randomColor = POST_IT_COLORS[Math.floor(Math.random() * POST_IT_COLORS.length)].value

    const postIt: PostIt = {
      id,
      content,
      color: color ?? randomColor,
      linked_task_id: null,
      position_x: x,
      position_y: y,
      width: 200,
      height: 180,
      z_index: maxZ + 1,
      is_pinned: 0,
      created_at: now,
      updated_at: now,
    }

    await dbInsert('post_its', { ...postIt })
    set({ postIts: [postIt, ...get().postIts] })
    return postIt
  },

  updatePostIt: async (id, data) => {
    const cleanData: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() }
    delete cleanData.id
    await dbUpdate('post_its', id, cleanData)

    set({
      postIts: get().postIts.map((p) =>
        p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p
      ),
    })
  },

  deletePostIt: async (id) => {
    await dbDelete('post_its', id)
    set({ postIts: get().postIts.filter((p) => p.id !== id) })
  },

  movePostIt: async (id, x, y) => {
    await dbUpdate('post_its', id, {
      position_x: x,
      position_y: y,
      updated_at: new Date().toISOString(),
    })
    set({
      postIts: get().postIts.map((p) =>
        p.id === id ? { ...p, position_x: x, position_y: y } : p
      ),
    })
  },

  resizePostIt: async (id, w, h) => {
    await dbUpdate('post_its', id, {
      width: w,
      height: h,
      updated_at: new Date().toISOString(),
    })
    set({
      postIts: get().postIts.map((p) =>
        p.id === id ? { ...p, width: w, height: h } : p
      ),
    })
  },

  bringToFront: async (id) => {
    const { postIts } = get()
    const maxZ = postIts.reduce((max, p) => Math.max(max, p.z_index), 0)
    await dbUpdate('post_its', id, {
      z_index: maxZ + 1,
      updated_at: new Date().toISOString(),
    })
    set({
      postIts: postIts.map((p) =>
        p.id === id ? { ...p, z_index: maxZ + 1 } : p
      ),
    })
  },

  togglePin: async (id) => {
    const postIt = get().postIts.find((p) => p.id === id)
    if (!postIt) return
    const newPinned = postIt.is_pinned === 1 ? 0 : 1
    await dbUpdate('post_its', id, {
      is_pinned: newPinned,
      updated_at: new Date().toISOString(),
    })
    set({
      postIts: get().postIts.map((p) =>
        p.id === id ? { ...p, is_pinned: newPinned } : p
      ),
    })
  },
}))
