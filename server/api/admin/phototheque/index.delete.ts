import { requireAdmin } from '../../../utils/adminAuth'
import { oublierLegende } from '../../../utils/phototheque'

/** Oublie la légende saisie : le fichier reste, la légende du code reprend. */
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { src } = await readBody<{ src?: string }>(event)
  if (!src) throw createError({ statusCode: 400, statusMessage: "Chemin de l'image manquant." })
  return await oublierLegende(src)
})
