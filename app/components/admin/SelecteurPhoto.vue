<script setup lang="ts">
import { chercherImages, formatDimensions, type Image } from '#shared/phototheque'

/**
 * Le sélecteur d'images du back-office.
 *
 * Il remplace le champ où l'on tapait « /img/eglise-nef.jpg » de mémoire. On
 * choisit dans une planche, et la photo arrive avec son titre, son texte
 * alternatif et son crédit — les trois champs qu'on laisse vides quand il faut
 * les écrire à la main, et dont l'absence ne se voit qu'à l'usage : une image
 * sans `alt` est une image muette pour qui ne la voit pas.
 *
 * En choix multiple, l'ordre retenu est celui des clics, pas celui de la
 * planche : on compose une suite de photos, on ne coche pas une liste.
 */
const props = withDefaults(
  defineProps<{
    ouvert: boolean
    multiple?: boolean
    /** Chemins déjà retenus ailleurs : marqués « déjà là », mais choisissables. */
    dejaLa?: string[]
  }>(),
  { multiple: false, dejaLa: () => [] },
)

const emit = defineEmits<{
  'update:ouvert': [valeur: boolean]
  choisir: [images: Image[]]
}>()

const { images, chargement, erreur, assurerCharge } = usePhototheque()

const recherche = ref('')
const retenues = ref<string[]>([])
const champRecherche = ref<HTMLInputElement | null>(null)

watch(
  () => props.ouvert,
  async (ouvert) => {
    if (!ouvert) return
    retenues.value = []
    recherche.value = ''
    await assurerCharge()
    await nextTick()
    champRecherche.value?.focus()
  },
  { immediate: true },
)

const visibles = computed(() => chercherImages(images.value ?? [], recherche.value))

function fermer() {
  emit('update:ouvert', false)
}

function cliquer(image: Image) {
  if (!props.multiple) {
    emit('choisir', [image])
    fermer()
    return
  }
  retenues.value = retenues.value.includes(image.src)
    ? retenues.value.filter((s) => s !== image.src)
    : [...retenues.value, image.src]
}

function valider() {
  const choisies = retenues.value
    .map((src) => images.value.find((i) => i.src === src))
    .filter((i): i is Image => !!i)
  if (choisies.length) emit('choisir', choisies)
  fermer()
}

const cadre =
  'relative overflow-hidden rounded-lg border-2 bg-white text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-clay-600'
</script>

<template>
  <Teleport to="body">
    <div
      v-if="ouvert"
      class="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Photothèque"
      @click.self="fermer"
      @keydown.esc="fermer"
    >
      <div class="flex max-h-[92vh] w-full max-w-[980px] flex-col overflow-hidden rounded-t-2xl bg-[#f4f5f6] shadow-2xl sm:rounded-2xl">
        <div class="flex items-start justify-between gap-4 border-b border-black/10 bg-white px-5 py-4">
          <div>
            <h2 class="font-display text-[17px] font-bold">Photothèque</h2>
            <p class="text-[12.5px] text-slate-500">
              {{ multiple ? 'Choisis une ou plusieurs images' : 'Choisis une image' }} ·
              {{ images.length }} fichier{{ images.length > 1 ? 's' : '' }} dans <code>public/img/</code>
            </p>
          </div>
          <button
            type="button"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Fermer"
            @click="fermer"
          >
            ✕
          </button>
        </div>

        <div class="border-b border-black/10 bg-white px-5 pb-4">
          <input
            ref="champRecherche"
            v-model="recherche"
            type="search"
            placeholder="Chercher : église, pont, carte postale, 2026…"
            class="w-full rounded-lg border border-black/10 bg-[#f4f5f6] px-3 py-2 text-[14px] focus:border-clay-600 focus:outline-none"
          >
        </div>

        <div class="flex-1 overflow-y-auto px-5 py-4">
          <p v-if="chargement" class="py-10 text-center text-[14px] text-slate-500">Chargement…</p>
          <p v-else-if="erreur" class="py-10 text-center text-[14px] text-red-700">{{ erreur }}</p>
          <p v-else-if="!visibles.length" class="py-10 text-center text-[14px] text-slate-500">
            Aucune image ne correspond à « {{ recherche }} ».
          </p>

          <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <button
              v-for="image in visibles"
              :key="image.src"
              type="button"
              :class="[
                cadre,
                retenues.includes(image.src) ? 'border-clay-600' : 'border-transparent hover:border-clay-300',
              ]"
              :aria-pressed="multiple ? retenues.includes(image.src) : undefined"
              @click="cliquer(image)"
            >
              <img
                :src="image.src"
                :alt="image.alt || image.titre"
                loading="lazy"
                decoding="async"
                class="aspect-[4/3] w-full bg-slate-100 object-cover"
              >
              <span
                v-if="multiple && retenues.includes(image.src)"
                class="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-clay-600 text-[12px] font-bold text-white"
              >
                {{ retenues.indexOf(image.src) + 1 }}
              </span>
              <span
                v-else-if="dejaLa.includes(image.src)"
                class="absolute right-2 top-2 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
              >
                déjà là
              </span>

              <span class="block px-2.5 py-2">
                <span class="block truncate text-[13px] font-semibold">{{ image.titre }}</span>
                <span class="block truncate text-[11px] text-slate-500">{{ formatDimensions(image) }}</span>
                <span v-if="!image.alt" class="mt-1 block text-[11px] font-semibold text-amber-700">
                  sans texte alternatif
                </span>
              </span>
            </button>
          </div>
        </div>

        <div
          v-if="multiple"
          class="flex items-center justify-between gap-4 border-t border-black/10 bg-white px-5 py-3"
        >
          <span class="text-[13px] text-slate-500">
            {{ retenues.length }} image{{ retenues.length > 1 ? 's' : '' }} retenue{{ retenues.length > 1 ? 's' : '' }}
          </span>
          <button
            type="button"
            class="rounded-lg bg-clay-600 px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-clay-700 disabled:opacity-50"
            :disabled="!retenues.length"
            @click="valider"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
