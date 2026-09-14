import {
  SEED_EVENEMENTS,
  type EtapeProgramme,
  type Evenement,
  type LienCta,
  type PhotoSouvenir,
  type Souvenir,
} from '#shared/evenements'
import { getSupabaseServer, requireSupabase, tableAbsente } from './supabase'

/**
 * Couche d'accès aux événements.
 *
 * Le site public fusionne DEUX sources : les événements de la maquette
 * (`SEED_EVENEMENTS`, toujours présents) et ceux créés dans le back-office
 * (table Supabase `evenements`). À `slug` égal, la base l'emporte. Ainsi :
 *  - sans Supabase (développement, tests), le site affiche le contenu du code ;
 *  - en production, ajouter un rendez-vous enrichit le site sans redéploiement,
 *    et corriger un événement fondateur se fait en créant une ligne de même slug.
 *
 * Aucune lecture ne lève : une page publique doit s'afficher même si la base est
 * indisponible ou la table pas encore créée.
 */

export const EVENEMENTS_TABLE = 'evenements'

interface EvenementRow {
  id: string
  slug: string
  date: string | null
  cadre: string | null
  titre: string
  titre_accueil: string | null
  resume: string | null
  description: string | null
  programme: EtapeProgramme[] | null
  cta: LienCta | null
  souvenir: Souvenir | null
}

function mapRow(r: EvenementRow): Evenement {
  return {
    id: r.id,
    slug: r.slug,
    date: (r.date ?? '').slice(0, 10),
    cadre: r.cadre ?? '',
    titre: r.titre,
    titreAccueil: r.titre_accueil ?? undefined,
    resume: r.resume ?? '',
    description: r.description ?? '',
    programme: r.programme ?? [],
    cta: r.cta ?? undefined,
    souvenir: normaliserSouvenir(r.souvenir),
    source: 'db',
  }
}

/**
 * Un souvenir sans récit ni photo n'a rien à afficher : on le traite comme
 * absent, sinon un bloc vide apparaîtrait dans « C'était chez nous » dès qu'un
 * événement passe la date.
 */
function normaliserSouvenir(s: Souvenir | null): Souvenir | undefined {
  if (!s) return undefined
  const photos: PhotoSouvenir[] = Array.isArray(s.photos) ? s.photos : []
  if (!s.recit?.trim() && photos.length === 0) return undefined
  return { ...s, photos }
}

/** Valeurs acceptées en écriture depuis le back-office (camelCase). */
export interface EvenementInput {
  slug: string
  date?: string
  cadre?: string
  titre?: string
  titreAccueil?: string | null
  resume?: string
  description?: string
  programme?: EtapeProgramme[]
  cta?: LienCta | null
  souvenir?: Souvenir | null
}

/** Traduit une saisie back-office vers une ligne Supabase (snake_case). */
export function versLigneEvenement(input: EvenementInput): Record<string, unknown> {
  const p: Record<string, unknown> = {}
  if (input.slug !== undefined) p.slug = input.slug
  if (input.date !== undefined) p.date = input.date || null
  if (input.cadre !== undefined) p.cadre = input.cadre
  if (input.titre !== undefined) p.titre = input.titre
  if (input.titreAccueil !== undefined) p.titre_accueil = input.titreAccueil || null
  if (input.resume !== undefined) p.resume = input.resume
  if (input.description !== undefined) p.description = input.description
  if (input.programme !== undefined) p.programme = input.programme
  if (input.cta !== undefined) p.cta = input.cta
  if (input.souvenir !== undefined) p.souvenir = input.souvenir
  return p
}

async function lireBase(): Promise<Evenement[]> {
  const supabase = getSupabaseServer()
  if (!supabase) return []
  const { data, error } = await supabase.from(EVENEMENTS_TABLE).select('*')
  if (error) {
    if (!tableAbsente(error)) {
      console.error('[evenements] lecture Supabase impossible, repli sur le code :', error.message)
    }
    return []
  }
  return (data ?? []).map(mapRow)
}

/** Fusionne maquette + base (la base l'emporte à slug égal). */
function fusionner(seed: Evenement[], db: Evenement[]): Evenement[] {
  const parSlug = new Map<string, Evenement>()
  for (const e of seed) parSlug.set(e.slug, e)
  for (const e of db) parSlug.set(e.slug, e)
  return [...parSlug.values()]
}

/** Tous les événements visibles publiquement (le tri à venir / passé se fait à l'affichage). */
export async function getEvenementsPublics(): Promise<Evenement[]> {
  return fusionner(SEED_EVENEMENTS, await lireBase())
}

/** Idem, pour le back-office : même liste, mais on garde la provenance. */
export async function getEvenementsAdmin(): Promise<Evenement[]> {
  const liste = await getEvenementsPublics()
  return [...liste].sort((a, b) => b.date.localeCompare(a.date))
}

export async function creerEvenement(input: EvenementInput): Promise<Evenement> {
  const { data, error } = await requireSupabase()
    .from(EVENEMENTS_TABLE)
    .insert(versLigneEvenement(input))
    .select('*')
    .single()
  if (error) throw erreurEcriture(error)
  return mapRow(data as EvenementRow)
}

export async function modifierEvenement(id: string, input: EvenementInput): Promise<Evenement> {
  const { data, error } = await requireSupabase()
    .from(EVENEMENTS_TABLE)
    .update(versLigneEvenement(input))
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw erreurEcriture(error)
  return mapRow(data as EvenementRow)
}

export async function supprimerEvenement(id: string): Promise<void> {
  const { error } = await requireSupabase().from(EVENEMENTS_TABLE).delete().eq('id', id)
  if (error) throw erreurEcriture(error)
}

/** Une écriture qui échoue faute de table mérite un message actionnable. */
function erreurEcriture(error: { message: string; code?: string }) {
  return createError({
    statusCode: 500,
    // Sans accents : un statusMessage HTTP ne transporte que de l'ASCII.
    statusMessage: tableAbsente(error)
      ? 'Table absente : joue supabase/evenements.sql dans Supabase.'
      : error.message,
  })
}

/**
 * Date de la dernière modification éditoriale, au format ISO court, ou `null`.
 *
 * Elle vient de `updated_at` en base : c'est la seule donnée qui dise vraiment
 * quand le contenu a bougé. On ne la déduit surtout pas des dates d'événements —
 * un rendez-vous annoncé pour novembre donnerait un `lastmod` dans le futur,
 * que les moteurs traitent comme une valeur douteuse, voire ignorent.
 *
 * Sans base, il n'y a rien d'honnête à déclarer : le sitemap omet alors la date.
 */
export async function derniereModification(): Promise<string | null> {
  const supabase = getSupabaseServer()
  if (!supabase) return null
  const { data, error } = await supabase
    .from(EVENEMENTS_TABLE)
    .select('updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
  if (error || !data?.length) return null
  return String(data[0]!.updated_at ?? '').slice(0, 10) || null
}
