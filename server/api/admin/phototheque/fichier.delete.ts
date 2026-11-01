import { requireAdmin } from '../../../utils/adminAuth'
import { supprimerDepot } from '../../../utils/phototheque'

/** Supprime une photo (fichier + ligne), sauf si une page l'affiche encore. */
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const { src } = await readBody<{ src?: string }>(event)
  if (!src) throw createError({ statusCode: 400, statusMessage: "Adresse de la photo manquante." })
  await supprimerDepot(src)
  return { ok: true }
})
