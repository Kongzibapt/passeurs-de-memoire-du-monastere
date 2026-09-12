<script setup lang="ts">
import type { NuxtError } from '#app'

/**
 * Page d'erreur. Elle garde l'en-tête et le pied du site : quelqu'un qui arrive
 * sur une URL morte doit pouvoir repartir vers le contenu, pas se retrouver
 * devant une impasse.
 */
const props = defineProps<{ error: NuxtError }>()

const introuvable = computed(() => props.error?.statusCode === 404)

useHead({ meta: [{ name: 'robots', content: 'noindex' }] })
</script>

<template>
  <div>
    <a class="skip" href="#contenu">Aller au contenu</a>
    <SiteHeader />
    <main id="contenu" class="err pad">
      <div class="code">{{ error?.statusCode || 500 }}</div>
      <h1>{{ introuvable ? "Cette page n'existe pas" : "Quelque chose s'est mal passé" }}</h1>
      <p>
        {{
          introuvable
            ? 'Le lien que vous avez suivi ne mène nulle part. Le patrimoine du Monastère, lui, est toujours là.'
            : 'Réessayez dans un instant. Si cela persiste, écrivez-nous.'
        }}
      </p>
      <div class="cta">
        <NuxtLink class="btn btn-lg btn-primary" to="/">Retour à l'accueil</NuxtLink>
        <NuxtLink class="btn btn-lg btn-secondary" to="/actualites">Voir les actualités</NuxtLink>
      </div>
    </main>
    <SiteFooter />
  </div>
</template>
