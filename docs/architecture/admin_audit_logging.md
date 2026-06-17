# Admin Audit Logging

Bike Tag records authenticated admin actions in `public.admin_audit_events`.

## Audited actions

The initial implementation covers state-changing admin operations:

1. Approve a pending submission
2. Reject a pending submission
3. Archive an approved submission
4. Delete a pending submission
5. Create the opening tag
6. Delete all game data when the guarded cleanup endpoint is enabled

The schema also reserves `admin.login` for a follow-up that can record authentication outcomes without duplicating or weakening the existing login rate limiter.

## Event lifecycle

Each protected mutation follows this sequence:

1. Verify the Supabase admin session and `public.admin_users` authorization.
2. Validate the request body and target identifier.
3. Insert an audit event with outcome `started`.
4. Run the requested mutation.
5. Update the event to `succeeded` or `failed` and set `completed_at`.

If the initial audit insert fails, the mutation fails closed with HTTP `503` and does not run.

If the final audit update fails, the original action result is preserved. The durable `started` row remains as evidence that the action began, and the completion failure is logged on the server.

## Recorded fields

Each event can include:

- action and outcome
- admin-user ID, Auth user ID, and admin email
- target type and target ID
- request ID
- safe action metadata
- sanitized status code and error message
- creation and completion timestamps

Passwords, access tokens, cookies, image contents, and error stacks are never written to audit metadata.

## Database security

`public.admin_audit_events` has Row Level Security enabled.

The migration:

- revokes access from `public`, `anon`, and `authenticated`
- grants only `SELECT`, `INSERT`, and `UPDATE` to `service_role`
- does not grant `DELETE`, preserving the audit trail
- indexes creation time, actor, and target lookups

The service-role key remains server-only.

## Read-only API

Authenticated admins can read paginated history through:

```text
GET /api/admin/audit-events?limit=50&offset=0
```

The endpoint validates the existing admin session, reads through the server-side service-role client, and returns at most 100 events per request. The audit table is not exposed directly to browser-side Supabase clients.

A later admin UI can render this endpoint as a searchable activity view. Authorized operators can also inspect the table through the Supabase dashboard or trusted server-side tooling.
