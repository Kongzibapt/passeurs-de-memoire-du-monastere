import { lireReglagesPublics } from '../utils/reglages'

/**
 * Réglages publics du site. Route non authentifiée : elle ne rend que les clés
 * de la liste blanche, jamais le contenu brut de la table.
 */
export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300')
  return await lireReglagesPublics()
})
