<script setup lang="ts">
import {
  aujourdhuiISO,
  libelleDate,
  type Evenement,
  type EtapeProgramme,
} from '#shared/evenements'
import type { Image } from '#shared/phototheque'

/**
 * Gestion des événements.
 *
 * Un seul formulaire couvre les deux moments d'un rendez-vous : son annonce, et
 * le souvenir qu'on en garde. C'est volontaire — écrire le souvenir revient à
 * compléter la fiche existante, pas à créer une seconde entrée, et l'événement
 * conserve ainsi sa date, son titre et son identité.
 *
 * Les événements « du code » (ceux de la maquette) ne sont pas modifiables en
 * place : les enregistrer crée en base une version de même `slug`, qui les
 * remplace sur le site. L'original reste donc toujours récupérable.
 */
definePageMeta({ middleware: 'admin' })

useHead({ title: 'Événements — Back-office' })

const { data: evenements, refresh } = await useAsyncData('admin-evenements', () =>
  useRequestFetch()<Evenement[]>('/api/admin/evenements'),
)

const vide = (): Evenement => ({
  id: '',
  slug: '',
  date: aujourdhuiISO(),
  cadre: '',
  titre: '',
  titreAccueil: '',
  resume: '',
  description: '',
  programme: [],
  cta: { label: '', href: '', variant: 'secondary' },
  souvenir: { recit: '', question: '', photos: [], cta: { label: '', href: '', variant: 'secondary' } },
  source: 'db',
})

const brouillon = ref<Evenement>(vide())
const edition = ref(false)
const message = ref('')
const erreur = ref('')
const enregistrement = ref(false)

function nouveau() {
  brouillon.value = vide()
  edition.value = true
  message.value = ''
  erreur.value = ''
}

function editer(e: Evenement) {
  // Copie profonde : tant que l'enregistrement n'a pas eu lieu, la liste
  // affichée ne doit pas refléter les frappes en cours.
  brouillon.value = JSON.parse(JSON.stringify({ ...vide(), ...e }))
  edition.value = true
  message.value = ''
  erreur.value = ''
}

function ajouterEtape() {
  brouillon.value.programme.push({ heure: '', quoi: '' } as EtapeProgramme)
}
function retirerEtape(i: number) {
  brouillon.value.programme.splice(i, 1)
}
function retirerPhoto(i: number) {
  brouillon.value.souvenir!.photos.splice(i, 1)
}

/**
 * Les photos viennent de la photothèque, pas d'un champ à remplir.
 *
 * Choisies dans la planche, elles arrivent avec leur titre, leur texte
 * alternatif et leur crédit. Le formulaire reste modifiable ensuite : une même
 * photo peut se légender autrement selon l'événement où elle figure — c'est la
 * photothèque qui donne le point de départ, pas la dernière réponse.
 */
const selecteurOuvert = ref(false)
const dejaLa = computed(() => brouillon.value.souvenir?.photos.map((p) => p.src) ?? [])

function ajouterDepuisPhototheque(images: Image[]) {
  for (const image of images) {
    brouillon.value.souvenir!.photos.push({
      src: image.src,
      alt: image.alt,
      titre: image.titre,
      credit: image.credit,
    })
  }
}

/** Ne transmet le souvenir que s'il porte quelque chose à afficher. */
function corpsAEnvoyer() {
  const e = brouillon.value
  const souvenirUtile = !!e.souvenir?.recit?.trim() || !!e.souvenir?.photos.length
  return {
    slug: e.slug.trim(),
    date: e.date,
    cadre: e.cadre.trim(),
    titre: e.titre.trim(),
    titreAccueil: e.titreAccueil?.trim() || null,
    resume: e.resume.trim(),
    description: e.description.trim(),
    programme: e.programme.filter((p) => p.heure.trim() || p.quoi.trim()),
    cta: e.cta?.label?.trim() ? e.cta : null,
    souvenir: souvenirUtile
      ? {
          ...e.souvenir!,
          photos: e.souvenir!.photos.filter((p) => p.src.trim()),
          cta: e.souvenir!.cta?.label?.trim() ? e.souvenir!.cta : undefined,
        }
      : null,
  }
}

async function enregistrer() {
  enregistrement.value = true
  erreur.value = ''
  message.value = ''
  try {
    const corps = corpsAEnvoyer()
    // Un événement défini dans le code n'a pas de ligne en base : l'enregistrer
    // en crée une, de même slug, qui prendra sa place sur le site.
    const enBase = brouillon.value.id && !brouillon.value.id.startsWith('seed:')
    if (enBase) {
      await $fetch(`/api/admin/evenements/${brouillon.value.id}`, { method: 'PATCH', body: corps })
    } else {
      await $fetch('/api/admin/evenements', { method: 'POST', body: corps })
    }
    message.value = 'Enregistré. Le site est à jour dans la minute.'
    edition.value = false
    await refresh()
  } catch (e: unknown) {
    erreur.value = (e as { statusMessage?: string })?.statusMessage || 'Enregistrement impossible.'
  } finally {
    enregistrement.value = false
  }
}

async function supprimer(e: Evenement) {
  if (!confirm(`Supprimer « ${e.titre} » ? Cette action est définitive.`)) return
  erreur.value = ''
  try {
    await $fetch(`/api/admin/evenements/${e.id}`, { method: 'DELETE' })
    message.value = 'Supprimé.'
    await refresh()
  } catch (err: unknown) {
    erreur.value = (err as { statusMessage?: string })?.statusMessage || 'Suppression impossible.'
  }
}

const jour = aujourdhuiISO()
const champ =
  'mt-1 w-full border border-black/15 bg-white px-3 py-2 text-[14px] outline-none focus:border-clay-500'
const etiquette = 'block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-600'
</script>

<template>
  <AdminShell titre="Événements">
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="font-display text-[26px] font-bold tracking-tight">Événements</h1>
        <p class="mt-1 text-[14px] text-slate-600">
          Les rendez-vous à venir et les souvenirs de ceux qui ont eu lieu.
        </p>
      </div>
      <button
        type="button"
        class="bg-clay-600 px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-clay-700"
        @click="nouveau"
      >
        + Nouvel événement
      </button>
    </div>

    <p v-if="message" class="mt-5 border-l-4 border-sage-500 bg-sage-100 px-4 py-3 text-[14px] text-sage-700">
      {{ message }}
    </p>
    <p v-if="erreur" class="mt-5 border-l-4 border-[#A23A2A] bg-[#F2D9D3] px-4 py-3 text-[14px] text-[#A23A2A]">
      {{ erreur }}
    </p>

    <!-- Formulaire -->
    <form v-if="edition" class="mt-7 border border-black/10 bg-white p-6" @submit.prevent="enregistrer">
      <div
        v-if="brouillon.id.startsWith('seed:')"
        class="mb-5 border-l-4 border-clay-400 bg-clay-50 px-4 py-3 text-[13px] leading-relaxed text-slate-700"
      >
        Cet événement est défini dans le code. L'enregistrer publiera une version modifiée qui
        prendra sa place sur le site ; l'original restera intact dans les sources.
      </div>

      <h2 class="font-display text-[17px] font-bold">L'annonce</h2>
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label :class="etiquette" for="f-slug">Identifiant (slug)</label>
          <input id="f-slug" v-model="brouillon.slug" :class="champ" required placeholder="visite-guidee-2027">
        </div>
        <div>
          <label :class="etiquette" for="f-date">Date</label>
          <input id="f-date" v-model="brouillon.date" type="date" :class="champ" required>
        </div>
        <div class="sm:col-span-2">
          <span :class="etiquette">Telle qu'elle s'affichera</span>
          <p class="mt-1 font-accent text-[17px] italic text-clay-700">
            {{ brouillon.date ? libelleDate(brouillon.date) : '—' }}
          </p>
          <p class="mt-1 text-[12px] text-slate-500">
            Le libellé est calculé depuis la date : il s'écrit pareil sur tout le site, et il n'y a
            rien à saisir.
          </p>
        </div>
        <div class="sm:col-span-2">
          <label :class="etiquette" for="f-cadre">Cadre (sous la date)</label>
          <input id="f-cadre" v-model="brouillon.cadre" :class="champ" placeholder="Journées européennes du patrimoine">
        </div>
        <div class="sm:col-span-2">
          <label :class="etiquette" for="f-titre">Titre</label>
          <input id="f-titre" v-model="brouillon.titre" :class="champ" required>
        </div>
        <div class="sm:col-span-2">
          <label :class="etiquette" for="f-ta">Titre raccourci pour l'accueil (facultatif)</label>
          <input id="f-ta" v-model="brouillon.titreAccueil" :class="champ">
        </div>
        <div class="sm:col-span-2">
          <label :class="etiquette" for="f-resume">Résumé (accueil)</label>
          <textarea id="f-resume" v-model="brouillon.resume" rows="2" :class="champ" />
        </div>
        <div class="sm:col-span-2">
          <label :class="etiquette" for="f-desc">Présentation (page Actualités)</label>
          <textarea id="f-desc" v-model="brouillon.description" rows="4" :class="champ" />
        </div>
      </div>

      <h3 class="mt-7 font-display text-[15px] font-bold">Programme (facultatif)</h3>
      <div v-for="(etape, i) in brouillon.programme" :key="i" class="mt-3 flex gap-3">
        <input v-model="etape.heure" :class="[champ, 'max-w-[110px]']" placeholder="14h30">
        <input v-model="etape.quoi" :class="champ" placeholder="Conférence">
        <button type="button" class="px-3 text-[13px] text-slate-500 hover:text-[#A23A2A]" @click="retirerEtape(i)">
          Retirer
        </button>
      </div>
      <button type="button" class="mt-3 text-[13px] font-semibold text-clay-700" @click="ajouterEtape">
        + Ajouter une étape
      </button>

      <h3 class="mt-7 font-display text-[15px] font-bold">Bouton de l'événement</h3>
      <div class="mt-3 grid gap-4 sm:grid-cols-3">
        <div>
          <label :class="etiquette" for="f-ctal">Libellé</label>
          <input id="f-ctal" v-model="brouillon.cta!.label" :class="champ" placeholder="Être prévenu">
        </div>
        <div class="sm:col-span-2">
          <label :class="etiquette" for="f-ctah">Lien</label>
          <input
            id="f-ctah"
            v-model="brouillon.cta!.href"
            :class="champ"
            placeholder="adhesion, mailto:?sujet=… ou une URL"
          >
          <p class="mt-1 text-[12px] text-slate-500">
            <code class="font-mono">adhesion</code> pointe vers le lien HelloAsso du moment ;
            <code class="font-mono">mailto:?sujet=Ma visite</code> écrit à l'association avec cet objet.
          </p>
        </div>
      </div>

      <h2 class="mt-9 font-display text-[17px] font-bold">Le souvenir</h2>
      <p class="mt-1 text-[13px] text-slate-600">
        À remplir après coup. Dès le lendemain de la date, l'événement quitte « À venir » et ce bloc
        prend sa place dans « C'était chez nous ». Laissé vide, l'événement disparaît simplement.
      </p>
      <div class="mt-4 grid gap-4">
        <div>
          <label :class="etiquette" for="f-recit">Récit</label>
          <textarea id="f-recit" v-model="brouillon.souvenir!.recit" rows="3" :class="champ" />
        </div>
        <div>
          <label :class="etiquette" for="f-question">Question mise en exergue (facultatif)</label>
          <input id="f-question" v-model="brouillon.souvenir!.question" :class="champ">
        </div>
      </div>

      <h3 class="mt-6 font-display text-[15px] font-bold">Photos du souvenir</h3>
      <div
        v-for="(photo, i) in brouillon.souvenir!.photos"
        :key="i"
        class="mt-3 grid gap-3 sm:grid-cols-[88px_1fr_auto]"
      >
        <img
          :src="photo.src"
          :alt="photo.alt"
          class="h-16.5 w-22 rounded border border-black/10 bg-slate-100 object-cover"
        >
        <div class="grid gap-2">
          <input v-model="photo.titre" :class="champ" placeholder="La nef, le 3 juillet">
          <input v-model="photo.alt" :class="champ" placeholder="Texte alternatif">
          <div class="grid gap-2 sm:grid-cols-2">
            <input v-model="photo.credit" :class="champ" placeholder="Photo de l'association">
            <input v-model="photo.src" :class="champ" placeholder="/img/…jpg">
          </div>
        </div>
        <button
          type="button"
          class="self-start px-2 py-2 text-[13px] text-slate-500 hover:text-[#A23A2A]"
          :aria-label="`Retirer ${photo.titre || photo.src}`"
          @click="retirerPhoto(i)"
        >
          ✕
        </button>
      </div>
      <button
        type="button"
        class="mt-3 text-[13px] font-semibold text-clay-700"
        @click="selecteurOuvert = true"
      >
        + Choisir dans la photothèque
      </button>

      <AdminSelecteurPhoto
        v-model:ouvert="selecteurOuvert"
        multiple
        :deja-la="dejaLa"
        @choisir="ajouterDepuisPhototheque"
      />

      <div class="mt-8 flex flex-wrap gap-3 border-t border-black/10 pt-6">
        <button
          type="submit"
          class="bg-clay-600 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-clay-700 disabled:opacity-50"
          :disabled="enregistrement"
        >
          {{ enregistrement ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
        <button
          type="button"
          class="border border-black/20 px-5 py-2.5 text-[14px] font-semibold"
          @click="edition = false"
        >
          Annuler
        </button>
      </div>
    </form>

    <!-- Liste -->
    <div class="mt-8 border border-black/10 bg-white">
      <article
        v-for="e in evenements"
        :key="e.id"
        class="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 px-5 py-4 last:border-b-0"
      >
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <span class="font-accent text-[15px] italic text-clay-700">{{ libelleDate(e.date) }}</span>
            <span
              class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em]"
              :class="e.date >= jour ? 'bg-sage-100 text-sage-700' : 'bg-slate-100 text-slate-600'"
            >
              {{ e.date >= jour ? 'À venir' : e.souvenir ? 'Souvenir' : 'Passé, sans souvenir' }}
            </span>
          </div>
          <h2 class="mt-1 font-display text-[16px] font-bold">{{ e.titre }}</h2>
          <p class="mt-1 max-w-[70ch] text-[13px] text-slate-600">{{ e.resume || e.description }}</p>
        </div>
        <div class="flex shrink-0 gap-3">
          <button type="button" class="text-[13px] font-semibold text-clay-700" @click="editer(e)">
            Modifier
          </button>
          <button
            v-if="e.source === 'db'"
            type="button"
            class="text-[13px] font-semibold text-[#A23A2A]"
            @click="supprimer(e)"
          >
            Supprimer
          </button>
        </div>
      </article>
    </div>
  </AdminShell>
</template>
