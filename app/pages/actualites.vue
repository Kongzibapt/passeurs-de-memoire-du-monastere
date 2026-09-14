<script setup lang="ts">
import { aVenir, libelleDate } from '#shared/evenements'
import { filAriane } from '~/utils/structuredData'

/**
 * Actualités & rendez-vous.
 *
 * Deux temps : ce qui vient, et ce qui a eu lieu. Les deux listes se remplissent
 * seules à partir de la même source — un événement bascule de l'une à l'autre le
 * lendemain de sa date.
 */
const { data: evenements } = await useEvenements()
const { public: { siteUrl } } = useRuntimeConfig()

const prochains = computed(() => aVenir(evenements.value))

/**
 * Chapeau de la bande d'adhésion : il annonce le prochain rendez-vous, ou
 * reconnaît qu'il n'y en a pas encore — la maquette figeait ici la date de
 * septembre, qui aurait vieilli.
 */
const prochainRendezVous = computed(() => {
  const suivant = prochains.value[0]
  return suivant
    ? `Prochain rendez-vous : ${suivant.titre.toLowerCase()}, ${libelleDate(suivant.date).toLowerCase()}.`
    : 'Les prochaines dates sont en préparation : écrivez-nous pour être prévenu.'
})

useHead({
  title: 'Actualités & rendez-vous — Les Passeurs de Mémoire du Monastère',
  meta: [
    {
      name: 'description',
      content:
        'Les rendez-vous des Passeurs de Mémoire du Monastère : journées du patrimoine, visites, conférences et concerts.',
    },
    { property: 'og:title', content: 'Actualités & rendez-vous — Les Passeurs de Mémoire du Monastère' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(filAriane(siteUrl, [{ nom: 'Actualités', chemin: '/actualites' }])),
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
        <div class="rule-kicker">Visites, conférences, concerts et journées de rencontre</div>
        <h1>Actualités &amp; rendez-vous</h1>
        <p class="lede">
          Les réponses aux questions du village se donnent sur place. Voici où nous retrouver.
        </p>
      </section>

      <section class="sec pad" style="padding-top: 0">
        <div class="sec-head">
          <div class="t-eyebrow">À venir</div>
        </div>
        <EvenementsListe :evenements="evenements" variante="actualites" />
      </section>

      <SectionSouvenirs :evenements="evenements" />

      <SectionAdherer
        titre="Nous rejoindre pour la suite"
        texte="Les adhérents reçoivent les invitations aux visites et conférences, et donnent à l'association les moyens de travailler."
        colonne="slot"
        :question="false"
      >
        <div class="reason">
          <div class="n">→</div>
          <p>{{ prochainRendezVous }}</p>
        </div>
      </SectionAdherer>

      <!-- Le formulaire est aussi ici, et pas seulement sur l'accueil : c'est
           en lisant les rendez-vous passés qu'on se souvient d'une photo ou
           d'une histoire à raconter. Faire revenir le visiteur sur l'accueil
           pour écrire, c'est le perdre en chemin. -->
      <SectionContact />
    </main>

    <SiteFooter />
  </div>
</template>
