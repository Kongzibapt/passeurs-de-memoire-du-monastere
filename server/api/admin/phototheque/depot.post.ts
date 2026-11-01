import { requireAdmin } from '../../../utils/adminAuth'
import { deposerImage, OCTETS_MAX } from '../../../utils/phototheque'

/**
 * Dépôt d'une photo : le corps de la requête EST le fichier, les métadonnées
 * voyagent dans la query (`nom`, `largeur`, `hauteur`). Pas de multipart — le
 * navigateur a déjà réduit l'image, il n'y a qu'un seul octet-stream à lire.
 */
export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const type = (getRequestHeader(event, 'content-type') ?? '').split(';')[0]!.trim()
  const declare = Number(getRequestHeader(event, 'content-length') ?? 0)
  if (declare > OCTETS_MAX) {
    throw createError({ statusCode: 413, statusMessage: 'Photo trop lourde (4 Mo au maximum).' })
  }

  const octets = await readRawBody(event, false)
  if (!octets) throw createError({ statusCode: 400, statusMessage: 'Fichier manquant.' })

  const q = getQuery(event)
  return await deposerImage({
    octets,
    type,
    nom: String(q.nom ?? 'photo'),
    largeur: Number(q.largeur),
    hauteur: Number(q.hauteur),
  })
})
