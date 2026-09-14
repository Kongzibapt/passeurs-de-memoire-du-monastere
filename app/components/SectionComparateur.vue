<script setup lang="ts">
import { COMPARAISONS, INTRO_INITIALE } from '~/data/comparaisons'

/**
 * « Autrefois · aujourd'hui » — deux vues superposées, séparées par une ligne
 * que l'on fait glisser.
 *
 * Le découpage est fait en CSS (`clip-path: inset(0 0 0 var(--x))` sur l'image
 * récente) : on ne déplace donc qu'une variable, jamais des pixels, et le
 * glissement reste fluide même sur un téléphone.
 *
 * L'`<input type="range">` transparent posé par-dessus n'est pas un artifice
 * d'affichage : c'est lui qui rend le comparateur utilisable au clavier et
 * annonçable par un lecteur d'écran. Le pointeur ne fait que lui donner des
 * valeurs.
 */
const { actif } = useComparateur()

const courant = computed(() => COMPARAISONS.find((c) => c.cle === actif.value) ?? COMPARAISONS[0]!)

/**
 * Au premier rendu, la section affiche les textes d'origine de la maquette, qui
 * ne sont pas tout à fait ceux de l'onglet « Le pont » (la formulation changeait
 * après le premier clic). On les conserve tant que personne n'a touché aux
 * onglets, pour que la page au chargement soit exactement celle dessinée.
 */
const intact = ref(true)
const titre = computed(() => (intact.value ? INTRO_INITIALE.titre : courant.value.titre))
const texte = computed(() => (intact.value ? INTRO_INITIALE.texte : courant.value.texte))

function choisir(cle: (typeof COMPARAISONS)[number]['cle']) {
  intact.value = false
  actif.value = cle
}

// Un lien « autrefois et aujourd'hui » cliqué ailleurs dans la page change
// l'onglet sans passer par `choisir` : la section doit alors basculer sur les
// textes de l'onglet, sinon elle annoncerait le pont en montrant l'abbaye.
watch(actif, () => {
  intact.value = false
})

/** Position de la ligne, en pourcentage de la largeur. */
const position = ref(50)
const cadre = ref<HTMLElement | null>(null)

function deplacerVers(clientX: number) {
  const boite = cadre.value?.getBoundingClientRect()
  if (!boite || !boite.width) return
  position.value = Math.max(0, Math.min(100, ((clientX - boite.left) / boite.width) * 100))
}

function surPointeur(e: PointerEvent) {
  // `buttons` filtre le simple survol : on ne suit le doigt ou la souris que
  // lorsqu'un bouton est effectivement enfoncé.
  if (e.buttons) deplacerVers(e.clientX)
}
</script>

<template>
  <section id="autrefois" class="cmp-sec pad">
    <div class="intro">
      <div>
        <div class="t-eyebrow" style="color: var(--c-clay-300)">Autrefois · aujourd'hui</div>
        <h2 style="margin-top: var(--sp-4)">{{ titre }}</h2>
      </div>
      <p>{{ texte }}</p>
    </div>

    <div class="cmp-tabs" role="tablist">
      <button
        v-for="c in COMPARAISONS"
        :key="c.cle"
        type="button"
        role="tab"
        :aria-selected="c.cle === actif"
        @click="choisir(c.cle)"
      >
        {{ c.onglet }}
      </button>
    </div>

    <div
      ref="cadre"
      class="cmp"
      :style="{ '--x': `${position}%` }"
      @pointerdown="deplacerVers($event.clientX)"
      @pointermove="surPointeur"
    >
      <NuxtImg
        class="before"
        :src="courant.avant.src"
        :alt="courant.avant.alt"
        :style="{ objectPosition: courant.avant.position }"
        loading="lazy"
        decoding="async"
        sizes="xs:90vw sm:90vw md:90vw lg:90vw xl:1140px xxl:1140px"
      />
      <NuxtImg
        class="after"
        :src="courant.apres.src"
        :alt="courant.apres.alt"
        :style="{ objectPosition: courant.apres.position }"
        loading="lazy"
        decoding="async"
        sizes="xs:90vw sm:90vw md:90vw lg:90vw xl:1140px xxl:1140px"
      />
      <div class="handle" aria-hidden="true" />
      <div class="tag l">Autrefois</div>
      <div class="tag r">Aujourd'hui</div>
      <input
        v-model.number="position"
        type="range"
        min="0"
        max="100"
        aria-label="Comparer autrefois et aujourd'hui"
        style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: ew-resize"
      >
    </div>

    <!-- Une légende par image, posée sous le bord qu'elle décrit : la
         provenance de la carte postale à gauche, la date du cliché récent à
         droite. Réunies en un seul bloc, elles obligeaient à lire toute la
         phrase pour savoir laquelle des deux vues on regardait. -->
    <div class="cmp-caps">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <figcaption class="cap" v-html="courant.avant.legende" />
      <!-- eslint-disable-next-line vue/no-v-html -->
      <figcaption class="cap droite" v-html="courant.apres.legende" />
    </div>
  </section>
</template>
