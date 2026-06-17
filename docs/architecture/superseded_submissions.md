# Superseded submissions

## Purpose

When multiple riders submit finds for the same active tag, only one submission can advance the game. Once an admin approves the winner, every other pending submission for that same tag is automatically marked `superseded` instead of remaining permanently pending.

## Approval behavior

The approval transaction:

1. Locks the active tag.
2. Locks all pending submissions associated with that tag in a stable order.
3. Approves the selected submission and creates the next active tag.
4. Marks the other pending submissions as `superseded`.
5. Records the reviewer, review time, and the system note `Another submission for this tag was approved first.`
6. Detaches the superseded submissions' private storage paths and returns those paths to the server.

After the transaction commits, the server deletes the winner's old private files and the superseded submissions' private files. Storage deletion is best effort: a cleanup failure is logged, but it does not roll back a game-state transition that already committed.

## User and admin visibility

- Admins can filter and review superseded submissions separately from pending, approved, and rejected submissions.
- Superseded photos are no longer available after cleanup.
- Riders checking a reference code see that another rider's submission was approved first, rather than seeing an indefinitely pending result.

## Deployment order

Apply `20260617190000_supersede_competing_submissions.sql` before deploying application code that recognizes the new status.
