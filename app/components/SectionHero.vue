<script setup lang="ts">
const { urlAdhesion } = useReglages()

/**
 * Le mot « du Monastère » du titre s'écrit lettre à lettre, 650 ms après le
 * chargement puis une lettre toutes les 72 ms — reprise de `site/hero.js`.
 *
 * L'animation est purement cliente : au rendu serveur le titre est complet,
 * donc lisible sans JavaScript et indexable tel quel. Elle est neutralisée
 * quand le visiteur a demandé moins d'animations.
 */
const MOT = 'du Monastère'
const lettresVisibles = ref(MOT.length)
let horloge: ReturnType<typeof setTimeout> | undefined

onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  lettresVisibles.value = 0
  horloge = setTimeout(function tic() {
    lettresVisibles.value += 1
    if (lettresVisibles.value < MOT.length) horloge = setTimeout(tic, 72)
  }, 650)
})

onBeforeUnmount(() => clearTimeout(horloge))
</script>

<template>
  <section class="g12 hero">
    <div class="t col-txt">
      <div class="rule-kicker">Du IX<sup>e</sup> au XXI<sup>e</sup> siècle, sur les rives de l'Aveyron</div>
      <h1>
        Mettre en valeur et protéger le patrimoine
        <em>
          <!-- Chaque lettre garde sa place dès le premier rendu : on masque sa
               visibilité, on ne la retire pas du flux. Le titre ne se réajuste
               donc pas pendant l'animation. -->
          <span
            v-for="(lettre, i) in MOT.split('')"
            :key="i"
            :style="{ visibility: i < lettresVisibles ? undefined : 'hidden' }"
          >{{ lettre }}</span>
        </em>
      </h1>
      <p class="lede">
        L'abbaye, l'église, le pont : les trois éléments fondateurs de notre commune. Nous les
        documentons, nous les faisons découvrir, et nous les transmettons.
      </p>
      <div class="cta">
        <a class="btn btn-lg btn-primary" :href="urlAdhesion" target="_blank" rel="noopener">
          Adhérer à l'association
        </a>
        <a class="btn btn-lg btn-secondary" href="#patrimoine">Découvrir le patrimoine</a>
      </div>
    </div>

    <div class="m">
      <div class="brandbox">
        <!-- L'emblème est un SVG : il est servi tel quel, sans passer par
             l'optimiseur d'images (qui ne saurait qu'en dégrader la netteté). -->
        <img
          decoding="async"
          src="/assets/emblem.svg"
          alt="Emblème des Passeurs de Mémoire du Monastère"
          width="977"
          height="1053"
        >
      </div>
    </div>
  </section>
</template>
