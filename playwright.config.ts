import { defineConfig, devices } from '@playwright/test'

/**
 * Configuration Playwright du site des Passeurs de Mémoire du Monastère.
 *
 * Le bloc `webServer` démarre le serveur de développement sur un port dédié
 * (3124, pour ne pas entrer en conflit avec un `npm run dev` lancé à la main sur
 * 3000) et attend qu'il réponde avant de lancer la suite. En local le serveur
 * est réutilisé d'une exécution à l'autre ; en CI il est toujours redémarré.
 *
 * Les deux gabarits sont ceux de la maquette : 1440 px pour le bureau, 430 px
 * pour le téléphone — c'est à ces largeurs que la mise en page a été dessinée,
 * donc à ces largeurs qu'elle doit être vérifiée.
 *
 * Voir tests/e2e/ pour les scénarios, et README.md → « Tests ».
 */
const PORT = 3124
const baseURL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'bureau-chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'], viewport: { width: 430, height: 900 } },
    },
  ],

  webServer: {
    command: `npm run dev -- --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
