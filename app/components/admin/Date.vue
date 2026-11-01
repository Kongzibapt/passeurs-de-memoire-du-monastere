<script setup lang="ts">
/**
 * Choix d'une date : une case JJ/MM/AAAA et, dessous, un calendrier en
 * français où l'on touche le jour.
 *
 * Pas de `<input type="date">` : son format suit la langue du NAVIGATEUR, pas
 * celle de la page. Un ordinateur réglé en anglais afficherait MM/DD/YYYY, et un
 * 03/07 deviendrait le 7 mars. Ici le format est toujours le même.
 *
 * La valeur échangée reste la date ISO (`2026-07-03`), comme partout ailleurs.
 */
const props = defineProps<{ id: string }>()
const iso = defineModel<string>({ default: '' })

const MOIS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
]
const JOURS = ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']

const deux = (n: number) => String(n).padStart(2, '0')
const versTexte = (v: string) => {
  const [a, m, j] = v.split('-')
  return a && m && j ? `${j}/${m}/${a}` : ''
}

/** « 3/7/2026 » ou « 03/07/2026 » → `2026-07-03`, ou `null` si la date n'existe pas. */
function versIso(texte: string): string | null {
  const m = texte.trim().match(/^(\d{1,2})[/.\- ](\d{1,2})[/.\- ](\d{4})$/)
  if (!m) return null
  const [j, mo, a] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const d = new Date(Date.UTC(a, mo - 1, j))
  if (d.getUTCFullYear() !== a || d.getUTCMonth() !== mo - 1 || d.getUTCDate() !== j) return null
  return `${a}-${deux(mo)}-${deux(j)}`
}

const texte = ref(versTexte(iso.value))
const invalide = computed(() => !!texte.value.trim() && !versIso(texte.value))

// Une saisie incomplète ou fausse vide la date : on ne garde pas en silence
// l'ancienne pendant que la case en montre une autre. La case, elle, n'est
// jamais réécrite tant qu'on tape.
watch(texte, (t) => {
  const v = versIso(t) ?? ''
  if (v === iso.value) return
  iso.value = v
  if (v) afficher(v)
})
watch(iso, (v) => {
  if (v && versIso(texte.value) !== v) {
    texte.value = versTexte(v)
    afficher(v)
  }
})

// ── Le calendrier ────────────────────────────────────────────────────────────
const aujourdhui = new Date()
const vue = ref({ annee: aujourdhui.getFullYear(), mois: aujourdhui.getMonth() })

function afficher(v: string) {
  const [a, m] = v.split('-').map(Number)
  if (a && m) vue.value = { annee: a, mois: m - 1 }
}
if (iso.value) afficher(iso.value)

function decaler(n: number) {
  const d = new Date(vue.value.annee, vue.value.mois + n, 1)
  vue.value = { annee: d.getFullYear(), mois: d.getMonth() }
}

/** Les cases du mois, lundi en premier ; `null` pour les cases vides du début. */
const cases = computed(() => {
  const { annee, mois } = vue.value
  const premier = (new Date(annee, mois, 1).getDay() + 6) % 7
  const nb = new Date(annee, mois + 1, 0).getDate()
  return [
    ...Array<null>(premier).fill(null),
    ...Array.from({ length: nb }, (_, i) => `${annee}-${deux(mois + 1)}-${deux(i + 1)}`),
  ]
})

const jourIso = `${aujourdhui.getFullYear()}-${deux(aujourdhui.getMonth() + 1)}-${deux(aujourdhui.getDate())}`

function choisir(v: string) {
  iso.value = v
  texte.value = versTexte(v)
}
</script>

<template>
  <div>
    <label :for="props.id" class="block text-[17px] font-semibold text-slate-700">
      Tapez la date (jour/mois/année), ou touchez le jour dans le calendrier
    </label>
    <input
      :id="props.id"
      v-model="texte"
      type="text"
      inputmode="numeric"
      placeholder="JJ/MM/AAAA"
      maxlength="10"
      autocomplete="off"
      class="mt-2 w-[220px] rounded-xl border-2 bg-white px-4 py-3 text-[20px] tracking-wider outline-none focus:border-clay-600"
      :class="invalide ? 'border-amber-500' : 'border-slate-300'"
      :aria-invalid="invalide"
    >
    <p v-if="invalide" class="mt-2 text-[16px] font-semibold text-amber-800">
      Cette date n'est pas reconnue. Écrivez-la ainsi : 03/07/2026.
    </p>

    <div class="mt-5 w-full max-w-[420px] rounded-xl border-2 border-slate-200 bg-white p-4">
      <div class="flex items-center justify-between gap-2">
        <button
          type="button"
          class="h-12 w-12 rounded-xl border-2 border-slate-300 text-[22px] font-bold hover:border-slate-500"
          aria-label="Mois précédent"
          @click="decaler(-1)"
        >
          ‹
        </button>
        <p class="text-[19px] font-bold capitalize" aria-live="polite">
          {{ MOIS[vue.mois] }} {{ vue.annee }}
        </p>
        <button
          type="button"
          class="h-12 w-12 rounded-xl border-2 border-slate-300 text-[22px] font-bold hover:border-slate-500"
          aria-label="Mois suivant"
          @click="decaler(1)"
        >
          ›
        </button>
      </div>

      <div class="mt-3 grid grid-cols-7 gap-1 text-center">
        <span v-for="j in JOURS" :key="j" class="py-1 text-[14px] font-semibold uppercase text-slate-500">{{ j }}</span>
        <template v-for="(c, i) in cases" :key="c ?? `vide-${i}`">
          <span v-if="!c" />
          <button
            v-else
            type="button"
            class="h-12 rounded-lg text-[18px] font-semibold transition-colors"
            :class="
              c === iso ? 'bg-clay-600 text-white'
              : c === jourIso ? 'border-2 border-clay-600 text-clay-800 hover:bg-clay-50'
              : 'text-slate-800 hover:bg-slate-100'
            "
            :aria-pressed="c === iso"
            :aria-label="`${Number(c.slice(8))} ${MOIS[vue.mois]} ${vue.annee}`"
            @click="choisir(c)"
          >
            {{ Number(c.slice(8)) }}
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
