import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/**
 * Client Supabase côté serveur (service-role key), ou `null` quand Supabase
 * n'est pas configuré — le site doit tourner sans base : en développement, dans
 * les tests, et en production tant que la base n'est pas branchée. Le contenu
 * de la maquette (`SEED_*`) sert alors de repli.
 *
 * La clé service-role contourne le RLS : elle ne doit JAMAIS atteindre le
 * navigateur. C'est pourquoi tout passe par des routes Nitro.
 */
export function getSupabaseServer(): SupabaseClient | null {
  if (client) return client

  const config = useRuntimeConfig()
  const url = config.supabaseUrl
  const key = config.supabaseServiceKey
  if (!url || !key) return null

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return client
}

/** Même chose, mais lève une 503 quand la base est indispensable (écritures). */
export function requireSupabase(): SupabaseClient {
  const supabase = getSupabaseServer()
  if (!supabase) {
    throw createError({ statusCode: 503, statusMessage: 'Base Supabase non configuree' })
  }
  return supabase
}

/** Vrai si l'erreur Supabase signale une table encore absente de la base. */
export function tableAbsente(error: { code?: string; message?: string }): boolean {
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /schema cache|does not exist/i.test(error.message ?? '')
  )
}
