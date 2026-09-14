/**
 * Exporte la première planche des affiches d'événement en image pour le site.
 *
 * Les affiches sont dessinées en HTML dans le bundle Claude Design, une planche
 * par `<section class="page">`. On rend la première — celle qui sert d'affiche
 * proprement dite, les suivantes étant le verso ou des variantes — et on
 * l'enregistre dans `public/img/`.
 *
 * Les mentions de travail en cours (« Lieu et horaires à confirmer ») sont
 * retirées au rendu : elles avaient un sens pendant la préparation, elles n'en
 * ont plus sur le site une fois l'événement passé.
 *
 *   node scripts/exporter-affiches.mjs
 */
import { chromium } from '@playwright/test'
import sharp from 'sharp'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const ici = dirname(fileURLToPath(import.meta.url))
const PROJET = resolve(ici, '..', '..', '..', 'project')
const SORTIE = resolve(ici, '..', 'public', 'img')

/** Largeur d'export : l'affiche s'affiche vers 240 px, × 3 pour les écrans Retina. */
const LARGEUR = 1100

const AFFICHES = [
  {
    fichier: '3 juillet - Nuit des églises/Flyer 3 Juillet v2.html',
    sortie: 'affiche-nuit-des-eglises-2026.jpg',
  },
  {
    fichier: 'Affiches - Journee des associations.html',
    sortie: 'affiche-journee-des-associations-2026.jpg',
  },
]

const provisoire = await mkdtemp(join(tmpdir(), 'affiches-'))
const navigateur = await chromium.launch()

for (const { fichier, sortie } of AFFICHES) {
  const contexte = await navigateur.newContext({
    viewport: { width: 1400, height: 1200 },
    // Rendu à 2× puis réduit : le texte de l'affiche reste net une fois
    // ramené à la largeur d'export.
    deviceScaleFactor: 2,
  })
  const onglet = await contexte.newPage()
  await onglet.goto(pathToFileURL(resolve(PROJET, fichier)).href, { waitUntil: 'networkidle' })
  await onglet.addStyleTag({ content: '.wip { display: none !important }' })
  await onglet.waitForTimeout(2500)

  const planche = await onglet.$('section.page, .page')
  if (!planche) {
    console.log(`✘ ${fichier} — aucune planche trouvée`)
    await contexte.close()
    continue
  }

  const brut = join(provisoire, sortie.replace(/\.jpg$/, '.png'))
  await planche.screenshot({ path: brut })
  await contexte.close()

  const avant = await sharp(brut).metadata()
  await sharp(brut)
    .resize({ width: LARGEUR, withoutEnlargement: true })
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(resolve(SORTIE, sortie))
  const apres = await sharp(resolve(SORTIE, sortie)).metadata()
  console.log(`✔ ${sortie.padEnd(42)} ${avant.width}×${avant.height} → ${apres.width}×${apres.height}`)
}

await navigateur.close()
await rm(provisoire, { recursive: true, force: true })
