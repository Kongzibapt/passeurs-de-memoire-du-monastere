import { getArchives } from '../utils/archives'

/** Fonds d'archives affiché dans « Ce que les greniers ont conservé ». */
export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300')
  return await getArchives()
})
