import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260623161000_allow_current_tag_replace_audit.sql'
  ),
  'utf8'
)

describe('current tag replacement audit migration', () => {
  it('allows the current tag replacement audit action', () => {
    expect(migration).toContain('admin_audit_events_action_allowed')
    expect(migration).toContain("'tag.current.replace'")
  })
})
