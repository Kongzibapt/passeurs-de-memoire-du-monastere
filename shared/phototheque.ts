/**
 * La photothèque : toutes les images de `public/img/`, avec leur légende.
 *
 * ── Ce qu'elle rassemble ─────────────────────────────────────────────────────
 * Trois choses, tenues séparées parce qu'elles n'ont pas la même durée de vie :
 *
 *   1. l'inventaire du dossier — `phototheque-fichiers.ts`, généré à chaque
 *      construction, qui dit quels fichiers existent et de quelle taille ;
 *   2. les légendes écrites dans le code — `LEGENDES` ci-dessous, reprises des
 *      pages qui affichent déjà ces images ;
 *   3. les légendes saisies au back-office — la table Supabase `phototheque`,
 *      qui l'emporte sur le code à `src` égal.
 *
 * Une image sans légende reste proposée : elle prend un titre déduit de son nom
 * de fichier. Le fonds ne se cache pas parce qu'il n'est pas encore décrit.
 *
 * ── À quoi elle sert ─────────────────────────────────────────────────────────
 * À ne plus taper « /img/eglise-nef.jpg » de mémoire dans le back-office. On
 * choisit la photo dans une planche, et son titre, son texte alternatif et son
 * crédit viennent avec — les trois champs qu'on oublie de remplir quand il faut
 * les écrire à la main.
 */

/** Ce que l'inventaire du dossier sait d'un fichier. */
export interface FichierImage {
  /** Chemin depuis la racine du site : `/img/…`. C'est la clé de tout. */
  src: string
  largeur: number
  hauteur: number
  octets: number
}

/** Ce qu'on peut dire d'une image, dans le code ou depuis le back-office. */
export interface LegendeImage {
  /** Partie en gras de la légende : « La nef, le 3 juillet ». */
  titre: string
  /** Ce que montre l'image, pour qui ne la voit pas. */
  alt: string
  /** « Photo de l'association », « carte postale, collection de l'association »… */
  credit: string
  /** Pour la recherche : « église », « pont », « carte postale », « 2026 »… */
  motsCles: string[]
}

export interface Image extends FichierImage, LegendeImage {
  /**
   * D'où vient la légende : `code` (écrite ici), `base` (saisie au
   * back-office), `nue` (déduite du nom de fichier, personne ne l'a décrite).
   */
  source: 'code' | 'base' | 'nue'
}

const ASSOCIATION = "Photo de l'association"
const CARTE = "Carte postale, collection de l'association"

/**
 * Les légendes déjà écrites ailleurs dans le site.
 *
 * Reprises mot pour mot de `app/data/patrimoine.ts`, `app/data/comparaisons.ts`,
 * `shared/archives.ts` et `shared/evenements.ts` : une même photo doit se
 * présenter de la même façon, qu'on la rencontre sur une page ou dans le
 * sélecteur du back-office.
 */
export const LEGENDES: Record<string, LegendeImage> = {
  '/img/abbaye-2012.jpg': {
    titre: "L'abbaye en 2012",
    alt: "L'abbaye du Monastère en 2012",
    credit: ASSOCIATION,
    motsCles: ['abbaye', 'coteau', '2012', 'comparateur'],
  },
  '/img/abbaye-parc.jpg': {
    titre: "L'abbaye depuis le parc",
    alt: "L'abbaye du Monastère, ses deux tours et son parc",
    credit: ASSOCIATION,
    motsCles: ['abbaye', 'parc', 'tours', 'patrimoine'],
  },
  '/img/abbaye.jpg': {
    titre: "L'abbaye et son allée",
    alt: "Le corps de bâtiment de l'abbaye et ses deux tourelles, au bout du chemin du parc",
    credit: ASSOCIATION,
    motsCles: ['abbaye', 'tourelles', 'allée', 'parc'],
  },
  '/img/affiche-journee-des-associations-2026.jpg': {
    titre: "L'affiche du stand",
    alt: "Affiche des Passeurs de Mémoire : « Vous habitez un village vieux de mille ans », au-dessus d'une vue du Monastère et de son église depuis les hauteurs boisées",
    credit: "Affiche de l'association",
    motsCles: ['affiche', 'journée des associations', '2026'],
  },
  '/img/affiche-nuit-des-eglises-2026.jpg': {
    titre: "L'affiche de la soirée",
    alt: "Affiche de la Nuit des églises 2026 : concert orgue, flûte traversière et chant à l'église Saint-Blaise du Monastère, le 3 juillet à 20h30, entrée libre",
    credit: "Affiche de l'association",
    motsCles: ['affiche', 'nuit des églises', '2026', 'concert'],
  },
  '/img/archive-abbaye-coteau.jpg': {
    titre: 'Le Monastère-sous-Rodez',
    alt: 'Carte postale ancienne : le Monastère-sous-Rodez et son abbaye vus du coteau',
    credit: 'E. Carrère imp.-éd., Rodez · ' + CARTE.toLowerCase(),
    motsCles: ['carte postale', 'abbaye', 'coteau', 'archives'],
  },
  '/img/archive-eglise-village.jpg': {
    titre: "Le bourg et son église",
    alt: 'Le village du Monastère et son église sur une carte postale ancienne',
    credit: 'Éd. Chéojac · ' + CARTE.toLowerCase(),
    motsCles: ['carte postale', 'église', 'bourg', 'comparateur'],
  },
  '/img/archive-maisons-riviere.jpg': {
    titre: 'Maisons sur la rivière',
    alt: "Photographie ancienne : maisons et galeries de bois au bord de l'Aveyron",
    credit: CARTE,
    motsCles: ['archives', 'rivière', 'galeries', 'aveyron'],
  },
  '/img/archive-pont-malzac.jpg': {
    titre: 'Le pont du Monastère',
    alt: 'Le pont du Monastère sur une carte postale ancienne',
    credit: 'H. Malzac éd., 12 rue Neuve, Rodez · ' + CARTE.toLowerCase(),
    motsCles: ['carte postale', 'pont', 'comparateur'],
  },
  '/img/archive-rue.jpg': {
    titre: 'Une rue du bourg',
    alt: 'Carte postale ancienne : une rue à colombages du Monastère',
    credit: 'Éd. CIM · ' + CARTE.toLowerCase(),
    motsCles: ['carte postale', 'rue', 'colombages', 'archives'],
  },
  '/img/archive-vieux-pont.jpg': {
    titre: 'Le Monastère près Rodez — Vieux Pont',
    alt: 'Carte postale ancienne : le vieux pont du Monastère',
    credit: 'Imp. P. Carrère, Rodez · ' + CARTE.toLowerCase(),
    motsCles: ['carte postale', 'pont', 'archives'],
  },
  '/img/archive-vue-aerienne.jpg': {
    titre: 'Vue aérienne',
    alt: "Vue aérienne ancienne du village autour de l'église",
    credit: CARTE,
    motsCles: ['archives', 'vue aérienne', 'bourg', 'église'],
  },
  '/img/archive-vue-generale.jpg': {
    titre: 'Le Monastère-sur-Rodez',
    alt: 'Carte postale ancienne : vue générale du Monastère-sur-Rodez',
    credit: 'Imp. Carrère, Rodez · ' + CARTE.toLowerCase(),
    motsCles: ['carte postale', 'vue générale', 'archives'],
  },
  '/img/bourg-coteau-pins.jpg': {
    titre: 'Le bourg entre les pins',
    alt: 'Le village du Monastère vu du coteau, encadré par les branches des pins',
    credit: ASSOCIATION,
    motsCles: ['bourg', 'coteau', 'pins', 'panorama'],
  },
  '/img/concert-tribune.jpg': {
    titre: "Le concert, à la tribune d'orgue",
    alt: "Les musiciens du concert à la tribune d'orgue de l'église du Monastère",
    credit: ASSOCIATION,
    motsCles: ['nuit des églises', 'concert', 'orgue', 'tribune', '2026'],
  },
  '/img/conference-art-sacre.jpg': {
    titre: "La micro-conférence sur l'art sacré",
    alt: "La micro-conférence sur l'art sacré, devant le retable de l'église",
    credit: ASSOCIATION,
    motsCles: ['nuit des églises', 'conférence', 'art sacré', 'retable', '2026'],
  },
  '/img/eglise-2026.jpg': {
    titre: "L'église depuis le sud",
    alt: "L'église du Monastère vue du côté sud : la nef, son toit de lauzes et la tour-clocher",
    credit: ASSOCIATION,
    motsCles: ['église', 'clocher', 'nef', '2026'],
  },
  '/img/eglise-facade.jpg': {
    titre: 'Le portail nord et son contrefort',
    alt: "Le portail nord de l'église, son contrefort et les baies du clocher au-dessus",
    credit: ASSOCIATION,
    motsCles: ['église', 'portail', 'contrefort', 'clocher'],
  },
  '/img/eglise-nef.jpg': {
    titre: 'La nef, le 3 juillet',
    alt: "L'église du Monastère pleine, lors de la Nuit des églises",
    credit: ASSOCIATION,
    motsCles: ['nuit des églises', 'nef', 'public', '2026'],
  },
  '/img/eglise-place.jpg': {
    titre: "L'église, depuis la place",
    alt: "L'église du Monastère vue de la place : clocher, nef et portail",
    credit: ASSOCIATION,
    motsCles: ['église', 'place', 'clocher', 'patrimoine'],
  },
  '/img/eglise-retable.jpg': {
    titre: 'Le retable',
    alt: "Le retable doré de l'église pendant la présentation",
    credit: ASSOCIATION,
    motsCles: ['nuit des églises', 'retable', 'art sacré', '2026'],
  },
  '/img/eglise-tympan.jpg': {
    titre: 'Le portail',
    alt: "Le portail de l'église du Monastère",
    credit: ASSOCIATION,
    motsCles: ['église', 'portail', 'tympan'],
  },
  '/img/eglise-village-2026.jpg': {
    titre: "Le bourg et son église, 2026",
    alt: "Le bourg du Monastère et son église aujourd'hui",
    credit: ASSOCIATION,
    motsCles: ['bourg', 'église', '2026', 'comparateur'],
  },
  '/img/hero-bourg-coteau.jpg': {
    titre: 'Le bourg vu du coteau',
    alt: 'Le village du Monastère, son clocher et ses toits, vus depuis les hauteurs boisées',
    credit: ASSOCIATION,
    motsCles: ['bourg', 'coteau', 'clocher', 'panorama'],
  },
  '/img/hero-bourg-crepuscule.jpg': {
    titre: 'Le bourg au crépuscule',
    alt: 'Le village du Monastère à la tombée du jour, aperçu entre les feuillages du coteau',
    credit: ASSOCIATION,
    motsCles: ['bourg', 'crépuscule', 'coteau', 'panorama'],
  },
  '/img/pont-aujourdhui.jpg': {
    titre: "Le pont aujourd'hui",
    alt: "Le pont du Monastère aujourd'hui",
    credit: ASSOCIATION,
    motsCles: ['pont', '2026', 'comparateur'],
  },
  '/img/pont-large.jpg': {
    titre: 'Le pont et les maisons de la rive',
    alt: "Le pont Vieux, ses arches et les maisons de la rive, reflétés dans l'Aveyron",
    credit: ASSOCIATION,
    motsCles: ['pont', 'arches', 'reflet', 'aveyron'],
  },
  '/img/pont-panorama.jpg': {
    titre: 'Le pont Vieux et son reflet',
    alt: "Le pont Vieux du Monastère et ses arches reflétées dans l'Aveyron",
    credit: "Photo de l'association, août 2026",
    motsCles: ['pont', 'arches', 'reflet', 'panorama', '2026'],
  },
  '/img/pont-vertical.jpg': {
    titre: 'Le pont, en hauteur',
    alt: "Le pont Vieux et les maisons de la rive, cadrés en hauteur au-dessus de l'Aveyron",
    credit: ASSOCIATION,
    motsCles: ['pont', 'portrait', 'aveyron'],
  },
  '/img/rue-colombages.jpg': {
    titre: 'Une façade à colombages',
    alt: "Une maison à pan-de-bois et encorbellement, dans une rue du bourg",
    credit: ASSOCIATION,
    motsCles: ['rue', 'colombages', 'pan-de-bois', 'bourg'],
  },
  '/img/vue-bourg-coteau.jpg': {
    titre: 'Le village et son clocher',
    alt: 'Le village du Monastère, son clocher et ses toits, vus du coteau',
    credit: ASSOCIATION,
    motsCles: ['bourg', 'coteau', 'clocher', 'panorama'],
  },
}

/**
 * Titre de repli, déduit du nom de fichier.
 *
 * `/img/archive-vieux-pont.jpg` → « Archive vieux pont ». Ce n'est pas une
 * légende, mais c'est lisible dans une planche, et ça vaut mieux que le chemin
 * brut pour une image que personne n'a encore décrite.
 */
export function titreParDefaut(src: string): string {
  const nom = src.split('/').pop()?.replace(/\.[^.]+$/, '') ?? src
  const mots = nom.replace(/[-_]+/g, ' ').trim()
  return mots.charAt(0).toUpperCase() + mots.slice(1)
}

/**
 * Assemble l'inventaire, les légendes du code et celles de la base.
 *
 * L'ordre est celui de la priorité : la base l'emporte sur le code, le code sur
 * le repli. Une ligne de base qui désigne un fichier disparu est ignorée — on
 * ne propose pas une image que le dossier ne contient plus.
 */
export function composerPhototheque(
  fichiers: FichierImage[],
  base: Record<string, Partial<LegendeImage>> = {},
): Image[] {
  return fichiers.map((f) => {
    const duCode = LEGENDES[f.src]
    const deLaBase = base[f.src]
    const legende: LegendeImage = {
      titre: deLaBase?.titre?.trim() || duCode?.titre || titreParDefaut(f.src),
      alt: deLaBase?.alt?.trim() || duCode?.alt || '',
      credit: deLaBase?.credit?.trim() || duCode?.credit || '',
      motsCles: deLaBase?.motsCles?.length ? deLaBase.motsCles : (duCode?.motsCles ?? []),
    }
    return {
      ...f,
      ...legende,
      source: deLaBase ? 'base' : duCode ? 'code' : 'nue',
    }
  })
}

/**
 * Recherche sur le nom de fichier, le titre, le texte alternatif et les
 * mots-clés. Les accents sont ignorés : « eglise » trouve « église ».
 */
export function chercherImages(images: Image[], requete: string): Image[] {
  const q = sansAccent(requete)
  if (!q) return images
  const mots = q.split(/\s+/).filter(Boolean)
  return images.filter((i) => {
    const foin = sansAccent([i.src, i.titre, i.alt, i.credit, ...i.motsCles].join(' '))
    return mots.every((m) => foin.includes(m))
  })
}

function sansAccent(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/** « 1 920 × 2 880 · 445 ko », pour l'afficher sous une vignette. */
export function formatDimensions(i: FichierImage): string {
  const taille = i.octets >= 1024 * 1024
    ? `${(i.octets / 1024 / 1024).toFixed(1)} Mo`
    : `${Math.round(i.octets / 1024)} ko`
  if (!i.largeur || !i.hauteur) return taille
  return `${i.largeur} × ${i.hauteur} · ${taille}`
}
