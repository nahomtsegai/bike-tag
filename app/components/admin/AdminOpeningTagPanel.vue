<template>
  <AdminTagManagementPanel
    v-bind="props"
    @create="emit('create')"
    @clear="emit('clear')"
    @update:opening-tag-title="emit('update:openingTagTitle', $event)"
    @update:opening-tag-clue="emit('update:openingTagClue', $event)"
    @update:opening-tag-image-url="emit('update:openingTagImageUrl', $event)"
    @update:opening-tag-hidden-location-map-url="emit('update:openingTagHiddenLocationMapUrl', $event)"
  />
</template>

<script setup lang="ts">
const props = defineProps<{
  openingTagTitle: string
  openingTagClue: string
  openingTagImageUrl: string
  openingTagHiddenLocationMapUrl: string
  openingTagValidationMessage: string
  canCreateOpeningTag: boolean
  createOpeningTagButtonLabel: string
  isCreatingOpeningTag: boolean
}>()

const emit = defineEmits<{
  create: []
  clear: []
  'update:openingTagTitle': [string]
  'update:openingTagClue': [string]
  'update:openingTagImageUrl': [string]
  'update:openingTagHiddenLocationMapUrl': [string]
}>()
</script>
