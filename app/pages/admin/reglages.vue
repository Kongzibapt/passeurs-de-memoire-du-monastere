<script setup lang="ts">
import type { Reglages } from '~~/server/utils/reglages'

/**
 * Réglages du site.
 *
 * Un seul réglage aujourd'hui, mais c'est celui qui casse tous les ans : le
 * lien HelloAsso de la campagne d'adhésion, porté par tous les boutons
 * « Adhérer » du site.
 */
definePageMeta({ middleware: 'admin' })

useHead({ title: 'Réglages — Back-office' })

const { data: reglages, refresh } = await useAsyncData('admin-reglages', () =>
  useRequestFetch()<Reglages>('/api/reglages'),
)

const urlAdhesion = ref(reglages.value?.url_adhesion ?? '')
const message = ref('')
const erreur = ref('')
const enCours = ref(false)

async function enregistrer() {
  enCours.value = true
  message.value = ''
  erreur.value = ''
  try {
    await $fetch('/api/admin/reglages', { method: 'PATCH', body: { url_adhesion: urlAdhesion.value } })
    message.value = 'Enregistré. Tous les boutons « Adhérer » pointent désormais vers ce lien.'
    await refresh()
  } catch (e: unknown) {
    erreur.value = (e as { statusMessage?: string })?.statusMessage || 'Enregistrement impossible.'
  } finally {
    enCours.value = false
  }
}
</script>

<template>
  <AdminShell titre="Réglages">
    <h1 class="font-display text-[26px] font-bold tracking-tight">Réglages</h1>

    <form class="mt-7 max-w-[720px] border border-black/10 bg-white p-6" @submit.prevent="enregistrer">
      <label for="r-adhesion" class="block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600">
        Lien d'adhésion HelloAsso
      </label>
      <input
        id="r-adhesion"
        v-model="urlAdhesion"
        type="url"
        required
        class="mt-2 w-full border border-black/15 bg-white px-3 py-2.5 text-[14px] outline-none focus:border-clay-500"
      >
      <p class="mt-2 text-[13px] leading-relaxed text-slate-600">
        Il change à chaque campagne annuelle. Le mettre à jour ici suffit : tous les boutons
        « Adhérer » du site, y compris ceux des événements, suivent cette valeur.
      </p>

      <p v-if="message" class="mt-5 border-l-4 border-sage-500 bg-sage-100 px-4 py-3 text-[14px] text-sage-700">
        {{ message }}
      </p>
      <p v-if="erreur" class="mt-5 border-l-4 border-[#A23A2A] bg-[#F2D9D3] px-4 py-3 text-[14px] text-[#A23A2A]">
        {{ erreur }}
      </p>

      <button
        type="submit"
        class="mt-6 bg-clay-600 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-clay-700 disabled:opacity-50"
        :disabled="enCours"
      >
        {{ enCours ? 'Enregistrement…' : 'Enregistrer' }}
      </button>
    </form>
  </AdminShell>
</template>
