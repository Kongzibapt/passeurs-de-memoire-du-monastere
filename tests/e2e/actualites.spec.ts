import { expect, test } from '@playwright/test'
import { allerA } from './helpers'

/**
 * La page Actualités se remplit seule à partir des dates : ces tests vérifient
 * la règle qui fait toute sa valeur — un rendez-vous passé ne peut pas rester
 * annoncé.
 */
test.describe('Actualités', () => {
  test("n'annonce que des dates à venir", async ({ page }) => {
    await allerA(page, '/actualites')

    const evenements = await page.$$eval('.evts .evt', (els) =>
      els.map((e) => e.querySelector('.when')?.textContent?.trim() ?? ''),
    )
    expect(evenements.length).toBeGreaterThan(0)

    // Le site ne peut pas annoncer une année révolue.
    const anneeCourante = new Date().getFullYear()
    for (const quand of evenements) {
      const annee = Number(quand.match(/\b(20\d\d)\b/)?.[1])
      expect(annee).toBeGreaterThanOrEqual(anneeCourante)
    }
  })

  test('les événements passés deviennent des souvenirs', async ({ page }) => {
    await allerA(page, '/actualites')
    const souvenirs = page.locator('.passe .pevt')
    await expect(souvenirs.first()).toBeVisible()
    // Un souvenir porte un récit ; c'est ce qui le distingue d'une annonce.
    await expect(souvenirs.first().locator('.pe-t p').first()).not.toBeEmpty()
  })

  test('aucun événement ne figure à la fois à venir et en souvenir', async ({ page }) => {
    await allerA(page, '/actualites')
    const aVenir = await page.$$eval('.evts .evt h3', (els) => els.map((e) => e.textContent?.trim()))
    const passes = await page.$$eval('.passe .pevt h3', (els) => els.map((e) => e.textContent?.trim()))
    expect(aVenir.filter((t) => passes.includes(t))).toEqual([])
  })

  test('annonce le prochain rendez-vous dans la bande d’adhésion', async ({ page }) => {
    await allerA(page, '/actualites')
    await expect(page.locator('.adhere .reason p')).toContainText(
      /Prochain rendez-vous|prochaines dates sont en préparation/,
    )
  })
})
