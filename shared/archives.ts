/**
 * Modèle partagé du fonds d'archives + contenu de départ.
 *
 * Les documents sont posés en désordre sur la section « Ce que les greniers ont
 * conservé » : chacun reçoit une position de grille et une légère rotation,
 * décrites par les classes `.doc.d1` … `.doc.d6` de la charte. La mise en page
 * ne connaît donc que six emplacements, repris cycliquement au-delà (voir
 * `classePosition`) — le tas s'allonge, la composition reste celle de la
 * maquette.
 */

export interface Archive {
  /** `seed:<index>` pour le contenu du code, uuid pour la base. */
  id: string
  src: string
  alt: string
  /** Titre en gras de la légende. */
  titre: string
  /**
   * Suite de la légende, reprise telle quelle depuis la maquette — séparateur
   * « · » compris, car `.cap b` est en `display:block` : ce texte forme la
   * deuxième ligne de la légende et commence donc par son propre séparateur.
   */
  legende: string
  /** Ordre d'affichage dans le tas (croissant). */
  ordre: number
  source: 'seed' | 'db'
}

/** Nombre d'emplacements décrits par la charte (`.doc.d1` … `.doc.d6`). */
export const EMPLACEMENTS = 6

/** Classe de position d'un document selon son rang dans le tas. */
export function classePosition(index: number): string {
  return `d${(index % EMPLACEMENTS) + 1}`
}

export function trierArchives(liste: Archive[]): Archive[] {
  return [...liste].sort((a, b) => a.ordre - b.ordre)
}

export const SEED_ARCHIVES: Archive[] = [
  {
    id: 'seed:vue-generale',
    src: '/img/archive-vue-generale.jpg',
    alt: 'Carte postale ancienne : vue générale du Monastère-sur-Rodez',
    titre: 'Le Monastère-sur-Rodez',
    legende: '· vue générale · imp. Carrère, Rodez',
    ordre: 1,
    source: 'seed',
  },
  {
    id: 'seed:vieux-pont',
    src: '/img/archive-vieux-pont.jpg',
    alt: 'Carte postale ancienne : le vieux pont du Monastère',
    titre: 'Le Monastère près Rodez — Vieux Pont',
    legende: '· imp. P. Carrère, Rodez',
    ordre: 2,
    source: 'seed',
  },
  {
    id: 'seed:rue',
    src: '/img/archive-rue.jpg',
    alt: 'Carte postale ancienne : une rue à colombages du Monastère',
    titre: 'Une rue du bourg',
    legende: '· maisons à colombages · éd. CIM',
    ordre: 3,
    source: 'seed',
  },
  {
    id: 'seed:vue-aerienne',
    src: '/img/archive-vue-aerienne.jpg',
    alt: "Vue aérienne ancienne du village autour de l'église",
    titre: 'Vue aérienne',
    legende: "· le bourg autour de l'église",
    ordre: 4,
    source: 'seed',
  },
  {
    id: 'seed:maisons-riviere',
    src: '/img/archive-maisons-riviere.jpg',
    alt: "Photographie ancienne : maisons et galeries de bois au bord de l'Aveyron",
    titre: 'Maisons sur la rivière',
    legende: "· galeries de bois au-dessus de l'eau",
    ordre: 5,
    source: 'seed',
  },
  {
    id: 'seed:abbaye-coteau',
    src: '/img/archive-abbaye-coteau.jpg',
    alt: 'Carte postale ancienne : le Monastère-sous-Rodez et son abbaye vus du coteau',
    titre: 'Le Monastère-sous-Rodez',
    legende: "L'abbaye vue du coteau. E. Carrère imp.-éd., Rodez.",
    ordre: 6,
    source: 'seed',
  },
]
