<script setup lang="ts">
import {
  estLienExterne,
  hrefCta,
  libelleDate,
  souvenirsParAnnee,
  type Evenement,
} from '#shared/evenements'

/**
 * « C'était chez nous » — les événements passés, groupés par année.
 *
 * Un souvenir sans photo occupe toute la largeur (`.pevt.solo`) plutôt que de
 * laisser une demi-colonne vide à côté du récit.
 */
const props = defineProps<{ evenements: Evenement[] }>()

const { urlAdhesion } = useReglages()

const annees = computed(() => souvenirsParAnnee(props.evenements))
</script>

<template>
  <section v-if="annees.length" id="souvenirs" class="passe pad">
    <div class="sec-head">
      <div class="t-eyebrow">Souvenirs</div>
      <h2>C'était chez nous</h2>
    </div>

    <div v-for="groupe in annees" :key="groupe.annee" class="pyear">
      <div class="py-h"><span class="y">{{ groupe.annee }}</span></div>

      <article
        v-for="e in groupe.evenements"
        :key="e.id"
        class="pevt"
        :class="{ solo: !e.souvenir?.photos.length }"
      >
        <div class="pe-t">
          <div class="d">{{ libelleDate(e.date) }}</div>
          <h3>{{ e.titre }}</h3>
          <p>{{ e.souvenir?.recit }}</p>
          <div v-if="e.souvenir?.question" class="q">{{ e.souvenir.question }}</div>
          <a
            v-if="e.souvenir?.cta"
            class="btn btn-secondary btn-sm"
            :href="hrefCta(e.souvenir.cta, urlAdhesion)"
            :target="estLienExterne(hrefCta(e.souvenir.cta, urlAdhesion)) ? '_blank' : undefined"
            :rel="estLienExterne(hrefCta(e.souvenir.cta, urlAdhesion)) ? 'noopener' : undefined"
          >
            {{ e.souvenir.cta.label }}
          </a>
        </div>

        <div v-if="e.souvenir?.photos.length" class="pe-ph">
          <SouvenirCarrousel :photos="e.souvenir.photos" :evenement="e.titre" />
        </div>
      </article>
    </div>
  </section>
</template>
