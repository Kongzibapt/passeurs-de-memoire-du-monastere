<script setup lang="ts">
import { classePosition } from '#shared/archives'
import { mailto } from '#shared/association'

/**
 * « Ce que les greniers ont conservé » — les documents d'archives, posés en
 * désordre les uns sur les autres.
 *
 * Le bouton d'appel flotte au centre du tas (`.docs-cta` est en position
 * absolue, sans interception du pointeur sauf sur le bouton lui-même) : le
 * visiteur voit les cartes postales à travers, et le geste attendu — nous
 * envoyer les siennes — reste au premier plan.
 */
const { data: archives } = await useArchives()
</script>

<template>
  <section id="archives" class="arch pad">
    <div class="sec-head">
      <div class="t-eyebrow">Qu'a gardé le village ?</div>
      <h2>Ce que les greniers ont conservé</h2>
      <p>
        Cartes postales, vues du bourg, photographies de famille. Un fonds qui s'enrichit à chaque
        boîte retrouvée dans un grenier.
      </p>
    </div>

    <div class="docs-wrap">
      <div class="docs">
        <figure
          v-for="(doc, i) in archives"
          :key="doc.id"
          class="doc"
          :class="classePosition(i)"
        >
          <NuxtImg
            :src="doc.src"
            :alt="doc.alt"
            loading="lazy"
            decoding="async"
            sizes="xs:40vw sm:40vw md:40vw lg:30vw xl:360px xxl:360px"
          />
          <figcaption class="cap">
            <b>{{ doc.titre }}</b> {{ doc.legende }}
          </figcaption>
        </figure>
      </div>
      <div class="docs-cta">
        <a class="btn btn-primary" :href="mailto(`Photos d'archives`)">
          Vous avez des photos ? Écrivez-nous
        </a>
      </div>
    </div>
  </section>
</template>
