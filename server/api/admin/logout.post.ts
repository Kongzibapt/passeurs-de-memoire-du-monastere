import { clearAdminSession } from '../../utils/adminAuth'

export default defineEventHandler((event) => {
  clearAdminSession(event)
  return { ok: true }
})
