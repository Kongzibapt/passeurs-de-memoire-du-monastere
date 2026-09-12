/**
 * Coordonnées et constantes de l'association.
 *
 * Source unique : ces valeurs apparaissent dans l'en-tête, le pied de page, les
 * liens `mailto:`, l'e-mail de notification du formulaire et les données
 * structurées. Les modifier ici les change partout.
 */

export const ASSOCIATION = {
  nom: 'Les Passeurs de Mémoire du Monastère',
  /** Le nom tel qu'il s'affiche sur deux lignes dans la marque du site. */
  nomLigne1: 'Les Passeurs de Mémoire',
  nomLigne2: 'du Monastère',
  email: 'lespasseursdememoire12@gmail.com',
  adresse: {
    ligne1: 'Mairie du Monastère',
    codePostal: '12000',
    ville: 'Le Monastère',
    pays: 'FR',
  },
  /** Commune du Monastère-sous-Rodez (Aveyron). */
  geo: { latitude: 44.3336, longitude: 2.5794 },
  baseline: 'Association de sauvegarde et de valorisation du patrimoine du Monastère (Aveyron).',
  devise: 'Chaque pierre du Monastère porte une voix. Notre rôle est de les écouter, et de les transmettre.',
} as const

/**
 * Lien d'adhésion HelloAsso par défaut.
 *
 * Il change à chaque campagne annuelle (« adhesion-2026 », « adhesion-2027»…),
 * d'où le réglage `url_adhesion` modifiable depuis le back-office : la valeur
 * ci-dessous n'est que le repli quand la base n'est pas configurée.
 */
export const URL_ADHESION_DEFAUT =
  'https://www.helloasso.com/associations/les-passeurs-de-memoire-du-monastere/adhesions/adhesion-2026'

/** Construit un lien `mailto:` vers l'association, avec objet pré-rempli. */
export function mailto(sujet?: string): string {
  const base = `mailto:${ASSOCIATION.email}`
  return sujet ? `${base}?subject=${encodeURIComponent(sujet)}` : base
}
