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
defineProps<{ compact?: boolean }>()
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
      echecs.value.push(`« ${f.name} » : format non pris en charge (JPEG, PNG ou WebP).`)
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
  const msg = err?.data?.statusMessage || err?.statusMessage || err?.message || 'dépôt impossible.'
  return msg.startsWith('«') ? msg : `« ${nom} » : ${msg}`
}

function surDepot(e: DragEvent) {
  survol.value = false
  void traiter([...(e.dataTransfer?.files ?? [])])
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
        'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed text-center transition-colors',
        compact ? 'gap-0.5 px-4 py-3' : 'gap-1 px-6 py-8',
        survol ? 'border-clay-600 bg-clay-50' : 'border-black/15 bg-white hover:border-clay-300',
      ]"
      data-testid="depot-zone"
      @dragover.prevent="survol = true"
      @dragleave="survol = false"
      @drop.prevent="surDepot"
      @click="entree?.click()"
    >
      <span class="text-[14px] font-semibold">
        {{ enCours.length ? `Dépôt en cours… (${enCours.length})` : 'Déposer des photos' }}
      </span>
      <span class="text-[12.5px] text-slate-500">
        Glisse tes fichiers ici, ou
        <button type="button" class="font-semibold text-clay-700 underline" @click.stop="entree?.click()">
          parcours l'ordinateur
        </button>
        · JPEG, PNG ou WebP, réduites automatiquement
      </span>
      <input
        ref="entree"
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        class="sr-only"
        data-testid="depot-champ"
        @change="surChoix"
      >
    </div>

    <ul v-if="echecs.length" class="mt-2 grid gap-1" role="alert">
      <li v-for="e in echecs" :key="e" class="text-[13px] font-semibold text-red-700">{{ e }}</li>
    </ul>
  </div>
</template>
