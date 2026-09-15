<script setup lang="ts">
import { chercherImages, formatDimensions, type Image } from '#shared/phototheque'

/**
 * La photothèque : toutes les images du site, et ce qu'on en dit.
 *
 * On n'y téléverse pas. Les fichiers vivent dans `public/img/`, versionnés avec
 * le site : une photo d'archives est un objet qu'on conserve, et la mettre dans
 * le dépôt la met à l'abri d'un compte de stockage fermé. Pour en ajouter, on
 * dépose le fichier dans le dossier et on relance `npm run phototheque` — la
 * construction le fait d'elle-même.
 *
 * Ce qui se modifie ici, ce sont les LÉGENDES : titre, texte alternatif,
 * crédit, mots-clés. Elles servent partout où l'on choisit une image, et le
 * texte alternatif est la seule chose que lira quelqu'un qui ne voit pas
 * l'écran — d'où le compte des images qui en manquent, en tête de page.
 */
definePageMeta({ middleware: 'admin' })

useHead({ title: 'Photothèque — Back-office' })

const { images, chargement, erreur, assurerCharge, enregistrer, reinitialiser } = usePhototheque()

await assurerCharge()

const recherche = ref('')
const choisie = ref<Image | null>(null)
const brouillon = ref({ titre: '', alt: '', credit: '', motsCles: '' })
const message = ref('')
const soucis = ref('')
const enCours = ref(false)

const visibles = computed(() => chercherImages(images.value ?? [], recherche.value))
const sansAlt = computed(() => (images.value ?? []).filter((i) => !i.alt).length)

function ouvrir(image: Image) {
  choisie.value = image
  brouillon.value = {
    titre: image.titre,
    alt: image.alt,
    credit: image.credit,
    motsCles: image.motsCles.join(', '),
  }
  message.value = ''
  soucis.value = ''
}

function fermer() {
  choisie.value = null
}

async function sauvegarder() {
  if (!choisie.value) return
  enCours.value = true
  message.value = ''
  soucis.value = ''
  try {
    const image = await enregistrer(choisie.value.src, {
      titre: brouillon.value.titre.trim(),
      alt: brouillon.value.alt.trim(),
      credit: brouillon.value.credit.trim(),
      motsCles: brouillon.value.motsCles
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean),
    })
    choisie.value = image
    message.value = 'Légende enregistrée.'
  } catch (e: unknown) {
    soucis.value = messageErreur(e)
  } finally {
    enCours.value = false
  }
}

async function rendreAuCode() {
  if (!choisie.value) return
  enCours.value = true
  message.value = ''
  soucis.value = ''
  try {
    const image = await reinitialiser(choisie.value.src)
    ouvrir(image)
    message.value = 'Légende du code rétablie.'
  } catch (e: unknown) {
    soucis.value = messageErreur(e)
  } finally {
    enCours.value = false
  }
}

function messageErreur(e: unknown): string {
  const err = e as { data?: { statusMessage?: string }; statusMessage?: string }
  return err?.data?.statusMessage || err?.statusMessage || "L'enregistrement a échoué."
}

async function copierChemin(src: string) {
  try {
    await navigator.clipboard.writeText(src)
    message.value = `${src} copié.`
  } catch {
    // Le presse-papiers peut être refusé (page non sécurisée, permission
    // retirée) : le chemin reste affiché et sélectionnable à côté.
    soucis.value = 'Copie refusée par le navigateur — le chemin est affiché ci-dessus.'
  }
}

const champ =
  'w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-[14px] focus:border-clay-600 focus:outline-none'
const etiquette = 'block text-[12px] font-semibold uppercase tracking-wider text-slate-500'
</script>

<template>
  <AdminShell titre="Photothèque">
    <div>
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 class="font-display text-[26px] font-bold">Photothèque</h1>
          <p class="mt-1 max-w-[62ch] text-[14px] text-slate-600">
            Les {{ images.length }} images de <code>public/img/</code>, telles qu'elles seront
            proposées au moment de composer un événement ou une archive. On ne téléverse pas ici :
            on dépose le fichier dans le dossier, et la construction l'inventorie.
          </p>
        </div>
        <p
          v-if="sansAlt"
          class="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] text-amber-900"
        >
          <b>{{ sansAlt }}</b> image{{ sansAlt > 1 ? 's' : '' }} sans texte alternatif — muette{{ sansAlt > 1 ? 's' : '' }}
          pour qui ne voit pas l'écran.
        </p>
      </header>

      <input
        v-model="recherche"
        type="search"
        placeholder="Chercher : église, pont, carte postale, 2026…"
        class="mt-6 w-full max-w-[420px] rounded-lg border border-black/10 bg-white px-3 py-2 text-[14px] focus:border-clay-600 focus:outline-none"
      >

      <p v-if="chargement" class="mt-10 text-[14px] text-slate-500">Chargement…</p>
      <p v-else-if="erreur" class="mt-10 text-[14px] text-red-700">{{ erreur }}</p>
      <p v-else-if="!visibles.length" class="mt-10 text-[14px] text-slate-500">
        Aucune image ne correspond à « {{ recherche }} ».
      </p>

      <div v-else class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <button
          v-for="image in visibles"
          :key="image.src"
          type="button"
          class="overflow-hidden rounded-xl border border-black/10 bg-white text-left transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-clay-600"
          @click="ouvrir(image)"
        >
          <img
            :src="image.src"
            :alt="image.alt || image.titre"
            loading="lazy"
            decoding="async"
            class="aspect-[4/3] w-full bg-slate-100 object-cover"
          >
          <span class="block px-3 py-2.5">
            <span class="block truncate text-[13.5px] font-semibold">{{ image.titre }}</span>
            <span class="block truncate text-[11.5px] text-slate-500">{{ formatDimensions(image) }}</span>
            <span class="mt-1.5 flex flex-wrap gap-1">
              <span
                v-if="image.source === 'base'"
                class="rounded-full bg-clay-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-clay-800"
              >
                légende retouchée
              </span>
              <span
                v-if="!image.alt"
                class="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-900"
              >
                sans alt
              </span>
            </span>
          </span>
        </button>
      </div>
    </div>

    <!-- Fiche d'une image -->
    <Teleport to="body">
      <div
        v-if="choisie"
        class="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        :aria-label="choisie.titre"
        @click.self="fermer"
        @keydown.esc="fermer"
      >
        <div class="flex max-h-[92vh] w-full max-w-[900px] flex-col overflow-hidden rounded-t-2xl bg-[#f4f5f6] shadow-2xl sm:rounded-2xl">
          <div class="flex items-start justify-between gap-4 border-b border-black/10 bg-white px-5 py-4">
            <div class="min-w-0">
              <h2 class="truncate font-display text-[17px] font-bold">{{ choisie.titre }}</h2>
              <p class="truncate text-[12.5px] text-slate-500">
                <code>{{ choisie.src }}</code> · {{ formatDimensions(choisie) }}
              </p>
            </div>
            <button
              type="button"
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              aria-label="Fermer"
              @click="fermer"
            >
              ✕
            </button>
          </div>

          <div class="grid flex-1 gap-5 overflow-y-auto p-5 md:grid-cols-[minmax(0,320px)_1fr]">
            <img
              :src="choisie.src"
              :alt="choisie.alt || choisie.titre"
              class="w-full rounded-xl bg-slate-100 object-contain"
            >

            <form class="grid content-start gap-4" @submit.prevent="sauvegarder">
              <div class="grid gap-1.5">
                <label :class="etiquette" for="p-titre">Titre</label>
                <input id="p-titre" v-model="brouillon.titre" :class="champ">
              </div>
              <div class="grid gap-1.5">
                <label :class="etiquette" for="p-alt">Texte alternatif</label>
                <textarea id="p-alt" v-model="brouillon.alt" rows="3" :class="champ" />
                <p class="text-[12px] text-slate-500">
                  Ce que montre l'image, en une phrase. C'est la seule chose que lira quelqu'un qui
                  ne voit pas l'écran.
                </p>
              </div>
              <div class="grid gap-1.5">
                <label :class="etiquette" for="p-credit">Crédit</label>
                <input id="p-credit" v-model="brouillon.credit" :class="champ">
              </div>
              <div class="grid gap-1.5">
                <label :class="etiquette" for="p-mots">Mots-clés</label>
                <input id="p-mots" v-model="brouillon.motsCles" :class="champ" placeholder="église, portail, 2026">
                <p class="text-[12px] text-slate-500">Séparés par des virgules. Ils servent à la recherche.</p>
              </div>

              <p v-if="message" class="text-[13px] font-semibold text-green-800">{{ message }}</p>
              <p v-if="soucis" class="text-[13px] font-semibold text-red-700">{{ soucis }}</p>

              <div class="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  class="rounded-lg bg-clay-600 px-4 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-clay-700 disabled:opacity-50"
                  :disabled="enCours"
                >
                  {{ enCours ? 'Enregistrement…' : 'Enregistrer' }}
                </button>
                <button
                  type="button"
                  class="rounded-lg border border-black/15 px-4 py-2 text-[14px] font-medium transition-colors hover:bg-white"
                  @click="copierChemin(choisie!.src)"
                >
                  Copier le chemin
                </button>
                <button
                  v-if="choisie.source === 'base'"
                  type="button"
                  class="text-[13px] text-slate-500 underline transition-colors hover:text-slate-900"
                  :disabled="enCours"
                  @click="rendreAuCode"
                >
                  Revenir à la légende du code
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Teleport>
  </AdminShell>
</template>
