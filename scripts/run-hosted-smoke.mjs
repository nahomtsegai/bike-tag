import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const defaultTimeoutMs = 15_000
const defaultAttempts = 12
const retryDelayMs = 5_000
const deploymentReadinessRetryStatuses = [202, 401, 403, 404]

const hiddenCurrentTagFields = [
  'locationMapUrl',
  'foundLatitude',
  'foundLongitude',
  'foundLocationAccuracyMeters',
  'foundLocationCapturedAt'
]

const delay = (milliseconds) =>
  new Promise((resolvePromise) => setTimeout(resolvePromise, milliseconds))

const getArgumentValue = (name, args = process.argv.slice(2)) => {
  const exactIndex = args.indexOf(name)

  if (exactIndex >= 0) {
    return args[exactIndex + 1]
  }

  const prefix = `${name}=`
  const inlineArgument = args.find((argument) => argument.startsWith(prefix))

  return inlineArgument?.slice(prefix.length)
}

const assertPlainObject = (value, label) => {
  assert.ok(
    value !== null && typeof value === 'object' && !Array.isArray(value),
    `${label} must be an object.`
  )
}

const assertNonEmptyString = (value, label) => {
  assert.equal(typeof value, 'string', `${label} must be a string.`)
  assert.ok(value.trim().length > 0, `${label} must not be empty.`)
}

export const normalizeBaseUrl = (value) => {
  assertNonEmptyString(value, 'Smoke base URL')

  const url = new URL(value.trim())

  assert.ok(
    url.protocol === 'https:' || url.protocol === 'http:',
    'Smoke base URL must use HTTP or HTTPS.'
  )

  url.hash = ''
  url.search = ''
  url.pathname = url.pathname.replace(/\/+$/, '') || '/'

  return url.toString().replace(/\/$/, '')
}

export const createRequestHeaders = ({ accept, bypassSecret = '' }) => {
  const headers = {
    Accept: accept,
    'User-Agent': 'bike-tag-hosted-smoke/1.0'
  }
  const normalizedBypassSecret = bypassSecret.trim()

  if (normalizedBypassSecret) {
    headers['x-vercel-protection-bypass'] = normalizedBypassSecret
    headers['x-vercel-set-bypass-cookie'] = 'true'
  }

  return headers
}

export const isRetryableStatus = (status, additionalStatuses = []) => {
  return (
    additionalStatuses.includes(status) ||
    status === 408 ||
    status === 409 ||
    status === 425 ||
    status === 429 ||
    status >= 500
  )
}

export const validateCurrentTagPayload = (payload) => {
  assertPlainObject(payload, 'Current-tag response')
  assert.ok(
    Object.hasOwn(payload, 'currentTag'),
    'Current-tag response must include currentTag.'
  )

  if (payload.currentTag === null) {
    return
  }

  assertPlainObject(payload.currentTag, 'Current tag')
  assertNonEmptyString(payload.currentTag.id, 'Current tag id')
  assertNonEmptyString(payload.currentTag.title, 'Current tag title')
  assertNonEmptyString(payload.currentTag.imageUrl, 'Current tag imageUrl')
  assertNonEmptyString(payload.currentTag.status, 'Current tag status')
  assert.equal(
    typeof payload.currentTag.clueIsUnlocked,
    'boolean',
    'Current tag clueIsUnlocked must be a boolean.'
  )
  assertNonEmptyString(
    payload.currentTag.clueUnlocksAtIso,
    'Current tag clueUnlocksAtIso'
  )

  for (const fieldName of hiddenCurrentTagFields) {
    assert.equal(
      Object.hasOwn(payload.currentTag, fieldName),
      false,
      `Current-tag response must not expose ${fieldName}.`
    )
  }
}

export const validateFoundTagsPayload = (payload) => {
  assert.ok(Array.isArray(payload), 'Tag-history response must be an array.')

  for (const [index, tag] of payload.entries()) {
    assertPlainObject(tag, `Tag-history item ${index}`)
    assertNonEmptyString(tag.id, `Tag-history item ${index} id`)
    assertNonEmptyString(tag.title, `Tag-history item ${index} title`)
    assertNonEmptyString(tag.imageUrl, `Tag-history item ${index} imageUrl`)
    assertNonEmptyString(tag.status, `Tag-history item ${index} status`)
  }
}

const assertStatus = (response, expectedStatus, label) => {
  assert.equal(
    response.status,
    expectedStatus,
    `${label} returned ${response.status}; expected ${expectedStatus}.`
  )
}

const assertContentType = (response, expectedPattern, label) => {
  const contentType = response.headers.get('content-type') ?? ''

  assert.match(
    contentType,
    expectedPattern,
    `${label} returned unexpected content type: ${contentType || '(missing)'}.`
  )
}

const readJson = async (response, label) => {
  assertContentType(response, /application\/json/i, label)

  try {
    return await response.json()
  } catch (error) {
    throw new Error(`${label} returned invalid JSON.`, { cause: error })
  }
}

export const createRequester = ({
  baseUrl,
  bypassSecret = '',
  attempts = defaultAttempts,
  timeoutMs = defaultTimeoutMs,
  retryDelayMilliseconds = retryDelayMs,
  fetchImpl = fetch,
  delayImpl = delay
}) => {
  return async (path, accept, { retryStatuses = [] } = {}) => {
    const url = new URL(path, `${baseUrl}/`)
    let lastError

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const response = await fetchImpl(url, {
          headers: createRequestHeaders({ accept, bypassSecret }),
          redirect: 'follow',
          signal: AbortSignal.timeout(timeoutMs)
        })

        if (
          attempt < attempts &&
          isRetryableStatus(response.status, retryStatuses)
        ) {
          await response.arrayBuffer()
          console.warn(
            `Deployment is not ready at ${url.toString()} ` +
              `(status ${response.status}, attempt ${attempt}/${attempts}); retrying.`
          )
          await delayImpl(retryDelayMilliseconds)
          continue
        }

        return response
      } catch (error) {
        lastError = error

        if (attempt < attempts) {
          console.warn(
            `Request failed for ${url.toString()} ` +
              `(attempt ${attempt}/${attempts}); retrying.`
          )
          await delayImpl(retryDelayMilliseconds)
          continue
        }
      }
    }

    throw new Error(`Request failed for ${url.toString()}.`, {
      cause: lastError
    })
  }
}

const runCheck = async (name, callback, failures) => {
  try {
    await callback()
    console.log(`✓ ${name}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    failures.push({ name, message })
    console.error(`✗ ${name}: ${message}`)
  }
}

export const runHostedSmoke = async ({
  baseUrl,
  environment = 'unspecified',
  bypassSecret = ''
}) => {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)
  const request = createRequester({
    baseUrl: normalizedBaseUrl,
    bypassSecret
  })
  const failures = []

  console.log(
    `Running ${environment} hosted smoke tests against ${normalizedBaseUrl}`
  )

  await runCheck(
    'homepage and security headers',
    async () => {
      const response = await request('/', 'text/html', {
        retryStatuses: deploymentReadinessRetryStatuses
      })
      assertStatus(response, 200, 'Homepage')
      assertContentType(response, /text\/html/i, 'Homepage')

      const html = await response.text()
      assert.ok(
        html.includes('Louisville Bike Tag'),
        'Homepage did not contain the expected site title.'
      )
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
      assert.equal(response.headers.get('x-frame-options'), 'DENY')
      assert.equal(
        response.headers.get('referrer-policy'),
        'strict-origin-when-cross-origin'
      )
      assert.equal(
        response.headers.get('cross-origin-opener-policy'),
        'same-origin'
      )
      assert.match(
        response.headers.get('strict-transport-security') ?? '',
        /max-age=31536000/i
      )
      assert.match(
        response.headers.get('content-security-policy-report-only') ?? '',
        /default-src 'self'/i
      )

      const permissionsPolicy =
        response.headers.get('permissions-policy') ?? ''
      for (const directive of [
        'camera=()',
        'microphone=()',
        'geolocation=(self)',
        'payment=()'
      ]) {
        assert.ok(
          permissionsPolicy.includes(directive),
          `Permissions-Policy is missing ${directive}.`
        )
      }
    },
    failures
  )

  await runCheck(
    'current-tag public contract',
    async () => {
      const response = await request('/api/tags/current', 'application/json')
      assertStatus(response, 200, 'Current-tag API')
      validateCurrentTagPayload(await readJson(response, 'Current-tag API'))
    },
    failures
  )

  await runCheck(
    'tag-history public contract',
    async () => {
      const response = await request('/api/tags', 'application/json')
      assertStatus(response, 200, 'Tag-history API')
      validateFoundTagsPayload(await readJson(response, 'Tag-history API'))
    },
    failures
  )

  await runCheck(
    'unauthenticated admin session boundary',
    async () => {
      const response = await request('/api/admin/session', 'application/json')
      assertStatus(response, 200, 'Admin session API')
      assert.deepEqual(await readJson(response, 'Admin session API'), {
        isAuthenticated: false,
        authType: null,
        adminUser: null
      })
    },
    failures
  )

  await runCheck(
    'protected admin submissions boundary',
    async () => {
      const response = await request(
        '/api/admin/submissions',
        'application/json'
      )
      assertStatus(response, 403, 'Admin submissions API')
    },
    failures
  )

  await runCheck(
    'invalid public submission reference validation',
    async () => {
      const response = await request(
        '/api/submissions/status/not-a-uuid',
        'application/json'
      )
      assertStatus(response, 400, 'Submission-status API')
    },
    failures
  )

  if (failures.length > 0) {
    console.error(`\n${failures.length} hosted smoke check(s) failed:`)
    for (const failure of failures) {
      console.error(`- ${failure.name}: ${failure.message}`)
    }
    throw new Error('Hosted smoke tests failed.')
  }

  console.log(`\nAll hosted smoke checks passed for ${environment}.`)
}

const main = async () => {
  const baseUrl =
    getArgumentValue('--base-url') ?? process.env.SMOKE_BASE_URL ?? ''
  const environment =
    getArgumentValue('--environment') ??
    process.env.SMOKE_ENVIRONMENT ??
    'unspecified'

  await runHostedSmoke({
    baseUrl,
    environment,
    bypassSecret: process.env.VERCEL_AUTOMATION_BYPASS_SECRET ?? ''
  })
}

const entryUrl = process.argv[1]
  ? pathToFileURL(resolve(process.argv[1])).href
  : ''

if (entryUrl === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack : error)
    process.exitCode = 1
  })
}
