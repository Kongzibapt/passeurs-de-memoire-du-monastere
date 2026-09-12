import { expect, test } from '@playwright/test'
import { allerA } from './helpers'

/**
 * Les trois pièces interactives de la maquette : le menu, le comparateur
 * « autrefois · aujourd'hui » et la frise en forme de rivière. Ce sont elles qui
 * ont demandé le plus de réécriture en passant du prototype à Vue, donc celles
 * qu'il faut surveiller.
 */
test.describe('Comparateur autrefois / aujourd’hui', () => {
  test('change de monument au clic sur un onglet', async ({ page }) => {
    await allerA(page)
    const onglets = page.locator('.cmp-tabs button')
    await expect(onglets).toHaveCount(3)

    const avantInitial = await page.locator('.cmp .before').getAttribute('src')
    await onglets.nth(1).click() // L'église
    await expect(onglets.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(onglets.nth(0)).toHaveAttribute('aria-selected', 'false')
    await expect(page.locator('.cmp .before')).not.toHaveAttribute('src', avantInitial!)
    await expect(page.locator('#autrefois h2')).toContainText("L'église")
  })

  test('la ligne de séparation suit le curseur', async ({ page }) => {
    await allerA(page)
    const cadre = page.locator('.cmp')
    await cadre.scrollIntoViewIfNeeded()

    const position = () =>
      cadre.evaluate((el) => getComputedStyle(el).getPropertyValue('--x').trim())
    expect(await position()).toBe('50%')

    // Le curseur est un vrai `input[type=range]` : il doit répondre au clavier,
    // seul moyen d'utiliser le comparateur sans souris.
    await page.locator('.cmp input[type=range]').focus()
    await page.keyboard.press('ArrowLeft')
    await expect.poll(position).not.toBe('50%')
  })

  test('un lien « autrefois et aujourd’hui » ouvre le bon onglet', async ({ page }) => {
    await allerA(page)
    await page.locator('.pq-eglise .more').click()
    await expect(page.locator('.cmp-tabs button', { hasText: "L'église" })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })
})

test.describe('La rivière du temps', () => {
  test('affiche le premier repère et avance au suivant', async ({ page }) => {
    await allerA(page)
    const carte = page.locator('.riv-card')
    await carte.scrollIntoViewIfNeeded()
    await expect(carte.locator('h3')).toHaveText("L'abbaye royale")

    await page.locator('.riv-nav').nth(1).click() // repère suivant
    await expect(carte.locator('h3')).toHaveText("L'église")
    await expect(carte.locator('.rc-d')).toContainText('XII')
  })

  test('un clic sur une pierre du gué ouvre son repère', async ({ page }) => {
    await allerA(page)
    const pierres = page.locator('.riv .stone')
    await expect(pierres).toHaveCount(6)
    await pierres.last().scrollIntoViewIfNeeded()
    await pierres.last().click()
    await expect(page.locator('.riv-card .rc-d')).toHaveText('2006')
  })

  test('les repères restent lisibles en texte pour les moteurs', async ({ page }) => {
    // La liste `.jalons` est masquée quand le JavaScript prend la main, mais
    // elle doit rester dans le HTML servi : c'est la version textuelle de la
    // frise, et la seule que lisent les robots et les navigateurs sans JS.
    const html = await (await page.request.get('/')).text()
    // Le rendu serveur échappe les apostrophes (`L&#39;abbaye`) : on cherche
    // donc les mots, pas la ponctuation.
    expect(html).toContain('abbaye royale')
    expect(html).toContain('Le pont Vieux')
    expect(html).toContain('1339')
  })
})

test.describe('Navigation', () => {
  test('le menu mobile s’ouvre et se referme après un clic', async ({ page }, infos) => {
    test.skip(infos.project.name !== 'mobile-chromium', 'Menu déroulant sous 860 px seulement')
    await allerA(page)

    const menu = page.locator('#menu')
    const burger = page.locator('.burger')
    await expect(menu).toBeHidden()

    await burger.click()
    await expect(menu).toBeVisible()
    await expect(burger).toHaveAttribute('aria-expanded', 'true')

    await menu.locator('a', { hasText: 'Le patrimoine' }).click()
    await expect(menu).toBeHidden()
  })

  test('on circule entre l’accueil et les actualités', async ({ page }) => {
    await allerA(page)
    await page.locator('.evts').scrollIntoViewIfNeeded()
    await page.locator('a.btn', { hasText: 'Toutes les actualités' }).click()
    await expect(page).toHaveURL(/\/actualites$/)
    await expect(page.locator('h1')).toHaveText('Actualités & rendez-vous')

    await page.locator('header .mark').click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('les liens d’adhésion pointent vers HelloAsso', async ({ page }) => {
    await allerA(page)
    const liens = page.locator('a[href*="helloasso.com"]')
    expect(await liens.count()).toBeGreaterThan(0)
    // Un lien qui sort du site s'ouvre dans un nouvel onglet, et `noopener`
    // empêche la page d'arrivée de reprendre la main sur la nôtre.
    for (const lien of await liens.all()) {
      await expect(lien).toHaveAttribute('target', '_blank')
      await expect(lien).toHaveAttribute('rel', /noopener/)
    }
  })

  test('une URL inconnue rend la page d’erreur, pas une page blanche', async ({ page }) => {
    const reponse = await page.goto('/une-page-qui-nexiste-pas')
    expect(reponse?.status()).toBe(404)
    await expect(page.locator('h1')).toContainText("Cette page n'existe pas")
    await expect(page.locator('header .mark')).toBeVisible()
  })
})
