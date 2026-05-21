export type DataSourceStatusApiResponse = {
  tagDataSource: 'mock' | 'supabase'
  supabase: {
    hasUrl: boolean
    hasServiceRoleKey: boolean
    storageBucket: string
  }
}

export const useSystemApi = () => {
  const fetchDataSourceStatus = async () => {
    return await $fetch<DataSourceStatusApiResponse>(
      '/api/system/data-source'
    )
  }

  return {
    fetchDataSourceStatus
  }
}