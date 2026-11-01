import { expect, test } from '@playwright/test'

import {
  LEGENDES,
  PHOTO_BUREAU,
  STOCKAGE_IMAGES,
  chercherImages,
  composerPhototheque,
  img,
  titreParDefaut,
} from '../../shared/phototheque'

/** Les images légendées dans le code, comme si la table les listait toutes. */
const FONDS = Object.keys(LEGENDES).map((src) => ({ src, largeur: 1, hauteur: 1, octets: 1, depose: true }))

/**
 * Les images vivent dans le bucket Supabase ; le code ne garde que leurs
 * adresses et leurs légendes. Ces tests surveillent que les deux restent
 * d'accord, sans aller sur le réseau.
 */
test.describe('Photothèque', () => {
  test('les légendes du code désignent le fonds d’origine du bucket', () => {
    for (const src of Object.keys(LEGENDES)) {
      expect(src.startsWith(`${STOCKAGE_IMAGES}/historique/`), `${src} hors du bucket`).toBe(true)
    }
    expect(LEGENDES[PHOTO_BUREAU], 'la photo du Bureau doit être légendée').toBeTruthy()
  })

  test('une image sans légende reste proposée, avec un titre lisible', () => {
    const images = composerPhototheque([
      { src: img('archive-vieux-pont-2.jpg'), largeur: 10, hauteur: 10, octets: 10 },
    ])
    expect(images[0]!.titre).toBe('Archive vieux pont 2')
    expect(images[0]!.source).toBe('nue')
    expect(titreParDefaut(img('a_b-c.png'))).toBe('A b c')
  })

  test('la base l’emporte sur le code, et le code sur le repli', () => {
    const src = img('abbaye.jpg')
    const fichier = { src, largeur: 1, hauteur: 1, octets: 1 }
    expect(composerPhototheque([fichier])[0]!.source).toBe('code')
    expect(composerPhototheque([fichier])[0]!.titre).toBe(LEGENDES[src]!.titre)

    const retouchee = composerPhototheque([fichier], { [src]: { titre: 'Autre titre' } })[0]!
    expect(retouchee.titre).toBe('Autre titre')
    expect(retouchee.source).toBe('base')
    // Les champs laissés vides au back-office retombent sur le code, ils ne
    // l'effacent pas : corriger un titre ne doit pas faire perdre le texte
    // alternatif écrit ailleurs.
    expect(retouchee.alt).toBe(LEGENDES[src]!.alt)
  })

  test('une photo déposée garde son adresse complète, sa légende et son marquage', () => {
    const url = 'https://exemple.supabase.co/storage/v1/object/public/phototheque/2026/nef-ab12cd.jpg'
    const [image] = composerPhototheque(
      [{ src: url, largeur: 2400, hauteur: 1600, octets: 900_000, depose: true }],
      { [url]: { titre: 'Nef', alt: "L'église pleine" } },
    )
    expect(image!.depose).toBe(true)
    expect(image!.src).toBe(url)
    expect(image!.titre).toBe('Nef')
    expect(image!.source).toBe('base')
  })

  test('la recherche ignore les accents et croise les mots', () => {
    const images = composerPhototheque(FONDS)
    const eglises = chercherImages(images, 'eglise')
    expect(eglises.length).toBeGreaterThan(3)
    expect(chercherImages(images, 'carte postale pont').length).toBeGreaterThan(0)
    expect(chercherImages(images, 'zzz-introuvable')).toHaveLength(0)
  })
})
