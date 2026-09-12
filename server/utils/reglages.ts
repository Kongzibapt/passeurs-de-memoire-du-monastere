import { URL_ADHESION_DEFAUT } from '#shared/association'
import { getSupabaseServer, requireSupabase, tableAbsente } from './supabase'

/**
 * Réglages du site : les quelques valeurs éditables depuis le back-office.
 *
 * Elles sont lues par des pages publiques, d'où la liste blanche ci-dessous :
 * une table clé/valeur sans garde-fou finit par exposer de la configuration
 * qu'on n'avait pas prévu de publier.
 */
export const REGLAGES_TABLE = 'reglages'

/** Réglages autorisés, avec leur valeur de repli et leur validation. */
export const REGLAGES_PUBLICS = {
  /**
   * Lien HelloAsso de la campagne d'adhésion en cours. Il change chaque année
   * (« adhesion-2026 », « adhesion-2027 »…) : c'est le réglage qui évite un
   * redéploiement annuel pour une seule URL.
   */
  url_adhesion: {
    defaut: URL_ADHESION_DEFAUT,
    valider: (v: string) => /^https:\/\/(www\.)?helloasso\.com\/.+/i.test(v),
    aide: 'URL HelloAsso complète, en https.',
  },
} as const

export type CleReglage = keyof typeof REGLAGES_PUBLICS
export type Reglages = Record<CleReglage, string>

/**
 * Valeurs publiques, complétées par les valeurs de repli.
 *
 * Ne lève jamais : une page publique doit s'afficher même si la base est
 * indisponible ou la table pas encore créée. Le repli reprend ce qui était
 * figé dans le code de la maquette.
 */
export async function lireReglagesPublics(): Promise<Reglages> {
  const sortie = Object.fromEntries(
    Object.entries(REGLAGES_PUBLICS).map(([cle, def]) => [cle, def.defaut]),
  ) as Reglages

  const supabase = getSupabaseServer()
  if (!supabase) return sortie

  try {
    const { data, error } = await supabase
      .from(REGLAGES_TABLE)
      .select('cle, valeur')
      .in('cle', Object.keys(REGLAGES_PUBLICS))
    if (error) {
      if (!tableAbsente(error)) console.error('[reglages] illisibles :', error.message)
      return sortie
    }
    for (const ligne of data ?? []) {
      const def = REGLAGES_PUBLICS[ligne.cle as CleReglage]
      const valeur = String(ligne.valeur ?? '')
      if (def && valeur && def.valider(valeur)) sortie[ligne.cle as CleReglage] = valeur
    }
  } catch {
    // Supabase non configuré (dev, tests) : les valeurs de repli suffisent.
  }
  return sortie
}

export async function ecrireReglage(cle: CleReglage, valeur: string): Promise<string> {
  const def = REGLAGES_PUBLICS[cle]
  if (!def) throw createError({ statusCode: 400, statusMessage: 'Reglage inconnu' })
  const propre = valeur.trim()
  if (!def.valider(propre)) {
    throw createError({ statusCode: 400, statusMessage: `Valeur invalide. ${def.aide}` })
  }

  const { error } = await requireSupabase()
    .from(REGLAGES_TABLE)
    .upsert({ cle, valeur: propre, updated_at: new Date().toISOString() }, { onConflict: 'cle' })
  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: tableAbsente(error)
        ? 'Table absente : joue supabase/reglages.sql dans Supabase.'
        : error.message,
    })
  }
  return propre
}
