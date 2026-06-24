import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const endpoint = readFileSync(
  resolve(process.cwd(), 'server/api/admin/settings.patch.ts'),
  'utf8'
)

const helper = readFileSync(
  resolve(process.cwd(), 'server/utils/updateActiveTagClueUnlock.ts'),
  'utf8'
)

describe('admin clue delay updates', () => {
  it('updates the active tag after saving the game setting', () => {
    expect(endpoint).toContain('await updateSupabaseGameSettings')
    expect(endpoint).toContain('await updateActiveTagClueUnlock')
  })

  it('recalculates from the active tag creation time', () => {
    expect(helper).toContain(".select('id, created_at')")
    expect(helper).toContain(".eq('status', 'active')")
    expect(helper).toContain('new Date(activeTag.created_at).getTime()')
  })
})
