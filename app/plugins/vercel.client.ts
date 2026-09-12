import { injectAnalytics } from '@vercel/analytics/nuxt/runtime'
import { injectSpeedInsights } from '@vercel/speed-insights/nuxt/runtime'

/**
 * Vercel Analytics + Speed Insights, injectés à la main (plutôt que via leurs
 * modules Nuxt) pour pouvoir filtrer : aucun évènement n'est envoyé pour le
 * back-office privé `/admin`. Les allées et venues de l'association dans son
 * propre outil n'ont rien à faire dans la fréquentation du site public.
 */
export default defineNuxtPlugin(() => {
  const estAdmin = (s?: string) => {
    if (!s) return false
    try {
      // `s` peut être une URL absolue (Analytics) ou une route (Speed Insights).
      const chemin = s.startsWith('http') ? new URL(s).pathname : s
      return chemin === '/admin' || chemin.startsWith('/admin/')
    } catch {
      return s.includes('/admin')
    }
  }

  injectAnalytics({
    beforeSend: (event) => (estAdmin(event.url) ? null : event),
  })

  injectSpeedInsights({
    beforeSend: (event) => (estAdmin(event.route) || estAdmin(event.url) ? null : event),
  })
})
