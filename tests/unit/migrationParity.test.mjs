import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  compareMigrationSets,
  loadLocalMigrations,
  parseRemoteMigrations,
  queryRemoteMigrations,
  runMigrationParityCheck
} from '../../scripts/check-supabase-migration-parity.mjs'

const temporaryDirectories = []

const createMigrationDirectory = (filenames) => {
  const directory = mkdtempSync(join(tmpdir(), 'bike-tag-migrations-'))
  temporaryDirectories.push(directory)

  for (const filename of filenames) {
    writeFileSync(join(directory, filename), '-- test migration\n')
  }

  return directory
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { force: true, recursive: true })
  }
})

describe('hosted migration parity', () => {
  it('loads and sorts repository migration filenames', () => {
    const directory = createMigrationDirectory([
      '20260616031707_grant_service_role_tag_access.sql',
      '001_create_tags.sql',
      'README.md'
    ])

    expect(loadLocalMigrations(directory)).toEqual([
      {
        version: '001',
        name: 'create_tags',
        filename: '001_create_tags.sql'
      },
      {
        version: '20260616031707',
        name: 'grant_service_role_tag_access',
        filename: '20260616031707_grant_service_role_tag_access.sql'
      }
    ])
  })

  it('rejects malformed SQL migration filenames', () => {
    const directory = createMigrationDirectory(['missing-version.sql'])

    expect(() => loadLocalMigrations(directory)).toThrow(
      'Migration filename must use <version>_<name>.sql: missing-version.sql'
    )
  })

  it('parses the tab-separated hosted migration ledger', () => {
    expect(
      parseRemoteMigrations(
        '20260616031707\tgrant_service_role_tag_access\n001\tcreate_tags\n'
      )
    ).toEqual([
      { version: '001', name: 'create_tags' },
      {
        version: '20260616031707',
        name: 'grant_service_role_tag_access'
      }
    ])
  })

  it('passes the database URI directly to psql', () => {
    const databaseUrl =
      'postgresql://postgres.example:password@aws-0-us-east-2.pooler.supabase.com:5432/postgres'
    let invocation

    const remoteMigrations = queryRemoteMigrations({
      databaseUrl,
      psqlCommand: 'psql-test',
      spawn: (command, args, options) => {
        invocation = { command, args, options }

        return {
          status: 0,
          stdout: '001\tcreate_tags\n',
          stderr: ''
        }
      }
    })

    expect(remoteMigrations).toEqual([{ version: '001', name: 'create_tags' }])
    expect(invocation.command).toBe('psql-test')
    expect(invocation.args).toContain('--dbname')
    expect(invocation.args[invocation.args.indexOf('--dbname') + 1]).toBe(
      databaseUrl
    )
    expect(invocation.options.env.PGDATABASE).toBeUndefined()
    expect(invocation.options.env.PGSSLMODE).toBe('require')
  })

  it('reports missing, unexpected, and renamed migrations', () => {
    const comparison = compareMigrationSets(
      [
        { version: '001', name: 'create_tags', filename: '001_create_tags.sql' },
        {
          version: '002',
          name: 'create_submissions',
          filename: '002_create_submissions.sql'
        },
        {
          version: '004',
          name: 'canonical_name',
          filename: '004_canonical_name.sql'
        }
      ],
      [
        { version: '001', name: 'create_tags' },
        { version: '003', name: 'remote_only' },
        { version: '004', name: 'old_name' }
      ]
    )

    expect(comparison).toMatchObject({
      matches: false,
      missingFromRemote: [
        {
          version: '002',
          name: 'create_submissions',
          filename: '002_create_submissions.sql'
        }
      ],
      unexpectedOnRemote: [{ version: '003', name: 'remote_only' }],
      nameMismatches: [
        {
          version: '004',
          localName: 'canonical_name',
          remoteName: 'old_name'
        }
      ]
    })
  })

  it('reports a migration recorded under a different hosted version', () => {
    const comparison = compareMigrationSets(
      [
        {
          version: '20260617010712',
          name: 'create_admin_audit_events',
          filename: '20260617010712_create_admin_audit_events.sql'
        }
      ],
      [
        {
          version: '20260616224000',
          name: 'create_admin_audit_events'
        }
      ]
    )

    expect(comparison).toEqual({
      matches: false,
      versionMismatches: [
        {
          name: 'create_admin_audit_events',
          localVersion: '20260617010712',
          remoteVersion: '20260616224000'
        }
      ],
      missingFromRemote: [],
      unexpectedOnRemote: [],
      nameMismatches: []
    })
  })

  it('passes when repository and hosted migrations match exactly', () => {
    const localMigrations = [
      {
        version: '001',
        name: 'create_tags',
        filename: '001_create_tags.sql'
      }
    ]
    const remoteMigrations = [{ version: '001', name: 'create_tags' }]

    expect(
      runMigrationParityCheck({
        environmentLabel: 'Preview',
        localMigrations,
        remoteMigrations
      })
    ).toMatchObject({ matches: true })
  })
})
