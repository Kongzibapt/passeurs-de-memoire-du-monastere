import type { Page } from '@playwright/test'

/**
 * Navigue et attend que l'application cliente soit hydratée.
 *
 * `app.vue` pose `document.documentElement.dataset.hydrated = 'true'` au
 * montage : les interactions (envoi de formulaire, ouverture du menu, onglets)
 * atteignent donc à coup sûr de vrais gestionnaires Vue, et ne courent pas
 * l'hydratation. À utiliser systématiquement à la place de `page.goto()` dès
 * qu'un test clique ou saisit quelque chose.
 */
export async function allerA(page: Page, chemin = '/') {
  await page.goto(chemin)
  await page.waitForFunction(() => document.documentElement.dataset.hydrated === 'true')
}

/**
 * Fait défiler toute la page, puis attend que chaque image ait vraiment abouti.
 *
 * Les images sont en `loading="lazy"` : elles ne partent qu'une fois approchées.
 * Et celles du site sont transformées à la volée en AVIF/WebP, ce qui prend un
 * instant en développement. Remonter en haut trop tôt laisserait des images
 * encore en vol, qu'on prendrait à tort pour des images cassées : on reste donc
 * en bas de page le temps de l'attente.
 */
export async function chargerImages(page: Page) {
  await page.evaluate(async () => {
    const pas = window.innerHeight * 0.8
    for (let y = 0; y < document.body.scrollHeight; y += pas) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 100))
    }
    window.scrollTo(0, document.body.scrollHeight)
  })
  await page.waitForFunction(() => [...document.images].every((i) => i.complete), null, {
    timeout: 60_000,
  })
}
