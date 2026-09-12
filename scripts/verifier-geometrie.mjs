/**
 * Vérifie que le site rendu a EXACTEMENT la géométrie de la maquette.
 *
 * Un diff d'images ne peut pas trancher : les photos passent ici par AVIF/WebP
 * redimensionnés, donc leurs pixels diffèrent forcément de ceux des JPEG de la
 * maquette, sans qu'aucune règle de mise en page ait bougé. On compare donc ce
 * qui est réellement en jeu : la position et la taille de chaque élément.
 *
 *   npm run dev                          # dans un terminal
 *   node scripts/verifier-geometrie.mjs [port]
 *
 * Le repère est le haut de la page : un écart signalé est un vrai écart de mise
 * en page, pas un décalage hérité de la section précédente.
 */
import { chromium } from '@playwright/test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const ici = dirname(fileURLToPath(import.meta.url))
const port = process.argv[2] || '3000'
const MAQUETTE = pathToFileURL(resolve(ici, '..', '..', '..', 'project', 'site') + '/').href

const PAGES = [
  { nom: 'accueil', maquette: 'index.html', nuxt: '/' },
  { nom: 'actualites', maquette: 'actualites.html', nuxt: '/actualites' },
]

/** Tolérance en pixels. Les photos réencodées arrondissent parfois au demi-pixel. */
const TOLERANCE = 1.5

/**
 * Relevé de la géométrie de la page, élément par élément.
 *
 * La clé d'un élément est son chemin de classes depuis la racine, plus son
 * rang : deux documents différents n'ont pas les mêmes identifiants internes,
 * mais ils ont la même structure de classes — c'est ce qui rend les deux
 * relevés comparables.
 */
const releve = () => {
  const sortie = {}
  const compteurs = {}
  for (const el of document.querySelectorAll('body *')) {
    if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE' || el.tagName === 'NOSCRIPT') continue
    const classes = (el.getAttribute('class') || '')
      .split(/\s+/)
      .filter(Boolean)
      // Classes d'état posées par le JavaScript : elles vont et viennent, et ne
      // décrivent pas la structure.
      .filter((c) => !['open', 'on', 'now', 'vis', 'out'].includes(c))
      // Classes posées par vue-router sur le lien de la page courante : elles
      // n'existent pas dans la maquette et ne changent rien à la géométrie.
      .filter((c) => !c.startsWith('router-link-'))
      .sort()
      .join('.')
    if (!classes) continue
    const cle = `${el.tagName.toLowerCase()}.${classes}`
    compteurs[cle] = (compteurs[cle] ?? 0) + 1
    const r = el.getBoundingClientRect()
    sortie[`${cle}#${compteurs[cle]}`] = [
      Math.round((r.left + window.scrollX) * 100) / 100,
      Math.round((r.top + window.scrollY) * 100) / 100,
      Math.round(r.width * 100) / 100,
      Math.round(r.height * 100) / 100,
    ]
  }
  return sortie
}

const navigateur = await chromium.launch()
let anomalies = 0

for (const page of PAGES) {
  for (const largeur of [1440, 430]) {
    const releves = {}
    for (const [source, url] of [
      ['maquette', MAQUETTE + page.maquette],
      ['nuxt', `http://localhost:${port}${page.nuxt}`],
    ]) {
      const contexte = await navigateur.newContext({
        viewport: { width: largeur, height: 900 },
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
      })
      const onglet = await contexte.newPage()
      await onglet.goto(url, { waitUntil: 'networkidle' })
      // Les images en `loading="lazy"` ne se chargent qu'une fois approchées, et
      // celles du portage sont transformées à la volée (AVIF/WebP) : il faut donc
      // balayer la page ET attendre que chacune ait une taille intrinsèque, sans
      // quoi on mesurerait des figures encore vides.
      await onglet.evaluate(async () => {
        const pas = window.innerHeight * 0.8
        for (let y = 0; y < document.body.scrollHeight; y += pas) {
          window.scrollTo(0, y)
          await new Promise((r) => setTimeout(r, 120))
        }
        window.scrollTo(0, 0)
      })
      await onglet
        .waitForFunction(
          () => [...document.images].every((i) => i.complete && i.naturalWidth > 0),
          null,
          { timeout: 60_000 },
        )
        .catch(() => console.log('    (des images ne se sont pas chargées à temps)'))
      await onglet.evaluate(() => new Promise((r) => setTimeout(r, 600)))
      releves[source] = await onglet.evaluate(releve)
      await contexte.close()
    }

    const { maquette, nuxt } = releves
    const ecarts = []
    for (const [cle, m] of Object.entries(maquette)) {
      const n = nuxt[cle]
      if (!n) {
        ecarts.push(`${cle} — absent du portage`)
        continue
      }
      const noms = ['x', 'y', 'largeur', 'hauteur']
      const delta = m
        .map((v, i) => (Math.abs(v - n[i]) > TOLERANCE ? `${noms[i]} ${v}→${n[i]}` : null))
        .filter(Boolean)
      if (delta.length) ecarts.push(`${cle} — ${delta.join(', ')}`)
    }

    const total = Object.keys(maquette).length
    const etat = ecarts.length === 0 ? '✔' : '✘'
    console.log(`${etat} ${page.nom.padEnd(11)} ${String(largeur).padStart(4)}px  ${total} éléments comparés, ${ecarts.length} écart(s)`)
    for (const e of ecarts.slice(0, 25)) console.log(`    ${e}`)
    if (ecarts.length > 25) console.log(`    … et ${ecarts.length - 25} autres`)
    anomalies += ecarts.length
  }
}

await navigateur.close()
process.exit(anomalies === 0 ? 0 : 1)
