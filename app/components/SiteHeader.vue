<script setup lang="ts">
import { ASSOCIATION } from '#shared/association'

/**
 * En-tête collant du site.
 *
 * Les entrées du menu ne sont pas les mêmes selon la page : sur l'accueil ce
 * sont des ancres, ailleurs ce sont des liens vers l'accueil suivis de la même
 * ancre, et la dernière entrée change (« Contact » sur l'accueil, où le
 * formulaire est présent ; « L'association » ailleurs). C'est exactement la
 * différence entre `index.html` et `actualites.html` dans la maquette.
 */
const { urlAdhesion } = useReglages()
const route = useRoute()

const surAccueil = computed(() => route.path === '/')

interface Entree {
  label: string
  /** Ancre sur l'accueil, ou chemin absolu. */
  cible: string
}

const entrees = computed<Entree[]>(() => [
  { label: 'Le patrimoine', cible: '#patrimoine' },
  { label: 'Autrefois', cible: '#autrefois' },
  { label: 'Archives', cible: '#archives' },
  { label: 'Actualités', cible: '/actualites' },
  surAccueil.value
    ? { label: 'Contact', cible: '#contact-form' }
    : { label: "L'association", cible: '#association' },
])

/** Une ancre reste relative sur l'accueil, et repasse par `/` ailleurs. */
function href(cible: string): string {
  if (!cible.startsWith('#')) return cible
  return surAccueil.value ? cible : `/${cible}`
}

const ouvert = ref(false)
</script>

<template>
  <header class="site-top">
    <div class="pad bar">
      <NuxtLink class="mark" to="/">
        <span>
          <span class="l1">{{ ASSOCIATION.nomLigne1 }}</span>
          <span class="l2">{{ ASSOCIATION.nomLigne2 }}</span>
        </span>
      </NuxtLink>

      <button
        class="burger"
        :aria-expanded="ouvert"
        aria-controls="menu"
        type="button"
        @click="ouvert = !ouvert"
      >
        Menu
      </button>

      <nav id="menu" class="menu" :class="{ open: ouvert }">
        <NuxtLink
          v-for="entree in entrees"
          :key="entree.label"
          :to="href(entree.cible)"
          :aria-current="entree.cible === route.path ? 'page' : undefined"
          @click="ouvert = false"
        >
          {{ entree.label }}
        </NuxtLink>
        <a
          class="btn btn-primary btn-sm"
          :href="urlAdhesion"
          target="_blank"
          rel="noopener"
          @click="ouvert = false"
        >
          Adhérer
        </a>
      </nav>
    </div>
  </header>
</template>
