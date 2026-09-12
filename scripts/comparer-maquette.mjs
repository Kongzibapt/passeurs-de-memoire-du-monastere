/**
 * Compare le site rendu à la maquette Claude Design, côte à côte.
 *
 * Le portage vise le pixel : cet outil est le seul moyen de le vérifier
 * autrement qu'à l'œil nu. Il capture la même page dans les deux sources, au
 * même gabarit, et écrit les images dans `.captures/` pour un examen visuel.
 *
 *   npm run dev            # dans un terminal
 *   node scripts/comparer-maquette.mjs [port]
 *
 * Les animations d'entrée sont neutralisées (`reducedMotion`) pour que les deux
 * captures montrent le même état de la page, et non deux instants différents
 * d'une apparition en fondu.
 */
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const ici = dirname(fileURLToPath(import.meta.url))
const SORTIE = resolve(ici, '..', '.captures')
mkdirSync(SORTIE, { recursive: true })

const port = process.argv[2] || '3000'
const NUXT = `http://localhost:${port}`
// La maquette d'origine, telle qu'exportée par Claude Design.
const MAQUETTE = pathToFileURL(resolve(ici, '..', '..', '..', 'project', 'site') + '/').href

const PAGES = [
  { nom: 'accueil', maquette: 'index.html', nuxt: '/' },
  { nom: 'actualites', maquette: 'actualites.html', nuxt: '/actualites' },
]

const GABARITS = [
  { nom: 'bureau', viewport: { width: 1440, height: 900 } },
  { nom: 'mobile', viewport: { width: 430, height: 900 } },
]

const navigateur = await chromium.launch()

for (const page of PAGES) {
  for (const gabarit of GABARITS) {
    for (const [source, url] of [
      ['maquette', MAQUETTE + page.maquette],
      ['nuxt', NUXT + page.nuxt],
    ]) {
      const contexte = await navigateur.newContext({
        viewport: gabarit.viewport,
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
      })
      const onglet = await contexte.newPage()
      const erreurs = []
      onglet.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()))
      onglet.on('pageerror', (e) => erreurs.push('PAGEERROR ' + e.message))

      await onglet.goto(url, { waitUntil: 'networkidle' })
      // Les images en `loading="lazy"` ne se chargent qu'une fois approchées :
      // sans ce balayage, la capture pleine page les montrerait vides.
      await onglet.evaluate(async () => {
        window.scrollTo(0, document.body.scrollHeight)
        await new Promise((r) => setTimeout(r, 1500))
        window.scrollTo(0, 0)
        await new Promise((r) => setTimeout(r, 600))
      })

      const hauteur = await onglet.evaluate(() => document.body.scrollHeight)
      await onglet.screenshot({
        path: `${SORTIE}/${page.nom}-${gabarit.nom}-${source}.png`,
        fullPage: true,
      })
      console.log(
        `${page.nom.padEnd(11)} ${gabarit.nom.padEnd(7)} ${source.padEnd(9)} hauteur=${String(hauteur).padStart(6)}px  erreurs=${erreurs.length}`,
      )
      for (const e of erreurs.slice(0, 6)) console.log('     ⚠ ' + e.slice(0, 170))
      await contexte.close()
    }
  }
}

await navigateur.close()
console.log(`\nCaptures écrites dans ${SORTIE}`)
