import { passwordMatches, setAdminSession } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ password?: string }>(event)
  const password = (body?.password ?? '').trim()

  // Petite temporisation constante : ralentit une attaque par essais successifs
  // sans rien révéler par le temps de réponse.
  await new Promise((r) => setTimeout(r, 400))

  if (!passwordMatches(event, password)) {
    throw createError({ statusCode: 401, statusMessage: 'Mot de passe incorrect.' })
  }

  setAdminSession(event)
  return { ok: true }
})
