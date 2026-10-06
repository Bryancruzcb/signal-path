import { pathProfiles, type PathId, type ResourceStatus } from './data/careerPaths'

export const APPLICATION_STATUSES = ['Saved', 'Applied', 'Screen', 'Interview', 'Offer', 'Closed'] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export type Application = {
  id: string
  pathId: PathId
  company: string
  role: string
  url: string
  date: string
  status: ApplicationStatus
  nextStep: string
}

export type GuideDeviceChoice = 'windows' | 'macos'

export type ProgressImportSuccess = {
  ok: true
  restored: string[]
  selectedPath?: PathId
  completedTasks?: string[]
  resourceStates?: Record<string, ResourceStatus>
  completedMilestones?: string[]
  applications?: Application[]
  weeklyTasksCompleted?: Record<string, boolean>
  guideDevice?: GuideDeviceChoice
  modulesCompleted?: Record<string, boolean>
  knownCourses?: Record<string, boolean>
  focusLog?: { minutes: number; sessions: number }
}

export type ProgressImportResult = { ok: false; message: string } | ProgressImportSuccess

const KNOWN_KEYS = [
  'selectedPath',
  'completedTasks',
  'resourceStates',
  'completedMilestones',
  'applications',
  'weeklyTasksCompleted',
  'guideDevice',
  'modulesCompleted',
  'knownCourses',
  'focusLog',
] as const

const RESOURCE_STATUSES: readonly ResourceStatus[] = ['planned', 'in-progress', 'complete']

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPathId(value: string): value is PathId {
  return pathProfiles.some((path) => path.id === value)
}

function isApplicationStatus(value: string): value is ApplicationStatus {
  return APPLICATION_STATUSES.some((status) => status === value)
}

function isGuideDevice(value: unknown): value is GuideDeviceChoice {
  return value === 'windows' || value === 'macos'
}

function isResourceStatus(value: unknown): value is ResourceStatus {
  return typeof value === 'string' && RESOURCE_STATUSES.some((status) => status === value)
}

function stringArray(value: unknown[]) {
  return value.filter((item): item is string => typeof item === 'string')
}

function booleanRecord(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean'))
}

function isApplication(value: unknown): value is Application {
  if (!isPlainObject(value)) return false
  if (typeof value.id !== 'string') return false
  if (typeof value.pathId !== 'string' || !isPathId(value.pathId)) return false
  if (typeof value.company !== 'string') return false
  if (typeof value.role !== 'string') return false
  if (typeof value.url !== 'string') return false
  if (typeof value.date !== 'string') return false
  if (typeof value.status !== 'string' || !isApplicationStatus(value.status)) return false
  if (typeof value.nextStep !== 'string') return false
  return true
}

export function parseProgressImport(value: unknown): ProgressImportResult {
  if (!isPlainObject(value) || !KNOWN_KEYS.some((key) => key in value)) {
    return { ok: false, message: 'Import failed: not a Signal Path backup file.' }
  }

  const restored: string[] = []
  const fields: Omit<ProgressImportSuccess, 'ok' | 'restored'> = {}

  if (typeof value.selectedPath === 'string' && isPathId(value.selectedPath)) {
    fields.selectedPath = value.selectedPath
    restored.push('path')
  }
  if (Array.isArray(value.completedTasks)) {
    fields.completedTasks = stringArray(value.completedTasks)
    restored.push('tasks')
  }
  if (isPlainObject(value.resourceStates)) {
    fields.resourceStates = Object.fromEntries(
      Object.entries(value.resourceStates).filter((entry): entry is [string, ResourceStatus] => isResourceStatus(entry[1])),
    )
    restored.push('resources')
  }
  if (Array.isArray(value.completedMilestones)) {
    fields.completedMilestones = stringArray(value.completedMilestones)
    restored.push('milestones')
  }
  if (Array.isArray(value.applications)) {
    fields.applications = value.applications.filter(isApplication)
    restored.push('applications')
  }
  if (isPlainObject(value.weeklyTasksCompleted)) {
    fields.weeklyTasksCompleted = booleanRecord(value.weeklyTasksCompleted)
    restored.push('weekly tasks')
  }
  if (isGuideDevice(value.guideDevice)) {
    fields.guideDevice = value.guideDevice
    restored.push('guide device')
  }
  if (isPlainObject(value.modulesCompleted)) {
    fields.modulesCompleted = booleanRecord(value.modulesCompleted)
    restored.push('modules')
  }
  if (isPlainObject(value.knownCourses)) {
    fields.knownCourses = booleanRecord(value.knownCourses)
    restored.push('courses')
  }
  if (
    isPlainObject(value.focusLog) &&
    typeof value.focusLog.minutes === 'number' &&
    typeof value.focusLog.sessions === 'number'
  ) {
    fields.focusLog = {
      minutes: Math.max(0, value.focusLog.minutes),
      sessions: Math.max(0, value.focusLog.sessions),
    }
    restored.push('focus log')
  }

  if (restored.length === 0) {
    return { ok: false, message: 'Import failed: backup contained no restorable data.' }
  }
  return { ok: true, restored, ...fields }
}

export function parseProgressImportText(text: string): ProgressImportResult {
  try {
    return parseProgressImport(JSON.parse(text))
  } catch (error) {
    if (error instanceof SyntaxError) {
      return { ok: false, message: 'Import failed: file is not valid JSON.' }
    }
    throw error
  }
}
