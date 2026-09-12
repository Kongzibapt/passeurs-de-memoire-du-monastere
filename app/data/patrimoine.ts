/**
 * Les trois monuments fondateurs et le bourg qui s'est bâti avec eux.
 *
 * Contenu historique figé : il vient des notices du Service Patrimoine de Rodez
 * Agglomération relues par la commission patrimoine de l'association, pas du
 * back-office. Le HTML des paragraphes est volontairement autorisé — il ne
 * transporte que des exposants de siècle (`XIV<sup>e</sup>`) et des guillemets.
 */

export interface Monument {
  /** Clé de liaison avec le comparateur « autrefois / aujourd'hui ». */
  cle: 'abbaye' | 'eglise' | 'pont'
  /** Classe de mise en page de la planche (`.pq-abbaye`, `.pq-eglise`, `.pq-pont`). */
  classe: string
  /** Siècle affiché en gros, en Newsreader italique. */
  siecle: string
  titre: string
  /** Question d'accroche, en exergue sous le titre. */
  accroche: string
  /** Corps du texte, un élément par paragraphe (HTML inline autorisé). */
  paragraphes: string[]
  lienDetail: string
  image: {
    src: string
    alt: string
    /** Titre en gras de la légende. */
    titre: string
    /** Suite de la légende. */
    legende: string
    credit: string
    /** Surcharge d'`object-position` quand le cadrage par défaut ne convient pas. */
    position?: string
  }
}

export const MONUMENTS: Monument[] = [
  {
    cle: 'abbaye',
    classe: 'pq-abbaye',
    siecle: 'IX<sup>e</sup> s.',
    titre: "L'abbaye",
    accroche: "Pourquoi le village porte-t-il le nom d'un monastère ?",
    paragraphes: [
      "Un texte de 878, en faveur de l'abbesse Karissime, atteste l'existence de l'abbaye royale Saint-Sernin : la première abbaye de femmes du Rouergue, construite par l'ordre des Bénédictines à proximité d'un passage sur l'Aveyron. Le bourg doit son nom et son existence à cette abbaye prestigieuse, placée aussi sous la protection de sainte Tarcisse.",
      "Les familles nobles du Rouergue y plaçaient leurs filles ; l'abbaye abrita jusqu'à cinquante religieuses au XIV<sup>e</sup> siècle. Détruite pour l'essentiel après la révolution, il n'en subsiste que le corps de bâtiment cantonné de deux tourelles, édifié entre 1630 et 1643 et remanié au XVIII<sup>e</sup> siècle, et une maison assise sur des substructions médiévales. Les deux dernières religieuses de la Compagnie de Marie Notre-Dame quittèrent les lieux le 11 juillet 2006.",
    ],
    lienDetail: "L'abbaye autrefois et aujourd'hui",
    image: {
      src: '/img/abbaye-parc.jpg',
      alt: "L'abbaye du Monastère, ses deux tours et son parc",
      titre: "L'abbaye depuis le parc",
      legende: 'La façade sud et ses deux tours.',
      credit: "Photo de l'association",
    },
  },
  {
    cle: 'eglise',
    classe: 'pq-eglise',
    siecle: 'XII<sup>e</sup> s.',
    titre: "L'église",
    accroche: "Que reste-t-il du prieuré fondé par l'abbaye ?",
    paragraphes: [
      "Prieuré fondé au XII<sup>e</sup> siècle par l'abbaye du Monastère sous le vocable Saint-Étienne, l'église devient paroissiale au XIV<sup>e</sup> siècle, époque à laquelle elle est également placée sous la protection de saint Blaise, protecteur des corps de métier liés à la laine.",
      "L'église initiale comptait sans doute trois travées et ouvrait par un portail au sud. Elle fut agrandie d'un vaisseau au nord et pourvue d'un second portail : celui du Nord pour recevoir la communauté des paroissiens, celui du sud pour les religieuses Bénédictines de l'abbaye. La tour-clocher, percée d'archères cruciformes, et le niveau de refuge établi au-dessus des nefs derrière un parapet crénelé lui donnent un caractère défensif ostentatoire.",
    ],
    lienDetail: "L'église autrefois et aujourd'hui",
    image: {
      src: '/img/eglise-place.jpg',
      alt: "L'église du Monastère vue de la place : clocher, nef et portail",
      titre: "L'église, depuis la place",
      legende: 'Le clocher, le portail nord et le niveau de refuge au-dessus de la nef.',
      credit: "Photo de l'association",
      position: '50% 42%',
    },
  },
  {
    cle: 'pont',
    classe: 'pq-pont',
    siecle: 'XIV<sup>e</sup> s.',
    titre: 'Le pont Vieux',
    accroche: 'Qui passait sous ces arches ?',
    paragraphes: [
      "Cinq arches en plein cintre franchissent l'Aveyron « en dos d'âne », avec des refuges pour les piétons et des piles reposant sur des socles de pierre en forme de crèche. En 1339, le comte de Rodez fait bâtir un pont pour concurrencer la route vers Millau, favorisée par celui de l'évêque à Layoule. Le bourg gagne alors l'autre rive.",
      "Le long de l'Aveyron s'installent les métiers de la peau et de la laine : tanneries, fabricants de chapeaux de feutre, moulins à tan et à foulons. La croix au sommet du parapet est la copie d'une élégante croix en grès rose, placée là vraisemblablement au XVI<sup>e</sup> siècle. Le pont porte encore la circulation quotidienne du village, et c'est de lui que nous possédons le plus de vues anciennes : cartes postales, tirages de famille, plaques de verre.",
    ],
    lienDetail: "Le pont autrefois et aujourd'hui",
    image: {
      src: '/img/pont-panorama.jpg',
      alt: "Le pont Vieux du Monastère et ses arches reflétées dans l'Aveyron",
      titre: 'Le pont Vieux et son reflet',
      legende: "Cinq arches en plein cintre sur l'Aveyron, en amont du bourg.",
      credit: "Photo de l'association, août 2026",
    },
  },
]

/** « Et autour ? » — le bourg qui s'est bâti avec les trois monuments. */
export const AUTOUR: { titre: string; texte: string }[] = [
  {
    titre: 'Rue Droite',
    texte:
      'Deux maisons à façades en encorbellements construites en pan-de-bois, comparables à celles de Calmont-de-Plancatge datées par dendrochronologie vers 1440-1450.',
  },
  {
    titre: 'Avenue des Arcades',
    texte:
      "Aux n° 1 et 5, la plus importante demeure du Monastère, édifiée vers 1500 : une ancienne hôtellerie à l'angle des deux axes majeurs du bourg, face au pont.",
  },
  {
    titre: 'La tannerie Arnal',
    texte:
      'En activité depuis 1880, seule survivante des industries traditionnelles de la couronne ruthénoise. Elle produit des cuirs de bovins pour la sellerie, la maroquinerie et la chaussure.',
  },
  {
    titre: 'Le domaine de Combelles',
    texte:
      "Demeure seigneuriale du début de la Renaissance, monumentalisée au XIX<sup>e</sup> siècle. Vers 1860, il fut utilisé brièvement comme centre de redressement pour enfants. Lieu d'expérimentations agricoles menées par Adolphe Boisse, puis par Henri Julia, gendre d'Antoine Joseph Durand de Gros.",
  },
]

/** « Pourquoi adhérer ? » — les trois raisons de la bande terre cuite. */
export const RAISONS: string[] = [
  "Vous venez d'arriver au village et vous voulez comprendre où vous habitez.",
  "Vous connaissez une histoire, une photo, un nom que personne n'a encore notés.",
  "Vous avez deux heures à donner de temps en temps, et l'envie de le faire ensemble.",
]
