<script setup lang="ts">
import { MONUMENTS, type Monument } from '~/data/patrimoine'

/**
 * « Trois monuments, une seule histoire ».
 *
 * Chaque planche suit une composition qui lui est propre (l'abbaye texte à
 * droite, l'église texte à gauche, le pont en bandeau large puis trois
 * colonnes) : c'est la classe `.pq-*` qui la porte, et l'ordre du DOM change
 * donc d'un monument à l'autre — d'où le `v-if` sur `cle === 'pont'` plutôt
 * qu'un gabarit unique.
 */
const liste = MONUMENTS

/**
 * Le lien « autrefois et aujourd'hui » emmène au comparateur ET y sélectionne
 * le bon onglet : l'ancre `#autrefois` fait le déplacement, `selectionner`
 * choisit le monument à montrer.
 */
const { selectionner } = useComparateur()
</script>

<template>
  <section id="patrimoine">
    <div class="pat-head pad">
      <div class="t-eyebrow">Quel patrimoine protégeons-nous ?</div>
      <h2>Trois monuments, une seule histoire</h2>
      <p>
        L'abbaye, l'église et le pont sont les trois éléments structurants du bourg médiéval du
        Monastère : ils ont suscité et ordonné son développement, et inscrivent cette histoire dans
        le paysage.
      </p>
    </div>

    <div class="plaques">
      <article v-for="m in liste" :key="m.cle" class="pq" :class="m.classe">
        <!-- Pont : bandeau panoramique en haut, puis le texte en trois colonnes. -->
        <template v-if="m.cle === 'pont'">
          <figure class="m">
            <NuxtImg
              :src="m.image.src"
              :alt="m.image.alt"
              loading="lazy"
              decoding="async"
              sizes="xs:90vw sm:90vw md:90vw lg:90vw xl:1140px xxl:1140px"
            />
            <figcaption class="cap">
              <b>{{ m.image.titre }}</b> {{ m.image.legende }}
              <span class="crd">{{ m.image.credit }}</span>
            </figcaption>
          </figure>
          <div class="t">
            <div class="hd">
              <div class="idx"><span class="siecle" v-html="m.siecle" /></div>
              <h3>{{ m.titre }}</h3>
              <p class="hook">{{ m.accroche }}</p>
              <a class="more" href="#autrefois" @click="selectionner(m.cle)">{{ m.lienDetail }}</a>
            </div>
            <div v-for="(paragraphe, i) in m.paragraphes" :key="i" class="col">
              <p v-html="paragraphe" />
            </div>
          </div>
        </template>

        <!-- Abbaye et église : une image et un bloc de texte côte à côte.
             L'ordre du DOM suit celui de la maquette (image en premier pour
             l'abbaye, texte en premier pour l'église) ; la grille le confirme. -->
        <template v-else>
          <figure v-if="m.cle === 'abbaye'" class="m">
            <NuxtImg
              :src="m.image.src"
              :alt="m.image.alt"
              :style="m.image.position ? { objectPosition: m.image.position } : undefined"
              loading="lazy"
              decoding="async"
              sizes="xs:90vw sm:90vw md:90vw lg:50vw xl:560px xxl:560px"
            />
            <figcaption class="cap">
              <b>{{ m.image.titre }}</b> {{ m.image.legende }}
              <span class="crd">{{ m.image.credit }}</span>
            </figcaption>
          </figure>

          <div class="t">
            <div class="idx"><span class="siecle" v-html="m.siecle" /></div>
            <h3>{{ m.titre }}</h3>
            <p class="hook">{{ m.accroche }}</p>
            <p v-for="(paragraphe, i) in m.paragraphes" :key="i" v-html="paragraphe" />
            <a class="more" href="#autrefois" @click="selectionner(m.cle)">{{ m.lienDetail }}</a>
          </div>

          <figure v-if="m.cle === 'eglise'" class="m">
            <NuxtImg
              :src="m.image.src"
              :alt="m.image.alt"
              :style="m.image.position ? { objectPosition: m.image.position } : undefined"
              loading="lazy"
              decoding="async"
              sizes="xs:90vw sm:90vw md:90vw lg:50vw xl:560px xxl:560px"
            />
            <figcaption class="cap">
              <b>{{ m.image.titre }}</b> {{ m.image.legende }}
              <span class="crd">{{ m.image.credit }}</span>
            </figcaption>
          </figure>
        </template>
      </article>
    </div>
  </section>
</template>
