import { expect, test } from '@playwright/test'
import { readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, extname, resolve } from 'node:path'

import { FICHIERS_IMAGES } from '../../shared/phototheque-fichiers'
import { LEGENDES, chercherImages, composerPhototheque, titreParDefaut } from '../../shared/phototheque'

const ici = dirname(fileURLToPath(import.meta.url))
const DOSSIER = resolve(ici, '..', '..', 'public', 'img')

/**
 * La photothèque repose sur un inventaire écrit dans le code, parce que la
 * fonction serveur de Vercel ne voit pas `public/`. Cet inventaire peut donc
 * mentir : c'est ce que ces tests surveillent.
 */
test.describe('Photothèque', () => {
  test("l'inventaire correspond au dossier", async () => {
    const surDisque = (await readdir(DOSSIER))
      .filter((n) => ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'].includes(extname(n).toLowerCase()))
      .map((n) => `/img/${n}`)
      .sort()
    const inventorie = FICHIERS_IMAGES.map((f) => f.src).sort()

    // En cas d'écart : `npm run phototheque`. La construction le fait seule,
    // mais le dépôt doit rester juste entre deux déploiements.
    expect(inventorie).toEqual(surDisque)
  })

  test('chaque fichier inventorié porte ses dimensions', () => {
    for (const f of FICHIERS_IMAGES) {
      expect(f.largeur, `${f.src} sans largeur`).toBeGreaterThan(0)
      expect(f.hauteur, `${f.src} sans hauteur`).toBeGreaterThan(0)
      expect(f.octets, `${f.src} sans taille`).toBeGreaterThan(0)
    }
  })

  test('les légendes du code désignent des images qui existent', () => {
    const existantes = new Set(FICHIERS_IMAGES.map((f) => f.src))
    for (const src of Object.keys(LEGENDES)) {
      expect(existantes.has(src), `${src} est légendée mais absente du dossier`).toBe(true)
    }
  })

  test('une image sans légende reste proposée, avec un titre lisible', () => {
    const images = composerPhototheque([
      { src: '/img/archive-vieux-pont-2.jpg', largeur: 10, hauteur: 10, octets: 10 },
    ])
    expect(images[0]!.titre).toBe('Archive vieux pont 2')
    expect(images[0]!.source).toBe('nue')
    expect(titreParDefaut('/img/a_b-c.png')).toBe('A b c')
  })

  test('la base l’emporte sur le code, et le code sur le repli', () => {
    const fichier = { src: '/img/abbaye.jpg', largeur: 1, hauteur: 1, octets: 1 }
    expect(composerPhototheque([fichier])[0]!.source).toBe('code')
    expect(composerPhototheque([fichier])[0]!.titre).toBe(LEGENDES['/img/abbaye.jpg']!.titre)

    const retouchee = composerPhototheque([fichier], { '/img/abbaye.jpg': { titre: 'Autre titre' } })[0]!
    expect(retouchee.titre).toBe('Autre titre')
    expect(retouchee.source).toBe('base')
    // Les champs laissés vides au back-office retombent sur le code, ils ne
    // l'effacent pas : corriger un titre ne doit pas faire perdre le texte
    // alternatif écrit ailleurs.
    expect(retouchee.alt).toBe(LEGENDES['/img/abbaye.jpg']!.alt)
  })

  test('la recherche ignore les accents et croise les mots', () => {
    const images = composerPhototheque(FICHIERS_IMAGES)
    const eglises = chercherImages(images, 'eglise')
    expect(eglises.length).toBeGreaterThan(3)
    expect(chercherImages(images, 'carte postale pont').length).toBeGreaterThan(0)
    expect(chercherImages(images, 'zzz-introuvable')).toHaveLength(0)
  })
})
