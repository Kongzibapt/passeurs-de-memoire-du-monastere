import { requireAdmin } from '../../../utils/adminAuth'
import { modifierArchive, type ArchiveInput } from '../../../utils/archives'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Identifiant manquant.' })
  return await modifierArchive(id, await readBody<ArchiveInput>(event))
})
