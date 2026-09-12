import { expect, test } from '@playwright/test'
import { allerA, chargerImages } from './helpers'

/**
 * L'accueil déroule un récit en neuf sections. Ces tests vérifient qu'elles
 * sont toutes rendues par le serveur — c'est-à-dire présentes dans le HTML reçu,
 * et pas seulement construites après coup par le navigateur.
 */
test.describe('Accueil', () => {
  test('rend les neuf sections de la maquette', async ({ page }) => {
    await allerA(page)

    await expect(page.locator('.hero h1')).toContainText('Mettre en valeur et protéger le patrimoine')
    await expect(page.locator('#patrimoine h2')).toHaveText('Trois monuments, une seule histoire')
    await expect(page.locator('#autour h2')).toHaveText("Le bourg qui s'est bâti avec eux")
    await expect(page.locator('#autrefois h2')).toBeVisible()
    await expect(page.locator('#association h2')).toContainText('Faire passer la mémoire du village')
    await expect(page.locator('#frise h2')).toHaveText('La rivière du temps')
    await expect(page.locator('#archives h2')).toHaveText('Ce que les greniers ont conservé')
    await expect(page.locator('#adherer h2')).toBeVisible()
    await expect(page.locator('#contact-form h2')).toHaveText('Une question, une photo, une histoire')
    await expect(page.locator('.devise blockquote')).toContainText('Chaque pierre du Monastère')
  })

  test('présente les trois monuments avec leur siècle', async ({ page }) => {
    await allerA(page)
    const planches = page.locator('.plaques .pq')
    await expect(planches).toHaveCount(3)
    await expect(planches.nth(0).locator('h3')).toHaveText("L'abbaye")
    await expect(planches.nth(1).locator('h3')).toHaveText("L'église")
    await expect(planches.nth(2).locator('h3')).toHaveText('Le pont Vieux')
    // Les exposants de siècle sont du contenu, pas de la décoration : une
    // abbaye du « IXe s. » perd son sens si l'exposant disparaît.
    await expect(planches.nth(0).locator('.siecle')).toContainText('IX')
  })

  test('le contenu est bien rendu côté serveur', async ({ page }) => {
    // Sans JavaScript, le HTML reçu doit déjà porter le texte : c'est ce que
    // lisent les moteurs de recherche, et ce que voit un visiteur sur un réseau
    // lent avant l'hydratation.
    const reponse = await page.request.get('/')
    const html = await reponse.text()
    expect(html).toContain('Trois monuments, une seule histoire')
    expect(html).toContain('La rivière du temps')
    expect(html).toContain('Ce que les greniers ont conservé')
  })

  test('toutes les images se chargent', async ({ page }) => {
    await allerA(page)
    await chargerImages(page)
    const cassees = await page.evaluate(() =>
      [...document.images].filter((i) => i.naturalWidth === 0).map((i) => i.currentSrc || i.src),
    )
    expect(cassees).toEqual([])
  })

  test('chaque image porte un texte alternatif', async ({ page }) => {
    await allerA(page)
    await chargerImages(page)
    // Un site de patrimoine qui montre des cartes postales sans les décrire est
    // illisible pour qui ne voit pas les images. Seules les images purement
    // décoratives ont le droit à un alt vide.
    const sansAlt = await page.evaluate(() =>
      [...document.images].filter((i) => i.getAttribute('alt') === null).map((i) => i.src),
    )
    expect(sansAlt).toEqual([])
  })
})
