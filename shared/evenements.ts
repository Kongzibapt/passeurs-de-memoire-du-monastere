/**
 * Modèle partagé des événements + contenu de départ.
 *
 * Un seul objet décrit tout le cycle de vie d'un rendez-vous :
 *  - tant que sa date n'est pas passée, il s'affiche dans « À venir » (page
 *    Actualités) et dans « Rendez-vous » (accueil) ;
 *  - une fois la date passée, il bascule tout seul dans « C'était chez nous »
 *    s'il porte un bloc `souvenir`, et disparaît sinon.
 *
 * Ce basculement est la transposition de `site/evts.js` dans la maquette, qui
 * retirait les `.evt` périmés au chargement : le site ne peut donc pas annoncer
 * une date dépassée, même sans intervention.
 *
 * `SEED_EVENEMENTS` est le contenu de la maquette. Il reste toujours affiché
 * (voir server/utils/evenements.ts) ; la base Supabase vient s'y ajouter, et
 * l'emporte à `slug` égal — le back-office peut donc corriger un événement
 * fondateur sans redéploiement.
 */

import { mailto } from '#shared/association'

export interface EtapeProgramme {
  /** Heure affichée telle quelle : « 14h30 ». */
  heure: string
  /** Ce qui se passe à cette heure-là. */
  quoi: string
}

export interface PhotoSouvenir {
  src: string
  alt: string
  /** Titre en gras de la légende. */
  titre: string
  /** Crédit affiché sous le titre. */
  credit?: string
}

export interface Souvenir {
  /** Récit de l'événement passé. */
  recit: string
  /** Question ouverte mise en exergue (italique, filet terre cuite). */
  question?: string
  photos: PhotoSouvenir[]
  cta?: LienCta
}

export interface LienCta {
  label: string
  /**
   * Destination. Deux raccourcis sont résolus à l'affichage par `hrefCta()` :
   *  - `adhesion` → l'URL HelloAsso courante (réglage `url_adhesion`), qui
   *    change à chaque campagne annuelle ;
   *  - `mailto:?sujet=…` → l'adresse de l'association avec cet objet.
   * Toute autre valeur est utilisée telle quelle.
   */
  href: string
  /** `primary` = bouton plein terre cuite ; `secondary` = bouton contour. */
  variant?: 'primary' | 'secondary'
}

/** Résout les raccourcis de `LienCta.href` en URL réelle. */
export function hrefCta(cta: LienCta, urlAdhesion: string): string {
  if (cta.href === 'adhesion') return urlAdhesion
  if (cta.href.startsWith('mailto:?sujet=')) {
    return mailto(cta.href.slice('mailto:?sujet='.length))
  }
  return cta.href
}

/** Vrai pour un lien qui sort du site (à ouvrir dans un nouvel onglet). */
export function estLienExterne(href: string): boolean {
  return /^https?:\/\//.test(href)
}

export interface Evenement {
  /** `seed:<slug>` pour le contenu du code, uuid pour la base. */
  id: string
  slug: string
  /**
   * Date de l'événement (ISO `YYYY-MM-DD`). Elle fait tout : elle décide du
   * basculement à venir / souvenir, et c'est d'elle qu'est tiré le libellé
   * affiché (voir `libelleDate`). Rien n'est saisi à la main, donc rien ne peut
   * diverger d'un écran à l'autre.
   */
  date: string
  /** Surtitre sous la date : lieu ou cadre national de l'événement. */
  cadre: string
  titre: string
  /** Titre raccourci pour la liste de l'accueil (défaut : `titre`). */
  titreAccueil?: string
  /** Résumé affiché sur l'accueil. */
  resume: string
  /** Présentation complète, page Actualités. */
  description: string
  programme: EtapeProgramme[]
  /** Bouton de l'événement sur la page Actualités. */
  cta?: LienCta
  /** Bloc « souvenir », affiché une fois la date passée. */
  souvenir?: Souvenir
  source: 'seed' | 'db'
}

/**
 * Met une date ISO en français : « Samedi 21 novembre 2026 ».
 *
 * Un seul format pour tout le site — accueil, page Actualités et souvenirs.
 * Le calculer plutôt que le saisir est ce qui garantit qu'il le reste : un
 * libellé écrit à la main finit toujours par diverger d'un écran à l'autre, et
 * personne ne s'en aperçoit avant de voir les deux côte à côte.
 *
 * La date est lue en UTC de bout en bout. `new Date('2026-11-21')` est minuit
 * UTC ; l'interpréter dans un fuseau à l'ouest reculerait l'affichage d'un jour,
 * et un rendez-vous s'annoncerait la veille pour un visiteur en voyage.
 */
export function libelleDate(iso: string): string {
  const [annee, mois, jour] = iso.split('-').map(Number)
  if (!annee || !mois || !jour) return iso

  const parties = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).formatToParts(new Date(Date.UTC(annee, mois - 1, jour)))

  const texte = parties
    .map((p) =>
      // Le français ordinalise le premier jour du mois, et lui seul :
      // « 1er janvier », mais « 2 janvier ».
      p.type === 'day' && p.value === '1' ? '1er' : p.value,
    )
    .join('')

  return texte.charAt(0).toUpperCase() + texte.slice(1)
}

/** Date du jour au format ISO court, en heure de Paris. */
export function aujourdhuiISO(maintenant = new Date()): string {
  return new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(maintenant)
}

/** Événements encore à venir (date du jour incluse), du plus proche au plus lointain. */
export function aVenir(liste: Evenement[], jour = aujourdhuiISO()): Evenement[] {
  return liste.filter((e) => e.date >= jour).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Événements passés porteurs d'un souvenir, dans l'ordre où ils ont eu lieu.
 *
 * L'année, elle, se lit à l'envers (voir `souvenirsParAnnee`) : on descend le
 * temps d'année en année, mais à l'intérieur d'une année on raconte la saison
 * dans l'ordre — c'est la présentation de la maquette, et celle d'un album.
 */
export function souvenirs(liste: Evenement[], jour = aujourdhuiISO()): Evenement[] {
  return liste.filter((e) => e.date < jour && !!e.souvenir).sort((a, b) => a.date.localeCompare(b.date))
}

/** Regroupe les souvenirs par année, la plus récente d'abord. */
export function souvenirsParAnnee(liste: Evenement[], jour = aujourdhuiISO()) {
  const groupes = new Map<string, Evenement[]>()
  for (const e of souvenirs(liste, jour)) {
    const annee = e.date.slice(0, 4)
    groupes.set(annee, [...(groupes.get(annee) ?? []), e])
  }
  return [...groupes.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([annee, evenements]) => ({ annee, evenements }))
}

// ---------------------------------------------------------------------------
// Contenu de la maquette
// ---------------------------------------------------------------------------

export const SEED_EVENEMENTS: Evenement[] = [
  {
    id: 'seed:nuit-des-eglises-2026',
    slug: 'nuit-des-eglises-2026',
    date: '2026-07-03',
    cadre: "Nuit des églises",
    titre: 'Nuit des églises',
    resume:
      "Une soirée dans l'église du village : un concert, le drap mortuaire des tanneurs sorti des réserves, et une micro-conférence sur l'art sacré.",
    description:
      "Une soirée dans l'église du village : un concert, le drap mortuaire des tanneurs sorti des réserves, et une micro-conférence sur l'art sacré.",
    programme: [],
    souvenir: {
      recit:
        "Une soirée dans l'église du village : un concert, le drap mortuaire des tanneurs sorti des réserves, et une micro-conférence sur l'art sacré.",
      question: 'Que faisait un drap mortuaire dans une confrérie de tanneurs ?',
      photos: [
        {
          src: '/img/affiche-nuit-des-eglises-2026.jpg',
          alt: "Affiche de la Nuit des églises 2026 : concert orgue, flûte traversière et chant à l'église Saint-Blaise du Monastère, le 3 juillet à 20h30, entrée libre",
          titre: "L'affiche de la soirée",
          credit: "Affiche de l'association",
        },
        {
          src: '/img/eglise-nef.jpg',
          alt: "L'église du Monastère pleine, lors de la Nuit des églises",
          titre: 'La nef, le 3 juillet',
          credit: "Photo de l'association",
        },
        {
          src: '/img/eglise-retable.jpg',
          alt: "Le retable doré de l'église pendant la présentation",
          titre: 'Le retable',
          credit: "Photo de l'association",
        },
        {
          src: '/img/concert-tribune.jpg',
          alt: "Les musiciens du concert à la tribune d'orgue de l'église du Monastère",
          titre: "Le concert, à la tribune d'orgue",
          credit: "Photo de l'association",
        },
        {
          src: '/img/conference-art-sacre.jpg',
          alt: "La micro-conférence sur l'art sacré, devant le retable de l'église",
          titre: "La micro-conférence sur l'art sacré",
          credit: "Photo de l'association",
        },
        {
          src: '/img/eglise-tympan.jpg',
          alt: "Le portail de l'église du Monastère",
          titre: 'Le portail',
          credit: "Photo de l'association",
        },
      ],
      cta: { label: 'Nous écrire à ce sujet', href: 'mailto:?sujet=Nuit des églises', variant: 'secondary' },
    },
    source: 'seed',
  },
  {
    id: 'seed:journee-des-associations-2026',
    slug: 'journee-des-associations-2026',
    date: '2026-08-29',
    cadre: 'Le Monastère',
    titre: 'Journée des associations',
    resume:
      'Nous y tenons un stand : venez nous rencontrer, poser vos questions et adhérer sur place.',
    description:
      "Nous tenons un stand aux côtés des associations de la commune : venez nous rencontrer, poser vos questions, découvrir les quatre commissions et adhérer sur place.",
    programme: [],
    cta: { label: 'Adhérer', href: 'adhesion', variant: 'primary' },
    souvenir: {
      recit:
        "Un stand aux côtés des associations de la commune : rencontres, questions du village, présentation des quatre commissions et premières adhésions signées sur place.",
      photos: [
        {
          src: '/img/affiche-journee-des-associations-2026.jpg',
          alt: "Affiche des Passeurs de Mémoire : « Vous habitez un village vieux de mille ans », au-dessus d'une vue du Monastère et de son église depuis les hauteurs boisées",
          titre: "L'affiche du stand",
          credit: "Affiche de l'association",
        },
      ],
      cta: {
        label: 'Vous avez des photos de la journée ?',
        href: 'mailto:?sujet=Photos journée des associations',
        variant: 'secondary',
      },
    },
    source: 'seed',
  },
  {
    id: 'seed:journees-du-patrimoine-2026',
    slug: 'journees-du-patrimoine-2026',
    date: '2026-09-20',
    cadre: 'Journées européennes du patrimoine',
    titre: 'Balade découverte du patrimoine du Monastère',
    titreAccueil: 'Balade découverte du patrimoine',
    resume:
      "Visite du village et de ses trois monuments, puis récolte de plantes et collation à l'abbaye. Le pont Vieux succède-t-il à un pont antique ? Histoire à suivre lors des Journées européennes du patrimoine.",
    description:
      "Une visite du village et de ses trois monuments fondateurs, puis une balade de récolte de plantes et une collation préparée ensemble à l'arrivée. Le pont Vieux, daté du XIV<sup>e</sup> siècle, succède-t-il à un pont antique surmonté d'un tablier de bois ? Histoire à suivre ce jour-là. Programme et horaires en préparation avec la mairie.",
    programme: [],
    cta: {
      label: 'Être prévenu',
      href: 'mailto:?sujet=Journées du patrimoine 2026',
      variant: 'secondary',
    },
    source: 'seed',
  },
  {
    id: 'seed:rencontres-patrimoine-2026',
    slug: 'rencontres-patrimoine-2026',
    date: '2026-11-21',
    cadre: 'Rencontres Patrimoine',
    titre: "Le Monastère : du bourg ancien aux quartiers d'aujourd'hui",
    resume:
      "Comment le village s'est-il transformé au fil des décennies ? Conférence, grand quiz, goûter, puis assemblée générale pour les membres à jour de leurs cotisations.",
    description: "Comment le village s'est-il transformé au fil des décennies ?",
    programme: [
      { heure: '14h30', quoi: 'Conférence' },
      { heure: '15h30', quoi: "Grand Quiz du Monastère : hier, aujourd'hui… demain !" },
      { heure: '17h', quoi: 'Goûter' },
      { heure: '17h45', quoi: 'AG pour les membres à jour de leurs cotisations' },
    ],
    cta: {
      label: 'Être prévenu',
      href: 'mailto:?sujet=Rencontres Patrimoine 21 novembre',
      variant: 'secondary',
    },
    source: 'seed',
  },
]
