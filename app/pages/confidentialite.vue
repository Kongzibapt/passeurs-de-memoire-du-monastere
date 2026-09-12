<script setup lang="ts">
import { ASSOCIATION } from '#shared/association'
import { filAriane } from '~/utils/structuredData'

/**
 * Information sur les données personnelles (RGPD).
 *
 * Ajoutée hors maquette : le formulaire de contact recueille un nom, une adresse
 * e-mail et un message, les envoie par courriel et en archive une copie — trois
 * traitements dont le visiteur doit être informé avant d'écrire.
 */
const { public: { siteUrl } } = useRuntimeConfig()

useHead({
  title: 'Données personnelles — Les Passeurs de Mémoire du Monastère',
  meta: [
    {
      name: 'description',
      content:
        'Ce que devient ce que vous nous écrivez : finalité, conservation et droits sur vos données personnelles.',
    },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify(filAriane(siteUrl, [{ nom: 'Données personnelles', chemin: '/confidentialite' }])),
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
        <div class="rule-kicker">Ce que devient ce que vous nous écrivez</div>
        <h1>Données personnelles</h1>
      </section>

      <section class="sec pad prose-legal" style="padding-top: 0">
        <h2>Ce que nous recueillons</h2>
        <p>
          Uniquement ce que vous saisissez dans le formulaire de contact : votre nom, votre adresse
          e-mail, le sujet choisi et votre message. Rien d'autre ne vous est demandé, et le site ne
          vous suit pas d'une page à l'autre.
        </p>

        <h2>Pourquoi, et pour combien de temps</h2>
        <p>
          Ces informations servent à vous répondre, et à rien d'autre. Elles ne sont ni vendues, ni
          transmises à un tiers à des fins commerciales. Le message est expédié à l'adresse de
          l'association et une copie est conservée dans notre base, le temps de traiter la demande
          et d'en garder la trace — trois ans au plus après notre dernier échange.
        </p>

        <h2>Qui les traite</h2>
        <p>
          Le site est hébergé par Vercel Inc. ; les messages transitent par la messagerie Google
          (Gmail) et sont archivés chez Supabase, dont les serveurs sont situés dans l'Union
          européenne. Ces prestataires agissent pour notre compte et n'utilisent pas ces données
          pour eux-mêmes.
        </p>

        <h2>Mesure d'audience</h2>
        <p>
          Nous utilisons Vercel Analytics et Speed Insights, qui comptent les visites et mesurent
          les temps de chargement sans déposer de cookie ni constituer de profil : aucune donnée ne
          permet de vous reconnaître d'une visite à l'autre. C'est pourquoi aucune bannière de
          consentement ne vous est imposée.
        </p>

        <h2>Vos droits</h2>
        <p>
          Vous pouvez à tout moment demander à consulter, corriger ou effacer ce que nous détenons
          sur vous. Un e-mail à
          <a :href="`mailto:${ASSOCIATION.email}`">{{ ASSOCIATION.email }}</a> suffit, et nous
          répondons sous un mois. Si la réponse ne vous satisfait pas, vous pouvez saisir la CNIL
          (<a href="https://www.cnil.fr" target="_blank" rel="noopener">cnil.fr</a>).
        </p>

        <h2>Photographies et souvenirs de famille</h2>
        <p>
          Si vous nous confiez des documents anciens, nous convenons avec vous de ce qui peut être
          publié et sous quel crédit. Vous pouvez revenir sur cet accord : écrivez-nous, et nous
          retirons le document du site.
        </p>
      </section>
    </main>

    <SiteFooter />
  </div>
</template>
