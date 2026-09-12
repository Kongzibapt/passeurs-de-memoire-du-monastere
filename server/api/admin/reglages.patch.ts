import { requireAdmin } from '../../utils/adminAuth'
import { ecrireReglage, lireReglagesPublics, REGLAGES_PUBLICS, type CleReglage } from '../../utils/reglages'

/** Met à jour un ou plusieurs réglages de la liste blanche. */
export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<Partial<Record<CleReglage, string>>>(event)

  for (const [cle, valeur] of Object.entries(body ?? {})) {
    if (!(cle in REGLAGES_PUBLICS)) {
      throw createError({ statusCode: 400, statusMessage: `Reglage inconnu : ${cle}` })
    }
    await ecrireReglage(cle as CleReglage, String(valeur ?? ''))
  }

  return await lireReglagesPublics()
})
