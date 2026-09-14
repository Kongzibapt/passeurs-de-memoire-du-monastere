/**
 * Vérifie que le site rendu a la géométrie de la maquette, section par section.
 *
 * ── Pourquoi pas un diff d'images ────────────────────────────────────────────
 * Les photos passent ici par AVIF redimensionné : leurs pixels diffèrent
 * forcément de ceux des JPEG de la maquette, sans qu'aucune règle de mise en
 * page ait bougé. On compare donc ce qui est réellement en jeu — la position et
 * la taille de chaque élément.
 *
 * ── Pourquoi section par section ─────────────────────────────────────────────
 * Les coordonnées sont relevées PAR RAPPORT À LA SECTION, pas au haut de la
 * page. Sans cela, un seul écart volontaire — une date plus longue, un bloc
 * ajouté — décale tout ce qui suit et noie les vrais écarts sous des centaines
 * de faux positifs. Chaque section répond désormais d'elle-même.
 *
 *   npm run dev
 *   node scripts/verifier-geometrie.mjs [port]
 *
 * Sortie 0 si aucune section comparée ne diverge.
 */
import { chromium } from '@playwright/test'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const ici = dirname(fileURLToPath(import.meta.url))
const port = process.argv[2] || '3000'
const MAQUETTE = pathToFileURL(resolve(ici, '..', '..', '..', 'project', 'site') + '/').href

/** Tolérance en pixels — les photos réencodées arrondissent parfois au demi-pixel. */
const TOLERANCE = 1.5

/**
 * Sections volontairement différentes de la maquette, avec leur raison.
 *
 * C'est le seul endroit où une divergence est admise — si une section y entre
 * sans raison écrite, c'est qu'on est en train de perdre la maquette de vue.
 *
 * Trois formes, de la plus permissive à la plus serrée :
 *
 *   'sélecteur': 'raison'
 *       la section n'est pas comparée du tout.
 *
 *   'sélecteur': { raison, ignorer: [430] }
 *       elle n'est pas comparée À CES LARGEURS seulement. Une refonte propre au
 *       téléphone ne doit pas faire perdre de vue la version grand écran.
 *
 *   'sélecteur': { raison, derive: 8 }
 *       elle est comparée, mais on tolère jusqu'à 8 px d'écart VERTICAL (y et
 *       hauteur). Sert quand un bloc grandit de quelques pixels et pousse ce
 *       qui suit : les abscisses, les largeurs et les éléments manquants
 *       restent vérifiés au pixel près.
 */
const DIVERGENCES_ASSUMEES = {
  'section.sec.pad:has(.evts)':
    'les dates sont désormais calculées au format « Samedi 21 novembre 2026 », partout',
  '.passe':
    'même format de date, et les photos sont désormais dans un carrousel à cadre fixe',
  '.cmp-sec':
    'la légende est scindée en deux, chacune sous le bord de l\'image qu\'elle décrit',
  '.contact@actualites': 'formulaire de contact ajouté à cette page (absent de la maquette)',
  '.adhere@actualites':
    'la phrase « Prochain rendez-vous » cite la date au nouveau format, plus longue d\'une ligne',
  '.foot': 'deux liens légaux ajoutés (mentions légales, données personnelles)',
  '.site-top': {
    raison: 'replié sur trois lignes, le nom de l\'association est réparti à interligne égal',
    ignorer: [430],
  },
  '.hero': {
    raison: 'sur téléphone, l\'emblème passe au-dessus du titre au lieu de suivre les boutons',
    ignorer: [430],
  },
  '#patrimoine': {
    raison:
      'interligne des légendes unifié ; et sur téléphone, l\'église garde son cadre 4/5 (clocher compris) et le pont est recadré sur ses arches',
    ignorer: [430],
    derive: 8,
  },
  '.arch': {
    raison:
      'interligne des légendes unifié : chaque légende grandit de ~3 px et pousse la planche d\'autant',
    derive: 8,
  },
}

const PAGES = [
  {
    nom: 'accueil',
    maquette: 'index.html',
    nuxt: '/',
    sections: [
      ['en-tête', '.site-top'],
      ['hero', '.hero'],
      ['patrimoine', '#patrimoine'],
      ['autour', '#autour'],
      ['comparateur', '.cmp-sec'],
      ['but', '.but'],
      ['rivière', '.riviere'],
      ['archives', '.arch'],
      ['rendez-vous', 'section.sec.pad:has(.evts)'],
      ['adhérer', '.adhere'],
      ['contact', '.contact'],
      ['devise', '.devise'],
      ['pied', '.foot'],
    ],
  },
  {
    nom: 'actualites',
    maquette: 'actualites.html',
    nuxt: '/actualites',
    sections: [
      ['en-tête', '.site-top'],
      ['titre de page', '.page-head'],
      ['à venir', 'section.sec.pad:has(.evts)'],
      ['souvenirs', '.passe'],
      ['adhérer', '.adhere@actualites'],
      ['contact', '.contact@actualites'],
      ['pied', '.foot'],
    ],
  },
]

/**
 * Relevé de la géométrie d'une section, élément par élément.
 *
 * La clé d'un élément est son chemin de classes plus son rang : deux documents
 * différents n'ont pas les mêmes identifiants internes, mais ils ont la même
 * structure de classes — c'est ce qui rend les deux relevés comparables.
 */
const releverSection = (selecteur) => {
  const racine = document.querySelector(selecteur)
  if (!racine) return null

  const cadre = racine.getBoundingClientRect()
  const sortie = { '§ la section elle-même': [0, 0, +cadre.width.toFixed(2), +cadre.height.toFixed(2)] }
  const compteurs = {}

  for (const el of racine.querySelectorAll('*')) {
    if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue
    const classes = (el.getAttribute('class') || '')
      .split(/\s+/)
      .filter(Boolean)
      // Classes d'état posées par le JavaScript, et classes que vue-router
      // ajoute au lien de la page courante : elles vont et viennent et ne
      // décrivent pas la structure.
      .filter((c) => !['open', 'on', 'now', 'vis', 'out'].includes(c))
      .filter((c) => !c.startsWith('router-link-'))
      .sort()
      .join('.')
    if (!classes) continue

    const r = el.getBoundingClientRect()
    // Un élément masqué (`display:none`) a un rectangle nul : sa « position »
    // n'est que celle du coin de l'écran, et la comparer ne mesure que le
    // défilement des deux pages. C'est le cas de la liste `.jalons`, tenue en
    // réserve pour les navigateurs sans JavaScript.
    if (r.width === 0 && r.height === 0) continue

    const cle = `${el.tagName.toLowerCase()}.${classes}`
    compteurs[cle] = (compteurs[cle] ?? 0) + 1
    sortie[`${cle}#${compteurs[cle]}`] = [
      Math.round((r.left - cadre.left) * 100) / 100,
      Math.round((r.top - cadre.top) * 100) / 100,
      Math.round(r.width * 100) / 100,
      Math.round(r.height * 100) / 100,
    ]
  }
  return sortie
}

async function ouvrir(navigateur, url, largeur) {
  const contexte = await navigateur.newContext({
    viewport: { width: largeur, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  })
  const onglet = await contexte.newPage()
  await onglet.goto(url, { waitUntil: 'networkidle' })
  // Les images en `loading="lazy"` ne partent qu'une fois approchées, et celles
  // du portage sont transformées à la volée : il faut balayer la page ET
  // attendre, sans quoi on mesurerait des figures encore vides.
  await onglet.evaluate(async () => {
    const pas = window.innerHeight * 0.8
    for (let y = 0; y < document.body.scrollHeight; y += pas) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 120))
    }
    window.scrollTo(0, document.body.scrollHeight)
  })
  await onglet
    .waitForFunction(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0), null, {
      timeout: 60_000,
    })
    .catch(() => console.log('    (des images ne se sont pas chargées à temps)'))
  await onglet.evaluate(() => window.scrollTo(0, 0))
  await onglet.evaluate(() => new Promise((r) => setTimeout(r, 500)))
  return { contexte, onglet }
}

const navigateur = await chromium.launch()
let anomalies = 0

for (const page of PAGES) {
  for (const largeur of [1440, 430]) {
    const maquette = await ouvrir(navigateur, MAQUETTE + page.maquette, largeur)
    const nuxt = await ouvrir(navigateur, `http://localhost:${port}${page.nuxt}`, largeur)

    console.log(`\n${page.nom} — ${largeur} px`)

    for (const [nom, selecteur] of page.sections) {
      const admis = DIVERGENCES_ASSUMEES[selecteur]
      const regle = typeof admis === 'string' ? { raison: admis } : (admis ?? {})
      // Le suffixe `@page` ne sert qu'à distinguer deux sections de même
      // sélecteur sur des pages différentes ; le DOM ne le connaît pas.
      const css = selecteur.split('@')[0]

      // Sans `ignorer`, une raison seule met la section hors comparaison ; avec
      // `derive`, elle reste comparée et c'est la tolérance qui s'élargit.
      const ignoree = regle.ignorer
        ? regle.ignorer.includes(largeur)
        : Boolean(regle.raison && !regle.derive)
      if (ignoree) {
        console.log(`  ~ ${nom.padEnd(15)} non comparée — ${regle.raison}`)
        continue
      }
      // Tolérance verticale documentée : elle ne s'applique qu'à `y` et
      // `hauteur`, et seulement aux largeurs réellement comparées.
      const verticale = regle.derive ? Math.max(TOLERANCE, regle.derive) : TOLERANCE

      const [m, n] = await Promise.all([
        maquette.onglet.evaluate(releverSection, css),
        nuxt.onglet.evaluate(releverSection, css),
      ])

      if (!m) {
        console.log(`  · ${nom.padEnd(15)} absente de la maquette`)
        continue
      }
      if (!n) {
        console.log(`  ✘ ${nom.padEnd(15)} ABSENTE du portage`)
        anomalies++
        continue
      }

      const noms = ['x', 'y', 'largeur', 'hauteur']
      const ecarts = []
      for (const [cle, a] of Object.entries(m)) {
        const b = n[cle]
        if (!b) {
          ecarts.push(`${cle} — absent`)
          continue
        }
        const delta = a
          .map((v, i) => {
            const seuil = i === 1 || i === 3 ? verticale : TOLERANCE
            return Math.abs(v - b[i]) > seuil ? `${noms[i]} ${v}→${b[i]}` : null
          })
          .filter(Boolean)
        if (delta.length) ecarts.push(`${cle} — ${delta.join(', ')}`)
      }

      const total = Object.keys(m).length
      if (ecarts.length === 0) {
        console.log(`  ✔ ${nom.padEnd(15)} ${String(total).padStart(3)} éléments`)
      } else {
        console.log(`  ✘ ${nom.padEnd(15)} ${String(total).padStart(3)} éléments, ${ecarts.length} écart(s)`)
        for (const e of ecarts.slice(0, 12)) console.log(`      ${e}`)
        if (ecarts.length > 12) console.log(`      … et ${ecarts.length - 12} autres`)
        anomalies += ecarts.length
      }
    }

    await maquette.contexte.close()
    await nuxt.contexte.close()
  }
}

await navigateur.close()
console.log(
  anomalies === 0
    ? '\n✔ Toutes les sections comparées sont conformes à la maquette.'
    : `\n✘ ${anomalies} écart(s) inattendu(s).`,
)
process.exit(anomalies === 0 ? 0 : 1)
