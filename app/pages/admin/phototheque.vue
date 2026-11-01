<script setup lang="ts">
import { chercherImages, type Image } from '#shared/phototheque'
import { LONGUEURS, messageErreur } from '~/composables/useEvenementsAdmin'

/**
 * La photothèque, en simple : on ajoute des photos, on les voit toutes, on en
 * touche une pour la nommer, la décrire ou la supprimer.
 *
 * Toutes vivent dans Supabase Storage. Une photo qu'une page affiche encore ne
 * se supprime pas : le serveur refuse, et dit où elle sert.
 *
 * Le titre et la description suivent la photo partout où on la choisit ; la
 * description est la seule chose que lira quelqu'un qui ne voit pas l'écran.
 * Les mots-clés existants sont conservés, mais ne se saisissent plus ici.
 */
definePageMeta({ middleware: 'admin' })

useHead({ title: 'Photothèque — Back-office' })

const { images, chargement, erreur, assurerCharge, enregistrer, supprimer } = usePhototheque()

await assurerCharge()

const recherche = ref('')
const choisie = ref<Image | null>(null)
const brouillon = ref({ titre: '', alt: '', credit: '' })
const message = ref('')
const soucis = ref('')
const enCours = ref(false)

const visibles = computed(() => chercherImages(images.value ?? [], recherche.value))

function ouvrir(image: Image, nouvelle = false) {
  choisie.value = image
  // Une photo tout juste déposée porte son nom de fichier (« IMG 2034 ») :
  // on laisse le champ vide pour qu'on lui donne un vrai nom.
  brouillon.value = { titre: nouvelle ? '' : image.titre, alt: image.alt, credit: image.credit }
  soucis.value = ''
}

function apresDepot(deposees: Image[]) {
  message.value =
    deposees.length > 1
      ? `${deposees.length} photos ajoutées. Elles sont en tête de la liste ; touchez-en une pour lui donner un nom.`
      : 'Photo ajoutée. Donnez-lui un nom et décrivez-la en quelques mots.'
  ouvrir(deposees[0]!, true)
}

function fermer() {
  choisie.value = null
}

async function sauvegarder() {
  if (!choisie.value) return
  enCours.value = true
  soucis.value = ''
  try {
    await enregistrer(choisie.value.src, {
      titre: brouillon.value.titre.trim(),
      alt: brouillon.value.alt.trim(),
      credit: brouillon.value.credit.trim(),
    })
    message.value = 'Enregistré.'
    fermer()
  } catch (e: unknown) {
    soucis.value = messageErreur(e)
  } finally {
    enCours.value = false
  }
}

async function retirer() {
  const image = choisie.value
  if (!image) return
  if (!confirm(`Supprimer définitivement la photo « ${image.titre} » ?`)) return
  enCours.value = true
  soucis.value = ''
  try {
    await supprimer(image.src)
    message.value = 'Photo supprimée.'
    fermer()
  } catch (e: unknown) {
    soucis.value = messageErreur(e, "La suppression n'a pas abouti. Réessayez dans un instant.")
  } finally {
    enCours.value = false
  }
}
</script>

<template>
  <AdminShell titre="Photothèque">
    <div class="mx-auto max-w-[1100px]">
      <h1 class="font-display text-[32px] font-bold">Vos photos</h1>
      <p class="mt-2 max-w-[60ch] text-[18px] text-slate-600">
        Ajoutez ici les photos de l'association. Elles seront proposées chaque fois que vous
        annoncerez ou raconterez un événement.
      </p>

      <AdminDepotPhotos class="mt-7" @deposees="apresDepot" />

      <p
        v-if="message"
        class="mt-6 rounded-xl border-l-4 border-green-700 bg-green-50 px-5 py-4 text-[18px] font-semibold text-green-900"
        role="status"
      >
        ✓ {{ message }}
      </p>

      <div class="mt-10 flex flex-wrap items-end justify-between gap-4">
        <h2 class="font-display text-[24px] font-bold">
          {{ images.length }} photo{{ images.length > 1 ? 's' : '' }}
        </h2>
        <div class="w-full sm:w-[360px]">
          <label for="p-recherche" class="sr-only">Chercher une photo</label>
          <input
            id="p-recherche"
            v-model="recherche"
            type="search"
            placeholder="Chercher : église, pont, 2026…"
            class="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-[18px] outline-none focus:border-clay-600"
          >
        </div>
      </div>

      <p v-if="chargement" class="mt-8 text-[18px] text-slate-600">Chargement des photos…</p>
      <p v-else-if="erreur" class="mt-8 text-[18px] text-red-800">{{ erreur }}</p>
      <p v-else-if="!visibles.length" class="mt-8 text-[18px] text-slate-600">
        Aucune photo ne correspond à « {{ recherche }} ».
      </p>

      <ul v-else class="mt-6 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        <li v-for="image in visibles" :key="image.src">
          <button
            type="button"
            class="block w-full overflow-hidden rounded-xl border-2 border-transparent bg-white text-left shadow-sm transition-colors hover:border-clay-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-clay-400"
            @click="ouvrir(image)"
          >
            <img
              :src="image.src"
              :alt="image.alt || image.titre"
              loading="lazy"
              decoding="async"
              class="aspect-[4/3] w-full bg-slate-100 object-cover"
            >
            <span class="block px-3 py-3 text-[17px] font-semibold leading-snug">{{ image.titre }}</span>
          </button>
        </li>
      </ul>
    </div>

    <!-- Fiche d'une photo -->
    <Teleport to="body">
      <div
        v-if="choisie"
        class="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:items-center sm:p-6"
        role="dialog"
        aria-modal="true"
        :aria-label="choisie.titre"
        @click.self="fermer"
        @keydown.esc="fermer"
      >
        <form
          class="flex max-h-[94vh] w-full max-w-[920px] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
          @submit.prevent="sauvegarder"
        >
          <div class="grid flex-1 gap-7 overflow-y-auto p-6 md:grid-cols-[minmax(0,340px)_1fr] sm:p-8">
            <img :src="choisie.src" :alt="choisie.alt || choisie.titre" class="w-full rounded-xl bg-slate-100 object-contain">

            <div class="grid content-start gap-7">
              <AdminChamp
                id="p-titre"
                v-model="brouillon.titre"
                question="Nom de la photo"
                aide="Quelques mots : c'est sous ce nom que vous la retrouverez."
                exemple="Le portail de l'église"
                :longueur="LONGUEURS.legende"
              />
              <AdminChamp
                id="p-alt"
                v-model="brouillon.alt"
                question="Que voit-on sur la photo ?"
                aide="Une phrase, lue à voix haute aux personnes qui ne voient pas l'écran."
                exemple="Le portail sculpté de l'église du Monastère, sous un ciel bleu"
                :longueur="{ min: 20, max: 150, limite: 250 }"
                :lignes="3"
              />
              <AdminChamp
                id="p-credit"
                v-model="brouillon.credit"
                question="Qui a pris la photo ?"
                exemple="Photo de l'association"
                facultatif
              />
            </div>
          </div>

          <div class="border-t border-black/10 bg-slate-50 px-6 py-5 sm:px-8">
            <p
              v-if="soucis"
              class="mb-4 rounded-xl border-l-4 border-[#A23A2A] bg-[#F2D9D3] px-5 py-4 text-[17px] text-[#7a2a1f]"
              role="alert"
            >
              {{ soucis }}
            </p>
            <div class="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                class="text-left text-[16px] font-semibold text-[#A23A2A] underline underline-offset-4"
                :disabled="enCours"
                @click="retirer"
              >
                Supprimer cette photo
              </button>
              <div class="flex flex-col-reverse gap-3 sm:flex-row">
                <button
                  type="button"
                  class="min-h-14 rounded-xl border-2 border-slate-300 bg-white px-6 text-[18px] font-semibold hover:border-slate-500"
                  @click="fermer"
                >
                  Fermer sans enregistrer
                </button>
                <button
                  type="submit"
                  class="min-h-14 rounded-xl bg-green-700 px-7 text-[18px] font-bold text-white hover:bg-green-800 disabled:opacity-40"
                  :disabled="enCours"
                >
                  {{ enCours ? 'Enregistrement…' : 'Enregistrer' }}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Teleport>
  </AdminShell>
</template>
