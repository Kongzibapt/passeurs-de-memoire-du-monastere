<script setup lang="ts">
/**
 * Cadre d'un assistant pas à pas : une seule question à l'écran, l'étape où
 * l'on en est, et deux gros boutons pour avancer ou revenir.
 *
 * Pensé pour des personnes peu à l'aise avec l'informatique : rien ne se perd en
 * revenant en arrière, rien n'est publié avant le dernier bouton, et l'on peut
 * toujours abandonner sans conséquence.
 */
const props = defineProps<{
  /** Ce que l'on fait, en tête : « Annoncer un événement ». */
  titre: string
  /** Rappel sous le titre : l'événement concerné, par exemple. */
  sousTitre?: string
  /** Le nom de chaque étape, dans l'ordre. */
  etapes: string[]
  /** Vrai si l'étape en cours permet de continuer. */
  peutContinuer: boolean
  /** Ce qui manque pour continuer, dit en clair. */
  manque?: string
  enCours?: boolean
  erreur?: string
}>()

const etape = defineModel<number>('etape', { default: 0 })
const emit = defineEmits<{ publier: []; annuler: [] }>()

const derniere = computed(() => etape.value === props.etapes.length - 1)
const haut = ref<HTMLElement | null>(null)

function aller(n: number) {
  etape.value = n
  // Chaque étape repart du haut : sur une tablette, on ne doit pas avoir à
  // chercher la question suivante en faisant défiler.
  nextTick(() => haut.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
}

function continuer() {
  if (!props.peutContinuer) return
  if (derniere.value) emit('publier')
  else aller(etape.value + 1)
}

function annuler() {
  if (confirm('Abandonner ? Ce que vous avez saisi ne sera pas enregistré.')) emit('annuler')
}
</script>

<template>
  <section ref="haut" class="mx-auto max-w-[760px] scroll-mt-40">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="font-display text-[30px] font-bold leading-tight">{{ titre }}</h1>
        <p v-if="sousTitre" class="mt-1 text-[18px] text-slate-600">{{ sousTitre }}</p>
      </div>
      <button
        type="button"
        class="rounded-xl px-4 py-3 text-[17px] font-semibold text-slate-600 underline underline-offset-4 hover:text-slate-900"
        @click="annuler"
      >
        Abandonner
      </button>
    </div>

    <!-- Où l'on en est -->
    <div class="mt-6">
      <p class="text-[17px] font-semibold text-clay-800">
        Étape {{ etape + 1 }} sur {{ etapes.length }} — {{ etapes[etape] }}
      </p>
      <div class="mt-2 flex gap-1.5" aria-hidden="true">
        <span
          v-for="(_, i) in etapes"
          :key="i"
          class="h-2.5 flex-1 rounded-full"
          :class="i <= etape ? 'bg-clay-600' : 'bg-slate-300'"
        />
      </div>
    </div>

    <form class="mt-8 rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:p-8" @submit.prevent="continuer">
      <slot />

      <p
        v-if="erreur"
        class="mt-8 rounded-xl border-l-4 border-[#A23A2A] bg-[#F2D9D3] px-5 py-4 text-[17px] text-[#7a2a1f]"
        role="alert"
      >
        {{ erreur }}
      </p>

      <div class="mt-10 flex flex-col-reverse gap-3 border-t border-black/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          v-if="etape > 0"
          type="button"
          class="min-h-14 rounded-xl border-2 border-slate-300 bg-white px-6 text-[18px] font-semibold text-slate-800 transition-colors hover:border-slate-500"
          @click="aller(etape - 1)"
        >
          ← Retour
        </button>
        <span v-else />

        <div class="flex flex-col items-stretch gap-2 sm:items-end">
          <button
            type="submit"
            class="min-h-14 rounded-xl px-8 text-[19px] font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            :class="derniere ? 'bg-green-700 hover:bg-green-800' : 'bg-clay-600 hover:bg-clay-700'"
            :disabled="!peutContinuer || enCours"
          >
            {{ enCours ? 'Publication…' : derniere ? 'Publier sur le site ✓' : 'Continuer →' }}
          </button>
          <p v-if="!peutContinuer && manque" class="text-[16px] text-amber-800">{{ manque }}</p>
        </div>
      </div>
    </form>
  </section>
</template>
