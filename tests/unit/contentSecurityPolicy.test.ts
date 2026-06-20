import { describe, expect, it } from 'vitest'

import {
  buildContentSecurityPolicyReportOnly,
  openStreetMapTileSource
} from '../../server/utils/contentSecurityPolicy'

const broadHttpsImageSource = /(?:^|;\s*)img-src[^;]*\shttps:(?:\s|;|$)/
const broadWebSocketConnectionSource =
  /(?:^|;\s*)connect-src[^;]*\s(?:ws:|wss:)(?:\s|;|$)/

describe('content security policy', () => {
  it('allows only the production Supabase and OpenStreetMap origins', () => {
    const policy = buildContentSecurityPolicyReportOnly({
      supabaseUrl: 'https://bike-tag.supabase.co/rest/v1'
    })

    expect(policy).toContain(
      `img-src 'self' data: blob: ${openStreetMapTileSource} https://bike-tag.supabase.co`
    )
    expect(policy).toContain(
      "connect-src 'self' https://bike-tag.supabase.co wss://bike-tag.supabase.co"
    )
    expect(policy).toContain("frame-src 'none'")
    expect(policy).not.toMatch(broadHttpsImageSource)
    expect(policy).not.toMatch(broadWebSocketConnectionSource)
  })

  it('supports local Supabase development without broad websocket sources', () => {
    const policy = buildContentSecurityPolicyReportOnly({
      supabaseUrl: 'http://127.0.0.1:54321'
    })

    expect(policy).toContain(
      "connect-src 'self' http://127.0.0.1:54321 ws://127.0.0.1:54321"
    )
    expect(policy).not.toMatch(broadWebSocketConnectionSource)
  })

  it('ignores invalid or unsupported Supabase URLs', () => {
    expect(
      buildContentSecurityPolicyReportOnly({
        supabaseUrl: 'javascript:alert(1)'
      })
    ).toContain("connect-src 'self'")

    expect(
      buildContentSecurityPolicyReportOnly({
        supabaseUrl: 'not-a-url'
      })
    ).not.toContain('not-a-url')
  })

  it('keeps the current inline allowances visible for later enforcement work', () => {
    const policy = buildContentSecurityPolicyReportOnly()

    expect(policy).toContain("script-src 'self' 'unsafe-inline'")
    expect(policy).toContain("style-src 'self' 'unsafe-inline'")
  })
})
