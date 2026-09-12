<script setup lang="ts">
import { associationLd } from '~/utils/structuredData'

const route = useRoute()
const { public: { siteUrl } } = useRuntimeConfig()
const base = siteUrl.replace(/\/$/, '')

useHead({
  // URL canonique (dynamique selon la page visitée).
  link: [{ rel: 'canonical', href: computed(() => base + route.path) }],
  // Données structurées de l'association, présentes sur toutes les pages.
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(associationLd(siteUrl)),
    },
  ],
})

// Marque le document comme hydraté une fois l'application cliente montée.
// La suite E2E attend ce drapeau avant de cliquer (voir tests/e2e/helpers.ts) :
// sans lui, un test peut appuyer sur un bouton que Vue n'écoute pas encore.
onMounted(() => {
  document.documentElement.dataset.hydrated = 'true'
})
</script>

<template>
  <NuxtPage />
</template>
