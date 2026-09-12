<script setup lang="ts">
import { JALONS, TRACE_RIVIERE } from '~/data/jalons'
import { echantillonner } from '~/utils/courbe'

/**
 * « La rivière du temps » — la frise chronologique en forme de cours d'eau.
 *
 * Onze siècles sont posés le long d'une courbe : une pierre du gué par repère,
 * répartie à intervalle régulier, et un jeton qui remonte le fil. Trois façons
 * d'avancer, toutes reliées au même index : les pierres et leurs étiquettes, le
 * curseur, et la lecture automatique.
 *
 * Les pointillés du tracé sont normalisés par `pathLength="1000"` : le
 * navigateur convertit lui-même en unités réelles, ce qui évite d'avoir à
 * connaître la longueur exacte du chemin — impossible à obtenir au rendu
 * serveur, où `getTotalLength()` n'existe pas.
 */

/** Base de normalisation des pointillés (voir `pathLength` ci-dessus). */
const ECHELLE = 1000

/**
 * Feuille de style servie aux navigateurs sans JavaScript : elle rend la liste
 * des repères et retire les commandes, qui seraient inertes.
 */
const STYLE_SANS_JS =
  '<style>.riv-on .jalons{display:grid}.riv-ctrl,.riv-card{display:none}</style>'

const courbe = echantillonner(TRACE_RIVIERE)

/** Position de chaque repère, en fraction du tracé puis en coordonnées SVG. */
const reperes = JALONS.map((jalon, i) => {
  const fraction = JALONS.length > 1 ? i / (JALONS.length - 1) : 0
  const point = courbe.pointAFraction(fraction)
  return {
    ...jalon,
    i,
    fraction,
    x: point.x,
    y: point.y,
    // Une étiquette sur deux passe au-dessus, l'autre en dessous : sans cette
    // alternance, les dates se chevaucheraient là où la rivière est plate.
    cote: i % 2 ? 'dn' : 'up',
  }
})

const actif = ref(0)
/** Avancée du jeton, en fraction du tracé — continue, donc pas toujours sur un repère. */
const avancee = ref(0)
const jeton = computed(() => courbe.pointAFraction(avancee.value))

const piste = ref<HTMLElement | null>(null)
const cadre = ref<HTMLElement | null>(null)
/** Passe à vrai quand la frise entre dans le champ : déclenche le dessin du lit. */
const visible = ref(false)
let animation: number | undefined
let minuterie: ReturnType<typeof setInterval> | undefined
const lecture = ref(false)
let moinsDAnimations = false

function placer(fraction: number) {
  avancee.value = Math.max(0, Math.min(1, fraction))
}

/** Amène le jeton à une fraction donnée, en l'accompagnant plutôt qu'en sautant. */
function glisser(cible: number, duree?: number, doux = false) {
  if (animation) cancelAnimationFrame(animation)
  if (moinsDAnimations) return placer(cible)

  const depart = avancee.value
  const ecart = cible - depart
  const debut = performance.now()
  // Une transition proportionnelle à la distance : passer au repère voisin est
  // vif, remonter toute la frise prend le temps qu'il faut.
  const total = duree ?? Math.min(900, 300 + Math.abs(ecart) * courbe.longueur * 0.6)
  // `doux` (lecture automatique) part et arrive au ralenti ; le pas manuel
  // démarre plus franchement.
  const courbeTemps = doux
    ? (t: number) => 0.5 - Math.cos(Math.PI * t) / 2
    : (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

  const pas = (maintenant: number) => {
    const t = Math.min(1, (maintenant - debut) / total)
    placer(depart + ecart * courbeTemps(t))
    if (t < 1) animation = requestAnimationFrame(pas)
  }
  animation = requestAnimationFrame(pas)
}

function allerA(i: number, duree?: number, doux = false) {
  const index = Math.max(0, Math.min(reperes.length - 1, i))
  actif.value = index
  glisser(reperes[index]!.fraction, duree, doux)
  centrer(index)
}

/** Repère le plus proche d'une fraction quelconque du tracé. */
function plusProche(fraction: number): number {
  let meilleur = 0
  let distance = Infinity
  for (const r of reperes) {
    const d = Math.abs(r.fraction - fraction)
    if (d < distance) {
      distance = d
      meilleur = r.i
    }
  }
  return meilleur
}

/**
 * Sous 820 px la frise défile horizontalement : on amène le repère choisi au
 * centre du cadre, sinon la moitié de la rivière reste hors de l'écran.
 */
function centrer(i: number) {
  const boite = cadre.value
  const interieur = piste.value
  if (!boite || !interieur || boite.scrollWidth <= boite.clientWidth + 4) return
  const x = (reperes[i]!.x / 1200) * interieur.offsetWidth - boite.clientWidth / 2
  boite.scrollTo({ left: Math.max(0, x), behavior: moinsDAnimations ? 'auto' : 'smooth' })
}

function surCurseur(valeur: number) {
  if (animation) cancelAnimationFrame(animation)
  arreter()
  placer(valeur / ECHELLE)
  actif.value = plusProche(avancee.value)
}

function arreter() {
  if (!minuterie) return
  clearInterval(minuterie)
  minuterie = undefined
  lecture.value = false
}

function basculerLecture() {
  if (minuterie) return arreter()
  lecture.value = true

  const PAS = 5400
  const DUREE = 3000
  const avancer = () => {
    if (actif.value >= reperes.length - 1) return arreter()
    allerA(actif.value + 1, DUREE, true)
  }

  // Relancer depuis la fin repart du début, sinon rien ne se passerait.
  if (actif.value >= reperes.length - 1) allerA(0, 1600, true)
  else avancer()
  minuterie = setInterval(avancer, PAS)
}

let observateur: IntersectionObserver | undefined

onMounted(() => {
  moinsDAnimations = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  observateur = new IntersectionObserver(
    (entrees) => {
      for (const entree of entrees) {
        if (!entree.isIntersecting) continue
        visible.value = true
        observateur?.disconnect()
      }
    },
    { threshold: 0.25 },
  )
  if (cadre.value) observateur.observe(cadre.value)
})

onBeforeUnmount(() => {
  observateur?.disconnect()
  if (animation) cancelAnimationFrame(animation)
  arreter()
})

const courantJalon = computed(() => reperes[actif.value]!)
</script>

<template>
  <section id="frise" class="riviere pad riv-on" :class="{ vis: visible }">
    <!-- Sans JavaScript, le curseur et les pierres ne répondent pas : on rend
         alors la liste des repères, qui dit la même chose en texte brut. -->
    <!-- eslint-disable-next-line vue/no-v-html -->
    <noscript v-html="STYLE_SANS_JS" />

    <div class="riv-head">
      <div>
        <div class="t-eyebrow">Dans quel ordre tout cela est-il arrivé ?</div>
        <h2>La rivière du temps</h2>
      </div>
      <p>
        Onze siècles au fil de l'Aveyron. Faites glisser le curseur, cliquez sur une pierre du gué,
        ou laissez le fil se dérouler.
      </p>
    </div>

    <div id="riv" ref="cadre" class="riv">
      <div ref="piste" class="riv-in">
        <svg viewBox="0 0 1200 300" role="img" aria-label="Frise chronologique du Monastère, en forme de rivière">
          <g>
            <path
              class="bed"
              :d="TRACE_RIVIERE"
              :pathLength="ECHELLE"
              :stroke-dasharray="ECHELLE"
              :stroke-dashoffset="ECHELLE"
            />
            <!-- Pas de `pathLength` ici : les pointillés du fil d'eau sont
                 posés par la charte en unités réelles, les normaliser
                 changerait leur longueur à l'écran. -->
            <path class="flow" :d="TRACE_RIVIERE" />
            <path
              class="prog"
              :d="TRACE_RIVIERE"
              :pathLength="ECHELLE"
              :stroke-dasharray="ECHELLE"
              :stroke-dashoffset="ECHELLE - avancee * ECHELLE"
            />

            <g
              v-for="r in reperes"
              :key="r.i"
              class="stone"
              :class="{ on: r.i <= actif, now: r.i === actif }"
              :style="{ '--i': r.i }"
              tabindex="0"
              role="button"
              :aria-label="`${r.date.replace(/<[^>]+>/g, '')} — ${r.titre}`"
              @click="arreter(); allerA(r.i)"
              @keydown.enter.prevent="arreter(); allerA(r.i)"
              @keydown.space.prevent="arreter(); allerA(r.i)"
            >
              <circle class="hit" :cx="r.x" :cy="r.y" r="26" />
              <circle class="ring" :cx="r.x" :cy="r.y" r="15" />
              <circle class="dot" :cx="r.x" :cy="r.y" r="6" />
            </g>

            <g class="mark" :transform="`translate(${jeton.x},${jeton.y})`">
              <circle class="halo" r="16" />
              <circle class="core" r="9" />
            </g>
          </g>
        </svg>

        <div class="riv-labels">
          <button
            v-for="r in reperes"
            :key="r.i"
            type="button"
            class="riv-lab"
            :class="[r.cote, { on: r.i <= actif, now: r.i === actif }]"
            :style="{ left: `${(r.x / 1200) * 100}%`, top: `${(r.y / 300) * 100}%`, '--i': r.i }"
            @click="arreter(); allerA(r.i)"
          >
            <!-- eslint-disable-next-line vue/no-v-html -->
            <span class="y" v-html="r.date" />
          </button>
        </div>
      </div>
    </div>

    <div class="riv-ctrl">
      <button type="button" class="riv-nav" aria-label="Repère précédent" @click="arreter(); allerA(actif - 1)">
        &#8592;
      </button>
      <input
        id="rivRange"
        type="range"
        min="0"
        :max="ECHELLE"
        :value="Math.round(avancee * ECHELLE)"
        aria-label="Remonter le fil du temps"
        @input="surCurseur(Number(($event.target as HTMLInputElement).value))"
        @change="allerA(plusProche(avancee))"
      >
      <button type="button" class="riv-nav" aria-label="Repère suivant" @click="arreter(); allerA(actif + 1)">
        &#8594;
      </button>
      <button type="button" class="riv-play" :class="{ on: lecture }" @click="basculerLecture">
        {{ lecture ? 'Arrêter' : 'Parcourir le fil' }}
      </button>
    </div>

    <ol class="jalons">
      <li v-for="r in reperes" :key="r.i">
        <h4>{{ r.titre }}</h4>
        <p>{{ r.texte }}</p>
      </li>
    </ol>

    <div class="riv-card">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="rc-d" v-html="courantJalon.date" />
      <div class="rc-b">
        <h3>{{ courantJalon.titre }}</h3>
        <p>{{ courantJalon.texte }}</p>
      </div>
    </div>

    <p class="cap riv-src">
      Repères établis d'après les notices du Service Patrimoine de Rodez Agglomération, complétées
      par la commission patrimoine de l'Association.
    </p>
  </section>
</template>
