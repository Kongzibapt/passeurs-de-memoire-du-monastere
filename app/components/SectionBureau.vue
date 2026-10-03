<script setup lang="ts">
import { LEGENDES } from '#shared/phototheque'

/**
 * Le Bureau et les membres de l'association, en une photo de groupe.
 *
 * Personne n'est nommé : la section présente l'équipe, pas un organigramme.
 * La légende vient de la photothèque, pour que la photo se présente de la même
 * façon ici et dans le sélecteur du back-office.
 */
const SRC = '/img/bureau-membres.jpg'
const photo = LEGENDES[SRC]!
</script>

<template>
  <section id="bureau" class="equipe pad">
    <div class="sec-head">
      <div class="t-eyebrow">Qui sommes-nous ?</div>
      <h2>Le Bureau et les membres</h2>
      <p>
        Des habitants du Monastère et des amoureux de son histoire, réunis bénévolement pour en
        garder la mémoire et la partager.
      </p>
    </div>
    <figure class="bureau-photo">
      <NuxtImg
        :src="SRC"
        :alt="photo.alt"
        width="885"
        height="500"
        loading="lazy"
        decoding="async"
        sizes="xs:100vw sm:100vw md:100vw lg:885px xl:885px xxl:885px"
      />
      <figcaption class="cap">
        <b>{{ photo.titre }}</b> {{ photo.credit }}
      </figcaption>
    </figure>
  </section>
</template>

<style scoped>
/* La photo source fait 885 px de large : l'étirer au-delà la rendrait floue. */
.bureau-photo {
  margin: 0;
  max-width: 885px;
}
.bureau-photo img {
  display: block;
  width: 100%;
  height: auto;
}
</style>
