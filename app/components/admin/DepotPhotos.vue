<script setup lang="ts">
import type { Image } from '#shared/phototheque'
import { formatAccepte } from '~/composables/usePhototheque'

/**
 * Zone de dépôt des photos : on y glisse des fichiers, ou on clique pour les
 * choisir. Plusieurs à la fois, chacune réduite puis envoyée à son tour — en
 * série, parce que la fonction serveur ne gagne rien à en recevoir dix ensemble
 * et qu'une erreur reste ainsi rattachée à son fichier.
 *
 * Le composant ne dit rien de ce qu'on fait ensuite des photos : il émet
 * `deposees`, et la page ou le sélecteur décide (ouvrir la fiche, retenir les
 * images pour l'événement en cours…).
 */
const props = withDefaults(defineProps<{ compact?: boolean; multiple?: boolean }>(), {
  compact: false,
  multiple: true,
})
const emit = defineEmits<{ deposees: [images: Image[]] }>()

const { deposer } = usePhototheque()

const survol = ref(false)
const entree = ref<HTMLInputElement | null>(null)
const enCours = ref<string[]>([])
const echecs = ref<string[]>([])

async function traiter(fichiers: File[]) {
  if (!fichiers.length) return
  echecs.value = []
  const faites: Image[] = []
  for (const f of fichiers) {
    if (!formatAccepte(f)) {
      echecs.value.push(`« ${f.name} » n'est pas une photo que le site sait lire (il faut du JPEG, PNG ou WebP).`)
      continue
    }
    enCours.value = [...enCours.value, f.name]
    try {
      faites.push(await deposer(f))
    } catch (e: unknown) {
      echecs.value.push(messageDe(e, f.name))
    } finally {
      enCours.value = enCours.value.filter((n) => n !== f.name)
    }
  }
  if (faites.length) emit('deposees', faites)
}

function messageDe(e: unknown, nom: string): string {
  const err = e as { data?: { statusMessage?: string }; statusMessage?: string; message?: string }
  const msg = err?.data?.statusMessage || err?.statusMessage || err?.message || "l'envoi n'a pas abouti."
  return msg.startsWith('«') ? msg : `« ${nom} » : ${msg}`
}

function surDepot(e: DragEvent) {
  survol.value = false
  const fichiers = [...(e.dataTransfer?.files ?? [])]
  void traiter(props.multiple ? fichiers : fichiers.slice(0, 1))
}

function surChoix(e: Event) {
  const champ = e.target as HTMLInputElement
  void traiter([...(champ.files ?? [])])
  champ.value = '' // permet de redéposer le même fichier
}
</script>

<template>
  <div>
    <div
      :class="[
        'flex flex-col items-center justify-center rounded-2xl border-2 border-dashed text-center transition-colors',
        compact ? 'gap-2 px-4 py-4' : 'gap-3 px-6 py-10',
        survol ? 'border-clay-600 bg-clay-50' : 'border-slate-300 bg-white',
      ]"
      data-testid="depot-zone"
      @dragover.prevent="survol = true"
      @dragleave="survol = false"
      @drop.prevent="surDepot"
    >
      <p v-if="enCours.length" class="text-[19px] font-semibold text-clay-800" aria-live="polite">
        Envoi en cours… ({{ enCours.length }} photo{{ enCours.length > 1 ? 's' : '' }} restante{{ enCours.length > 1 ? 's' : '' }})
      </p>
      <template v-else>
        <button
          type="button"
          class="min-h-14 rounded-xl bg-clay-600 px-7 text-[19px] font-bold text-white transition-colors hover:bg-clay-700"
          @click="entree?.click()"
        >
          {{ multiple ? 'Ajouter des photos depuis l’ordinateur' : 'Ajouter une photo depuis l’ordinateur' }}
        </button>
        <span class="text-[16px] text-slate-600">
          ou faites-{{ multiple ? 'les' : 'la' }} glisser ici. Elles sont redressées et allégées toutes seules.
        </span>
      </template>
      <input
        ref="entree"
        type="file"
        :multiple="multiple"
        accept="image/jpeg,image/png,image/webp"
        class="sr-only"
        data-testid="depot-champ"
        @change="surChoix"
      >
    </div>

    <ul v-if="echecs.length" class="mt-3 grid gap-1" role="alert">
      <li v-for="e in echecs" :key="e" class="text-[17px] font-semibold text-red-800">{{ e }}</li>
    </ul>
  </div>
</template>
