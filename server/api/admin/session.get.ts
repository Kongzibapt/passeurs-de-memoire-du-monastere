import { hasValidAdminSession } from '../../utils/adminAuth'

/** État de session du back-office (lu par le middleware et la page /admin). */
export default defineEventHandler((event) => {
  return { authed: hasValidAdminSession(event) }
})
