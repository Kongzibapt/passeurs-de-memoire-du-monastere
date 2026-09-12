import { ASSOCIATION } from '#shared/association'

/**
 * Données structurées (schema.org) de l'association.
 *
 * Servent à Google pour relier le site à une entité réelle : une organisation
 * à but non lucratif, située au Monastère, qui s'occupe de trois monuments
 * identifiés. Les `LandmarksOrHistoricalBuildings` associés donnent au moteur
 * les objets dont le site parle, ce qu'un simple texte ne dit pas explicitement.
 */
export function associationLd(siteUrl: string) {
  const base = siteUrl.replace(/\/$/, '')
  return {
    '@context': 'https://schema.org',
    '@type': 'NGO',
    '@id': `${base}/#association`,
    name: ASSOCIATION.nom,
    alternateName: 'Les Passeurs de Mémoire',
    description: ASSOCIATION.baseline,
    url: base,
    email: ASSOCIATION.email,
    logo: `${base}/assets/logo-officiel.png`,
    // Le numéro RNA rattache le site à l'association déclarée en préfecture ;
    // c'est l'identifiant le plus fiable dont dispose une association loi 1901.
    identifier: ASSOCIATION.rna,
    slogan: ASSOCIATION.devise,
    address: {
      '@type': 'PostalAddress',
      streetAddress: ASSOCIATION.adresse.ligne1,
      postalCode: ASSOCIATION.adresse.codePostal,
      addressLocality: ASSOCIATION.adresse.ville,
      addressRegion: 'Aveyron',
      addressCountry: ASSOCIATION.adresse.pays,
    },
    areaServed: {
      '@type': 'Place',
      name: 'Le Monastère (Aveyron)',
      geo: {
        '@type': 'GeoCoordinates',
        latitude: ASSOCIATION.geo.latitude,
        longitude: ASSOCIATION.geo.longitude,
      },
    },
    knowsAbout: [
      'Patrimoine du Monastère',
      'Abbaye royale Saint-Sernin du Monastère',
      "Église Saint-Étienne du Monastère",
      'Pont Vieux du Monastère',
      'Histoire du Rouergue',
    ],
    subjectOf: [
      {
        '@type': 'LandmarksOrHistoricalBuildings',
        name: "L'abbaye du Monastère",
        description:
          "Abbaye royale Saint-Sernin, première abbaye de femmes du Rouergue, attestée en 878.",
      },
      {
        '@type': 'LandmarksOrHistoricalBuildings',
        name: "L'église du Monastère",
        description:
          "Prieuré Saint-Étienne fondé au XIIe siècle, église paroissiale au XIVe siècle, à la tour-clocher défensive.",
      },
      {
        '@type': 'LandmarksOrHistoricalBuildings',
        name: 'Le pont Vieux du Monastère',
        description:
          "Pont à cinq arches en plein cintre sur l'Aveyron, bâti à partir de 1339 par le comte de Rodez.",
      },
    ],
  }
}

/**
 * Fil d'Ariane d'une page intérieure. Google l'affiche à la place de l'URL dans
 * les résultats, ce qui vaut mieux qu'un chemin brut.
 */
export function filAriane(siteUrl: string, pages: { nom: string; chemin: string }[]) {
  const base = siteUrl.replace(/\/$/, '')
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ nom: 'Accueil', chemin: '/' }, ...pages].map((page, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: page.nom,
      item: `${base}${page.chemin}`,
    })),
  }
}
