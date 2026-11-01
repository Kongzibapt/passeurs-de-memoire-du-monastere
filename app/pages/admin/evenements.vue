<script setup lang="ts">
import { afficheDe, aVenir, estRaconte, libelleDate, passes, type Evenement } from '#shared/evenements'
import { messageErreur } from '~/composables/useEvenementsAdmin'

/**
 * Les événements, en deux colonnes de vie : ceux qui viennent, ceux qui sont
 * passés.
 *
 * À venir, on annonce ; une fois passés, on raconte. Chacun de ces gestes a son
 * assistant pas à pas (`AdminAssistantAnnonce`, `AdminAssistantSouvenir`) qui
 * prend toute la page : une seule chose à faire à la fois, et la liste revient
 * une fois publié.
 *
 * Les événements « d'origine » (définis dans le code) se modifient comme les
 * autres : les publier crée en base une version qui les remplace sur le site.
 * Ils ne se suppriment pas.
 */
definePageMeta({ middleware: 'admin' })

useHead({ title: 'Événements — Back-office' })

const { data: evenements, refresh } = await useAsyncData('admin-evenements', () =>
  useRequestFetch()<Evenement[]>('/api/admin/evenements'),
)

const liste = computed(() => evenements.value ?? [])
const prochains = computed(() => aVenir(liste.value))
const anciens = computed(() => passes(liste.value))
const pris = computed(() => liste.value.map((e) => e.slug))

type Mode = { quoi: 'liste' } | { quoi: 'annonce'; e?: Evenement } | { quoi: 'souvenir'; e: Evenement }
const mode = ref<Mode>({ quoi: 'liste' })
const message = ref('')
const erreur = ref('')

function ouvrir(m: Mode) {
  mode.value = m
  message.value = ''
  erreur.value = ''
  if (import.meta.client) window.scrollTo({ top: 0 })
}

async function apresPublication(titre: string) {
  await refresh()
  ouvrir({ quoi: 'liste' })
  message.value = `« ${titre} » est publié. Le site est à jour dans la minute.`
}

async function supprimer(e: Evenement) {
  if (!confirm(`Supprimer « ${e.titre} » du site ? Cette action est définitive.`)) return
  erreur.value = ''
  message.value = ''
  try {
    await $fetch(`/api/admin/evenements/${e.id}`, { method: 'DELETE' })
    message.value = `« ${e.titre} » a été supprimé.`
    await refresh()
  } catch (err: unknown) {
    erreur.value = messageErreur(err, "La suppression n'a pas abouti. Réessayez dans un instant.")
  }
}

const bouton =
  'inline-flex min-h-13 items-center justify-center rounded-xl px-6 text-[18px] font-bold transition-colors'
</script>

<template>
  <AdminShell titre="Événements">
    <AdminAssistantAnnonce
      v-if="mode.quoi === 'annonce'"
      :evenement="mode.e"
      :pris="pris"
      @publie="apresPublication"
      @annuler="ouvrir({ quoi: 'liste' })"
    />

    <AdminAssistantSouvenir
      v-else-if="mode.quoi === 'souvenir'"
      :evenement="mode.e"
      @publie="apresPublication"
      @annuler="ouvrir({ quoi: 'liste' })"
    />

    <div v-else class="mx-auto max-w-[900px]">
      <div class="flex flex-wrap items-center justify-between gap-5">
        <h1 class="font-display text-[32px] font-bold">Les événements</h1>
        <button
          type="button"
          :class="[bouton, 'bg-clay-600 text-white hover:bg-clay-700']"
          @click="ouvrir({ quoi: 'annonce' })"
        >
          + Annoncer un nouvel événement
        </button>
      </div>

      <p
        v-if="message"
        class="mt-6 rounded-xl border-l-4 border-green-700 bg-green-50 px-5 py-4 text-[18px] font-semibold text-green-900"
        role="status"
      >
        ✓ {{ message }}
      </p>
      <p
        v-if="erreur"
        class="mt-6 rounded-xl border-l-4 border-[#A23A2A] bg-[#F2D9D3] px-5 py-4 text-[18px] text-[#7a2a1f]"
        role="alert"
      >
        {{ erreur }}
      </p>

      <!-- À venir -->
      <section class="mt-10" aria-labelledby="titre-a-venir">
        <h2 id="titre-a-venir" class="flex items-center gap-3 font-display text-[24px] font-bold text-green-900">
          <span class="h-3.5 w-3.5 rounded-full bg-green-600" aria-hidden="true" />
          À venir
        </h2>
        <p class="mt-1 text-[17px] text-slate-600">Annoncés sur le site jusqu'au jour de l'événement.</p>

        <p v-if="!prochains.length" class="mt-5 rounded-xl bg-white px-6 py-5 text-[18px] text-slate-600">
          Aucun événement annoncé pour le moment.
        </p>
        <ul v-else class="mt-5 grid gap-4">
          <li
            v-for="e in prochains"
            :key="e.id"
            class="flex flex-wrap items-center gap-5 rounded-2xl border-2 border-green-200 bg-white p-5"
          >
            <img
              v-if="afficheDe(e)"
              :src="afficheDe(e)!.src"
              :alt="afficheDe(e)!.alt"
              class="h-24 w-20 shrink-0 rounded-lg border border-black/10 object-cover"
            >
            <div class="w-full min-w-0 sm:w-auto sm:flex-1">
              <p class="font-accent text-[20px] italic text-clay-800">{{ libelleDate(e.date) }}</p>
              <h3 class="mt-0.5 text-[21px] font-bold leading-snug">{{ e.titre }}</h3>
              <p v-if="e.cadre" class="text-[16px] text-slate-600">{{ e.cadre }}</p>
            </div>
            <div class="flex flex-wrap items-center gap-4">
              <button
                type="button"
                :class="[bouton, 'border-2 border-clay-600 bg-white text-clay-800 hover:bg-clay-50']"
                @click="ouvrir({ quoi: 'annonce', e })"
              >
                Modifier l'annonce
              </button>
              <button
                v-if="e.source === 'db'"
                type="button"
                class="text-[16px] font-semibold text-[#A23A2A] underline underline-offset-4"
                @click="supprimer(e)"
              >
                Supprimer
              </button>
            </div>
          </li>
        </ul>
      </section>

      <!-- Passés -->
      <section class="mt-14" aria-labelledby="titre-passes">
        <h2 id="titre-passes" class="flex items-center gap-3 font-display text-[24px] font-bold text-slate-700">
          <span class="h-3.5 w-3.5 rounded-full bg-slate-400" aria-hidden="true" />
          Passés
        </h2>
        <p class="mt-1 text-[17px] text-slate-600">
          Une fois raconté, un événement passé s'affiche dans « C'était chez nous ». Sans récit, il
          n'apparaît plus sur le site.
        </p>

        <p v-if="!anciens.length" class="mt-5 rounded-xl bg-white px-6 py-5 text-[18px] text-slate-600">
          Aucun événement passé.
        </p>
        <ul v-else class="mt-5 grid gap-4">
          <li
            v-for="e in anciens"
            :key="e.id"
            class="flex flex-wrap items-center gap-5 rounded-2xl border-2 p-5"
            :class="estRaconte(e) ? 'border-slate-200 bg-slate-50' : 'border-amber-300 bg-amber-50'"
          >
            <div class="w-full min-w-0 sm:w-auto sm:flex-1">
              <p class="font-accent text-[19px] italic text-slate-600">{{ libelleDate(e.date) }}</p>
              <h3 class="mt-0.5 text-[20px] font-bold leading-snug text-slate-800">{{ e.titre }}</h3>
              <p
                class="mt-1 text-[16px] font-semibold"
                :class="estRaconte(e) ? 'text-green-800' : 'text-amber-900'"
              >
                {{
                  estRaconte(e)
                    ? `✓ Souvenir publié${e.souvenir?.photos.length ? ` · ${e.souvenir.photos.length} photo${e.souvenir.photos.length > 1 ? 's' : ''}` : ''}`
                    : '! Pas encore raconté — invisible sur le site'
                }}
              </p>
            </div>
            <div class="flex flex-wrap items-center gap-4">
              <button
                type="button"
                :class="[
                  bouton,
                  estRaconte(e)
                    ? 'border-2 border-slate-400 bg-white text-slate-800 hover:border-slate-600'
                    : 'bg-clay-600 text-white hover:bg-clay-700',
                ]"
                @click="ouvrir({ quoi: 'souvenir', e })"
              >
                {{ estRaconte(e) ? 'Modifier le souvenir' : 'Raconter cet événement' }}
              </button>
              <button
                v-if="e.source === 'db'"
                type="button"
                class="text-[16px] font-semibold text-[#A23A2A] underline underline-offset-4"
                @click="supprimer(e)"
              >
                Supprimer
              </button>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </AdminShell>
</template>
