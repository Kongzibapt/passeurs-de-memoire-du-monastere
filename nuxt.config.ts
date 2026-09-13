import tailwindcss from '@tailwindcss/vite'

// URL de production, source unique (canonique, sitemap, Open Graph).
// Modifiable via la variable d'environnement NUXT_PUBLIC_SITE_URL.
//
// Le domaine servi est le www ; l'apex (sans www) redirige vers lui. Canonique,
// sitemap, robots et Open Graph doivent donc désigner le www : une canonique
// qui redirige met Google en conflit avec lui-même et fait sortir les pages de
// l'index. Ne remplacer cette valeur par l'apex que si la redirection est
// inversée côté hébergeur.
const siteUrl = (
  process.env.NUXT_PUBLIC_SITE_URL || 'https://www.passeurs-memoire-du-monastere.fr'
).replace(/\/$/, '')
const ogImage = `${siteUrl}/og-image.jpg`

const description =
  "Mettre en valeur et protéger le patrimoine du Monastère (Aveyron) : l'abbaye, l'église " +
  "et le pont Vieux. Du IXe au XXIe siècle, sur les rives de l'Aveyron."

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-01',
  devtools: { enabled: true },

  // NB : Vercel Analytics & Speed Insights ne sont PAS chargés via leurs modules
  // (qui traquent tout, back-office inclus). On les injecte nous-mêmes dans
  // app/plugins/vercel.client.ts avec un `beforeSend` qui exclut /admin.
  modules: ['@pinia/nuxt', '@nuxtjs/sitemap', '@nuxtjs/robots', '@nuxt/image'],

  css: ['~/assets/css/main.css'],

  // Optimisation d'images : AVIF/WebP + srcset responsive générés à la volée.
  image: {
    format: ['avif', 'webp'],
    quality: 82,
    // Breakpoints du srcset : les valeurs par défaut s'arrêtent à 1536px,
    // trop peu pour une image plein écran sur un écran Retina (1440 × 2 = 2880).
    screens: { xs: 320, sm: 640, md: 768, lg: 1024, xl: 1280, xxl: 1536, hd: 1920, retina: 2880 },
  },

  // Base commune : /sitemap.xml (généré depuis les pages) + /robots.txt
  // (autorise l'indexation en production, la bloque sur les preview Vercel,
  //  et référence le sitemap automatiquement).
  site: { url: siteUrl },

  // Le module sitemap découvre les pages statiques tout seul. La source serveur
  // ci-dessous leur ajoute une `lastmod` calculée depuis le contenu réellement
  // publié (événements à venir et souvenirs), pour qu'une mise à jour faite
  // depuis le back-office se voie dans le sitemap sans redéploiement.
  sitemap: {
    sources: ['/api/__sitemap__/urls'],
    // Back-office privé : jamais dans le sitemap.
    exclude: ['/admin', '/admin/**'],
  },

  // robots.txt : interdit l'exploration du back-office (en plus du noindex
  // posé sur les pages elles-mêmes via useHead).
  robots: {
    disallow: ['/admin'],
  },

  vite: {
    plugins: [tailwindcss()],
  },

  runtimeConfig: {
    // Server-only — à définir dans .env / les variables d'env Vercel
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    // Email (SMTP Gmail) — le formulaire de contact envoie les messages ici
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    contactTo: process.env.CONTACT_TO || process.env.SMTP_USER || 'lespasseursdememoire12@gmail.com',
    // Back-office /admin : mot de passe unique partagé (jamais exposé au client).
    adminPassword: process.env.ADMIN_PASSWORD || '',
    public: {
      siteUrl,
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Les Passeurs de Mémoire du Monastère — patrimoine de l’abbaye, l’église et le pont',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: description },
        { name: 'theme-color', content: '#FCF0E1' },
        // Open Graph (Facebook, WhatsApp, LinkedIn, iMessage…)
        { property: 'og:title', content: 'Les Passeurs de Mémoire du Monastère' },
        { property: 'og:description', content: description },
        { property: 'og:type', content: 'website' },
        { property: 'og:locale', content: 'fr_FR' },
        { property: 'og:site_name', content: 'Les Passeurs de Mémoire du Monastère' },
        { property: 'og:url', content: siteUrl },
        { property: 'og:image', content: ogImage },
        { property: 'og:image:type', content: 'image/jpeg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: "Le pont Vieux du Monastère et ses arches reflétées dans l'Aveyron" },
        // Twitter / X
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'Les Passeurs de Mémoire du Monastère' },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: ogImage },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/assets/emblem.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          // Typographie 1 de la charte : titres Schibsted Grotesk, corps Mulish,
          // accents Newsreader italique.
          rel: 'stylesheet',
          href:
            'https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;500;600;700;800' +
            '&family=Mulish:wght@400;500;600;700' +
            '&family=Newsreader:ital,opsz,wght@1,6..72,400;1,6..72,500&display=swap',
        },
      ],
    },
  },
})
