import { expect, test } from '@playwright/test'
import { allerA } from './helpers'

/**
 * Back-office. L'essentiel à garantir ici n'est pas l'ergonomie mais la
 * fermeture : rien ne doit être lisible ni modifiable sans le mot de passe, et
 * rien de tout cela ne doit atterrir dans un moteur de recherche.
 */
test.describe('Back-office', () => {
  test('demande le mot de passe', async ({ page }) => {
    await allerA(page, '/admin')
    await expect(page.locator('input[type=password]')).toBeVisible()
    await expect(page.locator('h1')).toHaveText('Back-office')
  })

  test('les sous-pages renvoient vers la connexion', async ({ page }) => {
    for (const chemin of ['/admin/evenements', '/admin/archives', '/admin/phototheque', '/admin/reglages']) {
      await page.goto(chemin)
      await expect(page).toHaveURL(/\/admin$/)
    }
  })

  test('toutes les routes d’écriture refusent une requête non authentifiée', async ({ page }) => {
    const appels = [
      page.request.get('/api/admin/evenements'),
      page.request.get('/api/admin/archives'),
      page.request.get('/api/admin/phototheque'),
      page.request.post('/api/admin/evenements', { data: { slug: 'x', titre: 'x', date: '2030-01-01' } }),
      page.request.post('/api/admin/archives', { data: { src: '/x.jpg', titre: 'x' } }),
      page.request.patch('/api/admin/reglages', { data: { url_adhesion: 'https://helloasso.com/x' } }),
      page.request.patch('/api/admin/phototheque', { data: { src: '/img/abbaye.jpg', titre: 'x' } }),
      page.request.delete('/api/admin/evenements/quelconque'),
    ]
    for (const reponse of await Promise.all(appels)) {
      expect(reponse.status()).toBe(401)
    }
  })

  test('un mauvais mot de passe est refusé', async ({ page }) => {
    const reponse = await page.request.post('/api/admin/login', { data: { password: 'mauvais' } })
    expect(reponse.status()).toBe(401)
  })

  test('le back-office est exclu de l’indexation', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.locator('meta[name=robots]')).toHaveAttribute('content', /noindex/)
  })
})
