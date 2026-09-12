import { SEED_ARCHIVES, trierArchives, type Archive } from '#shared/archives'
import { getSupabaseServer, requireSupabase, tableAbsente } from './supabase'

/**
 * Couche d'accès au fonds d'archives.
 *
 * Même principe que les événements : les six documents de la maquette sont
 * toujours présents, la base Supabase vient s'y ajouter, et l'emporte à `id`
 * égal. Le fonds « s'enrichit à chaque boîte retrouvée dans un grenier » sans
 * qu'il faille redéployer.
 */

export const ARCHIVES_TABLE = 'archives'

interface ArchiveRow {
  id: string
  src: string
  alt: string | null
  titre: string
  legende: string | null
  ordre: number | null
}

function mapRow(r: ArchiveRow): Archive {
  return {
    id: r.id,
    src: r.src,
    alt: r.alt ?? '',
    titre: r.titre,
    legende: r.legende ?? '',
    ordre: r.ordre ?? 0,
    source: 'db',
  }
}

export interface ArchiveInput {
  src?: string
  alt?: string
  titre?: string
  legende?: string
  ordre?: number
}

export function versLigneArchive(input: ArchiveInput): Record<string, unknown> {
  const p: Record<string, unknown> = {}
  if (input.src !== undefined) p.src = input.src
  if (input.alt !== undefined) p.alt = input.alt
  if (input.titre !== undefined) p.titre = input.titre
  if (input.legende !== undefined) p.legende = input.legende
  if (input.ordre !== undefined) p.ordre = input.ordre
  return p
}

async function lireBase(): Promise<Archive[]> {
  const supabase = getSupabaseServer()
  if (!supabase) return []
  const { data, error } = await supabase.from(ARCHIVES_TABLE).select('*')
  if (error) {
    if (!tableAbsente(error)) {
      console.error('[archives] lecture Supabase impossible, repli sur le code :', error.message)
    }
    return []
  }
  return (data ?? []).map(mapRow)
}

export async function getArchives(): Promise<Archive[]> {
  const parId = new Map<string, Archive>()
  for (const a of SEED_ARCHIVES) parId.set(a.id, a)
  for (const a of await lireBase()) parId.set(a.id, a)
  return trierArchives([...parId.values()])
}

export async function creerArchive(input: ArchiveInput): Promise<Archive> {
  const { data, error } = await requireSupabase()
    .from(ARCHIVES_TABLE)
    .insert(versLigneArchive(input))
    .select('*')
    .single()
  if (error) throw erreurEcriture(error)
  return mapRow(data as ArchiveRow)
}

export async function modifierArchive(id: string, input: ArchiveInput): Promise<Archive> {
  const { data, error } = await requireSupabase()
    .from(ARCHIVES_TABLE)
    .update(versLigneArchive(input))
    .eq('id', id)
    .select('*')
    .single()
  if (error) throw erreurEcriture(error)
  return mapRow(data as ArchiveRow)
}

export async function supprimerArchive(id: string): Promise<void> {
  const { error } = await requireSupabase().from(ARCHIVES_TABLE).delete().eq('id', id)
  if (error) throw erreurEcriture(error)
}

function erreurEcriture(error: { message: string; code?: string }) {
  return createError({
    statusCode: 500,
    statusMessage: tableAbsente(error)
      ? 'Table absente : joue supabase/archives.sql dans Supabase.'
      : error.message,
  })
}
