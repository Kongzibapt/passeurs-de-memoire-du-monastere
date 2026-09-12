<script setup lang="ts">
import { ASSOCIATION } from '#shared/association'

const { urlAdhesion } = useReglages()

/**
 * L'année du copyright suit l'horloge plutôt que d'être figée à 2026 : un pied
 * de page qui affiche une année périmée est le premier signe d'un site
 * abandonné, et c'est précisément l'impression qu'une association de patrimoine
 * ne peut pas se permettre.
 */
const annee = new Date().getFullYear()
</script>

<template>
  <footer id="contact" class="foot pad">
    <div class="grid">
      <div>
        <NuxtLink class="mark logo-full" to="/">
          <img
            loading="lazy"
            decoding="async"
            src="/assets/logo-officiel.png"
            :alt="ASSOCIATION.nom"
            width="1292"
            height="1600"
          >
        </NuxtLink>
        <p>{{ ASSOCIATION.baseline }}</p>
      </div>

      <div>
        <h4>Nous écrire</h4>
        <div class="links">
          <a :href="`mailto:${ASSOCIATION.email}`">{{ ASSOCIATION.email }}</a>
          <span>
            {{ ASSOCIATION.adresse.ligne1 }}<br>
            {{ ASSOCIATION.adresse.codePostal }} {{ ASSOCIATION.adresse.ville }}
          </span>
        </div>
      </div>

      <div>
        <h4>Le site</h4>
        <div class="links">
          <NuxtLink to="/#patrimoine">Le patrimoine</NuxtLink>
          <NuxtLink to="/#archives">Archives</NuxtLink>
          <NuxtLink to="/actualites">Actualités</NuxtLink>
          <a :href="urlAdhesion" target="_blank" rel="noopener">Adhérer</a>
          <NuxtLink to="/mentions-legales">Mentions légales</NuxtLink>
          <NuxtLink to="/confidentialite">Données personnelles</NuxtLink>
        </div>
      </div>
    </div>

    <div class="fine">
      <span>© {{ annee }} {{ ASSOCIATION.nom }}</span>
      <span>
        <a :href="urlAdhesion" target="_blank" rel="noopener">Adhésion en ligne via HelloAsso</a>
      </span>
    </div>
  </footer>
</template>
