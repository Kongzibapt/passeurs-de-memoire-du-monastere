/**
 * Comparateur « autrefois · aujourd'hui ».
 *
 * Trois jeux d'images superposées, l'ancienne dessous et la récente au-dessus,
 * découpée au curseur. Les `position` sont des `object-position` choisis vue par
 * vue : les deux clichés n'ont jamais tout à fait le même cadrage, et c'est ce
 * réglage qui fait coïncider le pont d'une image à l'autre.
 */

import type { Monument } from './patrimoine'

export interface Comparaison {
  cle: Monument['cle']
  /** Libellé de l'onglet. */
  onglet: string
  titre: string
  texte: string
  /** L'image ancienne, à gauche du curseur — `legende` se pose sous ce bord. */
  avant: { src: string; alt: string; position: string; legende: string }
  /** L'image récente, à droite — sa légende s'aligne sur le bord droit. */
  apres: { src: string; alt: string; position: string; legende: string }
}

export const COMPARAISONS: Comparaison[] = [
  {
    cle: 'pont',
    onglet: 'Le pont',
    titre: "Le même pont, à un siècle d'écart",
    texte:
      "Faites glisser la ligne : à gauche la carte postale du vieux pont, à droite la même vue aujourd'hui. Les arches n'ont pas bougé. Le reste, si.",
    avant: {
      src: '/img/archive-pont-malzac.jpg',
      alt: 'Le pont du Monastère sur une carte postale ancienne',
      position: '50% 58%',
      legende:
        '<b>À gauche</b> · « 205. Le Pont du Monastère, sous Rodez (Aveyron) », H. Malzac éd., 12 rue Neuve, Rodez · carte postale, collection de l&rsquo;association',
    },
    apres: {
      src: '/img/pont-aujourdhui.jpg',
      alt: "Le pont du Monastère aujourd'hui",
      position: '38% 50%',
      legende: '<b>À droite</b> · le pont en août 2026',
    },
  },
  {
    cle: 'eglise',
    onglet: "L'église",
    titre: "L'église, avant les toits d'aujourd'hui",
    texte:
      "Le clocher et la nef occupent toujours la même place. Autour, le bourg s'est épaissi et la colline s'est couverte de maisons.",
    avant: {
      src: '/img/archive-eglise-village.jpg',
      alt: 'Le village du Monastère et son église sur une carte postale ancienne',
      position: '42% 55%',
      legende:
        '<b>À gauche</b> · vue du bourg et de l&rsquo;église · éd. Chéojac · carte postale, collection de l&rsquo;association',
    },
    apres: {
      src: '/img/eglise-village-2026.jpg',
      alt: "Le bourg du Monastère et son église aujourd'hui",
      position: '50% 40%',
      legende: '<b>À droite</b> · le bourg et son église, 2026 · cadrages différents',
    },
  },
  {
    cle: 'abbaye',
    onglet: "L'abbaye",
    titre: "L'abbaye, vue du coteau",
    texte:
      "Les bâtiments monastiques et leurs jardins en terrasses, tels qu'une carte postale du début du siècle les montre, et tels qu'on les voit aujourd'hui.",
    avant: {
      src: '/img/archive-abbaye-coteau.jpg',
      alt: 'Le Monastère-sous-Rodez et son abbaye sur une carte postale ancienne',
      position: '50% 55%',
      legende:
        '<b>À gauche</b> · « 98. Le Monastère-sous-Rodez », E. Carrère imp.-éd., Rodez · carte postale, collection de l&rsquo;association',
    },
    apres: {
      src: '/img/abbaye-2012.jpg',
      alt: "L'abbaye du Monastère en 2012",
      position: '50% 50%',
      legende: '<b>À droite</b> · l&rsquo;abbaye en 2012 · cadrages différents',
    },
  },
]


/** Intro de la section, avant tout clic sur un onglet. */
export const INTRO_INITIALE = {
  titre: "Le même pont, à un siècle d'écart",
  texte:
    "Faites glisser la ligne : à gauche la carte postale du vieux pont, à droite la même vue aujourd'hui. Les arches sont restées les mêmes. Le reste a changé.",
}
