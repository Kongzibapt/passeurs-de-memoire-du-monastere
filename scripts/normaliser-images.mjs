/**
 * Remet d'aplomb les photos de `public/img/`, et les ramène à une taille utile.
 *
 * ── Pourquoi ce script existe ────────────────────────────────────────────────
 * Un appareil photo ou un téléphone tenu de travers n'enregistre pas les pixels
 * tournés : il les laisse tels quels et ajoute une balise EXIF « oriente-moi de
 * 90° ». Un navigateur qui affiche le fichier d'origine lit cette balise et
 * redresse l'image tout seul.
 *
 * Mais les images du site sont réencodées à la volée en AVIF/WebP par IPX, qui
 * n'applique pas cette balise (vérifié : son code ne la lit nulle part). Résultat
 * : une photo parfaitement droite dans l'aperçu de l'ordinateur s'affiche
 * couchée sur le site, et rien dans le code ne l'explique.
 *
 * La parade est de ne jamais dépendre de la balise : on applique la rotation aux
 * pixels eux-mêmes, une fois pour toutes, à l'entrée du dépôt.
 *
 * ── Quand le lancer ──────────────────────────────────────────────────────────
 * Après avoir ajouté des photos dans `public/img/` :
 *
 *     node scripts/normaliser-images.mjs          # applique
 *     node scripts/normaliser-images.mjs --test   # signale sans rien modifier
 *
 * Le script ne touche que les fichiers qui en ont besoin : le relancer deux fois
 * de suite ne réencode rien la seconde fois, et ne dégrade donc pas les images.
 */
import sharp from 'sharp'
import { readdir, rename, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, extname, join, resolve } from 'node:path'

const ici = dirname(fileURLToPath(import.meta.url))
const DOSSIER = resolve(ici, '..', 'public', 'img')

/**
 * Largeur maximale conservée. `@nuxt/image` génère un srcset jusqu'à 2880 px
 * (1440 sur un écran Retina) : au-delà, les pixels supplémentaires ne sont
 * jamais servis et ne font qu'alourdir le dépôt.
 */
const LARGEUR_MAX = 2880

const testSeulement = process.argv.includes('--test')
const ko = (o) => `${Math.round(o / 1024)} ko`

const fichiers = (await readdir(DOSSIER)).filter((f) => /\.(jpe?g|png)$/i.test(f))
let modifies = 0

for (const nom of fichiers) {
  const chemin = join(DOSSIER, nom)
  const meta = await sharp(chemin).metadata()

  const aTourner = !!meta.orientation && meta.orientation !== 1
  const aReduire = (meta.width ?? 0) > LARGEUR_MAX
  if (!aTourner && !aReduire) continue

  const raisons = [aTourner && `orientation EXIF ${meta.orientation}`, aReduire && `${meta.width} px de large`]
    .filter(Boolean)
    .join(', ')

  if (testSeulement) {
    console.log(`À normaliser : ${nom.padEnd(32)} (${raisons})`)
    modifies++
    continue
  }

  const avant = (await stat(chemin)).size
  const provisoire = join(DOSSIER, `.${nom}.tmp`)

  // `.rotate()` sans argument applique l'orientation EXIF puis remet la balise à
  // zéro : les pixels sont enregistrés à l'endroit, plus personne n'a à la lire.
  let image = sharp(chemin).rotate()
  if (aReduire) image = image.resize({ width: LARGEUR_MAX, withoutEnlargement: true })

  const png = extname(nom).toLowerCase() === '.png'
  await (png ? image.png({ compressionLevel: 9 }) : image.jpeg({ quality: 88, mozjpeg: true })).toFile(
    provisoire,
  )
  await rename(provisoire, chemin)

  const apres = (await stat(chemin)).size
  const final = await sharp(chemin).metadata()
  console.log(
    `✔ ${nom.padEnd(32)} ${meta.width}×${meta.height} → ${final.width}×${final.height}   ${ko(avant)} → ${ko(apres)}   (${raisons})`,
  )
  modifies++
}

if (modifies === 0) {
  console.log(`Rien à faire : les ${fichiers.length} images de public/img/ sont déjà normalisées.`)
} else if (testSeulement) {
  console.log(`\n${modifies} image(s) à normaliser. Relancer sans --test pour les corriger.`)
  process.exit(1)
} else {
  console.log(`\n${modifies} image(s) normalisée(s) sur ${fichiers.length}.`)
}
