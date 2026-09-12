import { requireAdmin } from '../../../utils/adminAuth'
import { modifierEvenement, type EvenementInput } from '../../../utils/evenements'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Identifiant manquant.' })
  const body = await readBody<EvenementInput>(event)
  return await modifierEvenement(id, body)
})
