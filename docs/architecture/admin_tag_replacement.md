# Admin current-tag replacement

Authenticated administrators can replace the active Bike Tag from the submission-review page when a tag is unavailable, incorrect, or needs to be removed from play.

## Safety behavior

- The admin must enter a complete replacement tag and type `REPLACE CURRENT TAG`.
- The browser shows a final confirmation including the number of affected pending submissions.
- One database transaction locks the current tag and its pending submissions, marks the old tag `replaced`, supersedes pending submissions, and inserts the new active tag.
- The existing unique `one_active_tag` index continues to guarantee that only one tag is active.
- Replaced tags stay in the database for history and audit purposes but are excluded from public tag routes and found-tag lists.
- Pending submission photo references are returned by the transaction and cleaned up after commit. Cleanup failures are logged without rolling back an already-committed replacement.
- The action is recorded in the admin audit trail as an opening-tag creation with `replacement: true` metadata, including the old tag ID, new tag ID, and superseded submission count.

## Submission status

Affected pending submissions use the existing `superseded` status and the reason:

> The current tag was replaced by an administrator.

Approved, rejected, archived, and previously superseded submissions are unchanged.
