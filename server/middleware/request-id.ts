import { ensureEventRequestId } from '../utils/requestId'

export default defineEventHandler((event) => {
  ensureEventRequestId(event)
})
