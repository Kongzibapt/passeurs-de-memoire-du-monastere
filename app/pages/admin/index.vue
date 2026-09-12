<script setup lang="ts">
/**
 * Porte d'entrée du back-office : écran de connexion tant que la session n'est
 * pas ouverte, tableau de bord ensuite.
 *
 * Le mot de passe ne circule qu'une fois, vers `/api/admin/login` ; ce qui
 * revient est un cookie httpOnly que le JavaScript de la page ne peut pas lire.
 */
definePageMeta({ middleware: 'admin' })

useHead({
  title: 'Back-office — Les Passeurs de Mémoire',
  meta: [{ name: 'robots', content: 'noindex, nofollow' }],
})

const { data: session, refresh } = await useAsyncData('admin-session', () =>
  useRequestFetch()<{ authed: boolean }>('/api/admin/session'),
)

const motDePasse = ref('')
const erreur = ref('')
const enCours = ref(false)

async function seConnecter() {
  enCours.value = true
  erreur.value = ''
  try {
    await $fetch('/api/admin/login', { method: 'POST', body: { password: motDePasse.value } })
    motDePasse.value = ''
    await refresh()
  } catch (e: unknown) {
    erreur.value =
      (e as { statusMessage?: string })?.statusMessage || 'Connexion impossible. Réessayez.'
  } finally {
    enCours.value = false
  }
}

const outils = [
  {
    to: '/admin/evenements',
    titre: 'Événements',
    texte:
      "Annoncer un rendez-vous, corriger une date, écrire le souvenir d'une soirée passée. Un événement bascule tout seul dans « C'était chez nous » le lendemain de sa date.",
  },
  {
    to: '/admin/archives',
    titre: 'Archives',
    texte:
      'Ajouter au fonds les cartes postales et photographies retrouvées, avec leur légende et leur provenance.',
  },
  {
    to: '/admin/reglages',
    titre: 'Réglages',
    texte:
      "Le lien HelloAsso de la campagne d'adhésion en cours — celui que portent tous les boutons « Adhérer » du site.",
  },
]
</script>

<template>
  <!-- Connexion -->
  <div v-if="!session?.authed" class="grid min-h-screen place-items-center bg-slate-900 px-5 font-body">
    <form class="w-full max-w-[380px]" @submit.prevent="seConnecter">
      <img src="/assets/emblem.svg" alt="" class="mx-auto mb-6 h-20 w-20">
      <h1 class="text-center font-display text-[22px] font-bold tracking-tight text-white">
        Back-office
      </h1>
      <p class="mt-2 text-center font-accent text-[15px] italic text-white/60">
        Les Passeurs de Mémoire du Monastère
      </p>

      <label for="mdp" class="mt-8 block text-[11px] font-bold uppercase tracking-[0.14em] text-white/50">
        Mot de passe
      </label>
      <input
        id="mdp"
        v-model="motDePasse"
        type="password"
        autocomplete="current-password"
        required
        class="mt-2 w-full border border-white/20 bg-white/5 px-4 py-3 text-white outline-none focus:border-clay-400"
      >

      <p v-if="erreur" class="mt-3 text-[14px] text-clay-300">{{ erreur }}</p>

      <button
        type="submit"
        class="mt-5 w-full bg-clay-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-clay-700 disabled:opacity-50"
        :disabled="enCours"
      >
        {{ enCours ? 'Vérification…' : 'Entrer' }}
      </button>

      <NuxtLink to="/" class="mt-6 block text-center text-[13px] text-white/50 hover:text-white">
        ← Retour au site
      </NuxtLink>
    </form>
  </div>

  <!-- Tableau de bord -->
  <AdminShell v-else :retour="false">
    <h1 class="font-display text-[28px] font-bold tracking-tight">Tableau de bord</h1>
    <p class="mt-2 max-w-[60ch] text-[15px] text-slate-600">
      Ce qui est modifié ici apparaît sur le site dans la minute. Le contenu d'origine reste
      toujours en place : le modifier revient à publier une version qui le remplace.
    </p>

    <div class="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="outil in outils"
        :key="outil.to"
        :to="outil.to"
        class="block border border-black/10 bg-white p-6 transition-shadow hover:shadow-lg"
      >
        <h2 class="font-display text-[18px] font-bold">{{ outil.titre }}</h2>
        <p class="mt-2 text-[14px] leading-relaxed text-slate-600">{{ outil.texte }}</p>
        <span class="mt-4 inline-block text-[14px] font-semibold text-clay-700">Ouvrir →</span>
      </NuxtLink>
    </div>

    <div class="mt-10 border-l-4 border-clay-300 bg-clay-50 p-5">
      <h2 class="font-display text-[15px] font-bold">Avant la première utilisation</h2>
      <p class="mt-2 max-w-[70ch] text-[14px] leading-relaxed text-slate-700">
        Les écritures ont besoin de Supabase. Si un enregistrement échoue en disant qu'une table est
        absente, c'est que les fichiers de <code class="font-mono text-[13px]">supabase/</code> n'ont
        pas encore été joués dans l'éditeur SQL du projet. La lecture, elle, fonctionne sans base :
        le site affiche alors le contenu défini dans le code.
      </p>
    </div>
  </AdminShell>
</template>
