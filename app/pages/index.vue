<script setup lang="ts">
/**
 * Accueil.
 *
 * L'ordre des sections est celui de la maquette et raconte une progression :
 * ce que nous protégeons → ce qu'il y a autour → ce que le temps en a fait →
 * pourquoi nous le faisons → quand → ce que le village a gardé → où nous
 * retrouver → nous rejoindre → nous écrire.
 */
const { data: evenements } = await useEvenements()
</script>

<template>
  <div>
    <a class="skip" href="#contenu">Aller au contenu</a>
    <SiteHeader />

    <main id="contenu">
      <SectionHero />
      <SectionPatrimoine />
      <SectionAutour />
      <SectionComparateur />
      <SectionBut />
      <SectionRiviere />
      <SectionArchives />

      <section class="sec pad">
        <div class="sec-head">
          <div class="t-eyebrow">Où nous rencontrer ?</div>
          <h2>Rendez-vous</h2>
        </div>
        <EvenementsListe :evenements="evenements" variante="accueil" :limite="3" />
        <div class="cta">
          <NuxtLink class="btn btn-secondary" to="/actualites">Toutes les actualités</NuxtLink>
        </div>
      </section>

      <SectionAdherer />
      <SectionContact />
      <SectionDevise />
    </main>

    <SiteFooter />
  </div>
</template>
