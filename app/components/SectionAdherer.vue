<script setup lang="ts">
import { mailto } from '#shared/association'
import { RAISONS } from '~/data/patrimoine'

/**
 * Bande terre cuite d'appel à l'adhésion.
 *
 * Elle sert sur l'accueil et, avec d'autres textes, en bas de la page
 * Actualités : titre, chapeau et colonne de droite sont donc fournis par la
 * page. Par défaut, ce sont les contenus de l'accueil.
 */
withDefaults(
  defineProps<{
    titre?: string
    texte?: string
    /** `raisons` = les trois motifs d'adhérer ; `prochain` = le prochain rendez-vous. */
    colonne?: 'raisons' | 'slot'
    /** Affiche le second bouton « Poser une question » (accueil seulement). */
    question?: boolean
  }>(),
  {
    titre: "Le patrimoine tient debout grâce à ceux qui s'y intéressent",
    texte:
      "Adhérer, c'est nous permettre de documenter, restaurer et faire visiter — et recevoir les invitations aux visites et conférences réservées aux membres.",
    colonne: 'raisons',
    question: true,
  },
)

const { urlAdhesion } = useReglages()
</script>

<template>
  <section id="adherer" class="g12 adhere">
    <div class="t">
      <h2>{{ titre }}</h2>
      <p>{{ texte }}</p>
      <div class="cta">
        <a class="btn btn-lg btn-cream" :href="urlAdhesion" target="_blank" rel="noopener">
          Adhérer en ligne
        </a>
        <a v-if="question" class="btn btn-lg btn-secondary btn-line" :href="mailto()">
          Poser une question
        </a>
      </div>
    </div>
    <div class="r">
      <div class="reasons">
        <template v-if="colonne === 'raisons'">
          <div v-for="(raison, i) in RAISONS" :key="i" class="reason">
            <div class="n">{{ String(i + 1).padStart(2, '0') }}</div>
            <p>{{ raison }}</p>
          </div>
        </template>
        <slot v-else />
      </div>
    </div>
  </section>
</template>
