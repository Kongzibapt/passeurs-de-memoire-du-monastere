<script setup lang="ts">
import { aVenir, estLienExterne, hrefCta, type Evenement } from '#shared/evenements'

/**
 * La liste des rendez-vous à venir, dans ses deux tenues.
 *
 * - `accueil` : titre court, résumé, et un unique bouton « Détails » vers la
 *   page Actualités. C'est un aperçu, pas la page.
 * - `actualites` : titre complet, présentation détaillée, programme horaire
 *   quand il y en a un, et le bouton propre à l'événement.
 *
 * Un événement dont la date est passée n'apparaît jamais ici : `aVenir` le
 * filtre, comme le faisait `evts.js` dans la maquette. Le site ne peut donc
 * pas annoncer une date dépassée.
 */
const props = withDefaults(
  defineProps<{
    evenements: Evenement[]
    variante?: 'accueil' | 'actualites'
    /** Limite le nombre d'événements affichés (l'accueil n'en montre que trois). */
    limite?: number
  }>(),
  { variante: 'accueil', limite: undefined },
)

const { urlAdhesion } = useReglages()

const liste = computed(() => {
  const prochains = aVenir(props.evenements)
  return props.limite ? prochains.slice(0, props.limite) : prochains
})
</script>

<template>
  <div class="evts">
    <template v-if="liste.length">
      <article v-for="e in liste" :key="e.id" class="evt">
        <div class="when">
          {{ variante === 'accueil' ? e.dateCourte : e.dateLongue }}
          <small>{{ e.cadre }}</small>
        </div>

        <div>
          <h3>{{ variante === 'accueil' ? (e.titreAccueil ?? e.titre) : e.titre }}</h3>
          <!-- eslint-disable-next-line vue/no-v-html -->
          <p v-html="variante === 'accueil' ? e.resume : e.description" />
          <dl v-if="variante === 'actualites' && e.programme.length" class="prog">
            <template v-for="(etape, i) in e.programme" :key="i">
              <dt>{{ etape.heure }}</dt>
              <dd>{{ etape.quoi }}</dd>
            </template>
          </dl>
        </div>

        <NuxtLink v-if="variante === 'accueil'" class="btn btn-secondary btn-sm" to="/actualites">
          Détails
        </NuxtLink>
        <a
          v-else-if="e.cta"
          class="btn btn-sm"
          :class="e.cta.variant === 'primary' ? 'btn-primary' : 'btn-secondary'"
          :href="hrefCta(e.cta, urlAdhesion)"
          :target="estLienExterne(hrefCta(e.cta, urlAdhesion)) ? '_blank' : undefined"
          :rel="estLienExterne(hrefCta(e.cta, urlAdhesion)) ? 'noopener' : undefined"
        >
          {{ e.cta.label }}
        </a>
      </article>
    </template>

    <p v-else class="evts-empty">
      Les prochaines dates sont en préparation. Écrivez-nous pour être prévenu.
    </p>
  </div>
</template>
