import { derniereModification } from '../../utils/evenements'

/**
 * Source dynamique du sitemap.
 *
 * Le module découvre seul les pages, mais il leur donne à toutes le même poids.
 * On déclare donc ici la hiérarchie réelle du site — l'accueil d'abord, les
 * actualités ensuite, les pages légales loin derrière — et, quand la base sait
 * le dire, la date de dernière modification du contenu éditorial.
 */
export default defineEventHandler(async () => {
  // `lastmod` n'est posée que si elle est vraie : voir `derniereModification`.
  const lastmod = (await derniereModification()) ?? undefined

  return [
    { loc: '/', changefreq: 'monthly', priority: 1.0, lastmod },
    { loc: '/actualites', changefreq: 'weekly', priority: 0.8, lastmod },
    { loc: '/mentions-legales', changefreq: 'yearly', priority: 0.2 },
    { loc: '/confidentialite', changefreq: 'yearly', priority: 0.2 },
  ]
})
