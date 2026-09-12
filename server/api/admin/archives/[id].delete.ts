import { requireAdmin } from '../../../utils/adminAuth'
import { supprimerArchive } from '../../../utils/archives'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Identifiant manquant.' })
  if (id.startsWith('seed:')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Document defini dans le code : il ne peut pas etre supprime ici.',
    })
  }
  await supprimerArchive(id)
  return { ok: true }
})
