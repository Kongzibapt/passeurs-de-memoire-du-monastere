<script setup lang="ts">
import { chercherImages, type Image } from '#shared/phototheque'

/**
 * Le sélecteur d'images du back-office : une planche des photos déjà déposées,
 * où l'on touche celles qu'on veut.
 *
 * Il remplace le champ où l'on tapait une adresse d'image de mémoire. La photo
 * arrive avec son titre, son texte alternatif et son crédit — les trois champs
 * qu'on laisse vides quand il faut les écrire à la main.
 *
 * En choix multiple, l'ordre retenu est celui des touches, pas celui de la
 * planche : on compose une suite de photos, on ne coche pas une liste.
 */
const props = withDefaults(
  defineProps<{
    ouvert: boolean
    multiple?: boolean
    /** Photos déjà retenues ailleurs : marquées « déjà ajoutée », mais choisissables. */
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

watch(
  () => props.ouvert,
  async (ouvert) => {
    if (!ouvert) return
    retenues.value = []
    recherche.value = ''
    await assurerCharge()
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
</script>

<template>
  <Teleport to="body">
    <div
      v-if="ouvert"
      class="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Choisir parmi vos photos"
      @click.self="fermer"
      @keydown.esc="fermer"
    >
      <div class="flex max-h-[94vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-t-2xl bg-[#f4f5f6] shadow-2xl sm:rounded-2xl">
        <div class="flex items-center justify-between gap-4 border-b border-black/10 bg-white px-6 py-5">
          <div>
            <h2 class="font-display text-[24px] font-bold">Choisir parmi vos photos</h2>
            <p class="mt-1 text-[17px] text-slate-600">
              {{ multiple ? 'Touchez les photos à ajouter, puis « Ajouter ces photos ».' : 'Touchez la photo à utiliser.' }}
            </p>
          </div>
          <button
            type="button"
            class="min-h-12 shrink-0 rounded-xl border-2 border-slate-300 px-5 text-[17px] font-semibold text-slate-700 hover:border-slate-500"
            @click="fermer"
          >
            Fermer
          </button>
        </div>

        <div class="border-b border-black/10 bg-white px-6 pb-5">
          <label for="sel-recherche" class="sr-only">Chercher une photo</label>
          <input
            id="sel-recherche"
            v-model="recherche"
            type="search"
            placeholder="Chercher une photo : église, pont, 2026…"
            class="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-[18px] outline-none focus:border-clay-600"
          >
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-5">
          <p v-if="chargement" class="py-10 text-center text-[18px] text-slate-600">Chargement des photos…</p>
          <p v-else-if="erreur" class="py-10 text-center text-[18px] text-red-800">{{ erreur }}</p>
          <p v-else-if="!visibles.length" class="py-10 text-center text-[18px] text-slate-600">
            Aucune photo ne correspond à « {{ recherche }} ».
          </p>

          <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <button
              v-for="image in visibles"
              :key="image.src"
              type="button"
              class="relative overflow-hidden rounded-xl border-4 bg-white text-left transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-clay-400"
              :class="retenues.includes(image.src) ? 'border-clay-600' : 'border-transparent hover:border-clay-300'"
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
                class="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-clay-600 text-[17px] font-bold text-white"
              >
                {{ retenues.indexOf(image.src) + 1 }}
              </span>
              <span
                v-else-if="dejaLa.includes(image.src)"
                class="absolute right-2 top-2 rounded-full bg-slate-900/80 px-3 py-1 text-[14px] font-semibold text-white"
              >
                déjà ajoutée
              </span>
              <span class="block px-3 py-2.5 text-[16px] font-semibold leading-snug">{{ image.titre }}</span>
            </button>
          </div>
        </div>

        <div
          v-if="multiple"
          class="flex flex-wrap items-center justify-between gap-4 border-t border-black/10 bg-white px-6 py-4"
        >
          <span class="text-[17px] text-slate-600">
            {{ retenues.length }} photo{{ retenues.length > 1 ? 's' : '' }} choisie{{ retenues.length > 1 ? 's' : '' }}
          </span>
          <button
            type="button"
            class="min-h-14 rounded-xl bg-clay-600 px-7 text-[18px] font-bold text-white transition-colors hover:bg-clay-700 disabled:opacity-40"
            :disabled="!retenues.length"
            @click="valider"
          >
            Ajouter ces photos
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
