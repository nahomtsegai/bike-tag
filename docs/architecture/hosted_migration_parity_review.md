# Hosted Migration Parity Review Notes

This temporary review note documents the validation performed while introducing
the hosted migration parity gate.

1. The checker parses repository migration filenames without reading SQL bodies.
2. Hosted migration history is queried with a read-only PostgreSQL session.
3. The database URL is removed from the child process environment before `psql`
   starts and is passed through libpq's `PGDATABASE` setting.
4. The promotion workflow runs from the protected base branch with read-only
   repository permissions.
5. Pull-request scripts and executables are never run with the database secret.
6. Candidate migration files are copied as inert files and only their filenames
   are compared.
7. The checker was syntax-validated with Node 22-compatible syntax and exercised
   against a fake `psql` command for a matching ledger.
