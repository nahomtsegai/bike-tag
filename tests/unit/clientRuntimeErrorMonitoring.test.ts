import { describe, expect, it } from 'vitest'
import {
  createClientRuntimeErrorReport,
  getClientRuntimeErrorSignature,
  shouldReportClientRuntimeError
} from '../../app/utils/runtimeErrorMonitoring'

describe('client runtime error monitoring', () => {
  it('ignores expected HTTP and cancellation errors', () => {
    expect(
      shouldReportClientRuntimeError(
        Object.assign(new Error('Not found'), { statusCode: 404 })
      )
    ).toBe(false)
    expect(
      shouldReportClientRuntimeError(
        Object.assign(new Error('Cancelled'), { name: 'AbortError' })
      )
    ).toBe(false)
    expect(
      shouldReportClientRuntimeError(new Error('Component render failed'))
    ).toBe(true)
  })

  it('creates a sanitized client report without URL query values', () => {
    const error = Object.assign(new Error('Component render failed'), {
      data: {
        requestId: 'request-123'
      },
      statusCode: 500
    })
    const report = createClientRuntimeErrorReport(error, 'client-vue', {
      routePath: '/submit?step=review#photos',
      context: 'render function',
      screenWidth: 430,
      screenHeight: 932
    })

    expect(report).toMatchObject({
      source: 'client-vue',
      name: 'Error',
      message: 'Component render failed (render function)',
      routePath: '/submit',
      statusCode: 500,
      requestId: 'request-123',
      screenWidth: 430,
      screenHeight: 932
    })
    expect(report.stack).toContain('Component render failed')
  })

  it('creates stable duplicate-detection signatures', () => {
    const report = createClientRuntimeErrorReport(
      new Error('Component render failed'),
      'client-window',
      {
        routePath: '/current-tag'
      }
    )

    expect(getClientRuntimeErrorSignature(report)).toBe(
      'client-window|Error|Component render failed|/current-tag|'
    )
  })
})
