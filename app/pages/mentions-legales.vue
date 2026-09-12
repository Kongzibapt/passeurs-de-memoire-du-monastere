<script setup lang="ts">
import { ASSOCIATION } from '#shared/association'
import { filAriane } from '~/utils/structuredData'

/**
 * Mentions légales.
 *
 * Cette page ne vient pas de la maquette : elle est ajoutée parce qu'un site
 * d'association ouvert au public doit identifier son éditeur et son hébergeur
 * (LCEN, art. 6-III). Les valeurs entre crochets restent à compléter par
 * l'association — voir la section « À compléter » du README.
 */
const { public: { siteUrl } } = useRuntimeConfig()

useHead({
  title: 'Mentions légales — Les Passeurs de Mémoire du Monastère',
  meta: [{ name: 'description', content: 'Éditeur, hébergeur et crédits du site des Passeurs de Mémoire du Monastère.' }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(filAriane(siteUrl, [{ nom: 'Mentions légales', chemin: '/mentions-legales' }])),
    },
  ],
})
</script>

<template>
  <div>
    <a class="skip" href="#contenu">Aller au contenu</a>
    <SiteHeader />

    <main id="contenu">
      <section class="page-head pad">
        <div class="rule-kicker">Informations légales</div>
        <h1>Mentions légales</h1>
      </section>

      <section class="sec pad prose-legal" style="padding-top: 0">
        <h2>Éditeur du site</h2>
        <p>
          {{ ASSOCIATION.nom }}, association régie par la loi du 1<sup>er</sup> juillet 1901.<br>
          Siège social : {{ ASSOCIATION.adresse.ligne1 }}, {{ ASSOCIATION.adresse.codePostal }}
          {{ ASSOCIATION.adresse.ville }}.<br>
          Adresse électronique :
          <a :href="`mailto:${ASSOCIATION.email}`">{{ ASSOCIATION.email }}</a>.
        </p>
        <p>
          Numéro RNA : [à compléter]. Directeur de la publication : [président·e de l'association].
        </p>

        <h2>Hébergement</h2>
        <p>
          Le site est hébergé par Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723,
          États-Unis — <a href="https://vercel.com" target="_blank" rel="noopener">vercel.com</a>.
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          Les photographies signalées « Photo de l'association » et les documents d'archives
          présentés sur ce site appartiennent à l'association ou lui ont été confiés par leurs
          détenteurs. Les cartes postales anciennes reproduites proviennent de la collection de
          l'association. Toute reprise, même partielle, suppose notre accord écrit préalable :
          écrivez-nous.
        </p>
        <p>
          Les notices historiques s'appuient sur les travaux du Service Patrimoine de Rodez
          Agglomération, complétés par la commission patrimoine de l'association.
        </p>

        <h2>Signaler une erreur</h2>
        <p>
          Ce site parle d'histoire locale : une date, un nom ou une attribution peuvent nous avoir
          échappé. Si vous relevez une erreur, ou si un document publié ici vous appartient,
          écrivez-nous à <a :href="`mailto:${ASSOCIATION.email}`">{{ ASSOCIATION.email }}</a> — nous
          corrigeons ou retirons.
        </p>

        <h2>Données personnelles</h2>
        <p>
          Le traitement des informations transmises par le formulaire de contact est décrit sur la
          page <NuxtLink to="/confidentialite">Données personnelles</NuxtLink>.
        </p>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>
