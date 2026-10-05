<script setup lang="ts">
import { LEGENDES } from '#shared/phototheque'

/**
 * Le Bureau et les membres de l'association, en une photo de groupe.
 *
 * La photo de groupe est suivie de la composition du Bureau.
 * La légende vient de la photothèque, pour que la photo se présente de la même
 * façon ici et dans le sélecteur du back-office.
 */
const SRC = '/img/bureau-membres.jpg'
const photo = LEGENDES[SRC]!

const BUREAU = [
  { role: 'Présidente', noms: 'Françoise Tranier-Lagarrigue' },
  { role: 'Vice-présidents', noms: 'François Arnal et Jean-Louis Roques' },
  { role: 'Trésorière', noms: 'Clara Marty-Andréan' },
  { role: 'Secrétaire', noms: 'Julien Tranier-Lagarrigue' },
  { role: 'Secrétaire adjointe', noms: 'Catherine Pomarède' },
]
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
    <div class="bureau-layout">
      <figure class="bureau-photo">
        <NuxtImg
          :src="SRC"
          :alt="photo.alt"
          width="885"
          height="500"
          loading="lazy"
          decoding="async"
          sizes="xs:100vw sm:100vw md:100vw lg:720px xl:720px xxl:720px"
        />
        <figcaption class="cap">
          <b>{{ photo.titre }}</b> {{ photo.credit }}
        </figcaption>
      </figure>
      <div class="composition">
        <h3>Composition du Bureau</h3>
        <dl>
          <div v-for="m in BUREAU" :key="m.role">
            <dt>{{ m.role }}</dt>
            <dd>{{ m.noms }}</dd>
          </div>
        </dl>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* La photo source fait 885 px de large : on la garde en deçà, à l'échelle du texte. */
.bureau-photo {
  margin: 0;
  flex: 0 1 720px;
  min-width: 0;
}
/* La composition se place à droite de la photo quand la largeur le permet, sinon elle passe dessous. */
.bureau-layout {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 2rem;
}
.composition {
  flex: 1 1 18rem;
  container-type: inline-size;
}
.composition dl {
  margin: 0;
}
.composition dl > div {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 1rem;
  padding: 0.5rem 0;
}
.composition dt {
  font-weight: 600;
}
@container (min-width: 26rem) {
  .composition dt {
    min-width: 11rem;
  }
}
.composition dd {
  margin: 0;
}
.bureau-photo img {
  display: block;
  width: 100%;
  height: auto;
}
</style>
