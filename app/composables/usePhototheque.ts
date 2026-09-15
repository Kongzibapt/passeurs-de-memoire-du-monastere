import type { Image, LegendeImage } from '#shared/phototheque'

/**
 * Accès à la photothèque depuis le back-office.
 *
 * L'état est partagé : la page `/admin/phototheque` et le sélecteur
 * `AdminSelecteurPhoto` regardent le même cache, donc une légende corrigée sur
 * la page se retrouve aussitôt dans le sélecteur, sans recharger. Le
 * chargement n'a lieu qu'une fois — l'inventaire ne change qu'entre deux
 * déploiements.
 *
 * Le partage passe par `useState` et non par des `ref` au niveau du module :
 * sur le serveur, un module est chargé une fois pour toutes et ses variables
 * seraient communes à TOUTES les requêtes, donc à tous les visiteurs. `useState`
 * donne un état par requête côté serveur, et un seul côté navigateur.
 */
export function usePhototheque() {
  const images = useState<Image[]>('phototheque', () => [])
  const chargement = useState('phototheque-chargement', () => false)
  const charge = useState('phototheque-charge', () => false)
  const erreur = useState('phototheque-erreur', () => '')

  // Pendant le rendu serveur, `$fetch` n'emporte pas le cookie de session : la
  // requête reviendrait en 401 alors que le navigateur, lui, a le droit de
  // lire, et les deux rendus ne diraient pas la même chose. `useRequestFetch()`
  // transmet les en-têtes de la requête en cours ; côté navigateur, c'est
  // `$fetch`.
  const demander = useRequestFetch()

  async function recharger() {
    chargement.value = true
    erreur.value = ''
    try {
      images.value = await demander<Image[]>('/api/admin/phototheque')
      charge.value = true
    } catch (e: unknown) {
      erreur.value = messageDe(e) || 'Photothèque indisponible pour le moment.'
    } finally {
      chargement.value = false
    }
  }

  async function assurerCharge() {
    if (!charge.value && !chargement.value) await recharger()
  }

  /** Enregistre la légende d'une image et met le cache à jour. */
  async function enregistrer(src: string, legende: Partial<LegendeImage>): Promise<Image> {
    const image = await $fetch<Image>('/api/admin/phototheque', {
      method: 'PATCH',
      body: { src, ...legende },
    })
    images.value = images.value.map((i) => (i.src === src ? image : i))
    return image
  }

  /** Oublie la légende saisie : celle du code reprend la main. */
  async function reinitialiser(src: string): Promise<Image> {
    const image = await $fetch<Image>('/api/admin/phototheque', { method: 'DELETE', body: { src } })
    images.value = images.value.map((i) => (i.src === src ? image : i))
    return image
  }

  return { images, chargement, charge, erreur, recharger, assurerCharge, enregistrer, reinitialiser }
}

/**
 * Le message du serveur quand il est parlant (« Table absente… », « Base
 * Supabase non configuree »), rien sinon : une erreur réseau brute — « fetch
 * failed » — n'apprend rien à qui tient le back-office.
 */
function messageDe(e: unknown): string {
  const err = e as { data?: { statusMessage?: string }; statusMessage?: string }
  const msg = err?.data?.statusMessage || err?.statusMessage || ''
  return /supabase|table|autoris|configur/i.test(msg) ? msg : ''
}
