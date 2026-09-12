import { requireAdmin } from '../../../utils/adminAuth'
import { getEvenementsAdmin } from '../../../utils/evenements'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  return await getEvenementsAdmin()
})
