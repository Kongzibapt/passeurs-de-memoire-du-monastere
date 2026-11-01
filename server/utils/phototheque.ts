import { FICHIERS_IMAGES } from '#shared/phototheque-fichiers'
import {
  composerPhototheque,
  titreParDefaut,
  type FichierImage,
  type Image,
  type LegendeImage,
} from '#shared/phototheque'
import { getSupabaseServer, requireSupabase, tableAbsente } from './supabase'

/**
 * Couche d'accès à la photothèque.
 *
 * L'inventaire des fichiers vient du code — il est dressé à la construction, où
 * le dossier `public/img/` existe encore (sur Vercel la fonction serveur ne le
 * voit pas). Supabase n'apporte que les légendes retouchées au back-office, et
 * l'emporte sur celles écrites dans `shared/phototheque.ts`.
 *
 * Les photos DÉPOSÉES depuis le back-office font exception : elles ne peuvent pas
 * entrer dans le dépôt, la fonction serveur n'écrivant pas sur disque. Elles
 * vont dans le bucket Supabase `phototheque`, et leur ligne de table porte, avec
 * la légende, ce que l'inventaire sait des fichiers du dépôt (dimensions, poids).
 *
 * Conséquence utile : la photothèque fonctionne même sans base. Sans Supabase
 * on ne peut pas modifier une légende, mais on peut choisir ses images — ce qui
 * est l'essentiel de ce qu'on lui demande.
 */

export const PHOTOTHEQUE_TABLE = 'phototheque'
export const PHOTOTHEQUE_BUCKET = 'phototheque'

/**
 * Plafond d'un dépôt. Vercel refuse les corps de requête au-delà de 4,5 Mo ;
 * le navigateur réduit les photos avant l'envoi (voir `usePhototheque`), ce
 * plafond n'est que le filet de sécurité.
 */
export const OCTETS_MAX = 4 * 1024 * 1024

const TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

interface LigneImage {
  src: string
  depose: boolean | null
  chemin: string | null
  largeur: number | null
  hauteur: number | null
  octets: number | null
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

async function lireLignes(): Promise<LigneImage[]> {
  const supabase = getSupabaseServer()
  if (!supabase) return []
  const { data, error } = await supabase.from(PHOTOTHEQUE_TABLE).select('*')
  if (error) {
    if (!tableAbsente(error)) {
      console.error('[photothèque] lecture Supabase impossible, repli sur le code :', error.message)
    }
    return []
  }
  return (data ?? []) as LigneImage[]
}

export async function getPhototheque(): Promise<Image[]> {
  const lignes = await lireLignes()

  const base: Record<string, Partial<LegendeImage>> = {}
  const deposees: FichierImage[] = []
  for (const r of lignes) {
    base[r.src] = {
      titre: r.titre ?? undefined,
      alt: r.alt ?? undefined,
      credit: r.credit ?? undefined,
      motsCles: r.mots_cles ?? undefined,
    }
    if (r.depose) {
      deposees.push({
        src: r.src,
        largeur: r.largeur ?? 0,
        hauteur: r.hauteur ?? 0,
        octets: r.octets ?? 0,
        depose: true,
      })
    }
  }

  // Les photos déposées d'abord : ce sont les plus récentes, et celles qu'on
  // cherche en composant un événement.
  return composerPhototheque([...deposees.reverse(), ...FICHIERS_IMAGES], base)
}

export interface DepotInput {
  octets: Buffer
  type: string
  /** Nom du fichier d'origine : il donne le titre de départ. */
  nom: string
  largeur: number
  hauteur: number
}

/**
 * Dépose une photo dans le bucket et l'inscrit dans la photothèque.
 *
 * Le fichier est rangé sous un nom neuf (année, nom nettoyé, suffixe aléatoire)
 * : deux photos de même nom ne s'écrasent pas, et un nom saisi à la main ne
 * peut pas sortir du dossier.
 */
export async function deposerImage(input: DepotInput): Promise<Image> {
  const ext = TYPES[input.type]
  if (!ext) {
    throw createError({ statusCode: 415, statusMessage: 'Format non pris en charge : JPEG, PNG ou WebP.' })
  }
  if (!input.octets.length) {
    throw createError({ statusCode: 400, statusMessage: 'Fichier vide.' })
  }
  if (input.octets.length > OCTETS_MAX) {
    throw createError({ statusCode: 413, statusMessage: 'Photo trop lourde (4 Mo au maximum).' })
  }

  const supabase = requireSupabase()
  const base = input.nom
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'photo'
  const chemin = `${new Date().getFullYear()}/${base}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error: erreurStockage } = await supabase.storage
    .from(PHOTOTHEQUE_BUCKET)
    .upload(chemin, input.octets, { contentType: input.type, cacheControl: '31536000', upsert: false })
  if (erreurStockage) throw erreurDeStockage(erreurStockage)

  const src = supabase.storage.from(PHOTOTHEQUE_BUCKET).getPublicUrl(chemin).data.publicUrl
  const entier = (n: number) => (Number.isFinite(n) && n > 0 ? Math.round(n) : null)

  const { error } = await supabase.from(PHOTOTHEQUE_TABLE).insert({
    src,
    depose: true,
    chemin,
    largeur: entier(input.largeur),
    hauteur: entier(input.hauteur),
    octets: input.octets.length,
    titre: titreParDefaut(input.nom),
  })
  if (error) {
    // Pas de fichier orphelin dans le bucket si l'inscription échoue.
    await supabase.storage.from(PHOTOTHEQUE_BUCKET).remove([chemin])
    throw erreurEcriture(error)
  }

  return (await getPhototheque()).find((i) => i.src === src)!
}

/**
 * Supprime une photo déposée : le fichier du bucket et sa ligne.
 *
 * Les images du dépôt ne se suppriment pas d'ici — elles sont versionnées avec
 * le site. Une photo supprimée alors qu'un événement l'affiche y laisse un
 * trou ; le back-office le dit avant de confirmer.
 */
export async function supprimerDepot(src: string): Promise<void> {
  const supabase = requireSupabase()
  const { data, error } = await supabase
    .from(PHOTOTHEQUE_TABLE)
    .select('chemin, depose')
    .eq('src', src)
    .maybeSingle()
  if (error) throw erreurEcriture(error)
  if (!data?.depose || !data.chemin) {
    throw createError({ statusCode: 404, statusMessage: 'Aucune photo déposée à cette adresse.' })
  }

  const { error: e1 } = await supabase.storage.from(PHOTOTHEQUE_BUCKET).remove([data.chemin])
  if (e1) throw erreurDeStockage(e1)
  const { error: e2 } = await supabase.from(PHOTOTHEQUE_TABLE).delete().eq('src', src)
  if (e2) throw erreurEcriture(e2)
}

function erreurDeStockage(error: { message: string }) {
  const absent = /bucket not found/i.test(error.message)
  return createError({
    statusCode: 500,
    statusMessage: absent
      ? 'Bucket absent : rejoue supabase/phototheque.sql dans Supabase.'
      : error.message,
  })
}

/** Enregistre (ou remplace) la légende d'une image. */
export async function enregistrerLegende(src: string, input: LegendeInput): Promise<Image> {
  if (!(await getPhototheque()).some((i) => i.src === src)) {
    throw createError({ statusCode: 404, statusMessage: `Aucune image à ${src}` })
  }
  // `update` si la ligne existe (photo déposée : elle porte déjà ses dimensions
  // et ne doit pas les perdre), `insert` sinon. Un `upsert` ne toucherait que les
  // colonnes fournies, mais dirait moins ce qu'on fait.
  const supabase = requireSupabase()
  const champs = { updated_at: new Date().toISOString(), ...versLigneImage(input) }
  const existe = await supabase.from(PHOTOTHEQUE_TABLE).select('src').eq('src', src).maybeSingle()
  if (existe.error) throw erreurEcriture(existe.error)
  const { error } = existe.data
    ? await supabase.from(PHOTOTHEQUE_TABLE).update(champs).eq('src', src)
    : await supabase.from(PHOTOTHEQUE_TABLE).insert({ src, ...champs })
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
  if ((await getPhototheque()).find((i) => i.src === src)?.depose) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Une photo déposée n’a pas de légende du code : modifie-la, ou supprime la photo.',
    })
  }
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
