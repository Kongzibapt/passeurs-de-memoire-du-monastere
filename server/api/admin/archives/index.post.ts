import { requireAdmin } from '../../../utils/adminAuth'
import { creerArchive, type ArchiveInput } from '../../../utils/archives'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  const body = await readBody<ArchiveInput>(event)
  if (!body?.src?.trim() || !body?.titre?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'src et titre sont obligatoires.' })
  }
  return await creerArchive(body)
})
