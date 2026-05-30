<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { FoundTagApiResponse } from '../composables/useTagApi'

type LeafletModule = typeof import('leaflet')
type LeafletMap = import('leaflet').Map
type LeafletLayerGroup = import('leaflet').LayerGroup

type MappableFoundTag = FoundTagApiResponse & {
  foundLatitude: number
  foundLongitude: number
}

const props = defineProps<{
  tags: FoundTagApiResponse[]
}>()

const mapElement = ref<HTMLElement | null>(null)
let leaflet: LeafletModule | null = null
let map: LeafletMap | null = null
let markerLayer: LeafletLayerGroup | null = null

const mappableTags = computed<MappableFoundTag[]>(() => {
  return props.tags.filter((tag): tag is MappableFoundTag => {
    return typeof tag.foundLatitude === 'number' &&
      typeof tag.foundLongitude === 'number'
  })
})

const hasMappableTags = computed(() => {
  return mappableTags.value.length > 0
})

const escapeHtml = (value: string) => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

const createGoogleMapsUrl = (tag: MappableFoundTag) => {
  return `https://www.google.com/maps?q=${tag.foundLatitude},${tag.foundLongitude}`
}

const createPopupHtml = (tag: MappableFoundTag) => {
  const title = escapeHtml(tag.title)
  const foundBy = escapeHtml(tag.foundBy)
  const mapsUrl = createGoogleMapsUrl(tag)

  return `
    <strong>${title}</strong>
    <span>Found by ${foundBy}</span>
    <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer">
      Open in Maps
    </a>
  `
}

const fitMapToTags = () => {
  if (!leaflet || !map || mappableTags.value.length === 0) {
    return
  }

  const coordinates = mappableTags.value.map((tag) => {
    return [tag.foundLatitude, tag.foundLongitude] as [number, number]
  })

  const firstCoordinate = coordinates[0]

  if (coordinates.length === 1 && firstCoordinate) {
    map.setView(firstCoordinate, 14)
    return
  }

  map.fitBounds(leaflet.latLngBounds(coordinates), {
    padding: [32, 32]
  })
}

const renderMarkers = () => {
  if (!leaflet || !map || !markerLayer) {
    return
  }

  const leafletModule = leaflet
  const activeMarkerLayer = markerLayer

  activeMarkerLayer.clearLayers()

  mappableTags.value.forEach((tag) => {
    const marker = leafletModule.circleMarker(
      [tag.foundLatitude, tag.foundLongitude],
      {
        radius: 9,
        weight: 3,
        opacity: 1,
        fillOpacity: 0.82
      }
    )

    marker.bindPopup(createPopupHtml(tag), {
      className: 'foundTagMapPopup'
    })

    marker.addTo(activeMarkerLayer)
  })

  fitMapToTags()
}

const initializeMap = async () => {
  if (!mapElement.value || map || !hasMappableTags.value) {
    return
  }

  const leafletModule = await import('leaflet')
  leaflet = leafletModule

  await import('leaflet/dist/leaflet.css')

  await nextTick()

  if (!mapElement.value) {
    return
  }

  map = leafletModule.map(mapElement.value, {
    scrollWheelZoom: false
  })

  leafletModule
    .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    })
    .addTo(map)

  markerLayer = leafletModule.layerGroup().addTo(map)

  renderMarkers()
}

watch(mappableTags, async () => {
  if (!hasMappableTags.value) {
    return
  }

  if (!map) {
    await initializeMap()
    return
  }

  renderMarkers()
})

onMounted(() => {
  void initializeMap()
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
  markerLayer = null
  leaflet = null
})
</script>

<template>
  <section
    v-if="hasMappableTags"
    class="foundTagsMapCard"
    aria-labelledby="foundTagsMapTitle"
  >
    <div class="foundTagsMapHeader">
      <div>
        <p class="eyebrow">Interactive map</p>

        <h2 id="foundTagsMapTitle">
          Found tag pins
        </h2>
      </div>

      <p>
        {{ mappableTags.length }} captured
        {{ mappableTags.length === 1 ? 'location' : 'locations' }}
      </p>
    </div>

    <div
      ref="mapElement"
      class="foundTagsMap"
      aria-label="Interactive map of found tag locations"
    />

    <p class="foundTagsMapHint">
      Tap or click a pin to see the tag title, rider, and map link.
    </p>
  </section>
</template>

<style scoped>
.foundTagsMapCard {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
  overflow: hidden;
  padding: 1rem;
}

.foundTagsMapHeader {
  display: grid;
  gap: 0.75rem;
}

.foundTagsMapHeader h2 {
  color: var(--color-text);
  font-size: clamp(1.5rem, 6vw, 2.4rem);
  line-height: 1.05;
  margin: 0.25rem 0 0;
}

.foundTagsMapHeader p {
  color: var(--color-muted);
  font-weight: 800;
  line-height: 1.5;
  margin: 0;
}

.foundTagsMap {
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  min-height: 22rem;
  overflow: hidden;
  width: 100%;
}

.foundTagsMapHint {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

:global(.foundTagMapPopup .leaflet-popup-content) {
  display: grid;
  gap: 0.35rem;
  margin: 0.85rem;
}

:global(.foundTagMapPopup strong) {
  color: #0f172a;
  font-size: 1rem;
}

:global(.foundTagMapPopup span) {
  color: #475569;
}

:global(.foundTagMapPopup a) {
  color: #0f766e;
  font-weight: 800;
}

@media (min-width: 760px) {
  .foundTagsMapCard {
    padding: 1.25rem;
  }

  .foundTagsMapHeader {
    align-items: center;
    display: flex;
    justify-content: space-between;
  }

  .foundTagsMap {
    min-height: 28rem;
  }
}
</style>