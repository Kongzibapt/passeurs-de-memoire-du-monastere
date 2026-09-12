/**
 * « La rivière du temps » — les repères de la frise chronologique.
 *
 * L'ordre du tableau est celui du courant : chaque jalon est placé à intervalle
 * régulier le long du tracé de la rivière, du premier au dernier. Ajouter un
 * repère redistribue donc automatiquement les pierres du gué.
 *
 * Source : notices du Service Patrimoine de Rodez Agglomération, complétées par
 * la commission patrimoine de l'association.
 */

export interface Jalon {
  /** Date affichée (HTML inline autorisé pour les exposants de siècle). */
  date: string
  titre: string
  texte: string
}

export const JALONS: Jalon[] = [
  {
    date: '878',
    titre: "L'abbaye royale",
    texte: "Un texte en faveur de l'abbesse Karissime atteste la première abbaye de femmes du Rouergue.",
  },
  {
    date: 'XII<sup>e</sup>–XIV<sup>e</sup> s.',
    titre: "L'église",
    texte: "Le prieuré Saint-Étienne, fondé par l'abbaye, devient église paroissiale.",
  },
  {
    date: '1339',
    titre: 'Le pont Vieux',
    texte: "Le comte de Rodez fait bâtir le pont ; le bourg se développe sur l'autre rive.",
  },
  {
    date: '1792–1793',
    titre: "La fin de l'abbaye",
    texte: "La dernière abbesse quitte les lieux ; le District de Rodez fait abattre l'église et le cloître.",
  },
  {
    date: '1856',
    titre: 'La Compagnie de Marie Notre Dame',
    texte: 'La Compagnie de Marie achète les bâtiments restés intacts et y établit son couvent.',
  },
  {
    date: '2006',
    titre: 'Les 2 dernières sœurs de la Compagnie de Marie Notre Dame',
    texte: "Le 11 juillet, les deux dernières sœurs quittent l'abbaye pour Toulouse.",
  },
]

/**
 * Tracé de la rivière, dans le repère 0 0 1200 300 du SVG.
 *
 * Reprise exacte du `const D` de `site/frise.js` : la courbe porte à la fois le
 * lit (trait clair), le fil d'eau animé et la portion parcourue, et c'est elle
 * qui fixe la position de chaque pierre via `getPointAtLength`.
 */
export const TRACE_RIVIERE =
  'M40,168 C150,74 262,62 372,144 S572,252 692,178 S892,66 1012,128 S1142,196 1160,162'
