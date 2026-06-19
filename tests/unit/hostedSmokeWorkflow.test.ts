import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const hostedSmokeWorkflow = readFileSync(
  resolve(process.cwd(), '.github/workflows/hosted-smoke.yml'),
  'utf8'
)

describe('hosted smoke workflow', () => {
  it('uses a stable check name for deployment-status events', () => {
    expect(hostedSmokeWorkflow).toContain(
      'name: Verify hosted deployment\n'
    )
    expect(hostedSmokeWorkflow).not.toContain(
      'name: Verify hosted deployment ('
    )
  })

  it('isolates concurrency by deployment instead of release branch', () => {
    expect(hostedSmokeWorkflow).toContain('github.event.deployment.id')
    expect(hostedSmokeWorkflow).toContain('github.run_id')
    expect(hostedSmokeWorkflow).toContain('cancel-in-progress: false')
    expect(hostedSmokeWorkflow).not.toContain('cancel-in-progress: true')
  })

  it('uses the protected deployment URL only for Preview', () => {
    expect(hostedSmokeWorkflow).toContain(
      'louisvillebiketagpreview.vercel.app'
    )
    expect(hostedSmokeWorkflow).toContain('louisvillebiketag.vercel.app')
    expect(hostedSmokeWorkflow).toContain(
      'if [[ "$EVENT_NAME" != "workflow_dispatch" ]]'
    )
  })
})
