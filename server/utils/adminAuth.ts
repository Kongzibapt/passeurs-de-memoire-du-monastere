import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

/**
 * Authentification du back-office /admin — mot de passe unique partagé.
 *
 * Le cookie de session ne contient pas le mot de passe : il stocke un jeton
 * = HMAC-SHA256(clé = ADMIN_PASSWORD, "passeurs-admin-v1"). Quiconque connaît le
 * mot de passe peut le recalculer (mais se connecterait de toute façon) ;
 * personne ne peut le forger sans le mot de passe. Changer ADMIN_PASSWORD
 * invalide donc toutes les sessions existantes. Aucun secret séparé requis.
 */
export const ADMIN_COOKIE = 'pdm_admin'
const TOKEN_PAYLOAD = 'passeurs-admin-v1'
const MAX_AGE = 60 * 60 * 24 * 30 // 30 jours

function sessionToken(password: string): string {
  return createHmac('sha256', password).update(TOKEN_PAYLOAD).digest('hex')
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

/** Vérifie le mot de passe fourni contre ADMIN_PASSWORD (comparaison constante). */
export function passwordMatches(event: H3Event, password: string): boolean {
  const expected = useRuntimeConfig(event).adminPassword
  if (!expected || !password) return false
  return safeEqual(password, expected)
}

/** Pose le cookie de session httpOnly après une connexion réussie. */
export function setAdminSession(event: H3Event): void {
  const expected = useRuntimeConfig(event).adminPassword
  setCookie(event, ADMIN_COOKIE, sessionToken(expected), {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

/** Efface le cookie de session (déconnexion). */
export function clearAdminSession(event: H3Event): void {
  deleteCookie(event, ADMIN_COOKIE, { path: '/' })
}

/** True si la requête porte un cookie de session valide. */
export function hasValidAdminSession(event: H3Event): boolean {
  const expected = useRuntimeConfig(event).adminPassword
  if (!expected) return false
  const token = getCookie(event, ADMIN_COOKIE)
  if (!token) return false
  return safeEqual(token, sessionToken(expected))
}

/** Refuse la requête (401) si la session admin n'est pas valide. */
export function requireAdmin(event: H3Event): void {
  if (!hasValidAdminSession(event)) {
    throw createError({ statusCode: 401, statusMessage: 'Non autorise' })
  }
}
