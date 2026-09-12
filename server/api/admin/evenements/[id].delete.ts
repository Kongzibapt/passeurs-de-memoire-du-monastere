import { requireAdmin } from '../../../utils/adminAuth'
import { supprimerEvenement } from '../../../utils/evenements'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Identifiant manquant.' })
  // Les événements de la maquette vivent dans le code : rien à supprimer en base.
  if (id.startsWith('seed:')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Evenement defini dans le code : cree une version modifiee au meme slug.',
    })
  }
  await supprimerEvenement(id)
  return { ok: true }
})
