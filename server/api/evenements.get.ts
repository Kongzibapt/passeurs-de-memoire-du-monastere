import { getEvenementsPublics } from '../utils/evenements'

/**
 * Événements affichés par le site (accueil et page Actualités).
 *
 * Le tri « à venir / souvenir » se fait à l'affichage, à partir de la date du
 * jour : la réponse est donc la même pour tout le monde et peut être mise en
 * cache. Une minute suffit pour qu'une correction faite dans le back-office se
 * voie presque tout de suite, sans rappeler Supabase à chaque visite.
 */
export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300')
  return await getEvenementsPublics()
})
