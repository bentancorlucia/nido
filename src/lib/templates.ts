import { dbQuery, dbInsert } from './ipc'
import type { Template, Project } from '../types'

interface TemplateNode {
  name: string
  children?: TemplateNode[]
  tasks?: string[]
}

function uuid(): string {
  return crypto.randomUUID()
}

/**
 * Load all templates from DB
 */
export async function loadTemplates(): Promise<Template[]> {
  return dbQuery<Template>('SELECT * FROM templates ORDER BY name ASC')
}

/**
 * Apply a template, creating projects and tasks recursively.
 * Variables like {{nombre_materia}} are replaced with user-provided values.
 */
export async function applyTemplate(
  templateId: string,
  variables: Record<string, string>
): Promise<string> {
  const templates = await dbQuery<Template>(
    'SELECT * FROM templates WHERE id = ?',
    [templateId]
  )
  if (templates.length === 0) throw new Error('Template not found')

  const template = templates[0]
  const structure: TemplateNode = JSON.parse(template.structure)

  // Replace variables in name
  const rootName = replaceVariables(structure.name, variables)
  const rootId = await createProjectFromNode(
    { ...structure, name: rootName },
    null,
    variables,
    0
  )

  return rootId
}

/**
 * Save an existing project as a template
 */
export async function saveProjectAsTemplate(
  projectId: string,
  name: string,
  description: string
): Promise<void> {
  const structure = await buildTemplateStructure(projectId)
  const id = uuid()
  const now = new Date().toISOString()

  await dbInsert('templates', {
    id,
    name,
    description,
    structure: JSON.stringify(structure),
    created_at: now,
  })
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: string): Promise<void> {
  await window.nido.db.delete('templates', templateId)
}

/**
 * Extract variables from a template structure (e.g. {{nombre_materia}})
 */
export function extractVariables(structure: string): string[] {
  const matches = structure.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  return [...new Set(matches.map((m) => m.replace(/\{\{|\}\}/g, '')))]
}

// --- Internal helpers ---

function replaceVariables(text: string, variables: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`)
}

const DEFAULT_COLUMNS = [
  { name: 'Por hacer', sort_order: 0, is_default: 1 },
  { name: 'En proceso', sort_order: 1, is_default: 1 },
  { name: 'Realizado', sort_order: 2, is_default: 1 },
]

async function createProjectFromNode(
  node: TemplateNode,
  parentId: string | null,
  variables: Record<string, string>,
  sortOrder: number
): Promise<string> {
  const id = uuid()
  const now = new Date().toISOString()
  const name = replaceVariables(node.name, variables)

  // Create project
  await dbInsert('projects', {
    id,
    name,
    description: null,
    parent_id: parentId,
    color: '#01A7C2',
    icon: null,
    is_archived: 0,
    is_template: 0,
    template_name: null,
    sort_order: sortOrder,
    created_at: now,
    updated_at: now,
  })

  // Create default columns
  const columnIds: string[] = []
  for (const col of DEFAULT_COLUMNS) {
    const colId = uuid()
    columnIds.push(colId)
    await dbInsert('kanban_columns', {
      id: colId,
      name: col.name,
      project_id: id,
      color: null,
      sort_order: col.sort_order,
      is_default: col.is_default,
      created_at: now,
    })
  }

  // Create tasks in first column ("Por hacer")
  if (node.tasks) {
    for (let i = 0; i < node.tasks.length; i++) {
      const taskTitle = replaceVariables(node.tasks[i], variables)
      await dbInsert('tasks', {
        id: uuid(),
        title: taskTitle,
        description: null,
        project_id: id,
        column_id: columnIds[0],
        parent_task_id: null,
        priority: 'media',
        is_important: 0,
        due_date: null,
        due_time: null,
        estimated_minutes: null,
        actual_minutes: 0,
        is_completed: 0,
        completed_at: null,
        is_archived: 0,
        sort_order: i,
        is_recurring: 0,
        recurrence_rule: null,
        recurrence_end: null,
        recurrence_parent: null,
        created_at: now,
        updated_at: now,
      })
    }
  }

  // Recurse for children
  if (node.children) {
    for (let i = 0; i < node.children.length; i++) {
      const child = node.children[i]
      if (typeof child === 'string') continue // skip comments
      await createProjectFromNode(child, id, variables, i)
    }
  }

  return id
}

async function buildTemplateStructure(projectId: string): Promise<TemplateNode> {
  const projects = await dbQuery<Project>(
    'SELECT * FROM projects WHERE id = ?',
    [projectId]
  )
  if (projects.length === 0) throw new Error('Project not found')

  const project = projects[0]

  // Get tasks
  const tasks = await dbQuery<{ title: string }>(
    'SELECT title FROM tasks WHERE project_id = ? AND is_archived = 0 AND parent_task_id IS NULL ORDER BY sort_order ASC',
    [projectId]
  )

  // Get children
  const children = await dbQuery<Project>(
    'SELECT * FROM projects WHERE parent_id = ? AND is_archived = 0 ORDER BY sort_order ASC',
    [projectId]
  )

  const node: TemplateNode = {
    name: project.name,
  }

  if (tasks.length > 0) {
    node.tasks = tasks.map((t) => t.title)
  }

  if (children.length > 0) {
    node.children = []
    for (const child of children) {
      const childNode = await buildTemplateStructure(child.id)
      node.children.push(childNode)
    }
  }

  return node
}
