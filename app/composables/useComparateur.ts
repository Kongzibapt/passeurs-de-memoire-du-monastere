import type { Monument } from '~/data/patrimoine'

/**
 * Onglet actif du comparateur « autrefois · aujourd'hui ».
 *
 * Deux sections éloignées dans la page se partagent cet état : les liens
 * « L'abbaye autrefois et aujourd'hui » des planches patrimoine, et le
 * comparateur lui-même. Passer par `useState` évite de les faire dialoguer par
 * le DOM (`document.querySelector(...).click()`, comme dans la maquette) et
 * garde la sélection cohérente pendant le rendu serveur.
 */
export function useComparateur() {
  const actif = useState<Monument['cle']>('comparateur', () => 'pont')

  /** Ouvre l'onglet d'un monument ; l'ancre `#autrefois` fait le déplacement. */
  function selectionner(cle: Monument['cle']) {
    actif.value = cle
  }

  return { actif, selectionner }
}
