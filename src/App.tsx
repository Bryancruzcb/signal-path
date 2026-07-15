import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
} from 'react'
import {
  ArrowUpRight,
  BookOpenCheck,
  BrainCircuit,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  Check,
  CheckCircle2,
  Clock3,
  Code2,
  Coffee,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileCheck2,
  Gauge,
  GraduationCap,
  LayoutDashboard,
  Library,
  Map as MapIcon,
  Plus,
  Search,
  ShieldCheck,
  Target,
  Trash2,
  Upload,
  X,
  Zap,
  Compass,
  FileText,
} from 'lucide-react'
import {
  pathProfiles,
  projectsByPath,
  recruitingSignals,
  resources,
  roadmapsByPath,
  sharedApplicationActions,
  type PathId,
  type ResourceStatus,
} from './data/careerPaths'
import {
  WEEKLY_TASKS,
  COURSES,
  KNOWN_COURSES,
  ROADMAP,
  SKILLS,
  PROJECT_STAGES,
  ELECTIVES,
  SOURCES,
} from './data/sjsuData'
import { resources as roadmapResources } from './data/roadmap'
import './App.css'


type ApplicationStatus = 'Saved' | 'Applied' | 'Screen' | 'Interview' | 'Offer' | 'Closed'

type Application = {
  id: string
  pathId: PathId
  company: string
  role: string
  url: string
  date: string
  status: ApplicationStatus
  nextStep: string
}

type AppWorkspaceView =
  | 'dashboard'
  | 'courses'
  | 'academic-plan'
  | 'campus-resources'
  | 'career-paths'
  | 'career-resources'
  | 'outreach-applications'
  | 'evidence-shelf'

const pathIds = pathProfiles.map((path) => path.id)

const storage = {
  tasks: 'signal-path-tasks-v2',
  resourceStates: 'signal-path-resource-states-v2',
  milestones: 'signal-path-milestones-v2',
  applications: 'signal-path-applications-v2',
  path: 'signal-path-path-v2',
  view: 'signal-path-view-v2',
  weekly: 'third-year-lab-weekly-v1',
  modules: 'third-year-lab-modules-v1',
  knownCourses: 'third-year-lab-known-v1',
  activeCourse: 'third-year-lab-active-course-v1',
  focusLog: 'third-year-lab-focus-log-v1',
  timer: 'third-year-lab-timer-v1',
}

const FALL_2026_FIRST_DAY = '2026-08-19' // SJSU registrar: first day of Fall 2026 instruction
const INTERNSHIP_APPS_OPEN = '2026-08-01' // estimate: big-tech Summer 2027 postings historically start early August

function daysUntil(dateString: string) {
  const target = new Date(`${dateString}T00:00:00`)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((target.getTime() - now.getTime()) / 86_400_000))
}

// Once a countdown hits zero, show "Now"/"now" instead of a stale "0 days"
function countdownReached(dateString: string) {
  return daysUntil(dateString) === 0
}

// "45m" → 45 · "2 hours" → 120 · "2–3 hours" → 120 (lower bound, honest accounting)
function durationToMinutes(duration: string) {
  const minutes = duration.match(/^(\d+)m$/)
  if (minutes) return Number(minutes[1])
  const hours = duration.match(/^(\d+)(?:\s*[–-]\s*\d+)?\s*hours?$/)
  if (hours) return Number(hours[1]) * 60
  return 0
}

const statusOptions: ApplicationStatus[] = [
  'Saved',
  'Applied',
  'Screen',
  'Interview',
  'Offer',
  'Closed',
]

const referralDraft = `Hey [Name] — I’ve narrowed my target to product data science and have been preparing around SQL, experimentation, and product metrics. I built [project] to answer [decision], and I can walk through the trade-offs and recommendation. Would you be open to a 20-minute conversation about how the role works at Meta and where my gaps still are? No pressure on a referral—I’d value your candid feedback first.`

function readArray(key: string) {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? '[]')
    return Array.isArray(value) ? (value as string[]) : []
  } catch {
    return []
  }
}

function readObject<T>(key: string, fallback: T): T {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? 'null')
    return value && typeof value === 'object' ? (value as T) : fallback
  } catch {
    return fallback
  }
}

function isPathId(value: string | null): value is PathId {
  return pathIds.includes(value as PathId)
}

function isWorkspaceView(value: string | null | undefined): value is AppWorkspaceView {
  const views: AppWorkspaceView[] = [
    'dashboard',
    'courses',
    'academic-plan',
    'campus-resources',
    'career-paths',
    'career-resources',
    'outreach-applications',
    'evidence-shelf',
  ]
  return views.includes(value as AppWorkspaceView)
}

function getInitialPath(): PathId {
  const routePath = window.location.hash.replace(/^#\/?/, '').split('/')[0]
  if (isPathId(routePath)) return routePath
  const storedPath = localStorage.getItem(storage.path)
  if (isPathId(storedPath)) return storedPath
  return 'data-science'
}

function getInitialView(): AppWorkspaceView {
  // Current format is #/<view>; legacy links used #/<path>/<view>.
  const [first, second] = window.location.hash.replace(/^#\/?/, '').split('/')
  if (isWorkspaceView(first)) return first
  if (isWorkspaceView(second)) return second
  const storedView = localStorage.getItem(storage.view)
  if (isWorkspaceView(storedView)) return storedView
  return 'dashboard'
}

function getToday() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

function PathIcon({ id, size = 18 }: { id: PathId; size?: number }) {
  if (id === 'data-science') return <ChartNoAxesCombined size={size} />
  if (id === 'data-engineering') return <Database size={size} />
  if (id === 'swe') return <Code2 size={size} />
  if (id === 'java') return <Coffee size={size} />
  if (id === 'cyber') return <ShieldCheck size={size} />
  return <BrainCircuit size={size} />
}

function ViewIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  action?: React.ReactNode
}) {
  return (
    <header className="page-intro compact-intro" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '28px', marginBottom: '36px' }}>
      <div>
        <p className="mono-label">{eyebrow}</p>
        <h2 style={{ fontSize: '2.5rem', margin: '0' }}>{title}</h2>
        <p style={{ marginTop: '8px', color: 'var(--ink-soft)' }}>{description}</p>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </header>
  )
}

function App() {
  // --- States ---
  const [selectedPath, setSelectedPath] = useState<PathId>(getInitialPath)
  const [activeView, setActiveView] = useState<AppWorkspaceView>(getInitialView)
  const [completedTasks, setCompletedTasks] = useState<string[]>(() => readArray(storage.tasks))
  const [resourceStates, setResourceStates] = useState<Record<string, ResourceStatus>>(() =>
    readObject<Record<string, ResourceStatus>>(storage.resourceStates, {})
  )
  const [completedMilestones, setCompletedMilestones] = useState<string[]>(() =>
    readArray(storage.milestones)
  )
  const [applications, setApplications] = useState<Application[]>(() => {
    try {
      const current = JSON.parse(localStorage.getItem(storage.applications) ?? '[]')
      return Array.isArray(current) ? (current as Application[]) : []
    } catch {
      return []
    }
  })

  // Codex SJSU Study states
  const [weeklyTasksCompleted, setWeeklyTasksCompleted] = useState<Record<string, boolean>>(() =>
    readObject<Record<string, boolean>>(storage.weekly, {})
  )
  const [modulesCompleted, setModulesCompleted] = useState<Record<string, boolean>>(() =>
    readObject<Record<string, boolean>>(storage.modules, {})
  )
  const [knownCourses, setKnownCourses] = useState<Record<string, boolean>>(() => {
    const stored = readObject<Record<string, boolean>>(storage.knownCourses, {})
    if (Object.keys(stored).length) return stored
    return Object.fromEntries(KNOWN_COURSES.map((c) => [c.id, c.default]))
  })
  const [activeCourse, setActiveCourse] = useState<string>(() =>
    localStorage.getItem(storage.activeCourse) ?? 'cs149'
  )
  const [focusLog, setFocusLog] = useState<{ minutes: number; sessions: number }>(() =>
    readObject<{ minutes: number; sessions: number }>(storage.focusLog, { minutes: 0, sessions: 0 })
  )

  // Timer state (remaining seconds survive a refresh; the running flag never does)
  const [timerRemaining, setTimerRemaining] = useState(() => {
    const stored = Number(localStorage.getItem(storage.timer) ?? Number.NaN)
    // A stored 0 means the last focus block completed; start fresh instead of
    // reviving the terminal state (which would log a phantom session on resume).
    if (!Number.isFinite(stored) || stored <= 0) return 25 * 60
    return Math.min(25 * 60, Math.max(1, Math.round(stored)))
  })
  const [timerRunning, setTimerRunning] = useState(false)
  // Wall-clock deadline for the running timer; null whenever it is paused or idle.
  const timerEndAtRef = useRef<number | null>(null)

  // Modal / UI states
  const [openModuleId, setOpenModuleId] = useState<string | null>(null)
  const [evidenceLegendOpen, setEvidenceLegendOpen] = useState(false)
  const [resourceQuery, setResourceQuery] = useState('')
  const [resourceCategory, setResourceCategory] = useState('All')
  const [resourceKind, setResourceKind] = useState('All')
  const [sourceSearchQuery, setSourceSearchQuery] = useState('')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'official' | 'syllabus' | 'student' | 'resource'>('all')

  // Application Form states
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [jobUrl, setJobUrl] = useState('')
  const [applicationDate, setApplicationDate] = useState(getToday)
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>('Saved')
  const [nextStep, setNextStep] = useState('')

  // Toast / Reset
  const [toast, setToast] = useState('')
  const [resetArmed, setResetArmed] = useState(false)

  // Import backup
  const importInputRef = useRef<HTMLInputElement>(null)

  // --- Derived Values ---
  const profile = pathProfiles.find((item) => item.id === selectedPath) ?? pathProfiles[0]
  const phases = roadmapsByPath[selectedPath]
  const projects = projectsByPath[selectedPath]
  const pathResources = useMemo(() => {
    const general = resources.filter((res) => res.pathIds.includes(selectedPath))
    const generalKeys = new Set(
      general.flatMap((res) => [res.id, res.title.trim().toLowerCase()])
    )
    const roadmapMapped = roadmapResources
      .filter((res) => {
        if (generalKeys.has(res.id) || generalKeys.has(res.title.trim().toLowerCase())) return false
        const mappedTracks: string[] = []
        if (selectedPath === 'data-science') mappedTracks.push('product')
        if (selectedPath === 'data-engineering') mappedTracks.push('engineering')
        if (selectedPath === 'swe' || selectedPath === 'java') mappedTracks.push('engineering')
        if (selectedPath === 'ml') mappedTracks.push('ml')
        return res.tracks.some((t) => mappedTracks.includes(t))
      })
      .map((res) => ({
        id: res.id,
        title: res.title,
        provider: res.provider,
        pathIds: [selectedPath],
        category: res.category,
        format: res.format,
        access: res.access,
        duration: res.duration,
        level: res.level,
        url: res.url,
        why: res.why,
        action: res.action,
        kind: res.category === 'Community' ? 'Community' : 'Reference',
        evidence: res.evidence,
        verified: 'July 2026',
      }))
    return [...general, ...roadmapMapped]
  }, [selectedPath])
  const pathApplications = applications.filter((application) => application.pathId === selectedPath)
  const pathSignals = recruitingSignals.filter((signal) => signal.pathIds.includes(selectedPath))
  const allTasks = phases.flatMap((phase) => phase.tasks)
  const requiredTasks = allTasks.filter((task) => !task.optional)
  const completedRequired = requiredTasks.filter((task) => completedTasks.includes(task.id)).length
  
  const careerProgressPercent = requiredTasks.length
    ? Math.round((completedRequired / requiredTasks.length) * 100)
    : 0

  // Codex calculations
  const weeklyCompleteCount = WEEKLY_TASKS.filter((task) => weeklyTasksCompleted[task.id]).length
  const allSjsuModules = Object.values(COURSES).flatMap((course) => course.modules)
  const modulesCompleteCount = allSjsuModules.filter((module) => modulesCompleted[module.id]).length
  const totalCodexItems = WEEKLY_TASKS.length + allSjsuModules.length
  const totalCodexComplete = weeklyCompleteCount + modulesCompleteCount
  const sjsuProgressPercent = totalCodexItems
    ? Math.round((totalCodexComplete / totalCodexItems) * 100)
    : 0

  // Study time banked: finished focus blocks + every completed weekly task and lab
  const studyMinutes =
    focusLog.minutes +
    WEEKLY_TASKS.filter((task) => weeklyTasksCompleted[task.id]).reduce((sum, task) => sum + durationToMinutes(task.duration), 0) +
    allSjsuModules.filter((module) => modulesCompleted[module.id]).reduce((sum, module) => sum + durationToMinutes(module.duration), 0)
  const weeklyPlannedMinutes = WEEKLY_TASKS.reduce((sum, task) => sum + durationToMinutes(task.duration), 0)
  // Weekly sprint header: derived from task durations so it never goes stale (e.g. 250 → "4H 10M")
  const weeklyPlannedLabel = `${Math.floor(weeklyPlannedMinutes / 60)}H ${String(weeklyPlannedMinutes % 60).padStart(2, '0')}M`
  const totalPlannedMinutes =
    weeklyPlannedMinutes +
    allSjsuModules.reduce((sum, module) => sum + durationToMinutes(module.duration), 0)

  // Combined Global Readiness Score (0 - 100)
  // Codex Formula: Math.min(100, Math.round(18 + (weeklyComplete / WEEKLY_TASKS.length) * 22 + (modulesComplete / moduleList.length) * 60))
  // We can adapt this to show sjsu + career readiness!
  const readinessScore = Math.min(
    100,
    Math.round(
      15 +
      (weeklyCompleteCount / WEEKLY_TASKS.length) * 15 +
      (modulesCompleteCount / allSjsuModules.length) * 40 +
      (careerProgressPercent / 100) * 30
    )
  )

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(pathResources.map((resource) => resource.category)))],
    [pathResources]
  )
  const kinds = useMemo(
    () => ['All', ...Array.from(new Set(pathResources.map((resource) => resource.kind)))],
    [pathResources]
  )

  const filteredResources = useMemo(() => {
    const query = resourceQuery.trim().toLowerCase()
    return pathResources.filter((resource) => {
      const haystack = `${resource.title} ${resource.provider} ${resource.why} ${resource.category}`.toLowerCase()
      return (
        (!query || haystack.includes(query)) &&
        (resourceCategory === 'All' || resource.category === resourceCategory) &&
        (resourceKind === 'All' || resource.kind === resourceKind)
      )
    })
  }, [pathResources, resourceCategory, resourceKind, resourceQuery])

  const filteredSources = useMemo(() => {
    const query = sourceSearchQuery.trim().toLowerCase()
    return SOURCES.filter((source) => {
      const matchesType = sourceFilter === 'all' || source.type === sourceFilter
      const haystack = `${source.title} ${source.description} ${source.meta}`.toLowerCase()
      return matchesType && (!query || haystack.includes(query))
    })
  }, [sourceSearchQuery, sourceFilter])

  // --- Effects ---
  useEffect(() => localStorage.setItem(storage.tasks, JSON.stringify(completedTasks)), [completedTasks])
  useEffect(() => localStorage.setItem(storage.resourceStates, JSON.stringify(resourceStates)), [resourceStates])
  useEffect(() => localStorage.setItem(storage.milestones, JSON.stringify(completedMilestones)), [completedMilestones])
  useEffect(() => localStorage.setItem(storage.applications, JSON.stringify(applications)), [applications])
  useEffect(() => localStorage.setItem(storage.path, selectedPath), [selectedPath])
  useEffect(() => localStorage.setItem(storage.view, activeView), [activeView])
  useEffect(() => localStorage.setItem(storage.weekly, JSON.stringify(weeklyTasksCompleted)), [weeklyTasksCompleted])
  useEffect(() => localStorage.setItem(storage.modules, JSON.stringify(modulesCompleted)), [modulesCompleted])
  useEffect(() => localStorage.setItem(storage.knownCourses, JSON.stringify(knownCourses)), [knownCourses])
  useEffect(() => localStorage.setItem(storage.activeCourse, activeCourse), [activeCourse])
  useEffect(() => localStorage.setItem(storage.focusLog, JSON.stringify(focusLog)), [focusLog])

  // Focus Timer effect: the countdown is derived from a wall-clock deadline so background-tab
  // throttling never stalls it, and a throttled tab snaps back to the true value on return.
  // Remaining seconds are persisted on pause/completion/unload rather than on every tick.
  useEffect(() => {
    if (!timerRunning) return

    const sync = () => {
      const endAt = timerEndAtRef.current
      if (endAt === null) return
      const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000))
      if (remaining > 0) {
        setTimerRemaining(remaining)
        return
      }
      completeFocusBlock()
    }
    const persist = () => {
      const endAt = timerEndAtRef.current
      if (endAt === null) return
      const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000))
      if (remaining > 0) {
        localStorage.setItem(storage.timer, String(remaining))
        return
      }
      // The deadline expired before the completion tick fired: bank the finished
      // block straight to storage (React state cannot flush during unload), then
      // complete the in-memory state in case the page survives beforeunload. The
      // storage write stays consistent because the focusLog effect above persists
      // the same +25/+1 values, and the nulled deadline keeps this from re-firing
      // on the pagehide that follows beforeunload.
      const logged = readObject(storage.focusLog, { minutes: 0, sessions: 0 })
      localStorage.setItem(
        storage.focusLog,
        JSON.stringify({ minutes: logged.minutes + 25, sessions: logged.sessions + 1 })
      )
      completeFocusBlock()
    }

    const interval = setInterval(sync, 1000)
    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('beforeunload', persist)
    window.addEventListener('pagehide', persist)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', sync)
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('beforeunload', persist)
      window.removeEventListener('pagehide', persist)
    }
  }, [timerRunning])

  useEffect(() => {
    const handleHash = () => {
      const segments = window.location.hash.replace(/^#\/?/, '').split('/')
      // Current format is #/<view>; legacy links used #/<path>/<view>.
      const [first, second] = segments
      if (isPathId(first)) {
        setSelectedPath(first)
        if (isWorkspaceView(second)) setActiveView(second)
      } else if (isWorkspaceView(first)) {
        setActiveView(first)
      }
    }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  useEffect(() => {
    const expectedHash = `#/${activeView}`
    if (window.location.hash !== expectedHash) window.history.replaceState(null, '', expectedHash)
    document.title = `${profile.shortName} · Signal Path`
  }, [activeView, profile.shortName])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 3200)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!openModuleId && !evidenceLegendOpen) return undefined
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenModuleId(null)
        setEvidenceLegendOpen(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [openModuleId, evidenceLegendOpen])

  // --- Handlers ---
  function navigate(view: AppWorkspaceView, path: PathId = selectedPath) {
    setSelectedPath(path)
    setActiveView(view)
    window.location.hash = `/${view}`
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function choosePath(path: PathId) {
    setSelectedPath(path)
    const name = pathProfiles.find((item) => item.id === path)?.shortName
    setToast(`${name} workspace loaded.`)
  }

  function toggleTask(id: string) {
    setCompletedTasks((current) =>
      current.includes(id) ? current.filter((taskId) => taskId !== id) : [...current, id]
    )
  }

  function toggleWeeklyTask(id: string) {
    const nowComplete = !weeklyTasksCompleted[id]
    setWeeklyTasksCompleted((current) => ({ ...current, [id]: !current[id] }))
    if (nowComplete) {
      setToast("Weekly step recorded. Keep the artifact—you may reuse it in class.")
    }
  }

  function toggleModuleMastery(id: string) {
    const nowComplete = !modulesCompleted[id]
    const moduleTitle = allSjsuModules.find((m) => m.id === id)?.title ?? ''
    setModulesCompleted((current) => ({ ...current, [id]: !current[id] }))
    setToast(nowComplete ? `Mastery recorded: ${moduleTitle}` : `${moduleTitle} moved back to learning.`)
  }

  function toggleKnownCourse(id: string) {
    setKnownCourses((current) => ({ ...current, [id]: !current[id] }))
    setToast("Starting point updated. Verify the final plan against MyProgress.")
  }

  function toggleMilestone(id: string) {
    setCompletedMilestones((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    )
  }

  function setResourceStatus(id: string, status: ResourceStatus) {
    setResourceStates((current) => ({ ...current, [id]: status }))
  }

  function addApplication(event: FormEvent) {
    event.preventDefault()
    if (!company.trim() || !role.trim()) return
    setApplications((current) => [
      {
        id: crypto.randomUUID(),
        pathId: selectedPath,
        company: company.trim(),
        role: role.trim(),
        url: jobUrl.trim(),
        date: applicationDate,
        status: applicationStatus,
        nextStep: nextStep.trim(),
      },
      ...current,
    ])
    setCompany('')
    setRole('')
    setJobUrl('')
    setNextStep('')
    setToast('Application saved locally.')
  }

  function updateApplication(id: string, status: ApplicationStatus) {
    setApplications((current) =>
      current.map((application) => (application.id === id ? { ...application, status } : application))
    )
  }

  function exportProgress() {
    const payload = {
      exportedAt: new Date().toISOString(),
      selectedPath,
      completedTasks,
      resourceStates,
      completedMilestones,
      applications,
      weeklyTasksCompleted,
      modulesCompleted,
      knownCourses,
      focusLog,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `signal-path-${getToday()}.json`
    anchor.click()
    URL.revokeObjectURL(url)
    setToast('Progress exported.')
  }

  async function importProgress(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const file = input.files?.[0]
    input.value = '' // allow re-importing the same file
    if (!file) return

    let parsed: unknown
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      setToast('Import failed: file is not valid JSON.')
      return
    }

    const isPlainObject = (value: unknown): value is Record<string, unknown> =>
      typeof value === 'object' && value !== null && !Array.isArray(value)

    const knownKeys = [
      'selectedPath',
      'completedTasks',
      'resourceStates',
      'completedMilestones',
      'applications',
      'weeklyTasksCompleted',
      'modulesCompleted',
      'knownCourses',
      'focusLog',
    ]
    if (!isPlainObject(parsed) || !knownKeys.some((key) => key in parsed)) {
      setToast('Import failed: not a Signal Path backup file.')
      return
    }

    const toStringArray = (value: unknown[]) =>
      value.filter((item): item is string => typeof item === 'string')
    const toBooleanRecord = (value: Record<string, unknown>) =>
      Object.fromEntries(
        Object.entries(value).filter(([, item]) => typeof item === 'boolean')
      ) as Record<string, boolean>
    const resourceStatusValues: ResourceStatus[] = ['planned', 'in-progress', 'complete']
    const isApplication = (value: unknown): value is Application =>
      isPlainObject(value) &&
      typeof value.id === 'string' &&
      typeof value.pathId === 'string' &&
      isPathId(value.pathId) &&
      typeof value.company === 'string' &&
      typeof value.role === 'string' &&
      typeof value.url === 'string' &&
      typeof value.date === 'string' &&
      typeof value.status === 'string' &&
      statusOptions.includes(value.status as ApplicationStatus) &&
      typeof value.nextStep === 'string'

    const restored: string[] = []
    if (typeof parsed.selectedPath === 'string' && isPathId(parsed.selectedPath)) {
      setSelectedPath(parsed.selectedPath)
      restored.push('path')
    }
    if (Array.isArray(parsed.completedTasks)) {
      setCompletedTasks(toStringArray(parsed.completedTasks))
      restored.push('tasks')
    }
    if (isPlainObject(parsed.resourceStates)) {
      setResourceStates(
        Object.fromEntries(
          Object.entries(parsed.resourceStates).filter(([, value]) =>
            resourceStatusValues.includes(value as ResourceStatus)
          )
        ) as Record<string, ResourceStatus>
      )
      restored.push('resources')
    }
    if (Array.isArray(parsed.completedMilestones)) {
      setCompletedMilestones(toStringArray(parsed.completedMilestones))
      restored.push('milestones')
    }
    if (Array.isArray(parsed.applications)) {
      setApplications(parsed.applications.filter(isApplication))
      restored.push('applications')
    }
    if (isPlainObject(parsed.weeklyTasksCompleted)) {
      setWeeklyTasksCompleted(toBooleanRecord(parsed.weeklyTasksCompleted))
      restored.push('weekly tasks')
    }
    if (isPlainObject(parsed.modulesCompleted)) {
      setModulesCompleted(toBooleanRecord(parsed.modulesCompleted))
      restored.push('modules')
    }
    if (isPlainObject(parsed.knownCourses)) {
      setKnownCourses(toBooleanRecord(parsed.knownCourses))
      restored.push('courses')
    }
    if (
      isPlainObject(parsed.focusLog) &&
      typeof parsed.focusLog.minutes === 'number' &&
      typeof parsed.focusLog.sessions === 'number'
    ) {
      setFocusLog({
        minutes: Math.max(0, parsed.focusLog.minutes),
        sessions: Math.max(0, parsed.focusLog.sessions),
      })
      restored.push('focus log')
    }

    if (restored.length === 0) {
      setToast('Import failed: backup contained no restorable data.')
      return
    }
    setToast(`Backup restored: ${restored.join(', ')}.`)
  }

  function resetAllProgress() {
    if (!resetArmed) {
      setResetArmed(true)
      window.setTimeout(() => setResetArmed(false), 4000)
      return
    }
    setCompletedTasks([])
    setCompletedMilestones([])
    setResourceStates({})
    setWeeklyTasksCompleted({})
    setModulesCompleted({})
    setKnownCourses(Object.fromEntries(KNOWN_COURSES.map((c) => [c.id, c.default])))
    setApplications([])
    setResetArmed(false)
    setFocusLog({ minutes: 0, sessions: 0 })
    timerEndAtRef.current = null
    setTimerRemaining(25 * 60)
    setTimerRunning(false)
    localStorage.setItem(storage.timer, String(25 * 60))
    setToast('All progress reset on this device.')
  }

  async function copyReferral() {
    await navigator.clipboard.writeText(referralDraft)
    setToast('Conversation draft copied.')
  }

  // Timer helpers
  // Shared completion path: the sync tick, the pause button, and unload persistence
  // can each observe the deadline expiring first. It runs outside any state updater
  // (impure updaters double-fire under StrictMode); nulling the deadline before the
  // state updates guarantees the session logs exactly once.
  function completeFocusBlock() {
    timerEndAtRef.current = null
    setTimerRunning(false)
    setTimerRemaining(25 * 60)
    setFocusLog((log) => ({ minutes: log.minutes + 25, sessions: log.sessions + 1 }))
    setToast("Focus block complete. Write down what surprised you before opening another tab.")
    localStorage.setItem(storage.timer, String(25 * 60))
  }

  function toggleTimer() {
    if (timerRunning) {
      // Pause: freeze the remaining seconds derived from the deadline, then drop it.
      const endAt = timerEndAtRef.current
      if (endAt !== null) {
        const remaining = Math.max(0, Math.round((endAt - Date.now()) / 1000))
        if (remaining === 0) {
          // The deadline expired before the completion tick fired: finish the
          // block instead of stranding an unlogged session paused at 0.
          completeFocusBlock()
          return
        }
        timerEndAtRef.current = null
        setTimerRemaining(remaining)
        localStorage.setItem(storage.timer, String(remaining))
      }
      setTimerRunning(false)
    } else {
      timerEndAtRef.current = Date.now() + timerRemaining * 1000
      setTimerRunning(true)
    }
  }

  function resetTimer() {
    timerEndAtRef.current = null
    setTimerRunning(false)
    setTimerRemaining(25 * 60)
    localStorage.setItem(storage.timer, String(25 * 60))
  }

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  // Details for selected module dialog
  const activeModule = allSjsuModules.find((m) => m.id === openModuleId)
  const activeModuleCourse = openModuleId
    ? Object.entries(COURSES).find(([_, c]) => c.modules.some((m) => m.id === openModuleId))?.[1]
    : null

  const themeStyle = {
    '--path-accent': profile.accent,
    '--path-soft': profile.soft,
    '--path-deep': profile.deep,
  } as CSSProperties

  // Helper for evidence labels
  function renderEvidenceLabel(type: 'official' | 'syllabus' | 'student' | 'resource') {
    const labels = {
      official: "Official",
      syllabus: "Public syllabus",
      student: "Student signal",
      resource: "Learning resource",
    }
    const className = type === 'resource' ? 'evidence-inferred' : `evidence-${type}`
    return <span className={`evidence-pill ${className}`}>{labels[type]}</span>
  }

  return (
    <div className="app-shell" style={themeStyle}>
      {/* Sidebar Navigation */}
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 40 40" role="img">
              <path d="M15 6h10M18 6v9L9.5 29.8A3.5 3.5 0 0 0 12.5 35h15a3.5 3.5 0 0 0 3-5.2L22 15V6" />
              <path d="M13.5 27h13M16 22h8" />
            </svg>
          </div>
          <div>
            <strong>Signal Path</strong>
            <span>SJSU &amp; Career Hub</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Study dashboard views">
          <button
            className={`nav-item ${activeView === 'dashboard' ? 'is-active' : ''}`}
            type="button"
            onClick={() => navigate('dashboard')}
          >
            <LayoutDashboard />
            <span>This week</span>
          </button>
          <button
            className={`nav-item ${activeView === 'courses' ? 'is-active' : ''}`}
            type="button"
            onClick={() => navigate('courses')}
          >
            <BookOpenCheck />
            <span>Course prep</span>
          </button>
          <button
            className={`nav-item ${activeView === 'academic-plan' ? 'is-active' : ''}`}
            type="button"
            onClick={() => navigate('academic-plan')}
          >
            <MapIcon />
            <span>Academic plan</span>
          </button>
          <button
            className={`nav-item ${activeView === 'campus-resources' ? 'is-active' : ''}`}
            type="button"
            onClick={() => navigate('campus-resources')}
          >
            <GraduationCap />
            <span>Campus resources</span>
          </button>
          <button
            className={`nav-item ${activeView === 'career-paths' ? 'is-active' : ''}`}
            type="button"
            onClick={() => navigate('career-paths')}
          >
            <Compass />
            <span>Career paths</span>
          </button>
          <button
            className={`nav-item ${activeView === 'career-resources' ? 'is-active' : ''}`}
            type="button"
            onClick={() => navigate('career-resources')}
          >
            <Library />
            <span>Career resources</span>
          </button>
          <button
            className={`nav-item ${activeView === 'outreach-applications' ? 'is-active' : ''}`}
            type="button"
            onClick={() => navigate('outreach-applications')}
          >
            <BriefcaseBusiness />
            <span>Applications</span>
          </button>
          <button
            className={`nav-item ${activeView === 'evidence-shelf' ? 'is-active' : ''}`}
            type="button"
            onClick={() => navigate('evidence-shelf')}
          >
            <FileText />
            <span>Evidence shelf</span>
          </button>
        </nav>

        {/* Live meters (mirrors the dashboard signal meters) */}
        <div className="sidebar-meters" aria-label="Live progress meters">
          <div className="sidebar-meter">
            <span>Study banked</span>
            <strong>{(studyMinutes / 60).toFixed(1)}<em>/{Math.round(totalPlannedMinutes / 60)}h</em></strong>
          </div>
          <div className="sidebar-meter">
            <span>Fall classes</span>
            <strong>{countdownReached(FALL_2026_FIRST_DAY) ? 'now' : `${daysUntil(FALL_2026_FIRST_DAY)}d`}</strong>
          </div>
          <div className="sidebar-meter">
            <span>Apps open · est.</span>
            <strong>{countdownReached(INTERNSHIP_APPS_OPEN) ? 'now' : `${daysUntil(INTERNSHIP_APPS_OPEN)}d`}</strong>
          </div>
        </div>

        {/* Global Progress Panel */}
        <section className="sidebar-progress" aria-labelledby="sidebar-progress-title">
          <div className="progress-heading">
            <span id="sidebar-progress-title">Overall Prep</span>
            <strong>{Math.round((sjsuProgressPercent + careerProgressPercent) / 2)}%</strong>
          </div>
          <div className="progress-track" aria-hidden="true">
            <span style={{ width: `${Math.round((sjsuProgressPercent + careerProgressPercent) / 2)}%` }}></span>
          </div>
          <p id="sidebarProgressNote">
            {readinessScore > 30
              ? `${modulesCompleteCount} modules & ${completedRequired} career steps checked. Nice pace.`
              : "Start with one small lab or career task. Momentum follows evidence."}
          </p>
        </section>

        <div className="sidebar-footer">
          <span className="save-indicator">
            <i aria-hidden="true"></i> Saved on this device
          </span>
          <button type="button" className="text-button" onClick={exportProgress} style={{ padding: '0', display: 'flex', gap: '5px', marginTop: '6px', fontSize: '0.74rem' }}>
            <Download size={13} /> Export Backup
          </button>
          <button type="button" className="text-button" onClick={() => importInputRef.current?.click()} style={{ padding: '0', display: 'flex', gap: '5px', marginTop: '4px', fontSize: '0.74rem' }}>
            <Upload size={13} /> Import Backup
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            onChange={importProgress}
            style={{ display: 'none' }}
            aria-hidden="true"
            tabIndex={-1}
          />
          <button
            className={`text-button ${resetArmed ? 'danger armed' : ''}`}
            id="resetProgress"
            type="button"
            onClick={resetAllProgress}
            style={{ color: resetArmed ? '#ef6a52' : '', marginTop: '4px' }}
          >
            {resetArmed ? 'Confirm Reset' : 'Reset progress'}
          </button>
        </div>
      </aside>

      {/* Main Panel */}
      <main className="app-main" id="main-content">
        <header className="topbar">
          <div>
            <span className="topbar-context">
              {activeView === 'dashboard' && 'Summer preparation · 2026'}
              {activeView === 'courses' && 'Evidence-backed preparation'}
              {activeView === 'academic-plan' && 'A cautious four-term plan'}
              {activeView === 'campus-resources' && 'University resources & portals'}
              {activeView === 'career-paths' && `${profile.name} lane`}
              {activeView === 'career-resources' && `${pathResources.length} curated resources`}
              {activeView === 'outreach-applications' && 'Summer 2027 recruitment'}
              {activeView === 'evidence-shelf' && 'Research, with the labels left on'}
            </span>
            <h1 id="viewTitle">
              {activeView === 'dashboard' && 'This week'}
              {activeView === 'courses' && 'Course prep'}
              {activeView === 'academic-plan' && 'Your academic roadmap'}
              {activeView === 'campus-resources' && 'Campus Resources'}
              {activeView === 'career-paths' && `${profile.shortName} path`}
              {activeView === 'career-resources' && 'Curated learning'}
              {activeView === 'outreach-applications' && 'Applications & Outreach'}
              {activeView === 'evidence-shelf' && 'The evidence shelf'}
            </h1>
          </div>

          <div className="topbar-actions">
            {activeView !== 'evidence-shelf' && (
              <button className="certainty-button" type="button" onClick={() => navigate('evidence-shelf')}>
                <FileText size={16} />
                Research &amp; sources
              </button>
            )}
            <div className="profile-chip" aria-label="Personal workspace for Bryan">
              BC
            </div>
          </div>
        </header>

        {/* --- VIEW: Dashboard --- */}
        {activeView === 'dashboard' && (
          <section className="view is-active" id="view-dashboard">
            <header className="dashboard-intro">
              <div>
                <p className="mono-label" id="todayLabel">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).toUpperCase()} · WEEKLY FIELD NOTE
                </p>
                <h2>Make the machine less mysterious.</h2>
                <p>
                  Your waitlist does not have to be idle time. This week builds the exact bridge from CS 47 and CS 146 into processes, packets, and the systems underneath data work.
                </p>
                <div className="dashboard-actions">
                  <button className="button button-primary button-large" type="button" onClick={() => navigate('courses')}>
                    Continue studying
                  </button>
                  <button className="button button-secondary" type="button" onClick={() => navigate('academic-plan')}>
                    See your 4-term plan
                  </button>
                </div>
              </div>
              <div className="readiness-stamp" aria-label="Current preparation status">
                <span>READINESS</span>
                <strong id="readinessScore">{readinessScore}</strong>
                <small>/ 100</small>
              </div>
            </header>

            {/* Signal meters: logged focus time + the two clocks that matter */}
            <section className="signal-meters" aria-label="Progress meters and countdowns">
              <button type="button" className="signal-meter" onClick={() => document.querySelector('.focus-bench')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                <span className="mono-label">STUDY BANKED</span>
                <strong>{(studyMinutes / 60).toFixed(1)}<small> / {Math.round(totalPlannedMinutes / 60)} h planned</small></strong>
                <span className="signal-meter-note">
                  {studyMinutes === 0
                    ? 'Finish a focus block, weekly task, or lab to start the log'
                    : `${focusLog.sessions} focus block${focusLog.sessions === 1 ? '' : 's'} + ${totalCodexComplete} finished item${totalCodexComplete === 1 ? '' : 's'}`}
                </span>
              </button>
              <button type="button" className="signal-meter" onClick={() => navigate('academic-plan')}>
                <span className="mono-label">FALL 2026 CLASSES</span>
                {countdownReached(FALL_2026_FIRST_DAY)
                  ? <strong>Now</strong>
                  : <strong>{daysUntil(FALL_2026_FIRST_DAY)}<small> days</small></strong>}
                <span className="signal-meter-note">
                  {countdownReached(FALL_2026_FIRST_DAY)
                    ? 'Semester in session'
                    : 'Instruction starts Aug 19 · CS 149, CS 158A, GE R/S/V'}
                </span>
              </button>
              <button type="button" className="signal-meter" onClick={() => navigate('outreach-applications')}>
                <span className="mono-label">SUMMER 2027 APPS</span>
                {countdownReached(INTERNSHIP_APPS_OPEN)
                  ? <strong>Now</strong>
                  : <strong>{daysUntil(INTERNSHIP_APPS_OPEN)}<small> days</small></strong>}
                <span className="signal-meter-note">
                  {countdownReached(INTERNSHIP_APPS_OPEN)
                    ? 'Applications open — go apply'
                    : 'Est. early Aug — big-tech postings open first; verify per company'}
                </span>
              </button>
            </section>

            <div className="dashboard-grid">
              {/* Weekly Systems Sprint */}
              <section className="weekly-plan panel" aria-labelledby="weekly-plan-heading">
                <div className="section-heading-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '16px' }}>
                  <div>
                    <p className="mono-label">THIS WEEK · {weeklyPlannedLabel}</p>
                    <h3 id="weekly-plan-heading" style={{ fontSize: '1.4rem', margin: '0' }}>A small systems sprint</h3>
                  </div>
                  <span className="plan-count" id="weeklyCount" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--muted)' }}>
                    {weeklyCompleteCount} of {WEEKLY_TASKS.length} complete
                  </span>
                </div>
                <div className="task-list" id="weeklyTasks">
                  {WEEKLY_TASKS.map((task) => {
                    const complete = Boolean(weeklyTasksCompleted[task.id])
                    return (
                      <div className={`weekly-task ${complete ? 'is-done' : ''}`} key={task.id}>
                        <input
                          type="checkbox"
                          id={`weekly-${task.id}`}
                          checked={complete}
                          onChange={() => toggleWeeklyTask(task.id)}
                        />
                        <label htmlFor={`weekly-${task.id}`}>
                          <strong>{task.title}</strong>
                          <span>{task.detail}</span>
                        </label>
                        <time>{task.duration}</time>
                      </div>
                    )
                  })}
                </div>
                <div className="plan-footer" style={{ borderTop: '1px solid var(--line)', marginTop: '20px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--ink-soft)', maxWidth: '70%' }}>
                    <strong>Finish line:</strong> explain a process and a packet without leaning on vocabulary alone.
                  </p>
                  <button className="button button-primary" type="button" onClick={() => setOpenModuleId('os-processes')}>
                    Open first lab
                  </button>
                </div>
              </section>

              {/* Focus Timer Bench */}
              <aside className="focus-bench panel" aria-labelledby="focus-heading">
                <div className="focus-topline" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <span className="mono-label">FOCUS BENCH</span>
                  <span className="timer-status" id="timerStatus" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', fontWeight: '600', color: timerRunning ? 'var(--signal)' : 'var(--muted)' }}>
                    {timerRunning ? 'In focus' : timerRemaining < 25 * 60 ? 'Paused' : 'Ready'}
                  </span>
                </div>
                <h3 id="focus-heading" style={{ fontSize: '1.25rem', marginBottom: '8px' }}>One honest block.</h3>
                <div className="timer" id="timerDisplay" style={{ fontSize: '4.8rem', fontFamily: 'var(--font-mono)', fontWeight: '500', textAlign: 'center', margin: '24px 0', letterSpacing: '-0.02em', color: timerRunning ? 'var(--primary-deep)' : 'var(--ink)' }}>
                  {formatTimer(timerRemaining)}
                </div>
                <p id="timerPrompt" style={{ fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'center', marginBottom: '24px' }}>
                  Close the extra tabs. Compile one thing. Write down what surprised you.
                </p>
                <div className="timer-controls" style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', marginBottom: '24px' }}>
                  <button className="button button-primary" id="timerToggle" type="button" onClick={toggleTimer} style={{ minWidth: '130px' }}>
                    {timerRunning ? 'Pause focus' : timerRemaining < 25 * 60 ? 'Resume focus' : 'Start focus'}
                  </button>
                  <button className="icon-button" id="timerReset" type="button" aria-label="Reset focus timer" onClick={resetTimer} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--line)', background: 'var(--surface)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                </div>
                <div className="focus-rule" aria-hidden="true" style={{ borderTop: '1px solid var(--line)', margin: '0 -28px 20px' }}></div>
                <blockquote style={{ fontStyle: 'italic', color: 'var(--muted)', fontSize: '0.9rem', textAlign: 'center', margin: '0', fontFamily: 'var(--font-editorial)' }}>
                  “Mastery is being able to predict what happens next.”
                </blockquote>
              </aside>
            </div>

            {/* SJSU Waitlisted Course readiness */}
            <section className="course-readiness" aria-labelledby="course-readiness-heading" style={{ marginTop: '48px' }}>
              <div className="section-heading-row course-readiness-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <p className="mono-label">TWO SYSTEMS, ONE FOUNDATION</p>
                  <h3 id="course-readiness-heading" style={{ fontSize: '1.6rem', margin: '0' }}>Course readiness</h3>
                </div>
                <button className="text-button arrow-link" type="button" onClick={() => navigate('courses')}>
                  Open course prep <span aria-hidden="true">→</span>
                </button>
              </div>

              <div className="course-split" id="courseReadiness">
                {Object.entries(COURSES).map(([key, course]) => {
                  const completed = course.modules.filter((m) => modulesCompleted[m.id]).length
                  const readiness = Math.round(20 + (completed / course.modules.length) * 80)
                  const miniModules = course.modules.slice(0, 3)

                  return (
                    <article className={`course-readiness-panel ${course.tone === 'network' ? 'network' : ''}`} key={key}>
                      <div className="course-panel-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span className={`course-code ${course.tone === 'network' ? 'network' : ''}`}>
                          <i aria-hidden="true"></i>{course.code}
                        </span>
                        <span className="waitlist-pill">WAITLISTED</span>
                      </div>
                      <h4>{course.title}</h4>
                      <p>{course.likelyStack} · {course.evidenceNote}.</p>
                      <div className="readiness-meter" aria-label={`${readiness}% ready for ${course.code}`}>
                        <div aria-hidden="true"><span style={{ width: `${readiness}%` }}></span></div>
                        <strong>{readiness}%</strong>
                      </div>
                      <ul className="mini-module-list" style={{ listStyle: 'none', padding: '0', margin: '18px 0 0' }}>
                        {miniModules.map((module) => (
                          <li key={module.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--line-strong)' }}>
                            <i className={`module-state-dot ${modulesCompleted[module.id] ? 'is-complete' : ''}`} aria-hidden="true"></i>
                            <button className="text-button" type="button" onClick={() => setOpenModuleId(module.id)} style={{ flex: '1', textAlign: 'left', fontWeight: '500' }}>
                              {module.title}
                            </button>
                            <time style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--muted)' }}>
                              {module.duration.replace(" hours", "h").replace(" hour", "h")}
                            </time>
                          </li>
                        ))}
                      </ul>
                    </article>
                  )
                })}
              </div>
            </section>

            {/* Active Career Path snapshot widget */}
            <section className="career-path-snapshot panel" style={{ marginTop: '48px', padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
                <div>
                  <p className="mono-label">ACTIVE CAREER TRACK</p>
                  <h3 style={{ fontSize: '1.6rem', margin: '0' }}>{profile.name} Lane</h3>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="button button-secondary" type="button" onClick={() => navigate('career-paths')}>
                    Explore other paths
                  </button>
                  <button className="button button-primary" type="button" onClick={() => navigate('outreach-applications')}>
                    Track applications
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                <div>
                  <span className="evidence-pill" style={{ marginBottom: '8px' }}>LANE VERDICT</span>
                  <p style={{ fontWeight: '600', fontSize: '1.05rem', color: 'var(--ink)' }}>{profile.verdict}</p>
                  <p style={{ color: 'var(--ink-soft)', fontSize: '0.94rem', margin: '8px 0 0' }}>{profile.summary}</p>
                </div>
                <div>
                  <span className="evidence-pill" style={{ marginBottom: '8px' }}>ROLE FIT</span>
                  <p style={{ fontSize: '0.92rem', color: 'var(--ink-soft)', lineHeight: '1.5' }}>{profile.fit}</p>
                  <div style={{ marginTop: '16px' }}>
                    <span className="mono-label">WEEKLY TARGET</span>
                    <strong style={{ display: 'block', fontSize: '0.94rem' }}>{profile.duration} · {profile.weeklyHours}</strong>
                  </div>
                </div>
                <div>
                  <span className="evidence-pill" style={{ marginBottom: '8px' }}>TARGET EVIDENCE</span>
                  <p style={{ fontSize: '0.94rem', fontWeight: '500', color: 'var(--ink)' }}>{profile.primaryOutput}</p>
                  <div style={{ marginTop: '16px' }}>
                    <span className="mono-label">CAREER MILESTONES</span>
                    <strong style={{ display: 'block', fontSize: '0.94rem' }}>{completedRequired} / {requiredTasks.length} required tasks completed</strong>
                  </div>
                </div>
              </div>
            </section>

            {/* Bottom Lab Note */}
            <section className="lab-note" aria-labelledby="lab-note-heading" style={{ marginTop: '48px' }}>
              <div className="lab-note-index" aria-hidden="true">NOTE<br />07.14</div>
              <div>
                <p className="mono-label">WHY THIS MATTERS FOR DATA SCIENCE</p>
                <h3 id="lab-note-heading">The dataframe is not the whole machine.</h3>
                <p>
                  Operating systems explain why parallel jobs stall, memory spikes, and files become bottlenecks. Networks explain how data reaches an API, a cluster, or object storage. These courses are infrastructure literacy for serious data work—not detours from it.
                </p>
              </div>
              <button className="button button-secondary" type="button" onClick={() => navigate('academic-plan')}>
                See the data-science path
              </button>
            </section>
          </section>
        )}

        {/* --- VIEW: Course Prep --- */}
        {activeView === 'courses' && (
          <section className="view is-active" id="view-courses">
            <header className="page-intro compact-intro" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '28px', marginBottom: '36px' }}>
              <div>
                <p className="mono-label">EVIDENCE-BACKED PREPARATION</p>
                <h2 id="courses-heading" style={{ fontSize: '2.5rem', margin: '0' }}>Build the reflexes before the semester.</h2>
                <p style={{ marginTop: '8px', color: 'var(--ink-soft)' }}>
                  Each module ends in something you can run, inspect, or explain. Exact assignments vary by professor; the durable concepts do not.
                </p>
              </div>
              <div className="course-selector" role="group" aria-label="Choose a course" style={{ display: 'flex', gap: '8px', flexShrink: '0' }}>
                <button
                  className={`course-selector-button ${activeCourse === 'cs149' ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => setActiveCourse('cs149')}
                >
                  CS 149
                </button>
                <button
                  className={`course-selector-button ${activeCourse === 'cs158' ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => setActiveCourse('cs158')}
                >
                  CS 158A
                </button>
              </div>
            </header>

            {/* Course details */}
            {(() => {
              const course = COURSES[activeCourse] ?? COURSES.cs149
              const completed = course.modules.filter((m) => modulesCompleted[m.id]).length
              return (
                <div className="course-explorer-shell">
                  <div className="course-fact-strip">
                    <div className="course-fact">
                      {renderEvidenceLabel("official")}
                      <strong>{course.code} · {course.title}</strong>
                      <p>{course.official}</p>
                    </div>
                    <div className="course-fact">
                      <span>PREREQUISITES</span>
                      <strong>{course.prereqs}</strong>
                    </div>
                    <div className="course-fact">
                      <span>SAFEST STACK BET</span>
                      <strong>{course.likelyStack}</strong>
                    </div>
                    <div className="course-fact">
                      <span>ASSESSMENT SHAPE</span>
                      <strong>{course.assessment}</strong>
                      <p>{course.assessmentNote}</p>
                    </div>
                  </div>

                  <div className="course-story">
                    <div>
                      <p className="mono-label">WHAT TO EXPECT</p>
                      <h3>{course.tone === 'network' ? "Follow the packet, then build the path." : "Make the invisible machine observable."}</h3>
                      <p>{course.story}</p>
                    </div>
                    <div className="stack-list" aria-label="Likely languages and tools">
                      {course.stack.map((item) => (
                        <span className="stack-chip" key={item}>{item}</span>
                      ))}
                    </div>
                  </div>

                  <div className="module-list-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '48px', marginBottom: '24px', borderBottom: '1px solid var(--line)', paddingBottom: '12px' }}>
                    <div>
                      <p className="mono-label">PREPARATION TRACK</p>
                      <h3 style={{ fontSize: '1.4rem', margin: '0' }}>{completed} of {course.modules.length} modules mastered</h3>
                    </div>
                    <p style={{ margin: '0', fontSize: '0.82rem', color: 'var(--muted)' }}>
                      Mastered = concept note + working artifact + teach-back.
                    </p>
                  </div>

                  {/* Modules list */}
                  <div className="modules-list-container" style={{ display: 'grid', gap: '12px' }}>
                    {course.modules.map((module, index) => {
                      const isComplete = Boolean(modulesCompleted[module.id])
                      return (
                        <article className={`module-row ${course.tone === 'network' ? 'network' : ''} ${isComplete ? 'is-complete' : ''}`} key={module.id}>
                          <span className="module-number" aria-hidden="true">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className="module-main">
                            <h4>{module.title}</h4>
                            <p>{module.subtitle} · {module.duration}</p>
                          </div>
                          <p className="module-deliverable">
                            <span>PROOF OF WORK</span>{module.deliverable}
                          </p>
                          <div className="module-action">
                            <button
                              className={`button ${course.tone === 'network' ? 'button-network' : 'button-secondary'}`}
                              type="button"
                              onClick={() => setOpenModuleId(module.id)}
                            >
                              Open lab
                            </button>
                            <button
                              className="module-complete-button"
                              type="button"
                              onClick={() => toggleModuleMastery(module.id)}
                              aria-label={`Mark ${module.title} ${isComplete ? 'incomplete' : 'mastered'}`}
                            >
                              {isComplete ? '✓' : '○'}
                            </button>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </div>
              )
            })()}
          </section>
        )}

        {/* --- VIEW: Academic Plan --- */}
        {activeView === 'academic-plan' && (
          <section className="view is-active" id="view-roadmap">
            <header className="page-intro roadmap-intro page-intro-split">
              <div>
                <p className="mono-label">A CAUTIOUS FOUR-TERM PLAN</p>
                <h2 id="roadmap-heading" style={{ fontSize: '2.5rem', margin: '0' }}>Protect the prerequisites. Aim the electives.</h2>
                <p style={{ marginTop: '8px', color: 'var(--ink-soft)' }}>
                  This is a planning hypothesis built around the courses you named—not an audit of your degree. Mark what you have already completed, then verify the result against MyProgress and a CS advisor.
                </p>
              </div>
              <div className="adviser-note">
                <span className="evidence-pill evidence-inferred">Planning recommendation</span>
                <strong>Catalog year controls.</strong>
                <p>Requirements can differ by admission year, transferred credit, and approved substitutions.</p>
              </div>
            </header>

            {/* Checklist of what the planner knows */}
            <section className="known-courses" aria-labelledby="known-courses-heading" style={{ marginBottom: '36px' }}>
              <div>
                <p className="mono-label">YOUR STARTING POINT</p>
                <h3 id="known-courses-heading" style={{ fontSize: '1.25rem', marginTop: '0', marginBottom: '14px' }}>What the planner knows</h3>
              </div>
              <div className="course-checklist" id="knownCourseChecklist">
                {KNOWN_COURSES.map((course) => {
                  const checked = Boolean(knownCourses[course.id])
                  return (
                    <div className="course-check" key={course.id}>
                      <input
                        type="checkbox"
                        id={`known-${course.id}`}
                        checked={checked}
                        onChange={() => toggleKnownCourse(course.id)}
                      />
                      <label htmlFor={`known-${course.id}`}>
                        {checked ? '✓' : '+'} {course.label}
                      </label>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Roadmap Timeline */}
            <div className="roadmap-timeline" id="roadmapTimeline" style={{ display: 'grid', gap: '16px' }}>
              {ROADMAP.map((term) => {
                const trackable = term.courses.filter((course) => course.id)
                const doneCount = trackable.filter((course) => knownCourses[course.id as string]).length
                return (
                  <article className="term-row" key={term.term}>
                    <div className="term-label">
                      <span>{term.year}</span>
                      <strong>{term.term}</strong>
                      <span className={`term-progress ${doneCount === trackable.length && trackable.length > 0 ? 'is-complete' : ''}`}>
                        {trackable.length > 0 && doneCount === trackable.length
                          ? '✓ Term complete'
                          : `${doneCount} of ${trackable.length} done`}
                      </span>
                    </div>
                    <div className="term-courses">
                      {term.courses.map((course) => {
                        const isDone = Boolean(course.id && knownCourses[course.id])
                        return (
                          <span
                            className={`roadmap-course ${course.kind === 'ds' ? 'is-ds' : course.kind === 'critical' ? 'is-critical' : ''} ${isDone ? 'is-done' : ''}`}
                            key={course.code}
                          >
                            {course.id ? (
                              <button
                                type="button"
                                className="roadmap-course-toggle"
                                aria-pressed={isDone}
                                title={isDone ? `Mark ${course.code} as not completed` : `Mark ${course.code} as completed`}
                                onClick={() => toggleKnownCourse(course.id as string)}
                              >
                                <span className="roadmap-course-check" aria-hidden="true">{isDone ? '✓' : ''}</span>
                                <strong>{course.code}</strong> {course.title}
                              </button>
                            ) : (
                              <>
                                <strong>{course.code}</strong> {course.title}
                              </>
                            )}
                            {course.url && (
                              <a
                                className="roadmap-course-link"
                                href={course.url}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Open ${course.code} details in a new tab`}
                              >
                                <ArrowUpRight size={12} />
                              </a>
                            )}
                          </span>
                        )
                      })}
                    </div>
                    <p className="term-note">
                      <strong>{term.noteTitle}</strong> {term.note}
                    </p>
                  </article>
                )
              })}
            </div>

            <div className="roadmap-footer-note" style={{ display: 'flex', gap: '10px', marginTop: '24px', padding: '16px', background: 'var(--surface-muted)', borderRadius: 'var(--radius-sm)', color: 'var(--muted)', fontSize: '0.84rem' }}>
              <span aria-hidden="true">↳</span>
              <p style={{ margin: '0' }}>
                <strong>Waitlist-safe rule:</strong> keep one degree-progressing backup for every constrained CS course. Never let a perfect elective sequence become a graduation bottleneck.
              </p>
            </div>

            {/* Data Science Specialization Thread */}
            <section className="data-specialization" style={{ marginTop: '64px', borderTop: '1px solid var(--line)', paddingTop: '48px' }}>
              <header className="page-intro data-intro" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                  <p className="mono-label">YOUR SPECIALIZATION THREAD</p>
                  <h2 style={{ fontSize: '2rem', margin: '0' }}>Data science, with systems underneath it.</h2>
                  <p style={{ color: 'var(--ink-soft)', marginTop: '8px' }}>
                    A durable niche is broader than model training: collect data reliably, store it deliberately, compute efficiently, and communicate uncertainty.
                  </p>
                </div>
                <div className="north-star-mark" aria-hidden="true" style={{ width: '48px', height: '48px', color: 'var(--primary)' }}>
                  <svg viewBox="0 0 100 100" fill="currentColor">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="m50 8 8 34 34 8-34 8-8 34-8-34-34-8 34-8z" />
                  </svg>
                </div>
              </header>

              {/* Skill constellation */}
              <section className="skill-constellation" aria-labelledby="constellation-heading" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', marginBottom: '48px' }}>
                {SKILLS.map((skill) => {
                  const goesToCoursePrep = skill.title === 'Systems'
                  return (
                    <button
                      type="button"
                      className="skill-node skill-node-button"
                      key={skill.title}
                      onClick={() => {
                        if (goesToCoursePrep) {
                          navigate('courses')
                        } else {
                          document.getElementById('elective-lens-heading')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                      }}
                    >
                      <strong style={{ fontSize: '1.05rem', color: 'var(--ink)' }}>{skill.title}</strong>
                      <span style={{ fontSize: '0.84rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{skill.detail}</span>
                      <span className="skill-node-hint" aria-hidden="true">
                        {goesToCoursePrep ? 'Open course prep →' : 'See matching electives ↓'}
                      </span>
                    </button>
                  )
                })}
              </section>

              {/* Portfolio bridge stages */}
              <section className="portfolio-bridge" aria-labelledby="portfolio-heading">
                <div className="portfolio-copy">
                  <p className="mono-label">ONE PROJECT, FOUR SEMESTERS</p>
                  <h3 id="portfolio-heading" style={{ fontSize: '1.5rem', marginTop: '0', marginBottom: '14px' }}>Build a campus data observatory.</h3>
                  <p style={{ color: 'var(--ink-soft)', lineHeight: '1.6', fontSize: '0.94rem' }}>
                    Start with a tiny networked collector. Grow it into a database-backed pipeline, then add analysis, reliability work, and an ML question. The same project can prove each layer instead of leaving you with disconnected class demos.
                  </p>
                </div>
                <ol className="project-stages" id="projectStages" style={{ margin: '0', padding: '0', listStyle: 'none', display: 'grid', gap: '20px' }}>
                  {PROJECT_STAGES.map((stage) => (
                    <li className="project-stage" key={stage.title} style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '16px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--muted)', fontWeight: '600', paddingTop: '3px' }}>{stage.term}</span>
                      <div>
                        <strong style={{ display: 'block', fontSize: '1.05rem', color: 'var(--ink)', marginBottom: '4px' }}>{stage.title}</strong>
                        <p style={{ margin: '0', fontSize: '0.92rem', color: 'var(--ink-soft)' }}>{stage.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {/* Elective lens table */}
              <section className="elective-lens" aria-labelledby="elective-lens-heading">
                <div className="section-heading-row" style={{ marginBottom: '16px' }}>
                  <p className="mono-label">ELECTIVE LENS</p>
                  <h3 id="elective-lens-heading" style={{ fontSize: '1.4rem', margin: '0' }}>Choose courses by capability, not hype.</h3>
                </div>
                <div className="elective-table-wrap" style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', background: 'var(--surface)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-muted)', borderBottom: '1px solid var(--line)' }}>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Course</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Capability</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Data-science payoff</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Planning signal</th>
                      </tr>
                    </thead>
                    <tbody id="electiveTable">
                      {ELECTIVES.map((item) => (
                        <tr key={item.course} style={{ borderBottom: '1px solid var(--line-strong)' }}>
                          <td style={{ padding: '12px 16px', fontWeight: '600' }}>{item.course}</td>
                          <td style={{ padding: '12px 16px' }}>{item.capability}</td>
                          <td style={{ padding: '12px 16px', color: 'var(--ink-soft)' }}>{item.payoff}</td>
                          <td style={{ padding: '12px 16px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{item.signal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </section>
          </section>
        )}

        {/* --- VIEW: Campus Resources --- */}
        {activeView === 'campus-resources' && (
          <section className="view is-active" id="view-campus">
            <header className="page-intro page-intro-split">
              <div>
                <p className="mono-label">UNIVERSITY RESOURCES & PORTALS</p>
                <h2 style={{ fontSize: '2.5rem', margin: '0' }}>Campus Signals & Requirements</h2>
                <p style={{ marginTop: '8px', color: 'var(--ink-soft)' }}>
                  SJSU degree-audit, catalog, and career portals in one place.
                </p>
              </div>
            </header>

            <div className="campus-sjsu-view" style={{ display: 'grid', gap: '32px' }}>
                <section>
                  <p className="mono-label">DEGREE AUDIT & PORTAL RIGHTS</p>
                  <h3 style={{ fontSize: '1.4rem', marginTop: '0', marginBottom: '16px' }}>SJSU Degree Requirements</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    <article className="card" style={{ padding: '20px', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <span className="evidence-pill evidence-official">Official Guide</span>
                      <strong style={{ fontSize: '1.1rem' }}>MyProgress degree audit</strong>
                      <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', margin: '0' }}>
                        SJSU's official audit tool tracks your remaining CS requirements.
                      </p>
                      <a href="https://www.sjsu.edu/ue/student-resources/myprogress.php" target="_blank" rel="noreferrer" className="button button-secondary" style={{ alignSelf: 'start', marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}>
                        <span>Open instructions</span>
                        <ArrowUpRight size={14} />
                      </a>
                    </article>
                    <article className="card" style={{ padding: '20px', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <span className="evidence-pill evidence-official">Current Catalog</span>
                      <strong style={{ fontSize: '1.1rem' }}>BS CS current requirements</strong>
                      <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', margin: '0' }}>
                        SJSU's 2026-27 BS Computer Science course requirements and catalog rights.
                      </p>
                      <a href="https://catalog.sjsu.edu/preview_program.php?catoid=23&poid=18783&returnto=8470" target="_blank" rel="noreferrer" className="button button-secondary" style={{ alignSelf: 'start', marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}>
                        <span>Open Catalog</span>
                        <ArrowUpRight size={14} />
                      </a>
                    </article>
                  </div>
                </section>

                <section style={{ borderTop: '1px solid var(--line)', paddingTop: '32px' }}>
                  <p className="mono-label">CAREER PORTALS</p>
                  <h3 style={{ fontSize: '1.4rem', marginTop: '0', marginBottom: '16px' }}>SJSU Career &amp; Job-Search Resources</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    <article className="card" style={{ padding: '20px', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <span className="evidence-pill evidence-official">Official Portal</span>
                      <strong style={{ fontSize: '1.1rem' }}>SJSU Handshake</strong>
                      <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', margin: '0' }}>
                        SJSU's official internship and job board—employer messaging, career-fair registration, and on-campus recruiting.
                      </p>
                      <a href="https://sjsu.joinhandshake.com/" target="_blank" rel="noreferrer" className="button button-secondary" style={{ alignSelf: 'start', marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}>
                        <span>Open Handshake</span>
                        <ArrowUpRight size={14} />
                      </a>
                    </article>
                    <article className="card" style={{ padding: '20px', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <span className="evidence-pill evidence-official">Official Guide</span>
                      <strong style={{ fontSize: '1.1rem' }}>SJSU Career Center</strong>
                      <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', margin: '0' }}>
                        Resume reviews, drop-in advising, employer events, and each term's career-fair calendar.
                      </p>
                      <a href="https://www.sjsu.edu/careercenter/" target="_blank" rel="noreferrer" className="button button-secondary" style={{ alignSelf: 'start', marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}>
                        <span>Open Career Center</span>
                        <ArrowUpRight size={14} />
                      </a>
                    </article>
                    <article className="card" style={{ padding: '20px', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', background: 'var(--surface)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <span className="evidence-pill evidence-official">Department</span>
                      <strong style={{ fontSize: '1.1rem' }}>SJSU Computer Science</strong>
                      <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', margin: '0' }}>
                        Department advising contacts, announcements, and research opportunities for CS majors.
                      </p>
                      <a href="https://www.sjsu.edu/cs/" target="_blank" rel="noreferrer" className="button button-secondary" style={{ alignSelf: 'start', marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem' }}>
                        <span>Open CS Department</span>
                        <ArrowUpRight size={14} />
                      </a>
                    </article>
                  </div>
                </section>

                <section style={{ borderTop: '1px solid var(--line)', paddingTop: '32px' }}>
                  <p className="mono-label">MAJOR PREREQUISITES</p>
                  <h3 style={{ fontSize: '1.4rem', marginTop: '0', marginBottom: '16px' }}>SJSU CS Prerequisite Chart</h3>
                  <article className="card" style={{ padding: '24px', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', background: 'var(--surface)', display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '1.15rem', display: 'block', marginBottom: '4px' }}>CS prerequisite tree diagram</strong>
                      <p style={{ fontSize: '0.9rem', color: 'var(--ink-soft)', margin: '0' }}>
                        Visual map of SJSU CS department prerequisites (effective Fall 2022 onwards). Key to sequencing your remaining upper-division classes.
                      </p>
                    </div>
                    <a href="https://www.sjsu.edu/cs/docs/pdfs/prerequisite-chart-fall22.pdf" target="_blank" rel="noreferrer" className="button button-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span>View PDF</span>
                      <ArrowUpRight size={16} />
                    </a>
                  </article>
                </section>
              </div>
          </section>
        )}

        {/* --- VIEW: Career Paths --- */}
        {activeView === 'career-paths' && (
          <section className="view is-active" id="view-career-paths">
            {/* Career path strip selector */}
            <nav className="path-strip" aria-label="Career paths" style={{ marginBottom: '32px' }}>
              <div className="path-strip-inner" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {pathProfiles.map((path) => (
                  <button
                    key={path.id}
                    type="button"
                    className={`path-tab ${selectedPath === path.id ? 'active' : ''}`}
                    onClick={() => choosePath(path.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }}
                  >
                    <PathIcon id={path.id} />
                    <span>{path.shortName}</span>
                  </button>
                ))}
              </div>
            </nav>

            <ViewIntro
              eyebrow={profile.eyebrow}
              title={profile.name}
              description={profile.summary}
              action={
                <div className="intro-progress">
                  <span className="evidence-pill evidence-syllabus">{profile.duration} · {profile.weeklyHours}</span>
                  <div style={{ marginTop: '8px', fontSize: '0.84rem', color: 'var(--muted)', textAlign: 'right' }}>
                    <strong>{completedRequired}/{requiredTasks.length}</strong> required tasks complete
                  </div>
                </div>
              }
            />

            {/* Path details split */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', margin: '36px 0 48px' }}>
              <div className="panel" style={{ padding: '24px' }}>
                <span className="mono-label">WHY THIS FITS</span>
                <p style={{ fontSize: '0.94rem', color: 'var(--ink-soft)', lineHeight: '1.6', margin: '8px 0 0' }}>{profile.fit}</p>
              </div>
              <div className="panel" style={{ padding: '24px' }}>
                <span className="mono-label">TARGET PROOF</span>
                <p style={{ fontSize: '0.94rem', color: 'var(--ink-soft)', lineHeight: '1.6', margin: '8px 0 0' }}>{profile.primaryOutput}</p>
              </div>
              <div className="panel" style={{ padding: '24px' }}>
                <span className="mono-label">INTERVIEW FOCUS</span>
                <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '0.9rem', color: 'var(--ink-soft)', display: 'grid', gap: '6px' }}>
                  {profile.interviewFocus.map((focus) => <li key={focus}>{focus}</li>)}
                </ul>
              </div>
            </div>

            {/* Roadmap Tasks Checklist */}
            <section className="career-roadmap-milestones" style={{ marginBottom: '64px' }}>
              <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '28px' }}>
                <span className="mono-label">CAREER ROADMAP</span>
                <h3 style={{ fontSize: '1.5rem', margin: '0' }}>Milestones &amp; Actions</h3>
              </div>

              <div className="roadmap-list" style={{ display: 'grid', gap: '24px' }}>
                {phases.map((phase) => {
                  const phaseRequired = phase.tasks.filter((t) => !t.optional)
                  const phaseDone = phaseRequired.filter((t) => completedTasks.includes(t.id)).length

                  return (
                    <section className="phase-card" key={phase.id}>
                      <header className="phase-head" style={{ display: 'flex', gap: '20px', alignItems: 'start', marginBottom: '18px' }}>
                        <span className="phase-index" style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'var(--path-deep)', color: 'white', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', flexShrink: '0' }}>
                          {phase.index}
                        </span>
                        <div className="phase-title" style={{ flex: '1' }}>
                          <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontWeight: '600' }}>{phase.window}</span>
                          <h2 style={{ fontSize: '1.3rem', margin: '4px 0 0', fontWeight: '600' }}>{phase.title}</h2>
                          <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: 'var(--ink-soft)' }}>{phase.purpose}</p>
                        </div>
                        <div className="phase-score" style={{ textAlign: 'right', flexShrink: '0' }}>
                          <strong style={{ display: 'block', fontSize: '1.1rem' }}>{phaseDone}/{phaseRequired.length}</strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>required</span>
                        </div>
                      </header>

                      <div className="phase-milestone" style={{ background: 'var(--surface-quiet)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', fontSize: '0.88rem' }}>
                        <Target size={16} style={{ color: 'var(--path-accent)', flexShrink: '0' }} />
                        <span style={{ fontWeight: '600', color: 'var(--muted)' }}>Exit proof:</span>
                        <p style={{ margin: '0', color: 'var(--ink)' }}>{phase.milestone}</p>
                      </div>

                      <div className="phase-tasks" style={{ display: 'grid', gap: '10px' }}>
                        {phase.tasks.map((task) => {
                          const isComplete = completedTasks.includes(task.id)
                          return (
                            <article className={`roadmap-task ${isComplete ? 'complete' : ''}`} key={task.id} style={{ display: 'flex', gap: '12px', padding: '14px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', alignItems: 'start' }}>
                              <button
                                className="task-toggle"
                                type="button"
                                aria-pressed={isComplete}
                                onClick={() => toggleTask(task.id)}
                                style={{ width: '20px', height: '20px', borderRadius: '4px', border: '1px solid var(--line)', background: isComplete ? 'var(--path-deep)' : 'var(--surface)', color: 'white', display: 'grid', placeItems: 'center', cursor: 'pointer', flexShrink: '0', marginTop: '3px' }}
                              >
                                {isComplete && <Check size={14} />}
                              </button>
                              <div className="roadmap-task-copy" style={{ flex: '1' }}>
                                <div className="task-meta" style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                                  <span>{task.effort}</span>
                                  {task.optional && <span className="optional-tag" style={{ color: 'var(--primary)', fontWeight: '600' }}>Optional</span>}
                                </div>
                                <h3 style={{ fontSize: '1.05rem', margin: '4px 0 0', fontWeight: '600' }}>{task.title}</h3>
                                <p style={{ margin: '4px 0 0', fontSize: '0.92rem', color: 'var(--ink-soft)' }}>{task.detail}</p>
                                <div className="task-output" style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '10px', fontSize: '0.84rem', color: 'var(--muted)' }}>
                                  <FileCheck2 size={14} />
                                  <span>Output:</span>
                                  <span style={{ color: 'var(--ink)' }}>{task.output}</span>
                                </div>
                              </div>
                            </article>
                          )
                        })}
                      </div>
                    </section>
                  )
                })}
              </div>
            </section>

            {/* Flagship Projects briefs */}
            <section className="career-flagship-projects" style={{ marginBottom: '48px' }}>
              <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '28px' }}>
                <span className="mono-label">PORTFOLIO PROJECTS</span>
                <h3 style={{ fontSize: '1.5rem', margin: '0' }}>Build Work Worth Defending</h3>
              </div>

              <div className="project-stack" style={{ display: 'grid', gap: '32px' }}>
                {projects.map((project, pIdx) => {
                  const done = project.milestones.filter((_, idx) =>
                    completedMilestones.includes(`${project.id}-m${idx}`)
                  ).length
                  const percent = Math.round((done / project.milestones.length) * 100)

                  return (
                    <article className={`project-card ${pIdx === 0 ? 'featured' : ''}`} key={project.id} style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', background: 'var(--surface)', padding: '28px' }}>
                      <header className="project-card-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
                        <div>
                          <div className="project-labels" style={{ display: 'flex', gap: '8px', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginBottom: '8px' }}>
                            <span>{project.label}</span>
                            <span>Project {pIdx + 1} of {projects.length}</span>
                          </div>
                          <h2 style={{ fontSize: '1.6rem', margin: '0', fontWeight: '600' }}>{project.title}</h2>
                          <p style={{ margin: '8px 0 0', fontSize: '0.98rem', color: 'var(--ink-soft)', maxWidth: '640px' }}>{project.pitch}</p>
                        </div>
                        <div className="project-score" style={{ textAlign: 'right' }}>
                          <strong style={{ fontSize: '1.4rem', display: 'block' }}>{percent}%</strong>
                          <span style={{ fontSize: '0.74rem', color: 'var(--muted)' }}>{done}/{project.milestones.length} milestones</span>
                        </div>
                      </header>

                      <div className="project-meta-row" style={{ display: 'flex', gap: '16px', fontSize: '0.84rem', color: 'var(--muted)', marginBottom: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock3 size={14} /> {project.time}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Gauge size={14} /> {project.difficulty}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Code2 size={14} /> {project.stack.slice(0, 4).join(' · ')}</span>
                      </div>

                      <div className="decision-callout" style={{ display: 'flex', gap: '12px', background: 'var(--surface-muted)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '24px' }}>
                        <Target size={20} style={{ color: 'var(--path-accent)', flexShrink: '0', marginTop: '2px' }} />
                        <div>
                          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontWeight: '600' }}>THE DECISION THIS PROJECT SUPPORTS</span>
                          <p style={{ margin: '4px 0 0', fontSize: '0.94rem', fontWeight: '600', color: 'var(--ink)' }}>{project.decision}</p>
                        </div>
                      </div>

                      <div className="project-body-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '12px' }}>Build milestones</h4>
                          <div className="milestone-list" style={{ display: 'grid', gap: '8px' }}>
                            {project.milestones.map((milestone, idx) => {
                              const milestoneId = `${project.id}-m${idx}`
                              const isChecked = completedMilestones.includes(milestoneId)
                              return (
                                <label className={`milestone ${isChecked ? 'checked' : ''}`} key={milestoneId} style={{ display: 'flex', gap: '8px', alignItems: 'start', fontSize: '0.88rem', cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleMilestone(milestoneId)}
                                    style={{ marginTop: '3px' }}
                                  />
                                  <span style={{ color: isChecked ? 'var(--muted)' : 'var(--ink)' }}>{milestone}</span>
                                </label>
                              )
                            })}
                          </div>
                        </div>

                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '12px' }}>Definition of done</h4>
                          <ul style={{ listStyle: 'none', padding: '0', margin: '0', display: 'grid', gap: '8px', fontSize: '0.88rem' }}>
                            {project.acceptance.map((item) => (
                              <li key={item} style={{ display: 'flex', gap: '8px', alignItems: 'start', color: 'var(--ink-soft)' }}>
                                <CheckCircle2 size={14} style={{ color: 'var(--success)', marginTop: '3px', flexShrink: '0' }} />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '12px' }}>Interview defense</h4>
                          <ul style={{ listStyle: 'none', padding: '0', margin: '0', display: 'grid', gap: '8px', fontSize: '0.88rem' }}>
                            {project.interviewProof.map((item) => (
                              <li key={item} style={{ display: 'flex', gap: '8px', alignItems: 'start', color: 'var(--ink-soft)' }}>
                                <Zap size={14} style={{ color: 'var(--path-accent)', marginTop: '3px', flexShrink: '0' }} />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="resume-proof" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontWeight: '600' }}>RESUME BULLET POINT</span>
                          <p style={{ margin: '4px 0 0', fontStyle: 'italic', fontSize: '0.92rem', color: 'var(--ink)' }}>“{project.resumeLine}”</p>
                        </div>
                        <a href={project.datasetUrl} target="_blank" rel="noreferrer" className="button button-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                          {project.datasetLabel} <ExternalLink size={13} />
                        </a>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          </section>
        )}

        {/* --- VIEW: Career Resources --- */}
        {activeView === 'career-resources' && (
          <section className="view is-active" id="view-resources">
            <ViewIntro
              eyebrow={`${pathResources.length} curated resources`}
              title="A career resource stack, not a content pile"
              description="Start with one primary spine. Use practice to produce evidence, references to unblock work, and alternatives only when the main resource does not fit."
            />

            <section className="resource-controls" aria-label="Filter resources" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', margin: '28px 0', padding: '16px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)' }}>
              <label style={{ flex: '1', minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Search resources</span>
                <input
                  value={resourceQuery}
                  onChange={(event) => setResourceQuery(event.target.value)}
                  placeholder="Search title, provider, or skill..."
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)' }}
                />
              </label>
              <label style={{ minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Topic</span>
                <select value={resourceCategory} onChange={(event) => setResourceCategory(event.target.value)} style={{ padding: '8px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)' }}>
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </label>
              <label style={{ minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Use it as</span>
                <select value={resourceKind} onChange={(event) => setResourceKind(event.target.value)} style={{ padding: '8px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)' }}>
                  {kinds.map((k) => <option key={k}>{k}</option>)}
                </select>
              </label>
            </section>

            <div className="resource-grid">
              {filteredResources.map((res) => {
                const status = resourceStates[res.id] ?? 'planned'
                return (
                  <article className={`resource-card ${res.kind.toLowerCase().replaceAll(' ', '-')}`} key={res.id} style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '24px', background: 'var(--surface)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="evidence-pill">{res.kind}</span>
                      <span className={`evidence-pill ${res.evidence === 'Official' ? 'evidence-official' : 'evidence-student'}`}>{res.evidence}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{res.provider}</span>
                      <h2 style={{ fontSize: '1.25rem', margin: '4px 0 0', fontWeight: '600' }}>
                        <a href={res.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--ink)' }}>
                          {res.title} <ArrowUpRight size={15} />
                        </a>
                      </h2>
                      <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: 'var(--ink-soft)', lineHeight: '1.55' }}>{res.why}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--muted)' }}>
                      <span style={{ background: 'var(--surface-muted)', padding: '4px 8px', borderRadius: '4px' }}>{res.format}</span>
                      <span style={{ background: 'var(--surface-muted)', padding: '4px 8px', borderRadius: '4px' }}>{res.duration}</span>
                      <span style={{ background: 'var(--surface-muted)', padding: '4px 8px', borderRadius: '4px' }}>{res.level}</span>
                      <span style={{ background: 'var(--surface-muted)', padding: '4px 8px', borderRadius: '4px' }}>{res.access}</span>
                    </div>
                    <div style={{ background: 'var(--surface-quiet)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', display: 'flex', gap: '6px' }}>
                      <Target size={14} style={{ color: 'var(--path-accent)', flexShrink: '0', marginTop: '2px' }} />
                      <p style={{ margin: '0' }}><strong>Do this:</strong> {res.action}</p>
                    </div>
                    <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                        <span>Progress</span>
                        <select
                          value={status}
                          onChange={(e) => setResourceStatus(res.id, e.target.value as ResourceStatus)}
                          style={{ padding: '4px', border: '1px solid var(--line)', borderRadius: '4px' }}
                        >
                          <option value="planned">Planned</option>
                          <option value="in-progress">In progress</option>
                          <option value="complete">Complete</option>
                        </select>
                      </label>
                      <small style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Verified {res.verified}</small>
                    </div>
                  </article>
                )
              })}
            </div>

            {filteredResources.length === 0 && (
              <div className="resource-empty" role="status">
                <p>No resources match these filters.</p>
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setResourceQuery('')
                    setResourceCategory('All')
                    setResourceKind('All')
                  }}
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        )}

        {/* --- VIEW: Outreach & Applications --- */}
        {activeView === 'outreach-applications' && (
          <section className="view is-active" id="view-applications">
            <ViewIntro
              eyebrow="Summer 2027 campaign"
              title="Track and secure your pipeline"
              description="The market moves fast. Track your outreach, log applications, and keep yourself accountable with a weekly schedule checklist."
            />

            <section className="recruiting-banner" style={{ margin: '24px 0', padding: '20px', borderLeft: '4px solid var(--path-accent)', background: 'var(--surface)', borderRadius: 'var(--radius-sm)' }}>
              <div><span className="live-dot" /><p className="eyebrow" style={{ margin: '0', fontSize: '0.64rem' }}>TIMING ALERT</p></div>
              <h2 style={{ fontSize: '1.25rem', margin: '0', fontWeight: '600' }}>Summer 2027 recruitment is active now</h2>
              <p style={{ margin: '6px 0 0', color: 'var(--ink-soft)', fontSize: '0.92rem' }}>
                Postings refresh weekly. Put opportunities in the tracker immediately to prevent missed deadlines.
              </p>
            </section>

            {/* Recruiting Signals */}
            {pathSignals.length > 0 && (
              <section className="signal-section" style={{ marginBottom: '48px' }}>
                <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--line)', paddingBottom: '8px', marginBottom: '16px' }}>
                  <div><p className="mono-label">LIVE TRACKING</p><h2 style={{ fontSize: '1.3rem', margin: '0' }}>Target postings &amp; checkpoints</h2></div>
                </div>
                <div className="signal-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {pathSignals.map((signal) => (
                    <a href={signal.url} target="_blank" rel="noreferrer" className="signal-card" key={signal.id} style={{ display: 'block', padding: '16px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', textDecoration: 'none', color: 'inherit' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--path-accent)' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: '600', fontFamily: 'var(--font-mono)' }}>{signal.tag}</span>
                        <ExternalLink size={14} />
                      </div>
                      <h3 style={{ fontSize: '1.05rem', margin: '6px 0 4px', fontWeight: '600' }}>{signal.title}</h3>
                      <p style={{ margin: '0 0 10px', fontSize: '0.85rem', color: 'var(--ink-soft)' }}>{signal.detail}</p>
                      <small style={{ display: 'block', fontSize: '0.74rem', color: 'var(--muted)' }}>{signal.source}</small>
                    </a>
                  ))}
                </div>
              </section>
            )}

            <div className="application-layout">
              <section className="application-main">
                {/* Application Form */}
                <form id="application-form" className="application-form" onSubmit={addApplication} style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '24px', background: 'var(--surface)', marginBottom: '32px' }}>
                  <h3 style={{ fontSize: '1.25rem', margin: '0 0 16px', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>Log an Application</h3>
                  <div className="form-grid">
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span>Company *</span>
                      <input required value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company name" style={{ padding: '8px', border: '1px solid var(--line)', borderRadius: '4px' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span>Role *</span>
                      <input required value={role} onChange={(event) => setRole(event.target.value)} placeholder={profile.roles[0]} style={{ padding: '8px', border: '1px solid var(--line)', borderRadius: '4px' }} />
                    </label>
                    <label className="wide" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span>Job posting link</span>
                      <input type="url" value={jobUrl} onChange={(event) => setJobUrl(event.target.value)} placeholder="https://..." style={{ padding: '8px', border: '1px solid var(--line)', borderRadius: '4px' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span>Date applied</span>
                      <input type="date" value={applicationDate} onChange={(event) => setApplicationDate(event.target.value)} style={{ padding: '8px', border: '1px solid var(--line)', borderRadius: '4px' }} />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span>Status</span>
                      <select value={applicationStatus} onChange={(event) => setApplicationStatus(event.target.value as ApplicationStatus)} style={{ padding: '8px', border: '1px solid var(--line)', borderRadius: '4px' }}>
                        {statusOptions.map((status) => <option key={status}>{status}</option>)}
                      </select>
                    </label>
                    <label className="wide" style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span>Next action step</span>
                      <input value={nextStep} onChange={(event) => setNextStep(event.target.value)} placeholder="Tailor resume, schedule follow up, prepare SQL..." style={{ padding: '8px', border: '1px solid var(--line)', borderRadius: '4px' }} />
                    </label>
                  </div>
                  <button className="button button-primary" type="submit" style={{ marginTop: '20px' }}>
                    <Plus size={16} /> Save application
                  </button>
                </form>

                {/* Applications list */}
                <div className="application-list" style={{ display: 'grid', gap: '12px' }}>
                  {pathApplications.map((app) => (
                    <article className="application-card" key={app.id} style={{ display: 'flex', gap: '14px', alignItems: 'center', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: '16px', background: 'var(--surface)' }}>
                      <div className="company-avatar" style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--path-soft)', color: 'var(--path-deep)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontWeight: '600', flexShrink: '0' }}>
                        {app.company.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: '1', minWidth: '0' }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--muted)', display: 'block' }}>{app.company}</span>
                        <h4 style={{ fontSize: '1.05rem', margin: '2px 0 0', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.role}</h4>
                        <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                          {app.nextStep ? `Next: ${app.nextStep}` : 'No next action logged'} · {app.date}
                        </p>
                      </div>
                      <select
                        aria-label={`Status for ${app.company}`}
                        value={app.status}
                        onChange={(event) => updateApplication(app.id, event.target.value as ApplicationStatus)}
                        style={{ padding: '6px', border: '1px solid var(--line)', borderRadius: '4px', fontSize: '0.8rem' }}
                      >
                        {statusOptions.map((status) => <option key={status}>{status}</option>)}
                      </select>
                      {app.url && (
                        <a href={app.url} target="_blank" rel="noreferrer" style={{ color: 'var(--muted)', padding: '4px' }}>
                          <ExternalLink size={16} />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setApplications((current) => current.filter((item) => item.id !== app.id))}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </article>
                  ))}
                  {!pathApplications.length && (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '36px', border: '2px dashed var(--line)', borderRadius: 'var(--radius-sm)' }}>
                      <BriefcaseBusiness size={28} style={{ color: 'var(--muted)', margin: '0 auto 8px' }} />
                      <h4 style={{ fontSize: '1.1rem', margin: '0' }}>No applications logged for this path</h4>
                      <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--muted)' }}>Add opportunities to stay organized.</p>
                    </div>
                  )}
                </div>
              </section>

              <aside className="application-aside" style={{ display: 'grid', gap: '20px', alignContent: 'start' }}>
                <section className="career-card panel" style={{ padding: '20px' }}>
                  <span className="mono-label">SEARCH TITLES</span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                    {profile.roles.map((rName) => (
                      <span key={rName} style={{ padding: '6px 10px', background: 'var(--surface-muted)', borderRadius: '4px', fontSize: '0.78rem' }}>
                        {rName}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="career-card panel" style={{ padding: '20px' }}>
                  <span className="mono-label">WEEKLY CADENCE</span>
                  <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
                    {sharedApplicationActions.map((action, idx) => (
                      <div key={action.id} style={{ display: 'flex', gap: '10px' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--path-soft)', color: 'var(--path-deep)', display: 'grid', placeItems: 'center', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: '600', flexShrink: '0' }}>
                          {idx + 1}
                        </span>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.9rem' }}>{action.title}</strong>
                          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--ink-soft)' }}>{action.detail}</p>
                          <small style={{ display: 'block', fontSize: '0.7rem', color: 'var(--path-accent)', marginTop: '4px', fontWeight: '600' }}>{action.cadence}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {selectedPath === 'data-science' && (
                  <section className="career-card panel" style={{ padding: '20px', background: 'var(--surface-quiet)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--path-accent)' }}>
                      <GraduationCap size={18} />
                      <span className="mono-label" style={{ margin: '0' }}>REFERRAL STRATEGY</span>
                    </div>
                    <h3 style={{ fontSize: '1.15rem', margin: '12px 0 6px', fontWeight: '600' }}>Ask for calibration first</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--ink-soft)', lineHeight: '1.5' }}>
                      Always build context with a contact and verify your skills before asking for direct referral leverage.
                    </p>
                    <blockquote style={{ padding: '10px', background: 'var(--surface)', borderLeft: '2px solid var(--path-accent)', fontSize: '0.78rem', fontStyle: 'italic', margin: '14px 0', lineHeight: '1.6' }}>
                      {referralDraft}
                    </blockquote>
                    <button className="button button-secondary" type="button" onClick={copyReferral} style={{ width: '100%' }}>
                      <Copy size={14} /> Copy draft
                    </button>
                  </section>
                )}
              </aside>
            </div>
          </section>
        )}

        {/* --- VIEW: Evidence Shelf (Sources) --- */}
        {activeView === 'evidence-shelf' && (
          <section className="view is-active" id="view-sources">
            <header className="page-intro sources-intro" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '28px', marginBottom: '36px' }}>
              <div>
                <p className="mono-label">RESEARCH, WITH THE LABELS LEFT ON</p>
                <h2 id="sources-heading" style={{ fontSize: '2.5rem', margin: '0' }}>The evidence shelf</h2>
                <p style={{ marginTop: '8px', color: 'var(--ink-soft)' }}>
                  Course details change by term and instructor. This shelf makes it clear what is official, what came from a public syllabus, what students reported, and what this dashboard inferred.
                </p>
              </div>
              <div className="source-updated" style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', display: 'block' }}>Research checked</span>
                <strong style={{ fontSize: '1.1rem', display: 'block' }}>July 11, 2026</strong>
                <button className="text-button" id="openEvidenceLegend" type="button" onClick={() => setEvidenceLegendOpen(true)} style={{ marginTop: '4px' }}>
                  What the labels mean
                </button>
              </div>
            </header>

            <div className="source-toolbar" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '28px' }}>
              <label className="search-field" style={{ flex: '1', minWidth: '240px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', background: 'var(--surface)' }}>
                <Search size={16} style={{ color: 'var(--muted)' }} />
                <input
                  id="sourceSearch"
                  value={sourceSearchQuery}
                  onChange={(e) => setSourceSearchQuery(e.target.value)}
                  placeholder="Search course, topic, or source…"
                  style={{ border: 'none', background: 'none', width: '100%', outline: 'none' }}
                />
              </label>

              <div className="source-filters" role="group" aria-label="Filter by evidence type" style={{ display: 'flex', gap: '6px' }}>
                {(['all', 'official', 'syllabus', 'student', 'resource'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={`source-filter ${sourceFilter === filter ? 'is-active' : ''}`}
                    onClick={() => setSourceFilter(filter)}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="source-list" id="sourceList" style={{ display: 'grid', gap: '14px' }}>
              {filteredSources.map((source) => (
                <article className="source-row" key={source.title} style={{ display: 'flex', gap: '16px', padding: '16px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', alignItems: 'center' }}>
                  {renderEvidenceLabel(source.type)}
                  <div style={{ flex: '1' }}>
                    <h3 style={{ fontSize: '1.1rem', margin: '0', fontWeight: '600' }}>{source.title}</h3>
                    <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>{source.description}</p>
                  </div>
                  <span className="source-meta" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: 'var(--muted)', minWidth: '120px', textAlign: 'right' }}>
                    {source.meta}
                  </span>
                  <a className="source-link" href={source.url} target="_blank" rel="noreferrer" aria-label={`Open ${source.title}`} style={{ display: 'grid', placeItems: 'center', width: '32px', height: '32px', borderRadius: '4px', background: 'var(--surface-quiet)', color: 'var(--muted)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px' }}>
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                    </svg>
                  </a>
                </article>
              ))}
              {!filteredSources.length && (
                <p className="empty-state" style={{ textAlign: 'center', padding: '36px', color: 'var(--muted)' }}>
                  No sources match that filter. Try a broader search.
                </p>
              )}
            </div>
          </section>
        )}
      </main>

      {/* --- DIALOG MODALS --- */}
      {/* 1. Module Dialog Details */}
      {activeModule && activeModuleCourse && (
        <div className="dialog-overlay" style={{ position: 'fixed', inset: '0', zIndex: 100, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', padding: '20px' }} onClick={() => setOpenModuleId(null)}>
          <div className="dialog-shell" role="dialog" aria-modal="true" aria-labelledby="module-dialog-title" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '28px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
            <header className="dialog-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px', borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
              <div>
                <span className="mono-label" style={{ color: 'var(--path-accent)' }}>{activeModuleCourse.code} · {activeModuleCourse.title}</span>
                <h2 id="module-dialog-title" style={{ fontSize: '1.4rem', margin: '4px 0 0', fontWeight: '600' }}>{activeModule.title}</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Close module" onClick={() => setOpenModuleId(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={20} />
              </button>
            </header>
            <div className="dialog-body">
              <p className="dialog-intro" style={{ fontSize: '1.02rem', lineHeight: '1.6', color: 'var(--ink)' }}>{activeModule.why}</p>
              
              <section className="dialog-section" style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '8px' }}>Your proof of work</h3>
                <p style={{ margin: '0', fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
                  <strong>{activeModule.deliverable}</strong> · expected time {activeModule.duration}.
                </p>
              </section>

              <section className="dialog-section" style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '8px' }}>Run the lab</h3>
                <ol className="lab-steps" style={{ paddingLeft: '20px', margin: '0', display: 'grid', gap: '8px', fontSize: '0.9rem', color: 'var(--ink-soft)' }}>
                  {activeModule.steps.map((step) => <li key={step}>{step}</li>)}
                </ol>
              </section>

              <section className="dialog-section" style={{ marginTop: '20px', borderBottom: '1px solid var(--line)', paddingBottom: '20px', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '8px' }}>Primary resources</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {activeModule.resources.map((res) => (
                    <a className="resource-link button button-secondary" href={res.url} target="_blank" rel="noreferrer" key={res.label} style={{ fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span>{res.label}</span>
                      <ArrowUpRight size={14} />
                    </a>
                  ))}
                </div>
              </section>

              <div className="dialog-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button className="button button-secondary" type="button" onClick={() => setOpenModuleId(null)}>
                  Close
                </button>
                <button
                  className={`button ${activeModuleCourse.tone === 'network' ? 'button-network' : 'button-primary'}`}
                  type="button"
                  onClick={() => toggleModuleMastery(activeModule.id)}
                >
                  {modulesCompleted[activeModule.id] ? "Mark as still learning" : "Mark as mastered"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Evidence Legend Dialog */}
      {evidenceLegendOpen && (
        <div className="dialog-overlay" style={{ position: 'fixed', inset: '0', zIndex: 100, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', padding: '20px' }} onClick={() => setEvidenceLegendOpen(false)}>
          <div className="dialog-shell dialog-shell-narrow" role="dialog" aria-modal="true" aria-labelledby="legend-dialog-title" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
            <header className="dialog-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px', borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
              <div>
                <span className="mono-label">READING THE RESEARCH</span>
                <h2 id="legend-dialog-title" style={{ fontSize: '1.3rem', margin: '4px 0 0', fontWeight: '600' }}>Four levels of certainty</h2>
              </div>
              <button className="icon-button" type="button" aria-label="Close evidence guide" onClick={() => setEvidenceLegendOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={20} />
              </button>
            </header>
            <div className="evidence-guide" style={{ display: 'grid', gap: '16px' }}>
              <article style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <span className="evidence-pill evidence-official">Official</span>
                <p style={{ margin: '0', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                  Current SJSU department or catalog information. Strongest for course identity, description, and offering patterns.
                </p>
              </article>
              <article style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <span className="evidence-pill evidence-syllabus">Public syllabus</span>
                <p style={{ margin: '0', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                  A real section from a named term. Strong for that instructor and semester; useful but not a promise about yours.
                </p>
              </article>
              <article style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <span className="evidence-pill evidence-student">Student signal</span>
                <p style={{ margin: '0', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                  Anecdotal experience. Helpful for workload texture, never treated as representative fact.
                </p>
              </article>
              <article style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <span className="evidence-pill evidence-inferred">Lab recommendation</span>
                <p style={{ margin: '0', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                  An editorial preparation choice derived from the evidence and durable computer-science fundamentals.
                </p>
              </article>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div className="toast" role="status" style={{ position: 'fixed', right: '24px', bottom: '24px', zIndex: 100, display: 'flex', alignItems: 'center', gap: '9px', padding: '12px 18px', background: 'var(--primary-deep)', color: 'white', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: '500', boxShadow: 'var(--shadow-float)' }}>
          <CheckCircle2 size={16} style={{ color: 'var(--path-accent)' }} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}

export default App
