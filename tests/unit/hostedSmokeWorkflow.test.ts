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
      'name: Verify hosted deployment (${{'
    )
  })

  it('isolates concurrency by deployment instead of release branch', () => {
    expect(hostedSmokeWorkflow).toContain(
      "group: hosted-smoke-${{ github.event_name == 'workflow_dispatch' && github.run_id || github.event.deployment.id }}"
    )
    expect(hostedSmokeWorkflow).toContain('cancel-in-progress: false')
    expect(hostedSmokeWorkflow).not.toContain(
      "github.event.deployment.ref }}\n  cancel-in-progress: true"
    )
  })

  it('uses the protected deployment URL only for Preview', () => {
    expect(hostedSmokeWorkflow).toContain(
      'preview)\n              base_url="${base_url:-https://louisvillebiketagpreview.vercel.app}"'
    )
    expect(hostedSmokeWorkflow).toContain(
      'production)\n              if [[ "$EVENT_NAME" != "workflow_dispatch" ]]; then\n                base_url="https://louisvillebiketag.vercel.app"'
    )
  })
})
