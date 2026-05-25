# Contributing to Bike Tag

Thanks for helping improve Bike Tag.

This project uses a simple branch, verify, pull request, and merge workflow.

## Branch Workflow

Create new work from `develop`.

```bash
git switch develop
git pull origin develop
git switch -c feature_branch_name
```

Use descriptive branch names.

Examples:

```text
feature_add_submit_validation_tests
feature_add_ci_workflow
fix_shared_utility_imports
docs_update_storage_plan
```

Pull requests should target:

```text
develop
```

Do not open feature pull requests directly into `main`.

## Local Development

Install dependencies:

```bash
npm install
```

Start the app:

```bash
npm run dev
```

Start the app for access from another device on the same network:

```bash
npm run dev-local
```

## Verification

Before opening or updating a pull request, run:

```bash
npm run verify
```

This command runs:

```bash
npm run test:run
npm run typecheck
npm run build
```

A pull request should be considered ready only when local verification passes.

## Testing

Use automated tests when changing validation, utility logic, parsing, storage helpers, or server behavior.

Run unit tests:

```bash
npm run test:run
```

Run type checks:

```bash
npm run typecheck
```

Run a production build:

```bash
npm run build
```

## Manual Smoke Testing

Some flows still need manual smoke testing.

Use the smoke docs when changing:

1. Public submit
2. Admin approval
3. Admin rejection
4. Supabase Storage cleanup
5. Moderation behavior
6. Current tag behavior
7. Found tag history

Useful docs:

```text
docs/architecture/moderation_smoke_test.md
docs/architecture/supabase_submit_smoke_test.md
```

## Pull Requests

Every pull request should include:

1. Clear summary
2. Reason for the change
3. List of changes
4. Testing notes
5. Screenshots when the UI changes
6. Docs updates when behavior changes
7. Risk notes when relevant

Use the pull request template.

## Issues

Use issue templates for bugs and feature ideas.

Bug reports should include:

1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Environment
5. Screenshots or logs when helpful

Feature requests should include:

1. Summary
2. Reason
3. Proposed behavior
4. Acceptance criteria
5. Testing notes

## Documentation

Update docs when changing behavior.

Examples:

1. Submit flow changes
2. Moderation behavior changes
3. Storage behavior changes
4. Supabase setup changes
5. Security behavior changes
6. Test or CI workflow changes

Architecture docs live in:

```text
docs/architecture
```

## Commit Messages

Use clear commit messages.

Examples:

```text
Add submit form data tests
Add CI workflow
Fix shared utility imports for Nuxt build
Update storage cleanup plan
```

## After Merge

After a pull request is merged, sync local `develop`.

```bash
git switch develop
git pull origin develop
git branch -d feature_branch_name
git fetch --prune
```