import { describe, expect, it } from 'vitest'
import { parseProgressImport, parseProgressImportText } from './parseProgressImport'

const validApplication = {
  id: 'app-1',
  pathId: 'swe' as const,
  company: 'Example',
  role: 'Intern',
  url: 'https://example.com/jobs/1',
  date: '2026-08-01',
  status: 'Applied' as const,
  nextStep: 'Wait',
}

describe('parseProgressImport', () => {
  it('rejects text that is not JSON', () => {
    expect(parseProgressImportText('{')).toEqual({
      ok: false,
      message: 'Import failed: file is not valid JSON.',
    })
  })

  it('restores a valid path and drops a bogus focus log', () => {
    expect(
      parseProgressImport({
        selectedPath: 'swe',
        focusLog: { minutes: 'later', sessions: 2 },
      }),
    ).toEqual({
      ok: true,
      restored: ['path'],
      selectedPath: 'swe',
    })
  })

  it('drops a bad application row and keeps a valid one', () => {
    expect(
      parseProgressImport({
        applications: [{ ...validApplication, status: 'Nope' }, validApplication],
      }),
    ).toEqual({
      ok: true,
      restored: ['applications'],
      applications: [validApplication],
    })
  })

  it('rejects a top-level array as a backup file', () => {
    expect(parseProgressImport([{ selectedPath: 'swe' }])).toEqual({
      ok: false,
      message: 'Import failed: not a Signal Path backup file.',
    })
  })

  it('rejects a known key that contains nothing restorable', () => {
    expect(parseProgressImport({ focusLog: { minutes: 'x', sessions: 'y' } })).toEqual({
      ok: false,
      message: 'Import failed: backup contained no restorable data.',
    })
  })

  it('restores an empty task list', () => {
    expect(parseProgressImport({ completedTasks: [] })).toEqual({
      ok: true,
      restored: ['tasks'],
      completedTasks: [],
    })
  })
})
