import { expect, test, type Page } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const activeTagId = '11111111-1111-4111-8111-111111111111'
const activeTagTitle = 'Workflow opening tag'
const riderName = 'Workflow Rider'
const nextTagTitle = 'Workflow next mystery spot'
const nextTagClue = 'Look for the tiny automated landmark.'
const reviewerName = 'Workflow Reviewer'
const publicStorageBucket = 'bike_tag_photos'
const pendingStorageBucket = 'bike_tag_pending_photos'
const workflowCoordinates = {
  latitude: 38.2527,
  longitude: -85.7585,
  accuracy: 10
}

const requireEnvironmentValue = (key: string) => {
  const value = process.env[key]?.trim()

  if (!value) {
    throw new Error(`${key} is required for the workflow test.`)
  }

  return value
}

const workflowAdminEmail = requireEnvironmentValue('WORKFLOW_ADMIN_EMAIL')
const workflowAdminPassword = requireEnvironmentValue('WORKFLOW_ADMIN_PASSWORD')

const createServiceClient = () => {
  const supabaseUrl = requireEnvironmentValue('WORKFLOW_SUPABASE_URL')

  if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(supabaseUrl)) {
    throw new Error('The workflow test only runs against local Supabase.')
  }

  return createClient(
    supabaseUrl,
    requireEnvironmentValue('WORKFLOW_SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

const assertNoSupabaseError = (
  operation: string,
  error: { message: string } | null
) => {
  if (error) {
    throw new Error(`${operation}: ${error.message}`)
  }
}

const deleteRowsById = async (
  supabase: SupabaseClient,
  table: 'submissions' | 'tags'
) => {
  const { data, error } = await supabase.from(table).select('id')
  assertNoSupabaseError(`Could not list ${table}`, error)

  const ids = (data ?? []).map((row) => row.id)

  if (!ids.length) {
    return
  }

  const { error: deleteError } = await supabase
    .from(table)
    .delete()
    .in('id', ids)
  assertNoSupabaseError(`Could not delete ${table}`, deleteError)
}

const collectStorageObjectPaths = async (
  supabase: SupabaseClient,
  bucket: string,
  prefix = ''
): Promise<string[]> => {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: {
      column: 'name',
      order: 'asc'
    }
  })
  assertNoSupabaseError(`Could not list ${bucket}/${prefix}`, error)

  const paths: string[] = []

  for (const item of data ?? []) {
    const itemPath = prefix ? `${prefix}/${item.name}` : item.name

    if (item.id) {
      paths.push(itemPath)
      continue
    }

    paths.push(...(await collectStorageObjectPaths(supabase, bucket, itemPath)))
  }

  return paths
}

const clearStorageBucket = async (
  supabase: SupabaseClient,
  bucket: string
) => {
  const paths = await collectStorageObjectPaths(supabase, bucket)

  if (!paths.length) {
    return
  }

  const { error } = await supabase.storage.from(bucket).remove(paths)
  assertNoSupabaseError(`Could not clear ${bucket}`, error)
}

const deleteWorkflowAdminUser = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000
  })
  assertNoSupabaseError('Could not list auth users', error)

  const matchingUsers = data.users.filter(
    (user) => user.email?.toLowerCase() === workflowAdminEmail.toLowerCase()
  )

  for (const user of matchingUsers) {
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
    assertNoSupabaseError('Could not delete workflow admin user', deleteError)
  }
}

const cleanupWorkflowData = async (supabase: SupabaseClient) => {
  await deleteRowsById(supabase, 'submissions')
  await deleteRowsById(supabase, 'tags')
  await clearStorageBucket(supabase, pendingStorageBucket)
  await clearStorageBucket(supabase, publicStorageBucket)
  await deleteWorkflowAdminUser(supabase)
}

const seedWorkflowData = async (supabase: SupabaseClient) => {
  const { data: authUserData, error: authUserError } =
    await supabase.auth.admin.createUser({
      email: workflowAdminEmail,
      password: workflowAdminPassword,
      email_confirm: true
    })
  assertNoSupabaseError('Could not create workflow admin user', authUserError)

  if (!authUserData.user) {
    throw new Error('Supabase did not return the workflow admin user.')
  }

  const { error: adminUserError } = await supabase.from('admin_users').insert({
    user_id: authUserData.user.id,
    email: workflowAdminEmail,
    display_name: 'Workflow Admin'
  })
  assertNoSupabaseError('Could not authorize workflow admin user', adminUserError)

  const { error: activeTagError } = await supabase.from('tags').insert({
    id: activeTagId,
    title: activeTagTitle,
    clue: 'The starting point for the complete workflow test.',
    tag_photo_url: 'https://example.com/workflow-opening-tag.jpg',
    hidden_location_map_url:
      'https://www.google.com/maps/search/?api=1&query=38.2527,-85.7585',
    found_by: 'Bike Tag Admin',
    status: 'active'
  })
  assertNoSupabaseError('Could not seed the active workflow tag', activeTagError)
}

const createPhoto = async (name: string, background: string) => {
  const buffer = await sharp({
    create: {
      width: 32,
      height: 32,
      channels: 3,
      background
    }
  })
    .png()
    .toBuffer()

  return {
    name,
    mimeType: 'image/png',
    buffer
  }
}

const installDeterministicGeolocation = async (page: Page) => {
  await page.addInitScript((coordinates) => {
    const createPosition = (): GeolocationPosition => {
      return {
        coords: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          accuracy: coordinates.accuracy,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
          toJSON: () => ({})
        },
        timestamp: Date.now(),
        toJSON: () => ({})
      }
    }

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: (
          success: PositionCallback,
          _error?: PositionErrorCallback | null
        ) => {
          queueMicrotask(() => success(createPosition()))
        },
        watchPosition: (
          success: PositionCallback,
          _error?: PositionErrorCallback | null
        ) => {
          queueMicrotask(() => success(createPosition()))
          return 1
        },
        clearWatch: () => undefined
      }
    })
  }, workflowCoordinates)
}

const getSubmissionByTitle = async (supabase: SupabaseClient) => {
  const { data, error } = await supabase
    .from('submissions')
    .select(
      [
        'id',
        'status',
        'reviewed_by',
        'match_photo_url',
        'next_tag_photo_url'
      ].join(',')
    )
    .eq('next_title', nextTagTitle)
    .maybeSingle()
  assertNoSupabaseError('Could not load the workflow submission', error)

  return data
}

let supabase: SupabaseClient

test.beforeAll(async () => {
  supabase = createServiceClient()
  await cleanupWorkflowData(supabase)
  await seedWorkflowData(supabase)
})

test.afterAll(async () => {
  await cleanupWorkflowData(supabase)
})

test('a rider submission can be approved into the next active tag', async ({
  page
}) => {
  const matchPhoto = await createPhoto('workflow-match.png', '#0f766e')
  const nextPhoto = await createPhoto('workflow-next.png', '#d97706')

  await installDeterministicGeolocation(page)
  await page.goto('/submit', { waitUntil: 'networkidle' })

  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Found the tag? Claim it, then hide the next one.'
    })
  ).toBeVisible()

  await page.getByLabel('Rider name').fill(riderName)
  await page
    .getByRole('button', { name: 'Use my current location' })
    .first()
    .click()
  await expect(page.getByText('Match location captured')).toBeVisible()
  await page.getByLabel('Match photo').setInputFiles(matchPhoto)

  await page.getByLabel('Next tag title').fill(nextTagTitle)
  await page.getByLabel('Next tag clue').fill(nextTagClue)
  await page.getByRole('button', { name: 'Use my current location' }).click()
  await expect(page.getByText('Next hidden location captured')).toBeVisible()
  await page.getByLabel('Next tag photo').setInputFiles(nextPhoto)

  const reviewButton = page.getByRole('button', { name: 'Review tag' })
  await expect(reviewButton).toBeVisible()
  await reviewButton.click()

  await expect(
    page.getByRole('heading', {
      level: 2,
      name: 'Review your find and next mystery spot.'
    })
  ).toBeVisible()

  await page.getByRole('button', { name: 'Submit for review' }).click()
  await expect(page).toHaveURL(/\/submit\/success\?reference=/)
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: 'Your tag is in the review queue.'
    })
  ).toBeVisible()

  const submissionReference = new URL(page.url()).searchParams.get('reference')
  expect(submissionReference).toBeTruthy()

  await expect
    .poll(async () => (await getSubmissionByTitle(supabase))?.status ?? null)
    .toBe('pending')

  await page.goto('/admin/submissions', { waitUntil: 'networkidle' })
  await page.getByLabel('Admin email').fill(workflowAdminEmail)
  await page.getByLabel('Admin password').fill(workflowAdminPassword)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await expect(page.getByText('Signed in', { exact: true })).toBeVisible()
  await page.getByLabel('Reviewer name').fill(reviewerName)

  const submissionButton = page.getByRole('button', {
    name: new RegExp(nextTagTitle)
  })
  await expect(submissionButton).toBeVisible()
  await submissionButton.click()

  await page.getByRole('button', { name: 'Approve submission' }).click()

  const confirmationDialog = page.getByRole('dialog', {
    name: 'Approve submission?'
  })
  await expect(confirmationDialog).toBeVisible()
  await confirmationDialog
    .getByRole('button', { name: 'Approve submission' })
    .click()
  await expect(confirmationDialog).toBeHidden()

  await expect
    .poll(async () => (await getSubmissionByTitle(supabase))?.status ?? null)
    .toBe('approved')

  const approvedSubmission = await getSubmissionByTitle(supabase)
  expect(approvedSubmission).toMatchObject({
    status: 'approved',
    reviewed_by: reviewerName
  })
  expect(approvedSubmission?.match_photo_url).toContain(
    `/storage/v1/object/public/${publicStorageBucket}/`
  )
  expect(approvedSubmission?.next_tag_photo_url).toContain(
    `/storage/v1/object/public/${publicStorageBucket}/`
  )

  const { data: openingTag, error: openingTagError } = await supabase
    .from('tags')
    .select('status, found_by')
    .eq('id', activeTagId)
    .single()
  assertNoSupabaseError('Could not load the completed opening tag', openingTagError)
  expect(openingTag).toEqual({
    status: 'found',
    found_by: riderName
  })

  const { data: currentTag, error: currentTagError } = await supabase
    .from('tags')
    .select('id, title, clue, status')
    .eq('status', 'active')
    .single()
  assertNoSupabaseError('Could not load the new active tag', currentTagError)
  expect(currentTag).toMatchObject({
    title: nextTagTitle,
    clue: nextTagClue,
    status: 'active'
  })

  const currentTagResponse = await page.request.get('/api/tags/current')
  expect(currentTagResponse.ok()).toBe(true)
  const currentTagPayload = await currentTagResponse.json()
  expect(currentTagPayload.currentTag).toMatchObject({
    id: currentTag?.id,
    title: nextTagTitle,
    status: 'active'
  })
})
