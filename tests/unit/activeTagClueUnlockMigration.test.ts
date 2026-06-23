import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve(
    process.cwd(),
    'supabase/migrations/20260623190000_recalculate_active_tag_clue_unlock.sql'
  ),
  'utf8'
)

describe('active tag clue unlock recalculation migration', () => {
  it('recalculates only the active tag from the current game setting', () => {
    expect(migration).toContain('from public.game_settings')
    expect(migration).toContain("where tag.status = 'active'")
    expect(migration).toContain('make_interval(')
    expect(migration).toContain('clue_unlock_delay_days')
  })

  it('does not hardcode a tag id or a fixed unlock date', () => {
    expect(migration).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i)
    expect(migration).not.toMatch(/2026-07-03|2026-07-23/)
  })
})
