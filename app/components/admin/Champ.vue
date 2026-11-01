<script setup lang="ts">
import type { Longueur } from '~/composables/useEvenementsAdmin'

/**
 * Un champ de texte guidé : une question, une aide, un exemple, et un compteur
 * qui dit en clair si la longueur convient.
 *
 * Le compteur ne bloque rien avant le plafond dur (`longueur.limite`) : il
 * conseille. Un texte un peu court ou un peu long reste publiable — l'important
 * est qu'on le sache avant de voir la page.
 */
const props = withDefaults(
  defineProps<{
    id: string
    question: string
    aide?: string
    exemple?: string
    longueur?: Longueur
    lignes?: number
    facultatif?: boolean
  }>(),
  { aide: '', exemple: '', longueur: undefined, lignes: 1, facultatif: false },
)

const valeur = defineModel<string>({ default: '' })

const n = computed(() => valeur.value.trim().length)

const etat = computed<'vide' | 'court' | 'bien' | 'long'>(() => {
  if (!n.value) return 'vide'
  if (props.longueur && n.value < props.longueur.min) return 'court'
  if (props.longueur && n.value > props.longueur.max) return 'long'
  return 'bien'
})

const conseil = computed(() => {
  switch (etat.value) {
    case 'vide':
      return props.facultatif ? 'Facultatif : vous pouvez laisser vide.' : 'À remplir.'
    case 'court':
      return 'Un peu court : quelques mots de plus seraient bienvenus.'
    case 'long':
      return 'Un peu long : essayez de raccourcir.'
    default:
      return 'Longueur idéale.'
  }
})

const couleur = computed(
  () =>
    ({
      vide: 'text-slate-600',
      court: 'text-amber-800',
      long: 'text-amber-800',
      bien: 'text-green-800',
    })[etat.value],
)

const classeChamp =
  'mt-3 w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-[19px] leading-relaxed text-slate-900 outline-none transition-colors focus:border-clay-600'
</script>

<template>
  <div>
    <label :for="id" class="block text-[22px] font-bold leading-snug text-slate-900">
      {{ question }}
      <span v-if="facultatif" class="text-[17px] font-normal text-slate-500">(facultatif)</span>
    </label>
    <p v-if="aide" class="mt-2 text-[17px] leading-relaxed text-slate-600">{{ aide }}</p>
    <p v-if="exemple" class="mt-2 text-[17px] leading-relaxed text-slate-500">
      Par exemple : <em class="text-slate-700">« {{ exemple }} »</em>
    </p>

    <textarea
      v-if="lignes > 1"
      :id="id"
      v-model="valeur"
      :rows="lignes"
      :maxlength="longueur?.limite"
      :class="classeChamp"
      :aria-describedby="`${id}-compteur`"
    />
    <input
      v-else
      :id="id"
      v-model="valeur"
      type="text"
      :maxlength="longueur?.limite"
      :class="classeChamp"
      :aria-describedby="`${id}-compteur`"
    >

    <p :id="`${id}-compteur`" class="mt-2 flex flex-wrap items-baseline gap-x-3 text-[16px]" aria-live="polite">
      <span :class="['font-semibold', couleur]">
        <span aria-hidden="true">{{ etat === 'bien' ? '✓' : etat === 'vide' ? '' : '!' }}</span>
        {{ conseil }}
      </span>
      <span v-if="longueur" class="text-slate-500">
        {{ n }} caractère{{ n > 1 ? 's' : '' }} · conseillé : {{ longueur.min }} à {{ longueur.max }}
      </span>
    </p>
  </div>
</template>
