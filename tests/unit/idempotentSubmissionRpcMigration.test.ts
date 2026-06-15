import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260615143000_fix_idempotent_submission_rpc_ambiguity.sql'
)

const migrationSql = readFileSync(migrationPath, 'utf8')

describe('idempotent submission RPC migration', () => {
  it('qualifies active_tag_id when reading existing submissions', () => {
    expect(migrationSql).not.toMatch(/select\s+id,\s*active_tag_id\s+into/i)

    const qualifiedReferences = migrationSql.match(
      /existing_submission\.active_tag_id/g
    )

    expect(qualifiedReferences).toHaveLength(2)
    expect(migrationSql).toContain(
      'from public.submissions as existing_submission'
    )
  })
})
