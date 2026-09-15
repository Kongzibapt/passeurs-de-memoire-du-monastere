import { requireAdmin } from '../../../utils/adminAuth'
import { enregistrerLegende, type LegendeInput } from '../../../utils/phototheque'

/**
 * `src` voyage dans le corps, pas dans l'URL : un chemin d'image contient des
 * barres obliques, qu'un paramètre de route couperait en morceaux.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { src, ...legende } = await readBody<LegendeInput & { src?: string }>(event)
  if (!src) throw createError({ statusCode: 400, statusMessage: "Chemin de l'image manquant." })
  return await enregistrerLegende(src, legende)
})
