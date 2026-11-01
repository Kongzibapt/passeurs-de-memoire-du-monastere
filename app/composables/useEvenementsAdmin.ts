import type { Evenement, PhotoSouvenir } from '#shared/evenements'
import type { Image } from '#shared/phototheque'

/**
 * Ce que les deux assistants du back-office (annonce et souvenir) partagent :
 * les longueurs conseillées, la fabrication de l'identifiant, l'envoi.
 *
 * Les longueurs viennent des événements d'origine, qui tiennent dans la mise en
 * page : en deçà le texte paraît vide, au-delà il déborde ou se lit mal. `limite`
 * est le plafond dur du champ ; `min` et `max` bornent la zone conseillée.
 */
export interface Longueur {
  min: number
  max: number
  limite: number
}

export const LONGUEURS = {
  titre: { min: 15, max: 60, limite: 90 },
  cadre: { min: 5, max: 40, limite: 60 },
  resume: { min: 80, max: 220, limite: 320 },
  description: { min: 150, max: 600, limite: 1000 },
  etape: { min: 5, max: 70, limite: 120 },
  recit: { min: 100, max: 450, limite: 800 },
  question: { min: 30, max: 100, limite: 160 },
  appel: { min: 10, max: 45, limite: 70 },
  legende: { min: 8, max: 50, limite: 80 },
} satisfies Record<string, Longueur>

export const CREDIT_PAR_DEFAUT = "Photo de l'association"

/** Une photo de la photothèque, prête à entrer dans un souvenir. */
export function versPhotoSouvenir(image: Image, legende = image.titre): PhotoSouvenir {
  return {
    src: image.src,
    alt: image.alt,
    titre: legende,
    credit: image.credit || CREDIT_PAR_DEFAUT,
  }
}

/** Événement vierge, daté du jour : le point de départ de l'assistant d'annonce. */
export function evenementVide(date: string): Evenement {
  return {
    id: '',
    slug: '',
    date,
    cadre: '',
    titre: '',
    resume: '',
    description: '',
    programme: [],
    source: 'db',
  }
}

/** Copie profonde : tant qu'on n'a pas publié, la liste ne doit pas bouger. */
export function copier(e: Evenement): Evenement {
  return JSON.parse(JSON.stringify(e))
}

/**
 * Identifiant d'adresse, tiré du titre et de l'année : « Nuit des églises »
 * le 3 juillet 2026 → `nuit-des-eglises-2026`. Personne n'a à l'inventer ; s'il
 * est déjà pris, on lui ajoute un numéro.
 */
export function slugPour(titre: string, date: string, pris: string[]): string {
  const base =
    titre
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
      .replace(/-+$/, '') || 'evenement'
  const annee = date.slice(0, 4)
  const racine = base.endsWith(annee) ? base : `${base}-${annee}`
  let slug = racine
  for (let n = 2; pris.includes(slug); n++) slug = `${racine}-${n}`
  return slug
}

/**
 * Ce qu'on envoie au serveur : la fiche entière, nettoyée.
 *
 * Entière, parce qu'un événement d'origine (défini dans le code) n'a pas de
 * ligne en base : le publier en crée une, qui doit tout porter. Une photo sans
 * légende prend le titre de l'événement, et son texte alternatif retombe sur la
 * légende — une image ne part jamais muette.
 */
function corpsDe(e: Evenement) {
  const photos = (e.souvenir?.photos ?? [])
    .filter((p) => p.src.trim())
    .map((p) => {
      const titre = p.titre.trim() || e.titre.trim()
      return { ...p, titre, alt: p.alt?.trim() || titre, credit: p.credit?.trim() || CREDIT_PAR_DEFAUT }
    })
  const recit = e.souvenir?.recit?.trim() ?? ''
  const resume = e.resume.trim()
  return {
    slug: e.slug.trim(),
    date: e.date,
    cadre: e.cadre.trim(),
    titre: e.titre.trim(),
    titreAccueil: e.titreAccueil?.trim() || null,
    resume,
    description: e.description.trim() || resume,
    programme: e.programme
      .map((p) => ({ heure: p.heure.trim(), quoi: p.quoi.trim() }))
      .filter((p) => p.heure || p.quoi),
    cta: e.cta?.label?.trim() && e.cta.href.trim() ? e.cta : null,
    souvenir:
      recit || photos.length
        ? {
            recit,
            question: e.souvenir?.question?.trim() || undefined,
            photos,
            cta: e.souvenir?.cta?.label?.trim() ? e.souvenir.cta : undefined,
          }
        : null,
  }
}

/** Publie la fiche : mise à jour si elle est en base, création sinon. */
export async function publierEvenement(e: Evenement): Promise<void> {
  const corps = corpsDe(e)
  const enBase = e.id && !e.id.startsWith('seed:')
  if (enBase) {
    await $fetch(`/api/admin/evenements/${e.id}`, { method: 'PATCH', body: corps })
  } else {
    await $fetch('/api/admin/evenements', { method: 'POST', body: corps })
  }
}

export function messageErreur(e: unknown, defaut = "L'enregistrement n'a pas abouti. Réessayez dans un instant."): string {
  const err = e as { data?: { statusMessage?: string }; statusMessage?: string }
  return err?.data?.statusMessage || err?.statusMessage || defaut
}
