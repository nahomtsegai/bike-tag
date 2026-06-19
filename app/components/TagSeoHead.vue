<script setup lang="ts">
import { computed } from 'vue'

import {
  useTagApi,
  type TagDetailApiResponse
} from '../composables/useTagApi'
import { createTagSeoMetadata } from '../utils/tagSeo'
import {
  createTagStructuredData,
  serializeTagStructuredData
} from '../utils/tagStructuredData'

const route = useRoute()
const runtimeConfig = useRuntimeConfig()
const { fetchTagById } = useTagApi()

const tagId = computed(() => String(route.params.id ?? ''))
const siteUrl = computed(() => {
  return String(runtimeConfig.public.siteUrl || 'https://www.louisvillebiketag.com')
})

const { data: tag, error } = await useAsyncData<TagDetailApiResponse>(
  () => `tag-detail-${tagId.value}`,
  () => fetchTagById(tagId.value),
  {
    watch: [tagId]
  }
)

const resolvedTag = computed(() => {
  if (error.value) {
    return null
  }

  return tag.value ?? null
})

const metadata = computed(() => {
  return createTagSeoMetadata(resolvedTag.value, siteUrl.value, tagId.value)
})

const structuredData = computed(() => {
  if (!resolvedTag.value) {
    return null
  }

  return createTagStructuredData(resolvedTag.value, metadata.value)
})

useSeoMeta({
  title: () => metadata.value.title,
  description: () => metadata.value.description,
  ogTitle: () => metadata.value.title,
  ogDescription: () => metadata.value.description,
  ogType: 'article',
  ogUrl: () => metadata.value.canonicalUrl,
  ogImage: () => metadata.value.imageUrl,
  ogImageAlt: () => metadata.value.imageAlt,
  twitterCard: 'summary_large_image',
  twitterTitle: () => metadata.value.title,
  twitterDescription: () => metadata.value.description,
  twitterImage: () => metadata.value.imageUrl,
  twitterImageAlt: () => metadata.value.imageAlt,
  robots: () => metadata.value.robots
})

useHead(() => ({
  link: [
    {
      key: 'canonical',
      rel: 'canonical',
      href: metadata.value.canonicalUrl
    }
  ],
  script: structuredData.value
    ? [
        {
          key: 'tag-structured-data',
          type: 'application/ld+json',
          'data-seo': 'tag',
          textContent: serializeTagStructuredData(structuredData.value)
        }
      ]
    : []
}))
</script>
