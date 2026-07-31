import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  ArrowUpRight,
  BookOpenCheck,
  BrainCircuit,
  ChartNoAxesCombined,
  Check,
  CheckCircle2,
  ChevronRight,
  CirclePlay,
  Clock3,
  Code2,
  Coffee,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileCheck2,
  Gauge,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  Target,
  Trash2,
  Upload,
  X,
  Zap,
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
  GITHUB_STUDENT_PACK,
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

type WorkspaceRoute = {
  id: AppWorkspaceView
  code: string
  label: string
  shortLabel: string
  context: string
  title: string
  group: 'Prepare' | 'Choose' | 'Launch'
}

const workspaceRoutes: WorkspaceRoute[] = [
  {
    id: 'dashboard',
    code: '01',
    label: 'This week',
    shortLabel: 'Week',
    context: 'Summer preparation / 2026',
    title: 'This week',
    group: 'Prepare',
  },
  {
    id: 'courses',
    code: '02',
    label: 'Course prep',
    shortLabel: 'Courses',
    context: 'Waitlist preparation / CS 149 + CS 158A',
    title: 'Course prep',
    group: 'Prepare',
  },
  {
    id: 'academic-plan',
    code: '03',
    label: 'Academic plan',
    shortLabel: 'Plan',
    context: 'Four semesters / one clear plan',
    title: 'Academic plan',
    group: 'Prepare',
  },
  {
    id: 'campus-resources',
    code: '04',
    label: 'Campus resources',
    shortLabel: 'Campus',
    context: 'SJSU / official resources',
    title: 'Campus resources',
    group: 'Choose',
  },
  {
    id: 'career-paths',
    code: '05',
    label: 'Career paths',
    shortLabel: 'Paths',
    context: 'Six career options / compare the work',
    title: 'Career paths',
    group: 'Choose',
  },
  {
    id: 'career-resources',
    code: '06',
    label: 'Career resources',
    shortLabel: 'Library',
    context: 'Learning resources / start with the basics',
    title: 'Learning resources',
    group: 'Choose',
  },
  {
    id: 'outreach-applications',
    code: '07',
    label: 'Applications',
    shortLabel: 'Apply',
    context: 'Summer 2027 / application timeline',
    title: 'Applications',
    group: 'Launch',
  },
  {
    id: 'evidence-shelf',
    code: '08',
    label: 'Sources',
    shortLabel: 'Sources',
    context: 'Sources / where the information came from',
    title: 'Sources',
    group: 'Launch',
  },
]

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
  sidebarWidth: 'signal-path-sidebar-width-v1',
  sidebarCollapsed: 'signal-path-sidebar-collapsed-v1',
}

const SIDEBAR_DEFAULT_WIDTH = 244
const SIDEBAR_MIN_WIDTH = 200
const SIDEBAR_MAX_WIDTH = 340
const SIDEBAR_COLLAPSED_WIDTH = 84
const SIDEBAR_COLLAPSE_THRESHOLD = 160
const SIDEBAR_COMPACT_VIEWPORT_MAX = 1320

function clampSidebarWidth(value: number) {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(value)))
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

const referralDraft = `Hey [Name] — I’ve narrowed my target to [role family] and have been preparing around [skills]. I built [project] to answer [decision], and I can walk through the trade-offs and recommendation. Would you be open to a 20-minute conversation about how the role works at [company] and where my gaps still are? No pressure on a referral—I’d value your candid feedback first.`

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
    <header className="route-intro">
      <div className="route-intro-index" aria-hidden="true">
        <span />
        <i />
      </div>
      <div className="route-intro-copy">
        <p className="route-kicker">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action && <div className="route-intro-action">{action}</div>}
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
  const [openWeeklyTaskId, setOpenWeeklyTaskId] = useState<string | null>(null)
  const [openModuleId, setOpenModuleId] = useState<string | null>(null)
  const [evidenceLegendOpen, setEvidenceLegendOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const stored = localStorage.getItem(storage.sidebarWidth)
    const parsed = Number(stored)
    return stored !== null && Number.isFinite(parsed) ? clampSidebarWidth(parsed) : SIDEBAR_DEFAULT_WIDTH
  })
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem(storage.sidebarCollapsed)
    return stored === 'true'
  })
  const [sidebarCompactViewport, setSidebarCompactViewport] = useState(
    () => window.innerWidth > 768 && window.innerWidth <= SIDEBAR_COMPACT_VIEWPORT_MAX
  )
  const [sidebarResizing, setSidebarResizing] = useState(false)
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
  const sidebarRef = useRef<HTMLElement>(null)
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null)
  const mobileNavCloseRef = useRef<HTMLButtonElement>(null)
  const weeklyDrawerCloseRef = useRef<HTMLButtonElement>(null)
  const weeklyDrawerRef = useRef<HTMLElement>(null)
  const weeklyGuideReturnFocusRef = useRef<HTMLButtonElement | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const modalCloseRef = useRef<HTMLButtonElement>(null)
  const sidebarWidthRef = useRef(sidebarWidth)
  const sidebarResizePointerRef = useRef<number | null>(null)
  const sidebarDragCleanupRef = useRef<(() => void) | null>(null)

  // --- Derived Values ---
  const profile = pathProfiles.find((item) => item.id === selectedPath) ?? pathProfiles[0]
  const activeRoute = workspaceRoutes.find((route) => route.id === activeView) ?? workspaceRoutes[0]
  const activeRouteIndex = workspaceRoutes.findIndex((route) => route.id === activeView)
  const sidebarIsCollapsed = sidebarCollapsed || sidebarCompactViewport
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
  useEffect(() => localStorage.setItem(storage.sidebarCollapsed, String(sidebarCollapsed)), [sidebarCollapsed])
  useEffect(() => () => sidebarDragCleanupRef.current?.(), [])

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
    if (!openWeeklyTaskId && !openModuleId && !evidenceLegendOpen && !mobileNavOpen) return undefined
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenWeeklyTaskId(null)
        setOpenModuleId(null)
        setEvidenceLegendOpen(false)
        setMobileNavOpen(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [openWeeklyTaskId, openModuleId, evidenceLegendOpen, mobileNavOpen])

  useEffect(() => {
    if (!openWeeklyTaskId) return undefined

    const previousOverflow = document.body.style.overflow
    const drawer = weeklyDrawerRef.current
    const backgroundNodes = Array.from(
      document.querySelectorAll<HTMLElement>('.sidebar, .app-main, .mobile-nav-backdrop')
    )
    const previousInert = backgroundNodes.map((node) => node.inert)
    document.body.style.overflow = 'hidden'
    backgroundNodes.forEach((node) => {
      node.inert = true
    })
    const focusTimer = window.setTimeout(() => weeklyDrawerCloseRef.current?.focus(), 0)

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !drawer) return
      const focusable = Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute('hidden'))
      if (!focusable.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    drawer?.addEventListener('keydown', trapFocus)

    return () => {
      window.clearTimeout(focusTimer)
      drawer?.removeEventListener('keydown', trapFocus)
      document.body.style.overflow = previousOverflow
      backgroundNodes.forEach((node, index) => {
        node.inert = previousInert[index]
      })
      window.setTimeout(() => weeklyGuideReturnFocusRef.current?.focus(), 0)
    }
  }, [openWeeklyTaskId])

  useEffect(() => {
    if (!openModuleId && !evidenceLegendOpen) return undefined

    const dialog = modalRef.current
    const returnFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const previousOverflow = document.body.style.overflow
    const backgroundNodes = Array.from(
      document.querySelectorAll<HTMLElement>('.sidebar, .app-main, .mobile-nav-backdrop')
    )
    const previousInert = backgroundNodes.map((node) => node.inert)

    document.body.style.overflow = 'hidden'
    backgroundNodes.forEach((node) => {
      node.inert = true
    })

    const focusTimer = window.setTimeout(() => modalCloseRef.current?.focus(), 0)
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !dialog) return
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute('hidden'))
      if (!focusable.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    dialog?.addEventListener('keydown', trapFocus)

    return () => {
      window.clearTimeout(focusTimer)
      dialog?.removeEventListener('keydown', trapFocus)
      document.body.style.overflow = previousOverflow
      backgroundNodes.forEach((node, index) => {
        node.inert = previousInert[index]
      })
      window.setTimeout(() => returnFocus?.focus(), 0)
    }
  }, [openModuleId, evidenceLegendOpen])

  useEffect(() => {
    if (!mobileNavOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const returnFocus = mobileMenuButtonRef.current
    const main = document.querySelector<HTMLElement>('.app-main')
    const sidebar = sidebarRef.current
    const previousMainInert = main?.inert ?? false
    document.body.style.overflow = 'hidden'
    if (main) main.inert = true
    const focusTimer = window.setTimeout(() => mobileNavCloseRef.current?.focus(), 0)

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !sidebar) return
      const focusable = Array.from(
        sidebar.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute('hidden'))
      if (!focusable.length) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    sidebar?.addEventListener('keydown', trapFocus)

    return () => {
      window.clearTimeout(focusTimer)
      sidebar?.removeEventListener('keydown', trapFocus)
      document.body.style.overflow = previousOverflow
      if (main) main.inert = previousMainInert
      window.setTimeout(() => returnFocus?.focus(), 0)
    }
  }, [mobileNavOpen])

  useEffect(() => {
    const handleResponsiveNav = () => {
      const viewportWidth = window.innerWidth
      setSidebarCompactViewport(viewportWidth > 768 && viewportWidth <= SIDEBAR_COMPACT_VIEWPORT_MAX)
      if (viewportWidth > 768) {
        setMobileNavOpen(false)
        sidebarRef.current?.scrollTo({ top: 0 })
      }
    }

    handleResponsiveNav()
    window.addEventListener('resize', handleResponsiveNav)
    return () => window.removeEventListener('resize', handleResponsiveNav)
  }, [])

  // --- Handlers ---
  function navigate(view: AppWorkspaceView, path: PathId = selectedPath) {
    const updateRoute = () => {
      setSelectedPath(path)
      setActiveView(view)
      setMobileNavOpen(false)
      sidebarRef.current?.scrollTo({ top: 0 })
      window.location.hash = `/${view}`
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      })
    }
    const transitionDocument = document as Document & {
      startViewTransition?: (update: () => void) => void
    }
    if (
      transitionDocument.startViewTransition &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      transitionDocument.startViewTransition(updateRoute)
    } else {
      updateRoute()
    }
  }

  function toggleSidebar() {
    setSidebarCollapsed((collapsed) => !collapsed)
  }

  function setSidebarExpandedWidth(value: number, persist = false) {
    const nextWidth = clampSidebarWidth(value)
    sidebarWidthRef.current = nextWidth
    setSidebarWidth(nextWidth)
    if (persist) localStorage.setItem(storage.sidebarWidth, String(nextWidth))
  }

  function resizeSidebar(clientX: number) {
    if (clientX <= SIDEBAR_COLLAPSE_THRESHOLD) {
      setSidebarCollapsed(true)
      return
    }

    setSidebarCollapsed(false)
    setSidebarExpandedWidth(clientX)
  }

  function startSidebarResize(event: ReactPointerEvent<HTMLDivElement>) {
    if (window.innerWidth <= SIDEBAR_COMPACT_VIEWPORT_MAX) return
    event.preventDefault()
    sidebarDragCleanupRef.current?.()

    const pointerId = event.pointerId
    const handle = event.currentTarget
    sidebarResizePointerRef.current = pointerId
    handle.setPointerCapture(pointerId)
    setSidebarResizing(true)
    resizeSidebar(event.clientX)

    let sawPointerMove = false
    let cleanedUp = false
    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== pointerId) return
      sawPointerMove = true
      resizeSidebar(moveEvent.clientX)
    }
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!sawPointerMove) resizeSidebar(moveEvent.clientX)
    }
    const cleanup = () => {
      if (cleanedUp) return
      cleanedUp = true
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', finishPointer)
      window.removeEventListener('pointercancel', finishPointer)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', finishMouse)
      window.removeEventListener('blur', cleanup)
      handle.removeEventListener('lostpointercapture', cleanup)
      if (handle.hasPointerCapture(pointerId)) handle.releasePointerCapture(pointerId)
      localStorage.setItem(storage.sidebarWidth, String(sidebarWidthRef.current))
      sidebarResizePointerRef.current = null
      sidebarDragCleanupRef.current = null
      setSidebarResizing(false)
    }
    const finishPointer = (finishEvent: PointerEvent) => {
      if (finishEvent.pointerId === pointerId) cleanup()
    }
    const finishMouse = () => cleanup()

    sidebarDragCleanupRef.current = cleanup
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', finishPointer)
    window.addEventListener('pointercancel', finishPointer)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', finishMouse)
    window.addEventListener('blur', cleanup)
    handle.addEventListener('lostpointercapture', cleanup)
  }

  function startSidebarMouseResize(event: ReactMouseEvent<HTMLDivElement>) {
    if (window.innerWidth <= SIDEBAR_COMPACT_VIEWPORT_MAX || sidebarDragCleanupRef.current !== null) return
    event.preventDefault()
    setSidebarResizing(true)
    resizeSidebar(event.clientX)

    const handleMove = (moveEvent: MouseEvent) => resizeSidebar(moveEvent.clientX)
    const finish = () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', finish)
      window.removeEventListener('blur', finish)
      localStorage.setItem(storage.sidebarWidth, String(sidebarWidthRef.current))
      sidebarDragCleanupRef.current = null
      setSidebarResizing(false)
    }

    sidebarDragCleanupRef.current = finish
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', finish)
    window.addEventListener('blur', finish)
  }

  function resizeSidebarWithKeyboard(event: ReactKeyboardEvent<HTMLDivElement>) {
    const step = event.shiftKey ? 24 : 8

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      if (sidebarCollapsed || sidebarWidth <= SIDEBAR_MIN_WIDTH + step) {
        setSidebarCollapsed(true)
      } else {
        setSidebarExpandedWidth(sidebarWidth - step, true)
      }
      return
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      if (sidebarCollapsed) {
        setSidebarCollapsed(false)
      } else {
        setSidebarExpandedWidth(sidebarWidth + step, true)
      }
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      setSidebarCollapsed(true)
      return
    }

    if (event.key === 'End') {
      event.preventDefault()
      setSidebarCollapsed(false)
      setSidebarExpandedWidth(SIDEBAR_MAX_WIDTH, true)
    }
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
      setToast("Weekly step finished. Keep what you made—you may reuse it in class.")
    } else {
      setToast("Weekly step moved back to still learning.")
    }
  }

  function openWeeklyGuide(id: string, trigger: HTMLButtonElement) {
    weeklyGuideReturnFocusRef.current = trigger
    setOpenWeeklyTaskId(id)
  }

  function closeWeeklyGuide() {
    setOpenWeeklyTaskId(null)
  }

  async function copyWeeklyPrompt(prompt: string, successMessage = "ChatGPT prompt copied.") {
    try {
      if (!navigator.clipboard) throw new Error("Clipboard API unavailable")
      await navigator.clipboard.writeText(prompt)
      setToast(successMessage)
    } catch {
      setToast("Could not copy automatically. Select the prompt text and copy it.")
    }
  }

  function openChatGpt(prompt: string) {
    window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer")
    void copyWeeklyPrompt(prompt, "Prompt copied—paste it into ChatGPT.")
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
  const activeWeeklyTask = WEEKLY_TASKS.find((task) => task.id === openWeeklyTaskId)
  const activeModule = allSjsuModules.find((m) => m.id === openModuleId)
  const activeModuleCourse = openModuleId
    ? Object.entries(COURSES).find(([_, c]) => c.modules.some((m) => m.id === openModuleId))?.[1]
    : null

  const themeStyle = {
    '--path-accent': profile.accent,
    '--path-soft': profile.soft,
    '--path-deep': profile.deep,
    '--sidebar-width': `${sidebarIsCollapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebarWidth}px`,
  } as CSSProperties

  // Helper for evidence labels
  function renderEvidenceLabel(type: 'official' | 'syllabus' | 'student' | 'resource') {
    const labels = {
      official: "Official",
      syllabus: "Class syllabus",
      student: "Student opinion",
      resource: "Learning resource",
    }
    const className = type === 'resource' ? 'evidence-inferred' : `evidence-${type}`
    return <span className={`evidence-pill ${className}`}>{labels[type]}</span>
  }

  return (
    <div
      className={`app-shell ${timerRunning ? 'is-focusing' : ''} ${sidebarIsCollapsed ? 'is-sidebar-collapsed' : ''} ${sidebarResizing ? 'is-sidebar-resizing' : ''}`}
      style={themeStyle}
      data-view={activeView}
    >
      {/* Route rail */}
      <aside
        ref={sidebarRef}
        className={`sidebar ${mobileNavOpen ? 'is-mobile-open' : ''}`}
        id="primary-sidebar"
        aria-label="Primary navigation"
      >
        <div className="brand-lockup">
          <div className="brand-signal" aria-hidden="true">
            <svg viewBox="0 0 48 48" role="img">
              <path className="brand-signal-track" d="M6 24h11c5 0 5-12 10-12h15" />
              <path className="brand-signal-track" d="M17 24c5 0 5 12 10 12h15" />
              <circle cx="6" cy="24" r="3" />
              <circle cx="42" cy="12" r="3" />
              <circle cx="42" cy="36" r="3" />
            </svg>
          </div>
          <div className="brand-copy">
            <strong>Signal Path</strong>
            <span>Study &amp; career planner</span>
          </div>
          <button
            className="sidebar-collapse-button"
            type="button"
            aria-label={sidebarIsCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            aria-controls="primary-sidebar"
            aria-expanded={!sidebarIsCollapsed}
            title={sidebarIsCollapsed ? 'Expand navigation' : 'Collapse navigation'}
            onClick={toggleSidebar}
          >
            <ChevronRight size={17} aria-hidden="true" />
          </button>
          <button
            ref={mobileNavCloseRef}
            className="sidebar-mobile-close"
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileNavOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <nav className="sidebar-nav route-rail" aria-label="Signal Path workspaces">
          <div className="route-rail-line" aria-hidden="true">
            <span
              style={{
                height: `${(Math.max(0, activeRouteIndex) / (workspaceRoutes.length - 1)) * 100}%`,
              }}
            />
          </div>
          {workspaceRoutes.map((route, index) => {
            const isActive = route.id === activeView
            const isPassed = index < activeRouteIndex
            const showGroup = index === 0 || workspaceRoutes[index - 1].group !== route.group
            return (
              <div className="route-station-wrap" key={route.id}>
                {showGroup && <p className="nav-group-label">{route.group}</p>}
                <button
                  className={`nav-item route-station ${isActive ? 'is-active' : ''} ${isPassed ? 'is-passed' : ''}`}
                  type="button"
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`Step ${index + 1} of ${workspaceRoutes.length}: ${route.label}${isActive ? ', current step' : ''}`}
                  title={sidebarIsCollapsed ? `${route.code} · ${route.label}` : undefined}
                  onClick={() => navigate(route.id)}
                >
                  <span className="route-station-node" aria-hidden="true">
                    <i />
                  </span>
                  <span className="route-station-code">{route.code}</span>
                  <span className="route-station-copy">
                    <strong>{route.label}</strong>
                    <small>{route.shortLabel}</small>
                  </span>
                </button>
              </div>
            )
          })}
        </nav>

        <div className="sidebar-meters rail-readout" aria-label="Saved preparation summary">
          <span className="rail-readout-label">SAVED / LOCAL</span>
          <div className="rail-readout-grid">
            <div className="sidebar-meter">
              <span>Banked</span>
              <strong>{(studyMinutes / 60).toFixed(1)}<em>h</em></strong>
            </div>
            <div className="sidebar-meter">
              <span>Classes</span>
              <strong>{countdownReached(FALL_2026_FIRST_DAY) ? 'NOW' : `${daysUntil(FALL_2026_FIRST_DAY)}D`}</strong>
            </div>
            <div className="sidebar-meter">
              <span>Apps</span>
              <strong>{countdownReached(INTERNSHIP_APPS_OPEN) ? 'NOW' : `${daysUntil(INTERNSHIP_APPS_OPEN)}D`}</strong>
            </div>
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
              : "Start with one small lab or career task. Small steps add up."}
          </p>
        </section>

        <div className="sidebar-footer">
            <span className="sidebar-footer-label">YOUR DATA</span>
          <span className="save-indicator">
            <i aria-hidden="true"></i> Saved on this device
          </span>
          <button type="button" className="text-button sidebar-data-action" onClick={exportProgress}>
            <Download size={13} /> Export Backup
          </button>
          <button type="button" className="text-button sidebar-data-action" onClick={() => importInputRef.current?.click()}>
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
          >
            {resetArmed ? 'Confirm Reset' : 'Reset progress'}
          </button>
        </div>
      </aside>

      <div
        className="sidebar-resize-handle"
        role="separator"
        aria-label="Resize navigation"
        aria-controls="primary-sidebar"
        aria-orientation="vertical"
        aria-valuemin={sidebarIsCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_MIN_WIDTH}
        aria-valuemax={SIDEBAR_MAX_WIDTH}
        aria-valuenow={sidebarIsCollapsed ? SIDEBAR_COLLAPSED_WIDTH : sidebarWidth}
        aria-valuetext={sidebarIsCollapsed ? 'Navigation collapsed' : `Navigation width ${sidebarWidth} pixels`}
        tabIndex={0}
        title="Drag to resize navigation"
        onPointerDown={startSidebarResize}
        onMouseDown={startSidebarMouseResize}
        onKeyDown={resizeSidebarWithKeyboard}
      />

      <button
        className={`mobile-nav-backdrop ${mobileNavOpen ? 'is-visible' : ''}`}
        type="button"
        aria-label="Close navigation"
        tabIndex={mobileNavOpen ? 0 : -1}
        onClick={() => setMobileNavOpen(false)}
      />

      {/* Main Panel */}
      <main className="app-main" id="main-content">
        <header className="topbar">
          <div className="topbar-heading">
            <button
              ref={mobileMenuButtonRef}
              className="mobile-menu-button"
              type="button"
              aria-label="Open navigation"
              aria-controls="primary-sidebar"
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="topbar-route">
              <span className="topbar-route-code">{activeRoute.code} / 08</span>
              <div>
                <span className="topbar-context">{activeRoute.context}</span>
                <h1 id="viewTitle">
                  {activeView === 'career-paths' ? `${profile.shortName} path` : activeRoute.title}
                </h1>
              </div>
            </div>
          </div>

          <div className="topbar-actions">
            <span className="topbar-save-state">
              <i aria-hidden="true"></i>
              Saved on this device
            </span>
            {activeView !== 'evidence-shelf' && (
              <button className="certainty-button" type="button" onClick={() => navigate('evidence-shelf')}>
                <FileText size={16} />
                View sources
              </button>
            )}
            <div className="profile-chip" aria-label="Personal workspace for Bryan">
              <span>BC</span>
              <small>SJSU / CS</small>
            </div>
          </div>
        </header>

        <div className="view-stage" key={activeView}>
        {/* --- VIEW: Dashboard --- */}
        {activeView === 'dashboard' && (
          <section className="view is-active" id="view-dashboard">
            <header className="dashboard-intro routing-hero">
              <div className="routing-hero-copy">
                <p className="route-kicker" id="todayLabel">
                  01 / THIS WEEK · {new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase()}
                </p>
                <h2>
                  Get ready
                  <span>before the semester starts.</span>
                </h2>
                <p>
                  Use the waitlist period to practice processes, networks, and the skills you will need for Summer 2027 internships.
                </p>
                <div className="dashboard-actions">
                  <button className="button button-primary button-large" type="button" onClick={() => navigate('courses')}>
                    Open course prep <ChevronRight size={16} />
                  </button>
                  <button className="button button-secondary" type="button" onClick={() => navigate('academic-plan')}>
                    View academic plan
                  </button>
                </div>
              </div>

              <div className="routing-plot" aria-label={`Readiness ${readinessScore} out of 100`}>
                <div className="routing-plot-score">
                  <span>READINESS</span>
                  <strong id="readinessScore">{String(readinessScore).padStart(2, '0')}</strong>
                  <small>/100</small>
                </div>
                <svg viewBox="0 0 520 190" role="img" aria-label="Route from course preparation to recruiting">
                  <defs>
                    <linearGradient id="signal-route-gradient" x1="0" x2="1">
                      <stop offset="0" stopColor="var(--signal)" />
                      <stop offset={`${readinessScore}%`} stopColor="var(--signal)" />
                      <stop offset={`${readinessScore}%`} stopColor="var(--rail-muted)" />
                      <stop offset="1" stopColor="var(--rail-muted)" />
                    </linearGradient>
                  </defs>
                  <path className="routing-plot-grid" d="M16 48H504M16 104H504M16 160H504" />
                  <path className="routing-plot-path" d="M24 150C92 150 94 62 174 62H284C354 62 354 126 424 126H496" />
                  <g className="routing-plot-node is-current">
                    <circle cx="24" cy="150" r="7" />
                    <text x="24" y="178">NOW</text>
                  </g>
                  <g className="routing-plot-node">
                    <circle cx="174" cy="62" r="7" />
                    <text x="174" y="42">COURSES</text>
                  </g>
                  <g className="routing-plot-node">
                    <circle cx="424" cy="126" r="7" />
                    <text x="424" y="154">EVIDENCE</text>
                  </g>
                  <g className="routing-plot-node">
                    <circle cx="496" cy="126" r="7" />
                    <text x="496" y="106">APPLY</text>
                  </g>
                </svg>
                <p>
                  {weeklyCompleteCount + modulesCompleteCount === 0
                    ? 'Next step: finish one guided lab.'
                    : `${weeklyCompleteCount + modulesCompleteCount} study step${weeklyCompleteCount + modulesCompleteCount === 1 ? '' : 's'} finished.`}
                </p>
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
                <span className="signal-meter-action">Start a focus block <ChevronRight size={14} /></span>
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
                <span className="signal-meter-action">View plan <ChevronRight size={14} /></span>
              </button>
              <button type="button" className="signal-meter" onClick={() => navigate('outreach-applications')}>
                <span className="mono-label">SUMMER 2027 APPS</span>
                {countdownReached(INTERNSHIP_APPS_OPEN)
                  ? <strong>Now</strong>
                  : <strong>{daysUntil(INTERNSHIP_APPS_OPEN)}<small> days</small></strong>}
                <span className="signal-meter-note">
                  {countdownReached(INTERNSHIP_APPS_OPEN)
                    ? 'Applications open — go apply'
                    : 'Estimated early August — check each company for exact dates'}
                </span>
                <span className="signal-meter-action">Track applications <ChevronRight size={14} /></span>
              </button>
            </section>

            <div className="dashboard-grid">
              {/* Weekly Systems Sprint */}
              <section className="weekly-plan panel" aria-labelledby="weekly-plan-heading">
                <div className="section-heading-row weekly-heading-row">
                  <div>
                    <p className="mono-label">THIS WEEK · {weeklyPlannedLabel}</p>
                    <h3 id="weekly-plan-heading">Five small systems tasks</h3>
                  </div>
                  <div className="weekly-progress-summary">
                    <span className="plan-count" id="weeklyCount">
                      {weeklyCompleteCount} of {WEEKLY_TASKS.length} complete
                    </span>
                    <div className="weekly-progress-track" aria-hidden="true">
                      <span style={{ width: `${(weeklyCompleteCount / WEEKLY_TASKS.length) * 100}%` }}></span>
                    </div>
                  </div>
                </div>
                <div className="task-list" id="weeklyTasks">
                  {WEEKLY_TASKS.map((task) => {
                    const complete = Boolean(weeklyTasksCompleted[task.id])
                    const guideOpen = openWeeklyTaskId === task.id
                    return (
                      <div className={`weekly-task ${complete ? 'is-done' : ''} ${guideOpen ? 'is-open' : ''}`} key={task.id}>
                        <label className="weekly-task-check" htmlFor={`weekly-${task.id}`}>
                          <input
                            type="checkbox"
                            id={`weekly-${task.id}`}
                            checked={complete}
                            onChange={() => toggleWeeklyTask(task.id)}
                            aria-label={complete ? `Mark ${task.title} as still learning` : `Mark ${task.title} complete`}
                          />
                          <span aria-hidden="true"><Check size={14} /></span>
                        </label>
                        <button
                          className="weekly-task-guide"
                          type="button"
                          aria-haspopup="dialog"
                          aria-controls="weekly-guide-drawer"
                          aria-expanded={openWeeklyTaskId === task.id}
                          onClick={(event) => openWeeklyGuide(task.id, event.currentTarget)}
                        >
                          <span className="weekly-task-copy">
                            <strong>{task.title}</strong>
                            <span>{task.detail}</span>
                          </span>
                          <span className="weekly-task-meta">
                            <span className="weekly-task-open" aria-hidden="true">
                              {guideOpen ? 'Guide open' : complete ? 'Done · Guide' : 'Guide'} <ChevronRight size={14} />
                            </span>
                            <time>{task.duration}</time>
                          </span>
                        </button>
                      </div>
                    )
                  })}
                </div>
                <div className="plan-footer">
                  <p>
                    <strong>Goal:</strong> explain a process and a network packet in your own words.
                  </p>
                  <button className="button button-primary" type="button" onClick={() => setOpenModuleId('os-processes')}>
                    Open first lab
                  </button>
                </div>
              </section>

              {/* Focus Timer Bench */}
              <aside className="focus-bench panel" aria-labelledby="focus-heading">
                <div className="focus-topline">
                  <span className="mono-label">FOCUS TIMER</span>
                  <span className={`timer-status ${timerRunning ? 'is-running' : ''}`} id="timerStatus">
                    {timerRunning ? 'In focus' : timerRemaining < 25 * 60 ? 'Paused' : 'Ready'}
                  </span>
                </div>
                <h3 id="focus-heading">Focus for 25 minutes.</h3>
                <div className="timer" id="timerDisplay">
                  {formatTimer(timerRemaining)}
                </div>
                <p id="timerPrompt" className="timer-prompt">
                  Close extra tabs, finish one small task, and write down what you learned.
                </p>
                <div className="timer-controls">
                  <button className="button button-primary" id="timerToggle" type="button" onClick={toggleTimer}>
                    {timerRunning ? 'Pause focus' : timerRemaining < 25 * 60 ? 'Resume focus' : 'Start focus'}
                  </button>
                  <button className="icon-button timer-reset" id="timerReset" type="button" aria-label="Reset focus timer" onClick={resetTimer}>
                    <X size={16} />
                  </button>
                </div>
                <div className="focus-session-summary">
                  <span>{focusLog.sessions}</span>
                  focus block{focusLog.sessions === 1 ? '' : 's'} banked
                </div>
                <blockquote>“Mastery is being able to predict what happens next.”</blockquote>
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
                  <p className="mono-label">SELECTED CAREER PATH</p>
                  <h3 style={{ fontSize: '1.6rem', margin: '0' }}>{profile.name}</h3>
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
                  <span className="evidence-pill" style={{ marginBottom: '8px' }}>QUICK TAKE</span>
                  <p style={{ fontWeight: '600', fontSize: '1.05rem', color: 'var(--ink)' }}>{profile.verdict}</p>
                  <p style={{ color: 'var(--ink-soft)', fontSize: '0.94rem', margin: '8px 0 0' }}>{profile.summary}</p>
                </div>
                <div>
                  <span className="evidence-pill" style={{ marginBottom: '8px' }}>WHY IT MAY FIT</span>
                  <p style={{ fontSize: '0.92rem', color: 'var(--ink-soft)', lineHeight: '1.5' }}>{profile.fit}</p>
                  <div style={{ marginTop: '16px' }}>
                    <span className="mono-label">WEEKLY TARGET</span>
                    <strong style={{ display: 'block', fontSize: '0.94rem' }}>{profile.duration} · {profile.weeklyHours}</strong>
                  </div>
                </div>
                <div>
                  <span className="evidence-pill" style={{ marginBottom: '8px' }}>WHAT TO BUILD</span>
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
                <h3 id="lab-note-heading">Data science also needs systems skills.</h3>
                <p>
                  Operating systems explain why parallel jobs slow down, memory use grows, and files become bottlenecks. Networks explain how data reaches an API, a cluster, or cloud storage. These courses support real data work.
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
            <ViewIntro
              eyebrow="02 / COURSE PREP"
              title="Practice the basics before the semester."
              description="Each module gives you something to run, inspect, or explain. Assignments may change by instructor, but the core ideas stay useful."
              action={
                <div className="course-selector" role="group" aria-label="Choose a course">
                  <button
                    className={`course-selector-button ${activeCourse === 'cs149' ? 'is-active' : ''}`}
                    type="button"
                    onClick={() => setActiveCourse('cs149')}
                  >
                    <span>TRACK A</span>
                    CS 149
                  </button>
                  <button
                    className={`course-selector-button ${activeCourse === 'cs158' ? 'is-active' : ''}`}
                    type="button"
                    onClick={() => setActiveCourse('cs158')}
                  >
                    <span>TRACK B</span>
                    CS 158A
                  </button>
                </div>
              }
            />

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
                    <span>LIKELY TOOLS</span>
                      <strong>{course.likelyStack}</strong>
                    </div>
                    <div className="course-fact">
                      <span>HOW YOU MAY BE GRADED</span>
                      <strong>{course.assessment}</strong>
                      <p>{course.assessmentNote}</p>
                    </div>
                  </div>

                  <div className="course-story">
                    <div>
                      <p className="mono-label">WHAT TO EXPECT</p>
                      <h3>{course.tone === 'network' ? "Follow a packet through the network." : "See what the operating system is doing."}</h3>
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
                      <p className="mono-label">PREP MODULES</p>
                      <h3 style={{ fontSize: '1.4rem', margin: '0' }}>{completed} of {course.modules.length} modules finished</h3>
                    </div>
                    <p style={{ margin: '0', fontSize: '0.82rem', color: 'var(--muted)' }}>
                      Finished means you wrote a note, built a working example, and explained it.
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
                            <span>WHAT YOU WILL MAKE</span>{module.deliverable}
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
                              aria-label={`Mark ${module.title} ${isComplete ? 'not finished' : 'finished'}`}
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
            <ViewIntro
              eyebrow="03 / ACADEMIC PLAN"
              title="Finish required courses. Choose useful electives."
              description="This is a planning guide, not an official degree audit. Mark finished courses, then check MyProgress and talk with a CS advisor."
              action={
                <div className="adviser-note">
                  <span>IMPORTANT</span>
                  <strong>Your catalog year sets your requirements.</strong>
                  <p>Requirements can change based on when you started, transfer credits, and approved course replacements.</p>
                </div>
              }
            />

            {/* Checklist of what the planner knows */}
            <section className="known-courses" aria-labelledby="known-courses-heading" style={{ marginBottom: '36px' }}>
              <div>
                <p className="mono-label">YOUR STARTING POINT</p>
                <h3 id="known-courses-heading" style={{ fontSize: '1.25rem', marginTop: '0', marginBottom: '14px' }}>Courses you have finished</h3>
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
            <div className="roadmap-timeline" id="roadmapTimeline">
              {ROADMAP.map((term) => {
                const trackable = term.courses.filter((course) => course.id)
                const doneCount = trackable.filter((course) => knownCourses[course.id as string]).length
                const isTermComplete = trackable.length > 0 && doneCount === trackable.length
                return (
                  <article className={`term-row ${isTermComplete ? 'is-complete' : ''}`} key={term.term}>
                    <div className="term-label">
                      <span>{term.year}</span>
                      <strong>{term.term}</strong>
                      <span className={`term-progress ${isTermComplete ? 'is-complete' : ''}`}>
                        {isTermComplete
                          ? '✓ Term complete'
                          : `${doneCount} of ${trackable.length} done`}
                      </span>
                    </div>
                    <div className="term-courses">
                      {term.courses.map((course) => {
                        const isDone = Boolean(course.id && knownCourses[course.id])
                        return (
                          <article
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
                          </article>
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
                <strong>Waitlist tip:</strong> choose one backup that still counts toward your degree for every hard-to-get CS course.
              </p>
            </div>

            {/* Data Science Specialization Thread */}
            <section className="data-specialization" style={{ marginTop: '64px', borderTop: '1px solid var(--line)', paddingTop: '48px' }}>
              <header className="page-intro data-intro" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                  <p className="mono-label">DATA SCIENCE FOCUS</p>
                  <h2 style={{ fontSize: '2rem', margin: '0' }}>Build data science on strong systems skills.</h2>
                  <p style={{ color: 'var(--ink-soft)', marginTop: '8px' }}>
                    Go beyond training models: collect data reliably, store it carefully, work efficiently, and explain uncertainty.
                  </p>
                </div>
                <div className="north-star-mark" aria-hidden="true" style={{ width: '48px', height: '48px', color: 'var(--signal)' }}>
                  <svg viewBox="0 0 100 100" fill="currentColor">
                    <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="m50 8 8 34 34 8-34 8-8 34-8-34-34-8 34-8z" />
                  </svg>
                </div>
              </header>

              {/* Skill constellation */}
              <section className="skill-constellation" aria-label="Data science capability map">
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
                  <h3 id="portfolio-heading" style={{ fontSize: '1.5rem', marginTop: '0', marginBottom: '14px' }}>Build a campus data project.</h3>
                  <p style={{ color: 'var(--ink-soft)', lineHeight: '1.6', fontSize: '0.94rem' }}>
                    Start with a small program that collects public data. Add a database, analysis, reliability checks, and one machine-learning question over time. One growing project can connect the skills from each class.
                  </p>
                </div>
                <ol className="project-stages" id="projectStages">
                  {PROJECT_STAGES.map((stage) => (
                    <li className="project-stage" key={stage.title}>
                      <span className="project-stage-term">{stage.term}</span>
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
                  <p className="mono-label">ELECTIVE GUIDE</p>
                  <h3 id="elective-lens-heading" style={{ fontSize: '1.4rem', margin: '0' }}>Choose courses by the skills they teach.</h3>
                </div>
                <div className="elective-table-wrap" style={{ overflowX: 'auto', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', background: 'var(--surface)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-muted)', borderBottom: '1px solid var(--line)' }}>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Course</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Skill</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Why it helps with data science</th>
                        <th style={{ padding: '12px 16px', fontWeight: '600' }}>Priority</th>
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
            <ViewIntro
              eyebrow="04 / CAMPUS RESOURCES"
              title="Check official SJSU sources first."
              description="Find degree requirements, advising, department information, and career resources in one place."
            />

            <div className="campus-sjsu-view" style={{ display: 'grid', gap: '32px' }}>
                <section>
                  <p className="mono-label">DEGREE REQUIREMENTS</p>
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
                        A visual map of SJSU CS prerequisites, effective Fall 2022. Use it to plan the order of your remaining upper-division classes.
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
                <span className="mono-label">WHY IT MAY FIT YOU</span>
                <p style={{ fontSize: '0.94rem', color: 'var(--ink-soft)', lineHeight: '1.6', margin: '8px 0 0' }}>{profile.fit}</p>
              </div>
              <div className="panel" style={{ padding: '24px' }}>
                <span className="mono-label">WHAT TO BUILD</span>
                <p style={{ fontSize: '0.94rem', color: 'var(--ink-soft)', lineHeight: '1.6', margin: '8px 0 0' }}>{profile.primaryOutput}</p>
              </div>
              <div className="panel" style={{ padding: '24px' }}>
                <span className="mono-label">WHAT TO PRACTICE</span>
                <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '0.9rem', color: 'var(--ink-soft)', display: 'grid', gap: '6px' }}>
                  {profile.interviewFocus.map((focus) => <li key={focus}>{focus}</li>)}
                </ul>
              </div>
            </div>

            {/* Roadmap Tasks Checklist */}
            <section className="career-roadmap-milestones" style={{ marginBottom: '64px' }}>
              <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: '12px', marginBottom: '28px' }}>
                <span className="mono-label">CAREER PLAN</span>
                <h3 style={{ fontSize: '1.5rem', margin: '0' }}>Steps to take</h3>
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
                        <span style={{ fontWeight: '600', color: 'var(--muted)' }}>Finish with:</span>
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
                                aria-label={`${isComplete ? 'Mark incomplete' : 'Mark complete'}: ${task.title}`}
                                onClick={() => toggleTask(task.id)}
                              >
                                {isComplete && <Check size={14} />}
                              </button>
                              <div className="roadmap-task-copy" style={{ flex: '1' }}>
                                <div className="task-meta" style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>
                                  <span>{task.effort}</span>
                                  {task.optional && <span className="optional-tag" style={{ color: 'var(--path-accent)', fontWeight: '600' }}>Optional</span>}
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
                <h3 style={{ fontSize: '1.5rem', margin: '0' }}>Build projects you can explain</h3>
              </div>

              <div className="project-stack" style={{ display: 'grid', gap: '32px' }}>
                {projects.map((project, pIdx) => {
                  const done = project.milestones.filter((_, idx) =>
                    completedMilestones.includes(`${project.id}-m${idx}`)
                  ).length
                  const percent = Math.round((done / project.milestones.length) * 100)

                  return (
                    <article className={`project-card ${pIdx === 0 ? 'featured' : ''}`} key={project.id} style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', background: 'var(--surface)', padding: '28px' }}>
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
                          <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontWeight: '600' }}>WHAT THIS PROJECT SHOWS</span>
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
                          <h4 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '12px' }}>Done when</h4>
                          <ul style={{ listStyle: 'none', padding: '0', margin: '0', display: 'grid', gap: '8px', fontSize: '0.88rem' }}>
                            {project.acceptance.map((item) => (
                              <li key={item} style={{ display: 'flex', gap: '8px', alignItems: 'start', color: 'var(--ink-soft)' }}>
                                <CheckCircle2 size={14} style={{ color: 'var(--mint-deep)', marginTop: '3px', flexShrink: '0' }} />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '12px' }}>What to explain in interviews</h4>
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
              eyebrow={`${pathResources.length} learning resources`}
              title="Use a few good resources, not everything"
              description="Start with one main course or guide. Use practice resources to build skills, references when you get stuck, and alternatives only when the main resource does not work for you."
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
                <span style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>Resource type</span>
                <select value={resourceKind} onChange={(event) => setResourceKind(event.target.value)} style={{ padding: '8px', border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)' }}>
                  {kinds.map((k) => <option key={k} value={k}>{k === 'Primary spine' ? 'Start here' : k}</option>)}
                </select>
              </label>
            </section>

            <div className="resource-grid">
              {filteredResources.map((res) => {
                const status = resourceStates[res.id] ?? 'planned'
                return (
                  <article className={`resource-card ${res.kind.toLowerCase().replaceAll(' ', '-')}`} key={res.id} style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius-md)', padding: '24px', background: 'var(--surface)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '12px' }}>
                    <div className="resource-evidence" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="evidence-pill">{res.kind === 'Primary spine' ? 'Start here' : res.kind}</span>
                      <span className={`evidence-pill ${res.evidence === 'Official' ? 'evidence-official' : 'evidence-student'}`}>{res.evidence}</span>
                    </div>
                    <div className="resource-summary">
                      <span style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>{res.provider}</span>
                      <h2 style={{ fontSize: '1.25rem', margin: '4px 0 0', fontWeight: '600' }}>
                        <a href={res.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', color: 'var(--ink)' }}>
                          {res.title} <ArrowUpRight size={15} />
                        </a>
                      </h2>
                      <p style={{ margin: '8px 0 0', fontSize: '0.9rem', color: 'var(--ink-soft)', lineHeight: '1.55' }}>{res.why}</p>
                    </div>
                    <div className="resource-facts" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--muted)' }}>
                      <span style={{ background: 'var(--surface-muted)', padding: '4px 8px', borderRadius: '4px' }}>{res.format}</span>
                      <span style={{ background: 'var(--surface-muted)', padding: '4px 8px', borderRadius: '4px' }}>{res.duration}</span>
                      <span style={{ background: 'var(--surface-muted)', padding: '4px 8px', borderRadius: '4px' }}>{res.level}</span>
                      <span style={{ background: 'var(--surface-muted)', padding: '4px 8px', borderRadius: '4px' }}>{res.access}</span>
                    </div>
                    <div className="resource-action" style={{ background: 'var(--surface-quiet)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', display: 'flex', gap: '6px' }}>
                      <Target size={14} style={{ color: 'var(--path-accent)', flexShrink: '0', marginTop: '2px' }} />
                      <p style={{ margin: '0' }}><strong>Do this:</strong> {res.action}</p>
                    </div>
                    <div className="resource-progress" style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
          <section className="view is-active applications-route" id="view-applications">
            <ViewIntro
              eyebrow="07 / APPLICATIONS"
              title="Keep every application moving."
              description="Save Summer 2027 openings, choose the next step, and track each application from start to finish."
            />

            <section className="recruitment-calendar" aria-labelledby="recruitment-window-title">
              <div className="recruitment-calendar-copy">
                <span className="route-kicker">ESTIMATED APPLICATION DATES</span>
                <h3 id="recruitment-window-title">Summer 2027 applications are starting</h3>
                <p>Openings change every week. Save a role when you find it, then confirm the deadline on the company website.</p>
              </div>
              <div className="date-rail" aria-label="Recruitment timeline from July through November 2026">
                {['JUL', 'AUG', 'SEP', 'OCT', 'NOV'].map((month, index) => (
                  <div
                    className={`date-rail-stop ${index === 0 ? 'is-current' : ''} ${index === 1 ? 'is-gate' : ''}`}
                    key={month}
                  >
                    <span aria-hidden="true" />
                    <strong>{month}</strong>
                    {index === 0 && <small>NOW</small>}
                    {index === 1 && <small>MANY OPEN</small>}
                  </div>
                ))}
              </div>
            </section>

            {pathSignals.length > 0 && (
              <section className="posting-track" aria-labelledby="posting-track-title">
                <header className="track-section-heading">
                  <span className="track-section-index">A</span>
                  <div>
                    <p className="route-kicker">PLACES TO CHECK</p>
                    <h3 id="posting-track-title">Internship listings and company pages</h3>
                  </div>
                  <span>{pathSignals.length} verified lead{pathSignals.length === 1 ? '' : 's'}</span>
                </header>
                <div className="posting-track-line">
                  {pathSignals.map((signal, index) => (
                    <a href={signal.url} target="_blank" rel="noreferrer" className="posting-ticket" key={signal.id}>
                      <span className="posting-ticket-node" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                      <span className="posting-ticket-copy">
                        <small>{signal.tag}</small>
                        <strong>{signal.title}</strong>
                        <span>{signal.detail}</span>
                        <em>{signal.source}</em>
                      </span>
                      <ExternalLink size={15} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </section>
            )}

            <section className="application-capture" aria-labelledby="capture-application-title">
              <header className="track-section-heading">
                <span className="track-section-index">B</span>
                <div>
                  <p className="route-kicker">ADD AN APPLICATION</p>
                  <h3 id="capture-application-title">Save an opportunity</h3>
                </div>
                <span>Stored on this device</span>
              </header>
              <form id="application-form" className="dispatch-form" onSubmit={addApplication}>
                <label>
                  <span>Company *</span>
                  <input required value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company" />
                </label>
                <label>
                  <span>Role *</span>
                  <input required value={role} onChange={(event) => setRole(event.target.value)} placeholder={profile.roles[0]} />
                </label>
                <label className="dispatch-form-url">
                  <span>Posting</span>
                  <input type="url" value={jobUrl} onChange={(event) => setJobUrl(event.target.value)} placeholder="https://…" />
                </label>
                <label>
                  <span>Date</span>
                  <input type="date" value={applicationDate} onChange={(event) => setApplicationDate(event.target.value)} />
                </label>
                <label>
                  <span>Stage</span>
                  <select value={applicationStatus} onChange={(event) => setApplicationStatus(event.target.value as ApplicationStatus)}>
                    {statusOptions.map((status) => <option key={status}>{status}</option>)}
                  </select>
                </label>
                <label className="dispatch-form-next">
                  <span>Next step</span>
                  <input value={nextStep} onChange={(event) => setNextStep(event.target.value)} placeholder="Tailor resume, follow up, prepare SQL…" />
                </label>
                <button className="dispatch-submit" type="submit">
                  <Plus size={16} />
                  Save application
                </button>
              </form>
            </section>

            <section className="recruitment-pipeline" aria-labelledby="recruitment-pipeline-title">
              <header className="track-section-heading">
                <span className="track-section-index">C</span>
                <div>
                  <p className="route-kicker">APPLICATIONS / {profile.shortName.toUpperCase()}</p>
                  <h3 id="recruitment-pipeline-title">Application progress</h3>
                </div>
                <span>{pathApplications.length} opportunity{pathApplications.length === 1 ? '' : 'ies'}</span>
              </header>
              <div className="pipeline-tracks">
                {statusOptions.map((status, statusIndex) => {
                  const stageApplications = pathApplications.filter((application) => application.status === status)
                  return (
                    <section className={`pipeline-stage stage-${status.toLowerCase()}`} key={status}>
                      <header>
                        <span>{String(statusIndex + 1).padStart(2, '0')}</span>
                        <strong>{status}</strong>
                        <em>{stageApplications.length}</em>
                      </header>
                      <div className="pipeline-stage-rail" aria-hidden="true"><i /></div>
                      <div className="pipeline-stage-tickets">
                        {stageApplications.map((app) => (
                          <article className="application-ticket" key={app.id}>
                            <div className="application-ticket-id">
                              <span>{app.company.slice(0, 2).toUpperCase()}</span>
                              <time>{app.date}</time>
                            </div>
                            <h4>{app.role}</h4>
                            <p>{app.nextStep || 'Choose the next action.'}</p>
                            <div className="application-ticket-actions">
                              <select
                                aria-label={`Status for ${app.company}`}
                                value={app.status}
                                onChange={(event) => updateApplication(app.id, event.target.value as ApplicationStatus)}
                              >
                                {statusOptions.map((option) => <option key={option}>{option}</option>)}
                              </select>
                              {app.url && (
                                <a href={app.url} target="_blank" rel="noreferrer" aria-label={`Open ${app.company} posting`}>
                                  <ExternalLink size={15} />
                                </a>
                              )}
                              <button
                                type="button"
                                aria-label={`Delete ${app.company} application`}
                                onClick={() => setApplications((current) => current.filter((item) => item.id !== app.id))}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </article>
                        ))}
                        {!stageApplications.length && (
                          <span className="pipeline-empty">No applications here</span>
                        )}
                      </div>
                    </section>
                  )
                })}
              </div>
            </section>

            <div className="application-operations">
              <section className="role-destinations" aria-labelledby="role-destinations-title">
                <p className="route-kicker">JOB TITLES</p>
                <h3 id="role-destinations-title">Search these titles</h3>
                <ol>
                  {profile.roles.map((roleName, index) => (
                    <li key={roleName}>
                      <span>{String(index + 1).padStart(2, '0')}</span>
                      <strong>{roleName}</strong>
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </li>
                  ))}
                </ol>
              </section>

              <section className="cadence-loop" aria-labelledby="cadence-loop-title">
                <p className="route-kicker">WEEKLY ROUTINE</p>
                <h3 id="cadence-loop-title">Keep making progress</h3>
                <ol>
                  {sharedApplicationActions.map((action, index) => (
                    <li key={action.id}>
                      <span className="cadence-node">{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <strong>{action.title}</strong>
                        <p>{action.detail}</p>
                        <small>{action.cadence}</small>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              {selectedPath === 'data-science' && (
                <section className="calibration-note" aria-labelledby="calibration-note-title">
                  <p className="route-kicker">ASKING FOR HELP</p>
                  <h3 id="calibration-note-title">Ask for feedback before a referral.</h3>
                  <p>Share the exact role and ask if your experience fits before asking for a referral.</p>
                  <blockquote>{referralDraft}</blockquote>
                  <button className="button button-secondary" type="button" onClick={copyReferral}>
                    <Copy size={14} /> Copy conversation draft
                  </button>
                </section>
              )}
            </div>
          </section>
        )}

        {/* --- VIEW: Evidence Shelf (Sources) --- */}
        {activeView === 'evidence-shelf' && (
          <section className="view is-active" id="view-sources">
            <ViewIntro
              eyebrow="08 / SOURCES"
              title="Know where the information comes from."
              description="Course details and student benefits can change. Each item shows its source, so you can separate official information, class syllabi, student opinions, and study suggestions."
              action={
                <div className="source-updated">
                  <span>LAST CHECKED</span>
                  <strong>29 JUL 2026</strong>
                  <button className="text-button" id="openEvidenceLegend" type="button" onClick={() => setEvidenceLegendOpen(true)}>
                    What do these labels mean?
                  </button>
                </div>
              }
            />

            <section className="student-pack-panel" aria-labelledby="student-pack-title">
              <header className="student-pack-header">
                <div className="student-pack-copy">
                  <span className="student-pack-status">
                    <CheckCircle2 size={15} aria-hidden="true" />
                    Accepted
                  </span>
                  <p className="mono-label">YOUR GITHUB EDUCATION BENEFITS</p>
                  <h3 id="student-pack-title">Use your GitHub Student Developer Pack</h3>
                  <p>
                    Your student account is approved. Open the full pack to see every current offer,
                    then activate the tools that help with your classes, portfolio, and job search.
                  </p>
                </div>
                <div className="student-pack-actions">
                  <a
                    className="button button-primary"
                    href={GITHUB_STUDENT_PACK.packUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Code2 size={16} aria-hidden="true" />
                    View every pack offer
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                  <a
                    className="button student-pack-benefits-button"
                    href={GITHUB_STUDENT_PACK.benefitsUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Manage my benefits
                    <ExternalLink size={14} aria-hidden="true" />
                  </a>
                  <span>Checked {GITHUB_STUDENT_PACK.checked}</span>
                </div>
              </header>

              <ul className="student-pack-resources" aria-label="GitHub Student Developer Pack resources">
                {GITHUB_STUDENT_PACK.resources.map((resource) => (
                  <li key={resource.title}>
                    <a href={resource.url} target="_blank" rel="noreferrer">
                      <span>
                        <strong>{resource.title}</strong>
                        <small>{resource.detail}</small>
                      </span>
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>

              <p className="student-pack-note">
                Partner offers and redemption rules can change. The full GitHub pack page is the
                current source for every available benefit.
              </p>
            </section>

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

              <div className="source-filters" role="group" aria-label="Filter by source type" style={{ display: 'flex', gap: '6px' }}>
                {(['all', 'official', 'syllabus', 'student', 'resource'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    className={`source-filter ${sourceFilter === filter ? 'is-active' : ''}`}
                    onClick={() => setSourceFilter(filter)}
                  >
                    {{
                      all: 'All',
                      official: 'Official',
                      syllabus: 'Syllabi',
                      student: 'Students',
                      resource: 'Resources',
                    }[filter]}
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
                  <a className="source-link" href={source.url} target="_blank" rel="noreferrer" aria-label={`Open ${source.title}`}>
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
        </div>
      </main>

      {/* --- WEEKLY LEARNING GUIDE DRAWER --- */}
      {activeWeeklyTask && (
        <div
          className="weekly-guide-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeWeeklyGuide()
          }}
        >
          <aside
            ref={weeklyDrawerRef}
            className="weekly-guide-drawer"
            id="weekly-guide-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="weekly-guide-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="weekly-guide-header">
              <div>
                <p className="mono-label">WEEKLY TASK · STEP-BY-STEP GUIDE</p>
                <h2 id="weekly-guide-title">{activeWeeklyTask.title}</h2>
                <div className="weekly-guide-meta">
                  <span className="weekly-guide-duration">
                    <Clock3 size={15} aria-hidden="true" />
                    {durationToMinutes(activeWeeklyTask.duration)} minutes
                  </span>
                  <span className={`weekly-guide-status ${weeklyTasksCompleted[activeWeeklyTask.id] ? 'is-complete' : ''}`}>
                    {weeklyTasksCompleted[activeWeeklyTask.id] ? 'Complete' : 'Not started'}
                  </span>
                </div>
              </div>
              <button
                ref={weeklyDrawerCloseRef}
                className="weekly-guide-close"
                type="button"
                aria-label="Close weekly guide"
                onClick={closeWeeklyGuide}
              >
                <X size={20} />
              </button>
            </header>

            <div className="weekly-guide-body">
              <p className="sr-only" aria-live="polite">
                {weeklyTasksCompleted[activeWeeklyTask.id]
                  ? `${activeWeeklyTask.title} is marked complete.`
                  : `${activeWeeklyTask.title} is still in progress.`}
              </p>
              <section className="weekly-guide-section">
                <h3>Why this matters</h3>
                <p className="weekly-guide-why">{activeWeeklyTask.why}</p>
                <div className="weekly-guide-proof">
                  <span className="mono-label">WHAT YOU WILL MAKE</span>
                  <strong>{activeWeeklyTask.deliverable}</strong>
                </div>
              </section>

              <section className="weekly-guide-section">
                <h3>Run the lab</h3>
                <ol className="weekly-guide-steps">
                  {activeWeeklyTask.steps.map((step, index) => (
                    <li key={step.title}>
                      <span className="weekly-guide-step-number" aria-hidden="true">
                        {index + 1}
                      </span>
                      <div>
                        <strong>{step.title}</strong>
                        <p>{step.detail}</p>
                        {step.code && (
                          <pre>
                            <code>{step.code}</code>
                          </pre>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="weekly-guide-section">
                <h3>Study resources</h3>
                <div className="weekly-guide-resources">
                  {activeWeeklyTask.resources.map((resource) => (
                    <a
                      className={`weekly-guide-resource is-${resource.kind}`}
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      key={resource.url}
                    >
                      <span className="weekly-guide-resource-icon" aria-hidden="true">
                        {resource.kind === 'read'
                          ? <BookOpenCheck size={20} />
                          : <CirclePlay size={20} />}
                      </span>
                      <span>
                        <strong>{resource.label}</strong>
                        <small>{resource.meta}</small>
                      </span>
                      <ExternalLink size={16} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </section>

              <section className="weekly-guide-chat">
                <div className="weekly-guide-chat-heading">
                  <BrainCircuit size={22} aria-hidden="true" />
                  <h3>Ask ChatGPT</h3>
                </div>
                <p>{activeWeeklyTask.chatGptPrompt}</p>
                <div className="weekly-guide-chat-actions">
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => void copyWeeklyPrompt(activeWeeklyTask.chatGptPrompt)}
                  >
                    <Copy size={15} /> Copy prompt
                  </button>
                  <button
                    className="button weekly-guide-chat-open"
                    type="button"
                    onClick={() => openChatGpt(activeWeeklyTask.chatGptPrompt)}
                  >
                    Open ChatGPT <ExternalLink size={15} />
                  </button>
                </div>
              </section>
            </div>

            <footer className="weekly-guide-footer">
              <button className="button button-secondary" type="button" onClick={closeWeeklyGuide}>
                {weeklyTasksCompleted[activeWeeklyTask.id] ? "Close guide" : "Still learning"}
              </button>
              <button
                className="button button-primary"
                type="button"
                aria-pressed={Boolean(weeklyTasksCompleted[activeWeeklyTask.id])}
                onClick={() => toggleWeeklyTask(activeWeeklyTask.id)}
              >
                {weeklyTasksCompleted[activeWeeklyTask.id]
                  ? <X size={16} />
                  : <Check size={16} />}
                {weeklyTasksCompleted[activeWeeklyTask.id]
                  ? "Mark as still learning"
                  : "Mark complete"}
              </button>
            </footer>
          </aside>
        </div>
      )}

      {/* --- DIALOG MODALS --- */}
      {/* 1. Module Dialog Details */}
      {activeModule && activeModuleCourse && (
        <div className="dialog-overlay" style={{ position: 'fixed', inset: '0', zIndex: 100, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', padding: '20px' }} onClick={() => setOpenModuleId(null)}>
          <div ref={modalRef} className="dialog-shell" role="dialog" aria-modal="true" aria-labelledby="module-dialog-title" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '28px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
            <header className="dialog-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px', borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
              <div>
                <span className="mono-label" style={{ color: 'var(--path-accent)' }}>{activeModuleCourse.code} · {activeModuleCourse.title}</span>
                <h2 id="module-dialog-title" style={{ fontSize: '1.4rem', margin: '4px 0 0', fontWeight: '600' }}>{activeModule.title}</h2>
              </div>
              <button ref={modalCloseRef} className="icon-button" type="button" aria-label="Close module" onClick={() => setOpenModuleId(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={20} />
              </button>
            </header>
            <div className="dialog-body">
              <p className="dialog-intro" style={{ fontSize: '1.02rem', lineHeight: '1.6', color: 'var(--ink)' }}>{activeModule.why}</p>
              
              <section className="dialog-section" style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '600', marginBottom: '8px' }}>What you will make</h3>
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
                  {modulesCompleted[activeModule.id] ? "Mark as not finished" : "Mark as finished"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Evidence Legend Dialog */}
      {evidenceLegendOpen && (
        <div className="dialog-overlay" style={{ position: 'fixed', inset: '0', zIndex: 100, background: 'rgba(0,0,0,0.4)', display: 'grid', placeItems: 'center', padding: '20px' }} onClick={() => setEvidenceLegendOpen(false)}>
          <div ref={modalRef} className="dialog-shell dialog-shell-narrow" role="dialog" aria-modal="true" aria-labelledby="legend-dialog-title" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={(e) => e.stopPropagation()}>
            <header className="dialog-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px', borderBottom: '1px solid var(--line)', paddingBottom: '16px' }}>
              <div>
                <span className="mono-label">ABOUT THESE SOURCES</span>
                <h2 id="legend-dialog-title" style={{ fontSize: '1.3rem', margin: '4px 0 0', fontWeight: '600' }}>What each label means</h2>
              </div>
              <button ref={modalCloseRef} className="icon-button" type="button" aria-label="Close evidence guide" onClick={() => setEvidenceLegendOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                <X size={20} />
              </button>
            </header>
            <div className="evidence-guide" style={{ display: 'grid', gap: '16px' }}>
              <article style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <span className="evidence-pill evidence-official">Official</span>
                <p style={{ margin: '0', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                  Information from SJSU departments or the catalog. Use this first for course names, requirements, and schedules.
                </p>
              </article>
              <article style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <span className="evidence-pill evidence-syllabus">Class syllabus</span>
                <p style={{ margin: '0', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                  A syllabus from a real class and semester. It shows how that instructor taught the course, but your class may be different.
                </p>
              </article>
              <article style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <span className="evidence-pill evidence-student">Student opinion</span>
                <p style={{ margin: '0', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                  One student's experience. Helpful for context, but it may not represent everyone.
                </p>
              </article>
              <article style={{ display: 'flex', gap: '12px', alignItems: 'start' }}>
                <span className="evidence-pill evidence-inferred">Study suggestion</span>
                <p style={{ margin: '0', fontSize: '0.88rem', color: 'var(--ink-soft)' }}>
                  A study suggestion based on the sources and core computer science skills.
                </p>
              </article>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={16} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  )
}

export default App
