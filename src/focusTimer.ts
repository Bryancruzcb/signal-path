export const FOCUS_BLOCK_SECONDS = 25 * 60
export const FOCUS_BLOCK_MINUTES = 25

export type FocusLog = { minutes: number; sessions: number }

export type FocusTimerState = {
  endAt: number | null
  remainingSeconds: number
  running: boolean
  focusLog: FocusLog
}

export type ResyncStep =
  | { type: 'idle'; timer: FocusTimerState }
  | { type: 'tick'; remainingSeconds: number; timer: FocusTimerState }
  | { type: 'bank'; timer: FocusTimerState }

export type UnloadEffect =
  | { type: 'none' }
  | { type: 'remaining'; remainingSeconds: number }
  | { type: 'bank'; focusLog: FocusLog }

export type UnloadStep = { timer: FocusTimerState; effect: UnloadEffect }

export type PauseStep =
  | { type: 'paused'; timer: FocusTimerState }
  | { type: 'bank'; timer: FocusTimerState }

export function remainingFromDeadline(endAt: number, now: number) {
  return Math.max(0, Math.round((endAt - now) / 1000))
}

export function remainingFromStorage(stored: string | null) {
  const value = Number(stored)
  if (!Number.isFinite(value) || value <= 0) return FOCUS_BLOCK_SECONDS
  return Math.min(FOCUS_BLOCK_SECONDS, Math.max(1, Math.round(value)))
}

export function bankFocusBlock(log: FocusLog): FocusLog {
  return { minutes: log.minutes + FOCUS_BLOCK_MINUTES, sessions: log.sessions + 1 }
}

export function bankedTimer(log: FocusLog): FocusTimerState {
  return {
    endAt: null,
    remainingSeconds: FOCUS_BLOCK_SECONDS,
    running: false,
    focusLog: bankFocusBlock(log),
  }
}

export function resyncStep(timer: FocusTimerState, now: number): ResyncStep {
  if (!timer.running || timer.endAt === null) return { type: 'idle', timer }
  const remainingSeconds = remainingFromDeadline(timer.endAt, now)
  if (remainingSeconds > 0) {
    return { type: 'tick', remainingSeconds, timer: { ...timer, remainingSeconds } }
  }
  return { type: 'bank', timer: bankedTimer(timer.focusLog) }
}

export function unloadStep(timer: FocusTimerState, now: number): UnloadStep {
  // A null deadline stops beforeunload and pagehide from banking the same session twice.
  if (timer.endAt === null) return { timer, effect: { type: 'none' } }
  const remainingSeconds = remainingFromDeadline(timer.endAt, now)
  if (remainingSeconds > 0) return { timer, effect: { type: 'remaining', remainingSeconds } }
  const banked = bankedTimer(timer.focusLog)
  return { timer: banked, effect: { type: 'bank', focusLog: banked.focusLog } }
}

export function startStep(timer: FocusTimerState, now: number): FocusTimerState {
  return { ...timer, running: true, endAt: now + timer.remainingSeconds * 1000 }
}

export function pauseStep(timer: FocusTimerState, now: number): PauseStep {
  if (timer.endAt === null) return { type: 'paused', timer: { ...timer, running: false, endAt: null } }
  const remainingSeconds = remainingFromDeadline(timer.endAt, now)
  if (remainingSeconds === 0) return { type: 'bank', timer: bankedTimer(timer.focusLog) }
  return { type: 'paused', timer: { ...timer, running: false, endAt: null, remainingSeconds } }
}
