import { FICHIERS_IMAGES } from '#shared/phototheque-fichiers'
import { composerPhototheque, type Image, type LegendeImage } from '#shared/phototheque'
import { getSupabaseServer, requireSupabase, tableAbsente } from './supabase'

/**
 * Couche d'accès à la photothèque.
 *
 * L'inventaire des fichiers vient du code — il est dressé à la construction, où
 * le dossier `public/img/` existe encore (sur Vercel la fonction serveur ne le
 * voit pas). Supabase n'apporte que les légendes retouchées au back-office, et
 * l'emporte sur celles écrites dans `shared/phototheque.ts`.
 *
 * Conséquence utile : la photothèque fonctionne même sans base. Sans Supabase
 * on ne peut pas modifier une légende, mais on peut choisir ses images — ce qui
 * est l'essentiel de ce qu'on lui demande.
 */

export const PHOTOTHEQUE_TABLE = 'phototheque'

interface LigneImage {
  src: string
  titre: string | null
  alt: string | null
  credit: string | null
  mots_cles: string[] | null
}

export interface LegendeInput {
  titre?: string
  alt?: string
  credit?: string
  motsCles?: string[]
}

export function versLigneImage(input: LegendeInput): Record<string, unknown> {
  const p: Record<string, unknown> = {}
  if (input.titre !== undefined) p.titre = input.titre
  if (input.alt !== undefined) p.alt = input.alt
  if (input.credit !== undefined) p.credit = input.credit
  if (input.motsCles !== undefined) p.mots_cles = input.motsCles
  return p
}

async function lireBase(): Promise<Record<string, Partial<LegendeImage>>> {
  const supabase = getSupabaseServer()
  if (!supabase) return {}
  const { data, error } = await supabase.from(PHOTOTHEQUE_TABLE).select('*')
  if (error) {
    if (!tableAbsente(error)) {
      console.error('[photothèque] lecture Supabase impossible, repli sur le code :', error.message)
    }
    return {}
  }
  const parSrc: Record<string, Partial<LegendeImage>> = {}
  for (const r of (data ?? []) as LigneImage[]) {
    parSrc[r.src] = {
      titre: r.titre ?? undefined,
      alt: r.alt ?? undefined,
      credit: r.credit ?? undefined,
      motsCles: r.mots_cles ?? undefined,
    }
  }
  return parSrc
}

export async function getPhototheque(): Promise<Image[]> {
  return composerPhototheque(FICHIERS_IMAGES, await lireBase())
}

/** Enregistre (ou remplace) la légende d'une image. */
export async function enregistrerLegende(src: string, input: LegendeInput): Promise<Image> {
  if (!FICHIERS_IMAGES.some((f) => f.src === src)) {
    throw createError({ statusCode: 404, statusMessage: `Aucune image à ${src}` })
  }
  const { error } = await requireSupabase()
    .from(PHOTOTHEQUE_TABLE)
    .upsert({ src, updated_at: new Date().toISOString(), ...versLigneImage(input) }, { onConflict: 'src' })
  if (error) throw erreurEcriture(error)

  const images = await getPhototheque()
  return images.find((i) => i.src === src)!
}

/**
 * Oublie la légende saisie et rend la main au code.
 *
 * Ce n'est pas une suppression d'image : le fichier reste dans le dépôt, et
 * l'image reste proposée. Seule la retouche du back-office disparaît.
 */
export async function oublierLegende(src: string): Promise<Image> {
  const { error } = await requireSupabase().from(PHOTOTHEQUE_TABLE).delete().eq('src', src)
  if (error) throw erreurEcriture(error)

  const images = await getPhototheque()
  const image = images.find((i) => i.src === src)
  if (!image) throw createError({ statusCode: 404, statusMessage: `Aucune image à ${src}` })
  return image
}

function erreurEcriture(error: { message: string; code?: string }) {
  return createError({
    statusCode: 500,
    statusMessage: tableAbsente(error)
      ? 'Table absente : joue supabase/phototheque.sql dans Supabase.'
      : error.message,
  })
}
