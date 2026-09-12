import { requireAdmin } from '../../../utils/adminAuth'
import { creerEvenement, type EvenementInput } from '../../../utils/evenements'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<EvenementInput>(event)
  if (!body?.slug?.trim() || !body?.titre?.trim() || !body?.date) {
    throw createError({ statusCode: 400, statusMessage: 'slug, titre et date sont obligatoires.' })
  }
  return await creerEvenement(body)
})
