import { expect, test } from '@playwright/test'

/**
 * Référencement : c'est par là que les habitants du village trouveront le site.
 */
test.describe('SEO', () => {
  test('chaque page porte titre, description et canonique', async ({ page }) => {
    for (const chemin of ['/', '/actualites', '/mentions-legales', '/confidentialite']) {
      await page.goto(chemin)
      await expect(page).toHaveTitle(/Passeurs de Mémoire/)
      const description = await page.locator('meta[name=description]').getAttribute('content')
      expect(description?.length ?? 0).toBeGreaterThan(50)
      const canonique = await page.locator('link[rel=canonical]').getAttribute('href')
      expect(canonique).toMatch(new RegExp(`${chemin === '/' ? '/$' : chemin + '$'}`))
    }
  })

  test('les données structurées décrivent l’association', async ({ page }) => {
    await page.goto('/')
    const brut = await page.locator('script[type="application/ld+json"]').first().textContent()
    const donnees = JSON.parse(brut!)
    expect(donnees['@type']).toBe('NGO')
    expect(donnees.name).toContain('Passeurs de Mémoire')
    expect(donnees.address.addressLocality).toBe('Le Monastère')
  })

  test('le sitemap liste les pages publiques et ignore le back-office', async ({ page }) => {
    const xml = await (await page.request.get('/sitemap.xml')).text()
    expect(xml).toContain('/actualites')
    expect(xml).toContain('/mentions-legales')
    expect(xml).not.toContain('/admin')
  })

  test('robots.txt interdit le back-office', async ({ page }) => {
    // En développement, @nuxtjs/robots bloque TOUT le site pour qu'un aperçu ne
    // soit jamais indexé, et n'émet donc pas la règle ciblée. `mockProductionEnv`
    // est le commutateur prévu par le module pour obtenir le fichier réel.
    const txt = await (await page.request.get('/robots.txt?mockProductionEnv')).text()
    expect(txt).toContain('Disallow: /admin')
  })

  test('une seule balise h1 par page', async ({ page }) => {
    for (const chemin of ['/', '/actualites']) {
      await page.goto(chemin)
      await expect(page.locator('h1')).toHaveCount(1)
    }
  })

  test('l’image Open Graph est déclarée en absolu', async ({ page }) => {
    await page.goto('/')
    const og = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(og).toMatch(/^https?:\/\//)
  })
})
