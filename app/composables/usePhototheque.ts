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

  /**
   * Dépose une photo : le navigateur la redresse et la réduit, puis l'envoie.
   *
   * Réduire ici n'est pas un confort : Vercel refuse les corps de requête au-delà
   * de 4,5 Mo, et une photo de téléphone en fait 5 à 10. Passer par un canvas
   * applique aussi l'orientation EXIF aux pixels eux-mêmes — IPX, qui réencode
   * les images du site, ne la lit pas, et une photo prise à la verticale
   * s'afficherait couchée.
   */
  async function deposer(fichier: File): Promise<Image> {
    const { blob, largeur, hauteur } = await preparer(fichier)
    const image = await $fetch<Image>('/api/admin/phototheque/depot', {
      method: 'POST',
      query: { nom: fichier.name, largeur, hauteur },
      headers: { 'Content-Type': blob.type },
      body: blob,
    })
    images.value = [image, ...images.value]
    return image
  }

  /** Supprime une photo déposée. Les images du dépôt ne se suppriment pas d'ici. */
  async function supprimer(src: string): Promise<void> {
    await $fetch('/api/admin/phototheque/fichier', { method: 'DELETE', body: { src } })
    images.value = images.value.filter((i) => i.src !== src)
  }

  return { images, chargement, charge, erreur, recharger, assurerCharge, enregistrer, deposer, supprimer }
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

/** Côté le plus long conservé : `@nuxt/image` ne sert rien de plus large que 2880 px. */
const COTE_MAX = 2400
const OCTETS_VISES = 3.5 * 1024 * 1024
const ACCEPTES = ['image/jpeg', 'image/png', 'image/webp']

/** Vrai si le fichier est une image que la photothèque sait recevoir. */
export function formatAccepte(f: File): boolean {
  return ACCEPTES.includes(f.type)
}

async function preparer(fichier: File): Promise<{ blob: Blob; largeur: number; hauteur: number }> {
  if (!formatAccepte(fichier)) {
    throw new Error(`« ${fichier.name} » : format non pris en charge (JPEG, PNG ou WebP).`)
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(fichier, { imageOrientation: 'from-image' })
  } catch {
    throw new Error(`« ${fichier.name} » : image illisible.`)
  }

  const echelle = Math.min(1, COTE_MAX / Math.max(bitmap.width, bitmap.height))
  const largeur = Math.round(bitmap.width * echelle)
  const hauteur = Math.round(bitmap.height * echelle)

  // Un PNG ou un WebP déjà léger part tel quel : le réencoder en JPEG ne ferait
  // que l'abîmer. Un JPEG, lui, repasse toujours par le canvas — c'est ce qui
  // applique son orientation EXIF aux pixels.
  if (echelle === 1 && fichier.size <= OCTETS_VISES && fichier.type !== 'image/jpeg') {
    bitmap.close()
    return { blob: fichier, largeur, hauteur }
  }

  const canvas = document.createElement('canvas')
  canvas.width = largeur
  canvas.height = hauteur
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, largeur, hauteur)
  bitmap.close()

  // JPEG partout : les cartes postales et photos d'événements n'ont pas besoin
  // de transparence, et c'est le format le plus léger à qualité égale ici.
  for (const qualite of [0.88, 0.8, 0.7, 0.6]) {
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/jpeg', qualite))
    if (blob && blob.size <= OCTETS_VISES) return { blob, largeur, hauteur }
  }
  throw new Error(`« ${fichier.name} » : trop lourde, même réduite.`)
}
