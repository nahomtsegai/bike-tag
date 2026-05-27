type AdminPaginationState = {
  limit: number
  offset: number
  count: number
  hasMore: boolean
}

type CreateDefaultAdminPaginationOptions = {
  limit: number
  offset: number
}

type GetAdminPaginationOffsetOptions = {
  currentOffset: number
  limit: number
}

export const createDefaultAdminPagination = ({
  limit,
  offset
}: CreateDefaultAdminPaginationOptions): AdminPaginationState => {
  return {
    limit,
    offset,
    count: 0,
    hasMore: false
  }
}

export const getPreviousAdminPaginationOffset = ({
  currentOffset,
  limit
}: GetAdminPaginationOffsetOptions) => {
  return Math.max(0, currentOffset - limit)
}

export const getNextAdminPaginationOffset = ({
  currentOffset,
  limit
}: GetAdminPaginationOffsetOptions) => {
  return currentOffset + limit
}