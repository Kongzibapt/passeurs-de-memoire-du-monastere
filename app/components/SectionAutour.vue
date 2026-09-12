<script setup lang="ts">
import { AUTOUR } from '~/data/patrimoine'
</script>

<template>
  <section id="autour" class="sec pad">
    <div class="sec-head">
      <div class="t-eyebrow">Et autour ?</div>
      <h2>Le bourg qui s'est bâti avec eux</h2>
      <p>
        De part et d'autre de l'Aveyron, le village conserve des maisons de la fin du Moyen Âge et
        de l'époque moderne, et les traces des métiers qui l'ont fait vivre.
      </p>
    </div>
    <div class="comms">
      <div v-for="lieu in AUTOUR" :key="lieu.titre" class="comm">
        <h4>{{ lieu.titre }}</h4>
        <!-- eslint-disable-next-line vue/no-v-html -->
        <p v-html="lieu.texte" />
      </div>
    </div>
  </section>
</template>
