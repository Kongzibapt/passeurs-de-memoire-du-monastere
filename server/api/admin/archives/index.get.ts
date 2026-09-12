import { requireAdmin } from '../../../utils/adminAuth'
import { getArchives } from '../../../utils/archives'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  return await getArchives()
})
