<script setup lang="ts">
/**
 * Coque commune aux pages du back-office : barre supérieure (navigation,
 * retour au tableau de bord, déconnexion) et `noindex` systématique.
 *
 * Le back-office est volontairement en Tailwind pur, sans la charte du site :
 * c'est un outil interne, pas une page publique, et le distinguer d'un coup
 * d'œil évite de confondre une prévisualisation avec le site réel.
 */
withDefaults(defineProps<{ titre?: string; retour?: boolean }>(), { retour: true })

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
    <header class="sticky top-0 z-20 border-b border-black/10 bg-slate-900 text-white">
      <div class="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-5 py-3 lg:px-8">
        <div class="flex items-center gap-4">
          <NuxtLink to="/admin" class="flex items-center gap-3">
            <img src="/assets/emblem.svg" alt="" class="h-8 w-8">
            <span class="font-display text-[13px] font-bold uppercase tracking-[0.18em] text-white/80">
              Back-office
            </span>
          </NuxtLink>
          <span v-if="titre" class="hidden items-center gap-3 sm:flex">
            <span class="text-white/30">/</span>
            <span class="text-[14px] font-semibold">{{ titre }}</span>
          </span>
        </div>

        <div class="flex items-center gap-3">
          <NuxtLink
            to="/admin/evenements"
            class="hidden text-[13px] font-medium text-white/70 transition-colors hover:text-white sm:block"
          >
            Événements
          </NuxtLink>
          <NuxtLink
            to="/admin/archives"
            class="hidden text-[13px] font-medium text-white/70 transition-colors hover:text-white sm:block"
          >
            Archives
          </NuxtLink>
          <NuxtLink
            to="/admin/reglages"
            class="hidden text-[13px] font-medium text-white/70 transition-colors hover:text-white sm:block"
          >
            Réglages
          </NuxtLink>
          <NuxtLink
            v-if="retour"
            to="/admin"
            class="hidden text-[13px] font-medium text-white/70 transition-colors hover:text-white sm:block"
          >
            ← Tableau de bord
          </NuxtLink>
          <button
            type="button"
            class="rounded-full border border-white/25 px-4 py-1.5 text-[13px] font-semibold text-white/90 transition-colors hover:border-white hover:text-white disabled:opacity-50"
            :disabled="deconnexion"
            @click="seDeconnecter"
          >
            {{ deconnexion ? '…' : 'Déconnexion' }}
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-[1400px] px-5 py-8 lg:px-8 lg:py-10">
      <slot />
    </main>
  </div>
</template>
