<template>
  <template v-if="submission">
    <AppStateMessage v-if="isLoadingSelectedSubmission" variant="loading"
      message="Refreshing selected submission details..." />

    <section class="submission-review-summary" aria-labelledby="submissionReviewSummaryTitle">
      <div class="submission-review-summary-header">
        <div>
          <p class="eyebrow">Review summary</p>
          <h3 id="submissionReviewSummaryTitle">
            {{ submission.nextTitle }}
          </h3>
        </div>

        <div class="status-row compact-status-row">
          <span class="status-pill" :class="getStatusBadgeClass(submission.status)">
            {{ formatStatus(submission.status) }}
          </span>

          <span v-if="submission.archivedAt" class="status-pill archived-status-pill">
            Archived
          </span>
        </div>
      </div>

      <dl class="summary-detail-grid">
        <div>
          <dt>Rider</dt>
          <dd>{{ submission.riderName }}</dd>
        </div>

        <div>
          <dt>Submitted</dt>
          <dd>{{ formatAdminDate(submission.createdAt) }}</dd>
        </div>

        <div>
          <dt>Submission ID</dt>
          <dd>{{ submission.id }}</dd>
        </div>

        <div>
          <dt>Active tag ID</dt>
          <dd>{{ submission.activeTagId }}</dd>
        </div>
      </dl>
    </section>

    <dl class="detail-list">
      <div>
        <dt>Next clue</dt>
        <dd>{{ submission.nextClue }}</dd>
      </div>

      <div>
        <dt>Rejection reason</dt>
        <dd>{{ submission.rejectionReason || 'None' }}</dd>
      </div>

      <div>
        <dt>Reviewed by</dt>
        <dd>{{ submission.reviewedBy || 'Not reviewed' }}</dd>
      </div>

      <div>
        <dt>Reviewed at</dt>
        <dd>{{ formatAdminDate(submission.reviewedAt) }}</dd>
      </div>

      <div>
        <dt>Archived at</dt>
        <dd>{{ formatAdminDate(submission.archivedAt) }}</dd>
      </div>
    </dl>

    <dl class="detail-list">
      <div>
        <dt>Submission ID</dt>
        <dd>{{ submission.id }}</dd>
      </div>

      <div>
        <dt>Active tag ID</dt>
        <dd>{{ submission.activeTagId }}</dd>
      </div>

      <div>
        <dt>Rider</dt>
        <dd>{{ submission.riderName }}</dd>
      </div>

      <div>
        <dt>Next title</dt>
        <dd>{{ submission.nextTitle }}</dd>
      </div>

      <div>
        <dt>Next clue</dt>
        <dd>{{ submission.nextClue }}</dd>
      </div>

      <div>
        <dt>Rejection reason</dt>
        <dd>{{ submission.rejectionReason || 'None' }}</dd>
      </div>

      <div>
        <dt>Reviewed by</dt>
        <dd>{{ submission.reviewedBy || 'Not reviewed' }}</dd>
      </div>

      <div>
        <dt>Reviewed at</dt>
        <dd>{{ formatAdminDate(submission.reviewedAt) }}</dd>
      </div>

      <div>
        <dt>Archived at</dt>
        <dd>{{ formatAdminDate(submission.archivedAt) }}</dd>
      </div>
    </dl>

    <section class="captured-location-card" aria-labelledby="capturedFoundLocationTitle">
      <div class="captured-location-header">
        <div>
          <p class="eyebrow">Captured location</p>
          <h3 id="capturedFoundLocationTitle">
            Submitted match location
          </h3>
        </div>
      </div>

      <p class="captured-location-copy">
        This location was captured from the rider&apos;s device when they
        submitted the found tag.
      </p>

      <dl class="captured-location-list">
        <div>
          <dt>Latitude</dt>
          <dd>{{ formatCoordinate(submission.foundLatitude) }}</dd>
        </div>

        <div>
          <dt>Longitude</dt>
          <dd>{{ formatCoordinate(submission.foundLongitude) }}</dd>
        </div>

        <div>
          <dt>Accuracy</dt>
          <dd>
            {{ formatLocationAccuracy(submission.foundLocationAccuracyMeters) }}
          </dd>
        </div>

        <div>
          <dt>Captured at</dt>
          <dd>
            {{ formatLocationCapturedAt(submission.foundLocationCapturedAt) }}
          </dd>
        </div>
      </dl>

      <a :href="submission.foundLocationMapUrl" target="_blank" rel="noopener noreferrer"
        class="captured-location-link">
        Open submitted match location
      </a>
    </section>

    <section class="captured-location-card" aria-labelledby="capturedNextHiddenLocationTitle">
      <div class="captured-location-header">
        <div>
          <p class="eyebrow">Captured location</p>
          <h3 id="capturedNextHiddenLocationTitle">
            Submitted next tag location
          </h3>
        </div>
      </div>

      <p class="captured-location-copy">
        This location was captured from the rider&apos;s device when they
        created the next mystery spot. Admins can use it to verify the hidden
        next tag location before approval.
      </p>

      <dl class="captured-location-list">
        <div>
          <dt>Latitude</dt>
          <dd>{{ formatCoordinate(submission.nextHiddenLatitude) }}</dd>
        </div>

        <div>
          <dt>Longitude</dt>
          <dd>{{ formatCoordinate(submission.nextHiddenLongitude) }}</dd>
        </div>

        <div>
          <dt>Accuracy</dt>
          <dd>
            {{
              formatLocationAccuracy(
                submission.nextHiddenLocationAccuracyMeters
              )
            }}
          </dd>
        </div>

        <div>
          <dt>Captured at</dt>
          <dd>
            {{
              formatLocationCapturedAt(
                submission.nextHiddenLocationCapturedAt
              )
            }}
          </dd>
        </div>
      </dl>

      <a :href="submission.nextHiddenLocationMapUrl" target="_blank" rel="noopener noreferrer"
        class="captured-location-link">
        Open submitted next location
      </a>
    </section>

    <div class="image-preview-grid">
      <figure class="image-preview-card">
        <a v-if="!imageHasFailed(submission.id, 'matchPhoto')" :href="submission.matchPhotoUrl" target="_blank"
          rel="noopener noreferrer" aria-label="Open match photo in a new tab">
          <img :src="submission.matchPhotoUrl" alt="Submitted match photo" loading="lazy"
            @error="handleImageError(submission.id, 'matchPhoto')">
        </a>

        <div v-else class="image-fallback">
          <p>Image could not be loaded.</p>
          <p>Use the link below to open the photo.</p>
        </div>

        <figcaption>Submitted match photo</figcaption>
      </figure>

      <figure class="image-preview-card">
        <a v-if="!imageHasFailed(submission.id, 'nextTagPhoto')" :href="submission.nextTagPhotoUrl" target="_blank"
          rel="noopener noreferrer" aria-label="Open next tag photo in a new tab">
          <img :src="submission.nextTagPhotoUrl" alt="Submitted next tag photo" loading="lazy"
            @error="handleImageError(submission.id, 'nextTagPhoto')">
        </a>

        <div v-else class="image-fallback">
          <p>Image could not be loaded.</p>
          <p>Use the link below to open the photo.</p>
        </div>

        <figcaption>Submitted next tag photo</figcaption>
      </figure>
    </div>

    <div class="link-grid">
      <a :href="submission.foundLocationMapUrl" target="_blank" rel="noopener noreferrer">
        Found location
      </a>

      <a :href="submission.nextHiddenLocationMapUrl" target="_blank" rel="noopener noreferrer">
        Hidden next location
      </a>

      <a :href="submission.matchPhotoUrl" target="_blank" rel="noopener noreferrer">
        Match photo
      </a>

      <a :href="submission.nextTagPhotoUrl" target="_blank" rel="noopener noreferrer">
        Next tag photo
      </a>
    </div>
  </template>
</template>

<script setup lang="ts">
import type { AdminSubmission } from '~/types/adminSubmissions'

type AdminSubmissionStatus = AdminSubmission['status']
type AdminSubmissionImageType = 'matchPhoto' | 'nextTagPhoto'

defineProps<{
  submission: AdminSubmission | null
  isLoadingSelectedSubmission: boolean
  formatAdminDate: (value: string | null) => string
  formatStatus: (status: AdminSubmissionStatus) => string
  getStatusBadgeClass: (
    status: AdminSubmissionStatus
  ) => Record<string, boolean>
  formatCoordinate: (value: number | null) => string
  formatLocationAccuracy: (value: number | null) => string
  formatLocationCapturedAt: (value: string | null) => string
  imageHasFailed: (
    submissionId: string,
    imageType: AdminSubmissionImageType
  ) => boolean
  handleImageError: (
    submissionId: string,
    imageType: AdminSubmissionImageType
  ) => void
}>()
</script>

<style scoped>
.status-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: space-between;
}

.compact-status-row {
  justify-content: flex-end;
}

.detail-list {
  display: grid;
  gap: 0.9rem;
  margin: 0;
}

.detail-list div {
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
  padding-bottom: 0.9rem;
}

.detail-list dt {
  color: #64748b;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.detail-list dd {
  color: #0f172a;
  margin: 0.25rem 0 0;
  overflow-wrap: anywhere;
}

.submission-review-summary {
  background:
    radial-gradient(circle at top right,
      rgba(20, 184, 166, 0.12),
      transparent 16rem),
    #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 1rem;
  display: grid;
  gap: 1rem;
  padding: 1rem;
}

.submission-review-summary-header {
  align-items: flex-start;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.submission-review-summary-header h3 {
  color: #0f172a;
  font-size: 1.25rem;
  font-weight: 800;
  line-height: 1.25;
  margin: 0.25rem 0 0;
  overflow-wrap: anywhere;
}

.summary-detail-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
}

.summary-detail-grid div {
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 0.85rem;
  padding: 0.8rem;
}

.summary-detail-grid dt {
  color: #64748b;
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.summary-detail-grid dd {
  color: #0f172a;
  font-size: 0.95rem;
  font-weight: 650;
  line-height: 1.35;
  margin: 0.25rem 0 0;
  overflow-wrap: anywhere;
}

.captured-location-card {
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 1rem;
  display: grid;
  gap: 0.85rem;
  padding: 1rem;
}

.captured-location-header {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.captured-location-header h3 {
  color: #0f172a;
  font-size: 1.05rem;
  margin: 0.25rem 0 0;
}

.captured-location-copy {
  color: #475569;
  line-height: 1.55;
  margin: 0;
}

.captured-location-list {
  display: grid;
  gap: 0.75rem;
  margin: 0;
}

.captured-location-list div {
  border-bottom: 1px solid rgba(148, 163, 184, 0.25);
  display: grid;
  gap: 0.25rem;
  padding-bottom: 0.75rem;
}

.captured-location-list div:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.captured-location-list dt {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.captured-location-list dd {
  color: #0f172a;
  margin: 0;
  overflow-wrap: anywhere;
}

.captured-location-link {
  background: #ecfeff;
  border: 1px solid rgba(20, 184, 166, 0.28);
  border-radius: 999px;
  color: #0f766e;
  font-weight: 800;
  padding: 0.8rem 1rem;
  text-align: center;
  text-decoration: none;
}

.captured-location-link:hover {
  background: #ccfbf1;
}

.image-preview-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.image-preview-card {
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 1rem;
  display: grid;
  gap: 0.75rem;
  margin: 0;
  overflow: hidden;
  padding: 0.75rem;
}

.image-preview-card a {
  border-radius: 0.75rem;
  display: block;
  overflow: hidden;
}

.image-preview-card a:focus {
  outline: 3px solid rgba(20, 184, 166, 0.28);
  outline-offset: 3px;
}

.image-preview-card a:hover img {
  transform: scale(1.02);
}

.image-preview-card img {
  aspect-ratio: 4 / 3;
  border-radius: 0.75rem;
  object-fit: cover;
  transition: transform 160ms ease;
  width: 100%;
}

.image-preview-card figcaption {
  color: #334155;
  font-size: 0.9rem;
  font-weight: 800;
}

.image-fallback {
  align-content: center;
  aspect-ratio: 4 / 3;
  background: #f1f5f9;
  border: 1px dashed rgba(100, 116, 139, 0.42);
  border-radius: 0.75rem;
  color: #475569;
  display: grid;
  justify-items: center;
  padding: 1rem;
  text-align: center;
}

.image-fallback p {
  margin: 0;
}

.image-fallback p:first-child {
  color: #0f172a;
  font-weight: 900;
}

.link-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.link-grid a {
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.35);
  border-radius: 999px;
  color: #0f766e;
  font-weight: 800;
  padding: 0.8rem 1rem;
  text-align: center;
  text-decoration: none;
}

.link-grid a:hover {
  background: #ecfeff;
}

@media (max-width: 860px) {
  .status-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.5rem;
  }

  .image-preview-grid,
  .link-grid {
    grid-template-columns: 1fr;
  }

  .submission-review-summary-header {
    display: grid;
  }

  .compact-status-row {
    justify-content: flex-start;
  }

  .summary-detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
