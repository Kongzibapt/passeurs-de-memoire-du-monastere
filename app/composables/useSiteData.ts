import { URL_ADHESION_DEFAUT } from '#shared/association'
import type { Evenement } from '#shared/evenements'
import type { Archive } from '#shared/archives'
import type { Reglages } from '~~/server/utils/reglages'

/**
 * Accès aux trois jeux de données que le site public partage entre ses pages.
 *
 * `useAsyncData` est nommé et donc mutualisé : l'accueil et la page Actualités
 * demandent toutes deux les événements, mais un seul appel part au serveur, et
 * le résultat traverse l'hydratation par le payload plutôt que d'être redemandé
 * dans le navigateur.
 *
 * Chaque route renvoie déjà le contenu de la maquette quand Supabase n'est pas
 * configuré : le `default` n'a donc à couvrir que l'échec réseau.
 */

export function useEvenements() {
  return useAsyncData<Evenement[]>('evenements', () => $fetch('/api/evenements'), {
    default: () => [],
  })
}

export function useArchives() {
  return useAsyncData<Archive[]>('archives', () => $fetch('/api/archives'), {
    default: () => [],
  })
}

/**
 * Réglages du site. `urlAdhesion` est lu par tous les boutons « Adhérer » : on
 * garantit donc une valeur utilisable en toute circonstance, y compris si la
 * requête échoue.
 */
export function useReglages() {
  const { data } = useAsyncData<Reglages>('reglages', () => $fetch('/api/reglages'), {
    default: () => ({ url_adhesion: URL_ADHESION_DEFAUT }),
  })
  const urlAdhesion = computed(() => data.value?.url_adhesion || URL_ADHESION_DEFAUT)
  return { reglages: data, urlAdhesion }
}
