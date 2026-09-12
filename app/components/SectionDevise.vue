<script setup lang="ts">
import { ASSOCIATION } from '#shared/association'
</script>

<template>
  <section class="devise pad">
    <div class="dq">
      <!-- Le guillemet fermant est le même caractère, retourné à 180° par la
           charte : c'est ce qui lui donne exactement le même dessin qu'à
           l'ouverture, ce qu'un « » typographique ne ferait pas. -->
      <div class="qm" aria-hidden="true">«</div>
      <blockquote>{{ ASSOCIATION.devise }}</blockquote>
      <div class="qm close" aria-hidden="true">«</div>
      <cite>— Devise de l'association</cite>
    </div>
  </section>
</template>
