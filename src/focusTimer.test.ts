import { describe, expect, it } from 'vitest'
import {
  FOCUS_BLOCK_MINUTES,
  FOCUS_BLOCK_SECONDS,
  pauseStep,
  remainingFromStorage,
  resyncStep,
  startStep,
  unloadStep,
  type FocusLog,
  type FocusTimerState,
} from './focusTimer'

const now = 1_700_000_000_000

function runningTimer(log: FocusLog, endAt: number, remainingSeconds = 1500): FocusTimerState {
  return { endAt, remainingSeconds, running: true, focusLog: log }
}

describe('resyncStep', () => {
  it('resyncs a stale remaining count from the deadline for the interval, focus, and visibilitychange', () => {
    const log = { minutes: 50, sessions: 2 }
    const timer = runningTimer(log, now + 10_000, 1500)

    expect(resyncStep(timer, now)).toEqual({
      type: 'tick',
      remainingSeconds: 10,
      timer: { ...timer, remainingSeconds: 10 },
    })
    expect(timer.remainingSeconds).toBe(1500)
  })

  it('banks once when now equals the deadline', () => {
    const log = { minutes: 50, sessions: 2 }
    const timer = runningTimer(log, now, 1500)
    const step = resyncStep(timer, now)

    expect(step).toEqual({
      type: 'bank',
      timer: {
        endAt: null,
        remainingSeconds: FOCUS_BLOCK_SECONDS,
        running: false,
        focusLog: { minutes: log.minutes + FOCUS_BLOCK_MINUTES, sessions: log.sessions + 1 },
      },
    })
    expect(timer.focusLog).toEqual(log)
    expect(timer.endAt).toBe(now)
  })

  it('banks when now is 5 seconds past the deadline and does not return a negative remaining', () => {
    const log = { minutes: 0, sessions: 0 }
    const timer = runningTimer(log, now, 1500)
    const step = resyncStep(timer, now + 5_000)

    expect(step.type).toBe('bank')
    if (step.type !== 'bank') return
    expect(step.timer.remainingSeconds).toBe(FOCUS_BLOCK_SECONDS)
    expect(step.timer.remainingSeconds).toBeGreaterThanOrEqual(0)
    expect(step.timer.endAt).toBeNull()
    expect(step.timer.running).toBe(false)
  })
})

describe('unloadStep', () => {
  it('reports remaining seconds before the deadline and leaves the deadline and log alone', () => {
    const log = { minutes: 25, sessions: 1 }
    const timer = runningTimer(log, now + 10_000, 1500)
    const step = unloadStep(timer, now)

    expect(step.effect).toEqual({ type: 'remaining', remainingSeconds: 10 })
    expect(step.timer).toBe(timer)
    expect(step.timer.endAt).toBe(now + 10_000)
    expect(step.timer.focusLog).toEqual(log)
  })

  it('banks after the deadline and returns a timer with no deadline', () => {
    const log = { minutes: 25, sessions: 1 }
    const timer = runningTimer(log, now, 1)
    const step = unloadStep(timer, now)

    expect(step.effect).toEqual({
      type: 'bank',
      focusLog: { minutes: log.minutes + FOCUS_BLOCK_MINUTES, sessions: log.sessions + 1 },
    })
    expect(step.timer.endAt).toBeNull()
    expect(step.timer.running).toBe(false)
    expect(timer.endAt).toBe(now)
  })
})

describe('bank once across beforeunload and pagehide', () => {
  it('banks on the first unload and ignores the second', () => {
    const log = { minutes: 0, sessions: 4 }
    const timer = runningTimer(log, now - 1_000, 20)
    const first = unloadStep(timer, now)
    const second = unloadStep(first.timer, now)

    expect(first.effect.type).toBe('bank')
    expect(second.effect).toEqual({ type: 'none' })
    expect(first.timer.focusLog.sessions).toBe(log.sessions + 1)
    expect(second.timer.focusLog.sessions).toBe(log.sessions + 1)
    expect(second.timer.focusLog.minutes).toBe(log.minutes + FOCUS_BLOCK_MINUTES)
  })

  it('does not bank again when unload follows a resync that already banked', () => {
    const log = { minutes: 75, sessions: 3 }
    const timer = runningTimer(log, now, 5)
    const banked = resyncStep(timer, now)

    expect(banked.type).toBe('bank')
    if (banked.type !== 'bank') return
    const unload = unloadStep(banked.timer, now)
    expect(unload.effect).toEqual({ type: 'none' })
    expect(unload.timer.focusLog.sessions).toBe(log.sessions + 1)
    expect(banked.timer.focusLog.sessions).toBe(log.sessions + 1)
  })
})

describe('remainingFromStorage', () => {
  it('starts a full block when storage is missing, finished, or not a number', () => {
    expect(remainingFromStorage(null)).toBe(FOCUS_BLOCK_SECONDS)
    expect(remainingFromStorage('0')).toBe(FOCUS_BLOCK_SECONDS)
    expect(remainingFromStorage('nope')).toBe(FOCUS_BLOCK_SECONDS)
  })

  it('clamps a stored countdown into the focus block', () => {
    expect(remainingFromStorage('10')).toBe(10)
    expect(remainingFromStorage('99999')).toBe(FOCUS_BLOCK_SECONDS)
    expect(remainingFromStorage('1.6')).toBe(2)
  })
})

describe('pauseStep and startStep', () => {
  it('pauses from the deadline and clears it', () => {
    const log = { minutes: 0, sessions: 0 }
    const timer = runningTimer(log, now + 10_000, 1500)
    const step = pauseStep(timer, now)

    expect(step).toEqual({
      type: 'paused',
      timer: { ...timer, running: false, endAt: null, remainingSeconds: 10 },
    })
    expect(timer.endAt).toBe(now + 10_000)
  })

  it('banks when a pause lands on the deadline', () => {
    const log = { minutes: 0, sessions: 1 }
    const step = pauseStep(runningTimer(log, now, 3), now)

    expect(step.type).toBe('bank')
    if (step.type !== 'bank') return
    expect(step.timer.endAt).toBeNull()
    expect(step.timer.focusLog.sessions).toBe(log.sessions + 1)
  })

  it('starts a deadline from the remaining seconds', () => {
    const timer: FocusTimerState = {
      endAt: null,
      remainingSeconds: 40,
      running: false,
      focusLog: { minutes: 0, sessions: 0 },
    }

    expect(startStep(timer, now)).toEqual({ ...timer, running: true, endAt: now + 40_000 })
    expect(timer.endAt).toBeNull()
  })
})
