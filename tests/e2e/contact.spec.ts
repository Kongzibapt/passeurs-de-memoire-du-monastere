import { expect, test } from '@playwright/test'
import { allerA } from './helpers'

/**
 * Le formulaire de contact est la seule chose que ce site *reçoit*. Un message
 * perdu est un document d'archives qui ne sera jamais confié à l'association :
 * ces tests couvrent donc autant le refus propre que l'envoi réussi.
 */
test.describe('Formulaire de contact', () => {
  test('un champ obligatoire vide bloque l’envoi sur place', async ({ page }) => {
    await allerA(page)
    await page.locator('#contact-form').scrollIntoViewIfNeeded()

    // Aucune requête ne doit partir : le navigateur arrête l'envoi lui-même.
    let appels = 0
    await page.route('**/api/contact', (route) => {
      appels++
      return route.abort()
    })

    await page.locator('.cform button[type=submit]').click()
    await expect(page.locator('#nom')).toBeFocused()
    await expect(page.locator('.cform .retour')).toHaveCount(0)
    expect(appels).toBe(0)
  })

  test('affiche un retour après une tentative d’envoi', async ({ page }) => {
    await allerA(page)
    await page.locator('#contact-form').scrollIntoViewIfNeeded()

    await page.fill('#nom', 'Jeanne Test')
    await page.fill('#mail', 'jeanne@example.com')
    await page.selectOption('#sujet', { index: 1 })
    await page.fill('#msg', "J'ai retrouvé des cartes postales du pont dans le grenier.")
    await page.locator('.cform button[type=submit]').click()

    // En développement ni SMTP ni Supabase ne sont configurés : le serveur
    // répond alors 503 avec un message explicite plutôt que d'avaler l'envoi en
    // silence. Les deux issues sont acceptables ; le silence ne l'est pas.
    await expect(page.locator('.cform .retour')).toBeVisible({ timeout: 15_000 })
  })

  test('le pot de miel est hors de vue, du clavier et des lecteurs d’écran', async ({ page }) => {
    await allerA(page)
    const piege = page.locator('#site')

    // Le champ n'est pas masqué par `display:none` — certains robots ignorent
    // ce qui l'est. Il est repoussé hors de l'écran : c'est ce qu'on vérifie.
    const boite = await piege.boundingBox()
    expect(boite!.x + boite!.width).toBeLessThan(0)

    await expect(piege).toHaveAttribute('tabindex', '-1')
    // `aria-hidden` sur le conteneur le retire des lecteurs d'écran : un
    // visiteur aveugle ne doit pas tomber sur un champ piège.
    await expect(page.locator('[aria-hidden="true"] > #site')).toHaveCount(1)
  })

  test('un envoi rempli par un robot est écarté sans erreur', async ({ page }) => {
    const reponse = await page.request.post('/api/contact', {
      data: {
        nom: 'Robot',
        email: 'robot@example.com',
        sujet: 'Autre',
        message: 'Achetez ceci',
        site: 'http://spam.example',
      },
    })
    expect(reponse.status()).toBe(200)
    expect(await reponse.json()).toMatchObject({ ok: true, envoye: false, archive: false })
  })

  test('refuse une adresse e-mail invalide', async ({ page }) => {
    const reponse = await page.request.post('/api/contact', {
      data: { nom: 'Test', email: 'pas-une-adresse', sujet: 'Autre', message: 'Bonjour' },
    })
    expect(reponse.status()).toBe(400)
  })
})
