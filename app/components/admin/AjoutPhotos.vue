<script setup lang="ts">
import type { Image } from '#shared/phototheque'

/**
 * Les deux façons d'ajouter une photo, côte à côte : la prendre sur
 * l'ordinateur (elle rejoint aussi la photothèque) ou la choisir parmi celles
 * déjà déposées.
 *
 * `nouvelle` dit à l'assistant si la photo vient d'être déposée : son titre est
 * alors tiré du nom de fichier (« IMG 2034 »), et il vaut mieux demander une
 * vraie légende que de la reprendre.
 */
withDefaults(defineProps<{ multiple?: boolean; dejaLa?: string[] }>(), {
  multiple: true,
  dejaLa: () => [],
})
const emit = defineEmits<{ ajouter: [images: Image[], nouvelle: boolean] }>()

const selecteur = ref(false)
</script>

<template>
  <div class="grid gap-4">
    <AdminDepotPhotos :multiple="multiple" @deposees="(images) => emit('ajouter', images, true)" />
    <div class="text-center">
      <button
        type="button"
        class="min-h-14 rounded-xl border-2 border-clay-600 bg-white px-7 text-[18px] font-bold text-clay-800 transition-colors hover:bg-clay-50"
        @click="selecteur = true"
      >
        Choisir parmi vos photos déjà déposées
      </button>
    </div>
    <AdminSelecteurPhoto
      v-model:ouvert="selecteur"
      :multiple="multiple"
      :deja-la="dejaLa"
      @choisir="(images) => emit('ajouter', images, false)"
    />
  </div>
</template>
