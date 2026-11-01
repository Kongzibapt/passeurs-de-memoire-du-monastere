<script setup lang="ts">
import { aujourdhuiISO, libelleDate, type Evenement, type LienCta } from '#shared/evenements'
import type { Image } from '#shared/phototheque'
import {
  LONGUEURS,
  copier,
  evenementVide,
  messageErreur,
  publierEvenement,
  slugPour,
  versPhotoSouvenir,
} from '~/composables/useEvenementsAdmin'

/**
 * Annoncer un événement — ou corriger une annonce — une question à la fois.
 *
 * Tout ce qui peut se déduire est déduit : le libellé de la date, l'identifiant
 * d'adresse, la présentation détaillée (qui reprend la courte si on la laisse
 * vide), l'adresse du bouton. Il ne reste à saisir que ce que seule
 * l'association sait.
 */
const props = defineProps<{
  /** L'événement à modifier ; absent pour une nouvelle annonce. */
  evenement?: Evenement
  /** Identifiants déjà pris, pour ne pas en fabriquer un en double. */
  pris: string[]
}>()
const emit = defineEmits<{ publie: [titre: string]; annuler: [] }>()

const jour = aujourdhuiISO()
const e = ref<Evenement>(props.evenement ? copier(props.evenement) : evenementVide(jour))
const etape = ref(0)
const enCours = ref(false)
const erreur = ref('')

const ETAPES = [
  'La date',
  'Le titre',
  'Le lieu',
  'La présentation courte',
  'La présentation détaillée',
  'Le programme',
  "L'affiche",
  'Le bouton',
  'Vérifier et publier',
]

// ── Le bouton : quatre cas, dits en mots plutôt qu'en adresses ───────────────
type Bouton = 'aucun' | 'adhesion' | 'prevenir' | 'lien'
const cta = props.evenement?.cta
const bouton = ref<Bouton>(
  !cta ? 'aucun'
  : cta.href === 'adhesion' ? 'adhesion'
  : cta.href.startsWith('mailto:') ? 'prevenir'
  : 'lien',
)
const lienLibelle = ref(bouton.value === 'lien' ? cta!.label : 'Réserver')
const lienUrl = ref(bouton.value === 'lien' ? cta!.href : '')
const urlValide = computed(() => /^https?:\/\/\S+\.\S+/.test(lienUrl.value.trim()))

const CHOIX_BOUTON: { valeur: Bouton; titre: string; texte: string }[] = [
  { valeur: 'aucun', titre: 'Pas de bouton', texte: "L'annonce se suffit à elle-même." },
  { valeur: 'prevenir', titre: '« Être prévenu »', texte: "Le visiteur nous écrit un e-mail pour qu'on le prévienne." },
  { valeur: 'adhesion', titre: '« Adhérer »', texte: "Mène à la page d'adhésion HelloAsso de l'année." },
  { valeur: 'lien', titre: 'Un lien vers un autre site', texte: 'Pour une réservation ou une billetterie en ligne.' },
]

function ctaChoisi(): LienCta | undefined {
  switch (bouton.value) {
    case 'adhesion':
      return { label: 'Adhérer', href: 'adhesion', variant: 'primary' }
    case 'prevenir':
      return { label: 'Être prévenu', href: `mailto:?sujet=${e.value.titre.trim()}`, variant: 'secondary' }
    case 'lien':
      return { label: lienLibelle.value.trim(), href: lienUrl.value.trim(), variant: 'primary' }
    default:
      return undefined
  }
}

// ── L'affiche : la première photo du souvenir ────────────────────────────────
const affiche = computed(() => e.value.souvenir?.photos[0])

function choisirAffiche(images: Image[]) {
  const image = images[0]
  if (!image) return
  const photo = versPhotoSouvenir(image, "L'affiche")
  if (!e.value.souvenir) e.value.souvenir = { recit: '', photos: [] }
  if (e.value.souvenir.photos.length) e.value.souvenir.photos[0] = photo
  else e.value.souvenir.photos.push(photo)
}

function retirerAffiche() {
  e.value.souvenir?.photos.shift()
}

// ── Le programme ─────────────────────────────────────────────────────────────
function ajouterHoraire() {
  e.value.programme.push({ heure: '', quoi: '' })
}

// ── Avancer ──────────────────────────────────────────────────────────────────
const peutContinuer = computed(() => {
  switch (etape.value) {
    case 0:
      return !!e.value.date
    case 1:
      return !!e.value.titre.trim()
    case 3:
      return !!e.value.resume.trim()
    case 7:
      return bouton.value !== 'lien' || (!!lienLibelle.value.trim() && urlValide.value)
    default:
      return true
  }
})

const manque = computed(
  () =>
    ({
      0: 'Choisissez une date pour continuer.',
      1: 'Écrivez un titre pour continuer.',
      3: 'Écrivez quelques mots de présentation pour continuer.',
      7: "Indiquez le texte du bouton et l'adresse complète du site (elle commence par https://).",
    })[etape.value] ?? '',
)

async function publier() {
  enCours.value = true
  erreur.value = ''
  try {
    const fiche = copier(e.value)
    fiche.cta = ctaChoisi()
    if (!fiche.slug) fiche.slug = slugPour(fiche.titre, fiche.date, props.pris)
    await publierEvenement(fiche)
    emit('publie', fiche.titre)
  } catch (err: unknown) {
    erreur.value = messageErreur(err)
  } finally {
    enCours.value = false
  }
}

const libelleBouton = computed(() => ctaChoisi()?.label)
</script>

<template>
  <AdminAssistant
    v-model:etape="etape"
    :titre="evenement ? 'Modifier l’annonce' : 'Annoncer un nouvel événement'"
    :sous-titre="evenement ? evenement.titre : 'Répondez aux questions une par une. Rien n’est publié avant la dernière étape.'"
    :etapes="ETAPES"
    :peut-continuer="peutContinuer"
    :manque="manque"
    :en-cours="enCours"
    :erreur="erreur"
    @publier="publier"
    @annuler="emit('annuler')"
  >
    <!-- 1. La date -->
    <div v-if="etape === 0">
      <label for="a-date" class="block text-[22px] font-bold">Quel jour a lieu l'événement ?</label>
      <p class="mt-2 text-[17px] text-slate-600">Touchez le champ pour ouvrir le calendrier.</p>
      <input
        id="a-date"
        v-model="e.date"
        type="date"
        required
        class="mt-4 rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-[20px] outline-none focus:border-clay-600"
      >
      <p v-if="e.date" class="mt-5 text-[18px]">
        Sur le site, on lira :
        <strong class="font-accent text-[22px] italic text-clay-800">{{ libelleDate(e.date) }}</strong>
      </p>
      <p v-if="e.date && e.date < jour" class="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-[17px] text-amber-900">
        Attention : cette date est déjà passée. L'événement n'apparaîtra pas dans « À venir ».
      </p>
    </div>

    <!-- 2. Le titre -->
    <AdminChamp
      v-else-if="etape === 1"
      id="a-titre"
      v-model="e.titre"
      question="Quel est le titre de l'événement ?"
      aide="Il s'affiche en gros sur la page d'accueil et sur la page des actualités."
      exemple="Visites du village et de l'église"
      :longueur="LONGUEURS.titre"
    />

    <!-- 3. Le lieu -->
    <AdminChamp
      v-else-if="etape === 2"
      id="a-cadre"
      v-model="e.cadre"
      question="Où, ou dans quel cadre ?"
      aide="Écrit en petit sous la date : le lieu, ou le nom d'une manifestation nationale."
      exemple="Journées européennes du patrimoine"
      :longueur="LONGUEURS.cadre"
      facultatif
    />

    <!-- 4. La présentation courte -->
    <AdminChamp
      v-else-if="etape === 3"
      id="a-resume"
      v-model="e.resume"
      question="Présentez l'événement en deux phrases."
      aide="C'est ce qu'on lit sur la page d'accueil. Dites ce qui va se passer, et pourquoi venir."
      exemple="Une soirée dans l'église du village : un concert, et une micro-conférence sur l'art sacré."
      :longueur="LONGUEURS.resume"
      :lignes="4"
    />

    <!-- 5. La présentation détaillée -->
    <AdminChamp
      v-else-if="etape === 4"
      id="a-description"
      v-model="e.description"
      question="Voulez-vous en dire plus ?"
      aide="Ce texte s'affiche sur la page des actualités. Si vous le laissez vide, la présentation courte sera reprise."
      :longueur="LONGUEURS.description"
      :lignes="7"
      facultatif
    />

    <!-- 6. Le programme -->
    <div v-else-if="etape === 5">
      <p class="text-[22px] font-bold">Y a-t-il un programme heure par heure ? <span class="text-[17px] font-normal text-slate-500">(facultatif)</span></p>
      <p class="mt-2 text-[17px] text-slate-600">
        Une ligne par moment de la journée. Si l'événement n'a pas de programme, passez à la suite.
      </p>

      <div v-for="(ligne, i) in e.programme" :key="i" class="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div class="grid gap-3 sm:grid-cols-[160px_1fr]">
          <div>
            <label :for="`a-heure-${i}`" class="block text-[16px] font-semibold text-slate-700">Heure</label>
            <input
              :id="`a-heure-${i}`"
              v-model="ligne.heure"
              placeholder="14h30"
              maxlength="30"
              class="mt-1 w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-[19px] outline-none focus:border-clay-600"
            >
          </div>
          <div>
            <label :for="`a-quoi-${i}`" class="block text-[16px] font-semibold text-slate-700">Ce qui se passe</label>
            <input
              :id="`a-quoi-${i}`"
              v-model="ligne.quoi"
              placeholder="Conférence"
              :maxlength="LONGUEURS.etape.limite"
              class="mt-1 w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-[19px] outline-none focus:border-clay-600"
            >
          </div>
        </div>
        <button
          type="button"
          class="mt-3 text-[16px] font-semibold text-[#A23A2A] underline underline-offset-4"
          @click="e.programme.splice(i, 1)"
        >
          Retirer cette ligne
        </button>
      </div>

      <button
        type="button"
        class="mt-5 min-h-14 rounded-xl border-2 border-clay-600 px-6 text-[18px] font-bold text-clay-800 hover:bg-clay-50"
        @click="ajouterHoraire"
      >
        + Ajouter un horaire
      </button>
    </div>

    <!-- 7. L'affiche -->
    <div v-else-if="etape === 6">
      <p class="text-[22px] font-bold">Une affiche ou une photo ? <span class="text-[17px] font-normal text-slate-500">(facultatif)</span></p>
      <p class="mt-2 text-[17px] text-slate-600">
        Elle s'affiche sous la date, sur la page des actualités. Après l'événement, elle restera la
        première image de son souvenir.
      </p>

      <div v-if="affiche" class="mt-6 flex flex-wrap items-end gap-5">
        <img :src="affiche.src" :alt="affiche.alt" class="max-h-72 w-auto rounded-xl border border-black/10">
        <div class="grid gap-3">
          <button
            type="button"
            class="min-h-12 rounded-xl border-2 border-slate-300 px-5 text-[17px] font-semibold hover:border-slate-500"
            @click="retirerAffiche"
          >
            Retirer cette image
          </button>
        </div>
      </div>
      <AdminAjoutPhotos v-else class="mt-6" :multiple="false" @ajouter="choisirAffiche" />
    </div>

    <!-- 8. Le bouton -->
    <fieldset v-else-if="etape === 7">
      <legend class="text-[22px] font-bold">Quel bouton mettre sous l'annonce ?</legend>
      <div class="mt-5 grid gap-3">
        <label
          v-for="choix in CHOIX_BOUTON"
          :key="choix.valeur"
          class="flex cursor-pointer items-start gap-4 rounded-xl border-2 p-4 transition-colors"
          :class="bouton === choix.valeur ? 'border-clay-600 bg-clay-50' : 'border-slate-200 hover:border-slate-400'"
        >
          <input v-model="bouton" type="radio" name="bouton" :value="choix.valeur" class="mt-1.5 h-6 w-6 accent-clay-600">
          <span>
            <span class="block text-[19px] font-bold">{{ choix.titre }}</span>
            <span class="block text-[17px] text-slate-600">{{ choix.texte }}</span>
          </span>
        </label>
      </div>

      <div v-if="bouton === 'lien'" class="mt-6 grid gap-5 rounded-xl bg-slate-50 p-5">
        <div>
          <label for="a-lien-libelle" class="block text-[18px] font-bold">Texte du bouton</label>
          <input
            id="a-lien-libelle"
            v-model="lienLibelle"
            maxlength="40"
            class="mt-2 w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-[19px] outline-none focus:border-clay-600"
          >
        </div>
        <div>
          <label for="a-lien-url" class="block text-[18px] font-bold">Adresse du site</label>
          <p class="mt-1 text-[16px] text-slate-600">Copiez-la depuis la barre d'adresse du navigateur.</p>
          <input
            id="a-lien-url"
            v-model="lienUrl"
            type="url"
            placeholder="https://…"
            class="mt-2 w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-[19px] outline-none focus:border-clay-600"
          >
        </div>
      </div>
    </fieldset>

    <!-- 9. Vérifier -->
    <div v-else>
      <p class="text-[22px] font-bold">Vérifiez l'annonce avant de la publier.</p>
      <p class="mt-2 text-[17px] text-slate-600">
        Pour corriger quelque chose, revenez en arrière avec « ← Retour ».
      </p>

      <article class="mt-6 grid gap-6 rounded-2xl border-2 border-slate-200 bg-[#faf7f2] p-6 sm:grid-cols-[180px_1fr]">
        <div>
          <p class="font-accent text-[20px] italic leading-tight text-clay-800">{{ libelleDate(e.date) }}</p>
          <p v-if="e.cadre" class="mt-2 text-[13px] uppercase tracking-wider text-slate-500">{{ e.cadre }}</p>
          <img v-if="affiche" :src="affiche.src" :alt="affiche.alt" class="mt-3 w-full max-w-[144px] border border-black/10">
        </div>
        <div>
          <h3 class="font-display text-[22px] font-bold">{{ e.titre }}</h3>
          <p class="mt-2 whitespace-pre-line text-[17px] leading-relaxed text-slate-700">
            {{ e.description.trim() || e.resume }}
          </p>
          <dl v-if="e.programme.some((p) => p.heure || p.quoi)" class="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[16px]">
            <template v-for="(p, i) in e.programme" :key="i">
              <dt class="font-semibold text-clay-800">{{ p.heure }}</dt>
              <dd>{{ p.quoi }}</dd>
            </template>
          </dl>
          <span
            v-if="libelleBouton"
            class="mt-5 inline-block rounded-full border-2 border-clay-700 px-5 py-2 text-[16px] font-semibold text-clay-800"
          >
            {{ libelleBouton }}
          </span>
        </div>
      </article>

      <p class="mt-5 text-[17px] text-slate-600">
        Sur la page d'accueil, on lira la présentation courte :
        <em class="text-slate-800">« {{ e.resume }} »</em>
      </p>
    </div>
  </AdminAssistant>
</template>
