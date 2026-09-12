/**
 * Garde d'accès du back-office. Appliquée via definePageMeta({ middleware: 'admin' })
 * sur toutes les pages /admin/*. La page /admin elle-même gère l'affichage
 * connexion / tableau de bord ; les sous-pages renvoient vers /admin tant que
 * la session n'est pas valide.
 *
 * useRequestFetch() transmet les cookies pendant le rendu serveur — sans quoi
 * la session ne serait pas vue au premier rendu, et toute visite directe d'une
 * sous-page rebondirait vers l'écran de connexion.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const fetchAvecCookies = useRequestFetch()
  const { authed } = await fetchAvecCookies<{ authed: boolean }>('/api/admin/session')
  if (!authed && to.path !== '/admin') {
    return navigateTo('/admin')
  }
})
