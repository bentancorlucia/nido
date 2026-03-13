import { create } from 'zustand'
import { dbQuery, dbInsert, dbUpdate, dbDelete, dbRun } from '../lib/ipc'
import type {
  Semester, Subject, ClassInstance, GradeCategory, Grade,
  AttendanceStats, WeightedAverageResult, ScheduleEntry, Project,
} from '../types'

function uuid(): string {
  return crypto.randomUUID()
}

type SubjectTab = 'asistencia' | 'notas' | 'info'

interface FacultyState {
  semesters: Semester[]
  activeSemesterId: string | null
  subjects: Subject[]
  selectedSubjectId: string | null
  selectedTab: SubjectTab
  classInstances: ClassInstance[]
  gradeCategories: GradeCategory[]
  grades: Grade[]
  linkedProjects: Project[]
  loading: boolean

  // Semesters
  loadSemesters: () => Promise<void>
  createSemester: (data: { name: string; start_date: string; end_date: string }) => Promise<Semester>
  updateSemester: (id: string, data: Partial<Semester>) => Promise<void>
  deleteSemester: (id: string) => Promise<void>
  setActiveSemester: (id: string) => Promise<void>

  // Subjects
  loadSubjects: (semesterId: string) => Promise<void>
  selectSubject: (id: string | null) => void
  setSelectedTab: (tab: SubjectTab) => void
  createSubject: (data: {
    semester_id: string
    name: string
    color?: string
    professor?: string
    description?: string
    schedule?: string
    attendance_threshold?: number
    approval_threshold?: number
  }) => Promise<Subject>
  updateSubject: (id: string, data: Partial<Subject>) => Promise<void>
  deleteSubject: (id: string) => Promise<void>
  setFinalGrade: (id: string, grade: number, status: Subject['final_status']) => Promise<void>

  // Projects link
  loadLinkedProjects: (subjectId: string) => Promise<void>
  linkProject: (subjectId: string, projectId: string) => Promise<void>
  unlinkProject: (subjectId: string, projectId: string) => Promise<void>

  // Attendance
  loadClassInstances: (subjectId: string) => Promise<void>
  generateClassInstances: (subjectId: string, fromDate?: string) => Promise<void>
  updateClassStatus: (instanceId: string, status: ClassInstance['status']) => Promise<void>
  addManualClass: (subjectId: string, data: { date: string; start_time?: string; end_time?: string }) => Promise<void>
  deleteClassInstance: (instanceId: string) => Promise<void>
  getAttendanceStats: (subjectId: string) => AttendanceStats

  // Grades
  loadGradeCategories: (subjectId: string) => Promise<void>
  loadGrades: (subjectId: string) => Promise<void>
  createGradeCategory: (subjectId: string, data: { name: string; weight: number }) => Promise<void>
  updateGradeCategory: (id: string, data: Partial<GradeCategory>) => Promise<void>
  deleteGradeCategory: (id: string) => Promise<void>
  createGrade: (data: { category_id: string; subject_id: string; name: string; score?: number; max_score?: number; date?: string }) => Promise<void>
  updateGrade: (id: string, data: Partial<Grade>) => Promise<void>
  deleteGrade: (id: string) => Promise<void>
  getWeightedAverage: (subjectId: string) => WeightedAverageResult | null
}

export const useFacultyStore = create<FacultyState>((set, get) => ({
  semesters: [],
  activeSemesterId: null,
  subjects: [],
  selectedSubjectId: null,
  selectedTab: 'asistencia',
  classInstances: [],
  gradeCategories: [],
  grades: [],
  linkedProjects: [],
  loading: false,

  // --- Semesters ---
  loadSemesters: async () => {
    const semesters = await dbQuery<Semester>('SELECT * FROM semesters ORDER BY start_date DESC')
    // is_active can come as 1, true, or "1" depending on driver — use loose check
    const active = semesters.find((s) => !!s.is_active)
    set({ semesters, activeSemesterId: active?.id ?? semesters[0]?.id ?? null })
  },

  createSemester: async (data) => {
    const id = uuid()
    const now = new Date().toISOString()
    // Deactivate all existing semesters first
    await dbRun('UPDATE semesters SET is_active = 0')
    // Then insert the new one as active
    await dbInsert('semesters', { id, ...data, is_active: 1, created_at: now, updated_at: now })
    await get().loadSemesters()
    return { id, ...data, is_active: 1, created_at: now, updated_at: now }
  },

  updateSemester: async (id, data) => {
    await dbUpdate('semesters', id, { ...data, updated_at: new Date().toISOString() })
    await get().loadSemesters()
  },

  deleteSemester: async (id) => {
    await dbDelete('semesters', id)
    await get().loadSemesters()
  },

  setActiveSemester: async (id) => {
    await dbRun('UPDATE semesters SET is_active = 0')
    await dbRun('UPDATE semesters SET is_active = 1 WHERE id = ?', [id])
    set({ activeSemesterId: id })
    await get().loadSubjects(id)
  },

  // --- Subjects ---
  loadSubjects: async (semesterId) => {
    const subjects = await dbQuery<Subject>(
      'SELECT * FROM subjects WHERE semester_id = ? ORDER BY sort_order, name',
      [semesterId]
    )
    // Preload all class instances and grades for the semester so cards can show stats
    const subjectIds = subjects.map((s) => s.id)
    let allInstances: ClassInstance[] = []
    let allGradeCategories: GradeCategory[] = []
    let allGrades: Grade[] = []
    if (subjectIds.length > 0) {
      const placeholders = subjectIds.map(() => '?').join(',')
      allInstances = await dbQuery<ClassInstance>(
        `SELECT * FROM class_instances WHERE subject_id IN (${placeholders}) ORDER BY date ASC, start_time ASC`,
        subjectIds
      )
      allGradeCategories = await dbQuery<GradeCategory>(
        `SELECT * FROM grade_categories WHERE subject_id IN (${placeholders}) ORDER BY sort_order, name`,
        subjectIds
      )
      allGrades = await dbQuery<Grade>(
        `SELECT * FROM grades WHERE subject_id IN (${placeholders}) ORDER BY sort_order, date`,
        subjectIds
      )
    }
    set({ subjects, classInstances: allInstances, gradeCategories: allGradeCategories, grades: allGrades })
  },

  selectSubject: (id) => {
    set({ selectedSubjectId: id, selectedTab: 'asistencia' })
    if (id) {
      get().loadClassInstances(id)
      get().loadGradeCategories(id)
      get().loadGrades(id)
      get().loadLinkedProjects(id)
    }
  },

  setSelectedTab: (tab) => set({ selectedTab: tab }),

  createSubject: async (data) => {
    const id = uuid()
    const now = new Date().toISOString()
    const subject: Record<string, unknown> = {
      id,
      semester_id: data.semester_id,
      name: data.name,
      color: data.color ?? '#01A7C2',
      professor: data.professor ?? null,
      description: data.description ?? null,
      schedule: data.schedule ?? null,
      attendance_threshold: data.attendance_threshold ?? 75,
      approval_threshold: data.approval_threshold ?? 60,
      final_grade: null,
      final_status: 'en_curso',
      sort_order: 0,
      created_at: now,
      updated_at: now,
    }
    await dbInsert('subjects', subject)
    await get().loadSubjects(data.semester_id)
    return subject as unknown as Subject
  },

  updateSubject: async (id, data) => {
    await dbUpdate('subjects', id, { ...data, updated_at: new Date().toISOString() })
    const { activeSemesterId } = get()
    if (activeSemesterId) await get().loadSubjects(activeSemesterId)
  },

  deleteSubject: async (id) => {
    await dbDelete('subjects', id)
    const { activeSemesterId } = get()
    if (activeSemesterId) await get().loadSubjects(activeSemesterId)
    set({ selectedSubjectId: null })
  },

  setFinalGrade: async (id, grade, status) => {
    await dbUpdate('subjects', id, { final_grade: grade, final_status: status, updated_at: new Date().toISOString() })
    const { activeSemesterId } = get()
    if (activeSemesterId) await get().loadSubjects(activeSemesterId)
  },

  // --- Linked Projects ---
  loadLinkedProjects: async (subjectId) => {
    const projects = await dbQuery<Project>(
      `SELECT p.* FROM projects p
       INNER JOIN subject_projects sp ON sp.project_id = p.id
       WHERE sp.subject_id = ?`,
      [subjectId]
    )
    set({ linkedProjects: projects })
  },

  linkProject: async (subjectId, projectId) => {
    await dbRun(
      'INSERT OR IGNORE INTO subject_projects (subject_id, project_id) VALUES (?, ?)',
      [subjectId, projectId]
    )
    await get().loadLinkedProjects(subjectId)
  },

  unlinkProject: async (subjectId, projectId) => {
    await dbRun(
      'DELETE FROM subject_projects WHERE subject_id = ? AND project_id = ?',
      [subjectId, projectId]
    )
    await get().loadLinkedProjects(subjectId)
  },

  // --- Attendance ---
  loadClassInstances: async (subjectId) => {
    const instances = await dbQuery<ClassInstance>(
      'SELECT * FROM class_instances WHERE subject_id = ? ORDER BY date ASC, start_time ASC',
      [subjectId]
    )
    // Merge: replace only this subject's instances, keep others
    const other = get().classInstances.filter((c) => c.subject_id !== subjectId)
    set({ classInstances: [...other, ...instances] })
  },

  generateClassInstances: async (subjectId) => {
    const subject = get().subjects.find((s) => s.id === subjectId)
    if (!subject?.schedule) return

    const semester = get().semesters.find((s) => s.id === subject.semester_id)
    if (!semester) return

    const rawSchedule: ScheduleEntry[] = JSON.parse(subject.schedule)
    if (rawSchedule.length === 0) return

    // Deduplicate schedule entries (same day + start + end)
    const seen = new Set<string>()
    const schedule = rawSchedule.filter((e) => {
      const k = `${e.day}_${e.start}_${e.end}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })

    // Delete all auto-generated instances (keep manual ones and ones already marked)
    await dbRun(
      `DELETE FROM class_instances WHERE subject_id = ? AND is_manual = 0 AND status = 'pendiente'`,
      [subjectId]
    )

    // Keep track of remaining instances (manual + already marked) to avoid duplicates
    const existing = await dbQuery<{ date: string; start_time: string | null }>(
      'SELECT date, start_time FROM class_instances WHERE subject_id = ?',
      [subjectId]
    )
    const existingSet = new Set(existing.map((e) => `${e.date}_${e.start_time ?? ''}`))

    // Use T12:00:00 to avoid timezone boundary issues (UTC vs local)
    const startDate = new Date(semester.start_date + 'T12:00:00')
    const endDate = new Date(semester.end_date + 'T12:00:00')
    const current = new Date(startDate)

    const inserts: { id: string; subject_id: string; date: string; start_time: string; end_time: string; status: string; is_manual: number }[] = []

    while (current <= endDate) {
      const dayOfWeek = current.getDay()
      const y = current.getFullYear()
      const m = String(current.getMonth() + 1).padStart(2, '0')
      const d = String(current.getDate()).padStart(2, '0')
      const dateStr = `${y}-${m}-${d}`

      for (const entry of schedule) {
        if (entry.day === dayOfWeek) {
          const key = `${dateStr}_${entry.start}`
          if (!existingSet.has(key)) {
            existingSet.add(key)
            inserts.push({
              id: uuid(),
              subject_id: subjectId,
              date: dateStr,
              start_time: entry.start,
              end_time: entry.end,
              status: 'pendiente',
              is_manual: 0,
            })
          }
        }
      }
      current.setDate(current.getDate() + 1)
    }

    for (const ins of inserts) {
      await dbInsert('class_instances', ins)
    }

    await get().loadClassInstances(subjectId)
  },

  updateClassStatus: async (instanceId, status) => {
    await dbUpdate('class_instances', instanceId, { status, updated_at: new Date().toISOString() })
    const instance = get().classInstances.find((c) => c.id === instanceId)
    if (instance) await get().loadClassInstances(instance.subject_id)
  },

  addManualClass: async (subjectId, data) => {
    const id = uuid()
    await dbInsert('class_instances', {
      id,
      subject_id: subjectId,
      date: data.date,
      start_time: data.start_time ?? null,
      end_time: data.end_time ?? null,
      status: 'pendiente',
      is_manual: 1,
    })
    await get().loadClassInstances(subjectId)
  },

  deleteClassInstance: async (instanceId) => {
    const instance = get().classInstances.find((c) => c.id === instanceId)
    await dbDelete('class_instances', instanceId)
    if (instance) await get().loadClassInstances(instance.subject_id)
  },

  getAttendanceStats: (subjectId) => {
    const instances = get().classInstances.filter((c) => c.subject_id === subjectId)
    const subject = get().subjects.find((s) => s.id === subjectId)
    const threshold = subject?.attendance_threshold ?? 75

    const attended = instances.filter((c) => c.status === 'asisti').length
    const absent = instances.filter((c) => c.status === 'falte').length
    const cancelled = instances.filter((c) => c.status === 'cancelada').length
    const pending = instances.filter((c) => c.status === 'pendiente').length
    const total = instances.length

    const denominator = total - cancelled - pending
    const percentage = denominator > 0 ? (attended / denominator) * 100 : 0
    const atRisk = denominator > 0 ? percentage < threshold : false

    return { total, attended, absent, cancelled, pending, percentage, threshold, atRisk }
  },

  // --- Grades ---
  loadGradeCategories: async (subjectId) => {
    const categories = await dbQuery<GradeCategory>(
      'SELECT * FROM grade_categories WHERE subject_id = ? ORDER BY sort_order, name',
      [subjectId]
    )
    const other = get().gradeCategories.filter((c) => c.subject_id !== subjectId)
    set({ gradeCategories: [...other, ...categories] })
  },

  loadGrades: async (subjectId) => {
    const grades = await dbQuery<Grade>(
      'SELECT * FROM grades WHERE subject_id = ? ORDER BY sort_order, date',
      [subjectId]
    )
    const other = get().grades.filter((g) => g.subject_id !== subjectId)
    set({ grades: [...other, ...grades] })
  },

  createGradeCategory: async (subjectId, data) => {
    const id = uuid()
    await dbInsert('grade_categories', {
      id,
      subject_id: subjectId,
      name: data.name,
      weight: data.weight,
      sort_order: 0,
    })
    await get().loadGradeCategories(subjectId)
  },

  updateGradeCategory: async (id, data) => {
    const cat = get().gradeCategories.find((c) => c.id === id)
    await dbRun(
      `UPDATE grade_categories SET ${Object.keys(data).map((k) => `${k} = ?`).join(', ')} WHERE id = ?`,
      [...Object.values(data), id]
    )
    if (cat) await get().loadGradeCategories(cat.subject_id)
  },

  deleteGradeCategory: async (id) => {
    const cat = get().gradeCategories.find((c) => c.id === id)
    await dbDelete('grade_categories', id)
    if (cat) await get().loadGradeCategories(cat.subject_id)
  },

  createGrade: async (data) => {
    const id = uuid()
    await dbInsert('grades', {
      id,
      category_id: data.category_id,
      subject_id: data.subject_id,
      name: data.name,
      score: data.score ?? null,
      max_score: data.max_score ?? 10,
      date: data.date ?? null,
      sort_order: 0,
    })
    await get().loadGrades(data.subject_id)
  },

  updateGrade: async (id, data) => {
    const grade = get().grades.find((g) => g.id === id)
    await dbRun(
      `UPDATE grades SET ${Object.keys(data).map((k) => `${k} = ?`).join(', ')} WHERE id = ?`,
      [...Object.values(data), id]
    )
    if (grade) await get().loadGrades(grade.subject_id)
  },

  deleteGrade: async (id) => {
    const grade = get().grades.find((g) => g.id === id)
    await dbDelete('grades', id)
    if (grade) await get().loadGrades(grade.subject_id)
  },

  getWeightedAverage: (subjectId) => {
    const categories = get().gradeCategories.filter((c) => c.subject_id === subjectId)
    const allGrades = get().grades.filter((g) => g.subject_id === subjectId)
    const subject = get().subjects.find((s) => s.id === subjectId)

    if (categories.length === 0) return null

    const catResults = categories.map((cat) => {
      const catGrades = allGrades.filter((g) => g.category_id === cat.id)
      const graded = catGrades.filter((g) => g.score !== null)
      const average = graded.length > 0
        ? graded.reduce((sum, g) => sum + (g.score! / g.max_score), 0) / graded.length
        : null

      return {
        id: cat.id,
        name: cat.name,
        weight: cat.weight,
        average,
        gradeCount: catGrades.length,
        gradedCount: graded.length,
      }
    })

    const catsWithGrades = catResults.filter((c) => c.average !== null)
    if (catsWithGrades.length === 0) {
      return { overall: null, categories: catResults, meetsThreshold: null }
    }

    const totalWeight = catsWithGrades.reduce((sum, c) => sum + c.weight, 0)
    const overall = catsWithGrades.reduce((sum, c) => sum + c.average! * c.weight, 0) / totalWeight

    const threshold = subject?.approval_threshold ?? 60
    const meetsThreshold = (overall * 100) >= threshold

    return { overall, categories: catResults, meetsThreshold }
  },
}))
