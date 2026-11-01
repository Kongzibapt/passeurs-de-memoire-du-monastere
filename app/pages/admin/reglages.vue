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
    <div class="mx-auto max-w-[760px]">
      <h1 class="font-display text-[32px] font-bold">Réglages</h1>

      <form class="mt-7 rounded-2xl border border-black/10 bg-white p-6 sm:p-8" @submit.prevent="enregistrer">
        <label for="r-adhesion" class="block text-[22px] font-bold">Lien d'adhésion HelloAsso</label>
        <p class="mt-2 text-[17px] leading-relaxed text-slate-600">
          Il change à chaque campagne annuelle. Le mettre à jour ici suffit : tous les boutons
          « Adhérer » du site suivent ce lien.
        </p>
        <input
          id="r-adhesion"
          v-model="urlAdhesion"
          type="url"
          required
          class="mt-4 w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-[18px] outline-none focus:border-clay-600"
        >

        <p
          v-if="message"
          class="mt-6 rounded-xl border-l-4 border-green-700 bg-green-50 px-5 py-4 text-[18px] font-semibold text-green-900"
        >
          ✓ {{ message }}
        </p>
        <p
          v-if="erreur"
          class="mt-6 rounded-xl border-l-4 border-[#A23A2A] bg-[#F2D9D3] px-5 py-4 text-[17px] text-[#7a2a1f]"
        >
          {{ erreur }}
        </p>

        <button
          type="submit"
          class="mt-7 min-h-14 rounded-xl bg-green-700 px-7 text-[18px] font-bold text-white transition-colors hover:bg-green-800 disabled:opacity-40"
          :disabled="enCours"
        >
          {{ enCours ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </form>
    </div>
  </AdminShell>
</template>
