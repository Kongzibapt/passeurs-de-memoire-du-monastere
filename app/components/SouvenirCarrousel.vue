<script setup lang="ts">
import type { PhotoSouvenir } from '#shared/evenements'

/**
 * Les images d'un souvenir : une grande, et les autres en pellicule dessous.
 *
 * Le cadre ne change jamais de taille, et les images y sont posées en entier
 * (`object-fit: contain`) plutôt que recadrées. C'est ce qui permet de mêler
 * dans une même rangée ce que l'association a réellement sous la main : des
 * photos prises au téléphone en portrait, des panoramiques de tribune, et des
 * affiches A4. Les recadrer à une proportion commune reviendrait à couper un
 * tiers de chaque, et le titre des affiches avec.
 *
 * Pas de défilement automatique : ce sont des archives qu'on regarde, pas une
 * bannière qu'on subit.
 */
const props = defineProps<{
  photos: PhotoSouvenir[]
  /** Sert à nommer la région pour les lecteurs d'écran. */
  evenement: string
}>()

const index = ref(0)
const courante = computed(() => props.photos[index.value] ?? props.photos[0]!)
const plusieurs = computed(() => props.photos.length > 1)

function aller(i: number) {
  const n = props.photos.length
  // Le tour est bouclé : depuis la dernière on revient à la première, ce qui
  // évite un bouton mort en bout de course.
  index.value = ((i % n) + n) % n
}
</script>

<template>
  <div
    class="carrousel"
    role="group"
    :aria-roledescription="plusieurs ? 'carrousel' : undefined"
    :aria-label="`Images — ${evenement}`"
    @keydown.left.prevent="aller(index - 1)"
    @keydown.right.prevent="aller(index + 1)"
  >
    <figure class="car-scene">
      <div class="car-cadre">
        <NuxtImg
          :key="courante.src"
          :src="courante.src"
          :alt="courante.alt"
          loading="lazy"
          decoding="async"
          sizes="xs:90vw sm:90vw md:60vw lg:520px xl:520px xxl:520px"
        />

        <template v-if="plusieurs">
          <button
            type="button"
            class="car-fleche gauche"
            aria-label="Image précédente"
            @click="aller(index - 1)"
          >
            ←
          </button>
          <button
            type="button"
            class="car-fleche droite"
            aria-label="Image suivante"
            @click="aller(index + 1)"
          >
            →
          </button>
        </template>
      </div>

      <!-- La légende est annoncée quand elle change : sans cela, un lecteur
           d'écran resterait sur l'image précédente après un clic sur la flèche. -->
      <figcaption class="cap" aria-live="polite">
        <b>{{ courante.titre }}</b>
        <span v-if="courante.credit" class="crd">{{ courante.credit }}</span>
        <span v-if="plusieurs" class="car-rang">{{ index + 1 }} / {{ photos.length }}</span>
      </figcaption>
    </figure>

    <div v-if="plusieurs" class="car-pellicule">
      <button
        v-for="(photo, i) in photos"
        :key="photo.src"
        type="button"
        class="car-vignette"
        :class="{ on: i === index }"
        :aria-label="`Voir : ${photo.titre}`"
        :aria-current="i === index ? 'true' : undefined"
        @click="aller(i)"
      >
        <NuxtImg :src="photo.src" alt="" loading="lazy" decoding="async" sizes="xs:70px md:90px" />
      </button>
    </div>
  </div>
</template>
