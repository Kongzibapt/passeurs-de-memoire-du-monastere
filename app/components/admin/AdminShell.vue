<script setup lang="ts">
/**
 * Coque commune aux pages du back-office : barre supérieure et `noindex`
 * systématique.
 *
 * Deux rubriques seulement, en gros : Événements et Photothèque. Les réglages,
 * qu'on touche une fois par an, restent en petit dans un coin.
 *
 * Le back-office est volontairement en Tailwind pur, sans la charte du site :
 * c'est un outil interne, pas une page publique, et le distinguer d'un coup
 * d'œil évite de confondre une prévisualisation avec le site réel.
 */
defineProps<{ titre?: string }>()

const route = useRoute()
const RUBRIQUES = [
  { to: '/admin/evenements', libelle: 'Événements' },
  { to: '/admin/phototheque', libelle: 'Photothèque' },
]

useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const deconnexion = ref(false)
async function seDeconnecter() {
  deconnexion.value = true
  try {
    await $fetch('/api/admin/logout', { method: 'POST' })
    await navigateTo('/admin')
  } finally {
    deconnexion.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#f4f5f6] font-body text-slate-900">
    <header class="sticky top-0 z-20 bg-slate-900 text-white">
      <!-- Réglages et déconnexion : en petit, en haut à droite -->
      <div class="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 pt-3 lg:px-8">
        <NuxtLink to="/admin" class="flex items-center gap-3" :aria-label="titre ? `Accueil du back-office — ${titre}` : 'Accueil du back-office'">
          <img src="/assets/emblem.svg" alt="" class="h-9 w-9">
          <span class="hidden font-display text-[13px] font-bold uppercase tracking-[0.18em] text-white/70 sm:inline">
            Back-office
          </span>
        </NuxtLink>
        <div class="flex items-center gap-4 text-[14px]">
          <NuxtLink
            to="/admin/reglages"
            class="text-white/60 underline-offset-4 transition-colors hover:text-white hover:underline"
            :class="{ 'text-white underline': route.path === '/admin/reglages' }"
          >
            Réglages
          </NuxtLink>
          <button
            type="button"
            class="whitespace-nowrap rounded-full border border-white/25 px-3.5 py-1 font-semibold text-white/80 transition-colors hover:border-white hover:text-white disabled:opacity-50"
            :disabled="deconnexion"
            @click="seDeconnecter"
          >
            {{ deconnexion ? '…' : 'Se déconnecter' }}
          </button>
        </div>
      </div>

      <!-- Les deux rubriques -->
      <nav class="mx-auto flex max-w-[1400px] gap-2 px-5 pt-3 lg:px-8" aria-label="Rubriques">
        <NuxtLink
          v-for="r in RUBRIQUES"
          :key="r.to"
          :to="r.to"
          class="rounded-t-xl px-5 py-3.5 text-[19px] font-bold transition-colors sm:px-6"
          :class="route.path.startsWith(r.to) ? 'bg-[#f4f5f6] text-slate-900' : 'text-white/80 hover:bg-white/10 hover:text-white'"
          :aria-current="route.path.startsWith(r.to) ? 'page' : undefined"
        >
          {{ r.libelle }}
        </NuxtLink>
      </nav>
    </header>

    <main class="mx-auto max-w-[1400px] px-5 py-8 lg:px-8 lg:py-10">
      <slot />
    </main>
  </div>
</template>
