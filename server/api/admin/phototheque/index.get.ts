import { requireAdmin } from '../../../utils/adminAuth'
import { getPhototheque } from '../../../utils/phototheque'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  return await getPhototheque()
})
