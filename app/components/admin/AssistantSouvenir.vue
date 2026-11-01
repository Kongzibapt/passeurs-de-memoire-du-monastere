<script setup lang="ts">
import { libelleDate, type Evenement } from '#shared/evenements'
import type { Image } from '#shared/phototheque'
import { LONGUEURS, copier, messageErreur, publierEvenement, versPhotoSouvenir } from '~/composables/useEvenementsAdmin'

/**
 * Raconter un événement passé : le récit, les photos, et deux touches
 * facultatives — une question pour les visiteurs, une invitation à écrire.
 *
 * Le souvenir complète la fiche de l'événement : sa date et son titre ne se
 * ressaisissent pas. Tant que le récit est vide, rien n'apparaît sur le site.
 */
const props = defineProps<{ evenement: Evenement }>()
const emit = defineEmits<{ publie: [titre: string]; annuler: [] }>()

const e = ref<Evenement>(copier(props.evenement))
if (!e.value.souvenir) e.value.souvenir = { recit: '', photos: [] }
const souvenir = computed(() => e.value.souvenir!)

const etape = ref(0)
const enCours = ref(false)
const erreur = ref('')

const ETAPES = ['Le récit', 'Les photos', 'Une question', 'Un appel aux visiteurs', 'Vérifier et publier']

// ── Les photos ───────────────────────────────────────────────────────────────
const dejaLa = computed(() => souvenir.value.photos.map((p) => p.src))

/**
 * Une photo qui vient d'être déposée a pour titre son nom de fichier
 * (« IMG 2034 ») : on laisse sa légende vide, à écrire juste en dessous, plutôt
 * que de publier un nom d'appareil photo.
 */
function ajouter(images: Image[], nouvelle: boolean) {
  for (const image of images) {
    souvenir.value.photos.push(versPhotoSouvenir(image, nouvelle ? '' : image.titre))
  }
}

function monter(i: number) {
  const photos = souvenir.value.photos
  ;[photos[i - 1], photos[i]] = [photos[i]!, photos[i - 1]!]
}

// ── L'appel aux visiteurs ────────────────────────────────────────────────────
const appel = ref(!!souvenir.value.cta)
const appelLibelle = ref(souvenir.value.cta?.label ?? 'Vous avez des photos de cette journée ?')

// ── Avancer ──────────────────────────────────────────────────────────────────
const peutContinuer = computed(() => {
  if (etape.value === 0) return !!souvenir.value.recit.trim()
  if (etape.value === 3) return !appel.value || !!appelLibelle.value.trim()
  return true
})
const manque = computed(() =>
  etape.value === 0 ? 'Écrivez au moins quelques phrases pour continuer.'
  : etape.value === 3 ? 'Écrivez le texte du bouton, ou choisissez « Non ».'
  : '',
)

async function publier() {
  enCours.value = true
  erreur.value = ''
  try {
    const fiche = copier(e.value)
    fiche.souvenir!.cta = appel.value
      ? { label: appelLibelle.value.trim(), href: `mailto:?sujet=${fiche.titre}`, variant: 'secondary' }
      : undefined
    await publierEvenement(fiche)
    emit('publie', fiche.titre)
  } catch (err: unknown) {
    erreur.value = messageErreur(err)
  } finally {
    enCours.value = false
  }
}
</script>

<template>
  <AdminAssistant
    v-model:etape="etape"
    titre="Raconter l'événement"
    :sous-titre="`${evenement.titre} — ${libelleDate(evenement.date)}`"
    :etapes="ETAPES"
    :peut-continuer="peutContinuer"
    :manque="manque"
    :en-cours="enCours"
    :erreur="erreur"
    @publier="publier"
    @annuler="emit('annuler')"
  >
    <!-- 1. Le récit -->
    <AdminChamp
      v-if="etape === 0"
      id="s-recit"
      v-model="souvenir.recit"
      question="Comment s'est passé l'événement ?"
      aide="Racontez en quelques phrases ce qui s'est passé : ce qu'on a vu, entendu, appris. Ce texte s'affiche dans « C'était chez nous »."
      exemple="Une soirée dans l'église du village : un concert, le drap mortuaire des tanneurs sorti des réserves, et une micro-conférence sur l'art sacré."
      :longueur="LONGUEURS.recit"
      :lignes="7"
    />

    <!-- 2. Les photos -->
    <div v-else-if="etape === 1">
      <p class="text-[22px] font-bold">Ajoutez des photos de l'événement.</p>
      <p class="mt-2 text-[17px] text-slate-600">
        Elles s'affichent les unes après les autres, dans cet ordre. Donnez à chacune une courte
        légende : elle s'écrit sous la photo.
      </p>

      <ol v-if="souvenir.photos.length" class="mt-6 grid gap-4">
        <li
          v-for="(photo, i) in souvenir.photos"
          :key="photo.src + i"
          class="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[180px_1fr]"
        >
          <img :src="photo.src" :alt="photo.alt || photo.titre" class="aspect-[4/3] w-full rounded-lg bg-slate-200 object-cover">
          <div>
            <label :for="`s-legende-${i}`" class="block text-[17px] font-bold">Légende de la photo {{ i + 1 }}</label>
            <input
              :id="`s-legende-${i}`"
              v-model="photo.titre"
              :maxlength="LONGUEURS.legende.limite"
              placeholder="La nef, le 3 juillet"
              class="mt-2 w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-[18px] outline-none focus:border-clay-600"
            >
            <p class="mt-1 text-[15px] text-slate-500">
              {{ photo.titre.trim().length }} caractères · conseillé : moins de {{ LONGUEURS.legende.max }}
            </p>
            <div class="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              <button
                v-if="i > 0"
                type="button"
                class="text-[16px] font-semibold text-slate-700 underline underline-offset-4"
                @click="monter(i)"
              >
                ↑ Placer plus haut
              </button>
              <button
                type="button"
                class="text-[16px] font-semibold text-[#A23A2A] underline underline-offset-4"
                @click="souvenir.photos.splice(i, 1)"
              >
                Retirer cette photo
              </button>
            </div>
          </div>
        </li>
      </ol>
      <p v-else class="mt-6 rounded-xl bg-slate-50 px-5 py-4 text-[17px] text-slate-600">
        Aucune photo pour l'instant. Vous pouvez aussi publier sans photo.
      </p>

      <AdminAjoutPhotos class="mt-8" :deja-la="dejaLa" @ajouter="ajouter" />
    </div>

    <!-- 3. La question -->
    <AdminChamp
      v-else-if="etape === 2"
      id="s-question"
      v-model="souvenir.question"
      question="Une question à poser aux visiteurs ?"
      aide="Elle s'affiche en italique sous le récit, pour donner envie d'en savoir plus ou de nous écrire."
      exemple="Que faisait un drap mortuaire dans une confrérie de tanneurs ?"
      :longueur="LONGUEURS.question"
      facultatif
    />

    <!-- 4. L'appel -->
    <fieldset v-else-if="etape === 3">
      <legend class="text-[22px] font-bold">Inviter les visiteurs à vous écrire ?</legend>
      <p class="mt-2 text-[17px] text-slate-600">
        Un bouton sous le récit ouvre un e-mail à l'association, avec le nom de l'événement en objet.
      </p>
      <div class="mt-5 grid gap-3">
        <label
          class="flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4"
          :class="!appel ? 'border-clay-600 bg-clay-50' : 'border-slate-200 hover:border-slate-400'"
        >
          <input v-model="appel" type="radio" name="appel" :value="false" class="h-6 w-6 accent-clay-600">
          <span class="text-[19px] font-bold">Non, pas de bouton</span>
        </label>
        <label
          class="flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4"
          :class="appel ? 'border-clay-600 bg-clay-50' : 'border-slate-200 hover:border-slate-400'"
        >
          <input v-model="appel" type="radio" name="appel" :value="true" class="h-6 w-6 accent-clay-600">
          <span class="text-[19px] font-bold">Oui, ajouter un bouton</span>
        </label>
      </div>
      <AdminChamp
        v-if="appel"
        id="s-appel"
        v-model="appelLibelle"
        class="mt-6"
        question="Texte du bouton"
        exemple="Nous écrire à ce sujet"
        :longueur="LONGUEURS.appel"
      />
    </fieldset>

    <!-- 5. Vérifier -->
    <div v-else>
      <p class="text-[22px] font-bold">Vérifiez le souvenir avant de le publier.</p>
      <p class="mt-2 text-[17px] text-slate-600">
        Pour corriger quelque chose, revenez en arrière avec « ← Retour ».
      </p>

      <article class="mt-6 rounded-2xl border-2 border-slate-200 bg-[#faf7f2] p-6">
        <p class="font-accent text-[18px] italic text-clay-800">{{ libelleDate(e.date) }}</p>
        <h3 class="mt-1 font-display text-[22px] font-bold">{{ e.titre }}</h3>
        <p class="mt-3 whitespace-pre-line text-[17px] leading-relaxed text-slate-700">{{ souvenir.recit }}</p>
        <p v-if="souvenir.question?.trim()" class="mt-4 border-l-4 border-clay-600 pl-4 font-accent text-[18px] italic">
          {{ souvenir.question }}
        </p>
        <span
          v-if="appel"
          class="mt-5 inline-block rounded-full border-2 border-clay-700 px-5 py-2 text-[16px] font-semibold text-clay-800"
        >
          {{ appelLibelle }}
        </span>
        <div v-if="souvenir.photos.length" class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <figure v-for="(photo, i) in souvenir.photos" :key="photo.src + i">
            <img :src="photo.src" :alt="photo.alt || photo.titre" class="aspect-[4/3] w-full rounded-lg object-cover">
            <figcaption class="mt-1 text-[15px] font-semibold">{{ photo.titre || e.titre }}</figcaption>
          </figure>
        </div>
      </article>
    </div>
  </AdminAssistant>
</template>
