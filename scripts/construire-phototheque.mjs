/**
 * Inventorie `public/img/` et écrit `shared/phototheque-fichiers.ts`.
 *
 * ── Pourquoi un inventaire écrit dans le code ────────────────────────────────
 * Le back-office a besoin de la liste des images pour les proposer au choix.
 * On pourrait lister le dossier à chaque requête — c'est ce qu'on fait en
 * développement sans y penser — mais en production le site tourne sur Vercel :
 * les fichiers de `public/` sont servis par le CDN et n'existent PAS sur le
 * disque de la fonction serveur. Un `readdir` y renverrait une liste vide, et
 * la photothèque serait vide en ligne alors qu'elle marche en local : le pire
 * des bugs, celui qui ne se voit qu'après déploiement.
 *
 * L'inventaire est donc dressé à la construction, où le dossier est bien là, et
 * figé dans un module TypeScript ordinaire. Il est versionné : le dépôt dit ce
 * que le site contient, et un diff montre les images ajoutées ou retirées.
 *
 * ── Pourquoi pas sharp ───────────────────────────────────────────────────────
 * Lire les dimensions ne demande que l'en-tête du fichier. Y appeler `sharp`
 * obligerait Vercel à installer un binaire natif de trente mégaoctets à chaque
 * construction, pour lire quatre entiers. Les deux formats du dossier se
 * décodent en vingt lignes, ci-dessous.
 *
 *     npm run phototheque      # à lancer après avoir ajouté des images
 *
 * La construction le relance d'elle-même (`npm run build`), pour que
 * l'inventaire ne puisse pas rester en retard sur le dossier.
 */
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, extname, join, resolve } from 'node:path'

const ici = dirname(fileURLToPath(import.meta.url))
const DOSSIER = resolve(ici, '..', 'public', 'img')
const SORTIE = resolve(ici, '..', 'shared', 'phototheque-fichiers.ts')

const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'])

/**
 * Dimensions lues dans l'en-tête, sans décoder l'image.
 *
 * JPEG : suite de segments `FF xx` ; les marqueurs SOF0..SOF15 (sauf SOF4,
 * SOF8 et SOF12, qui ne sont pas des cadres) portent hauteur puis largeur.
 * PNG : le bloc IHDR est toujours le premier, à l'octet 16.
 */
function mesurer(buf) {
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { largeur: buf.readUInt32BE(16), hauteur: buf.readUInt32BE(20) }
  }
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i++
        continue
      }
      const marqueur = buf[i + 1]
      const cadre = marqueur >= 0xc0 && marqueur <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marqueur)
      if (cadre) return { hauteur: buf.readUInt16BE(i + 5), largeur: buf.readUInt16BE(i + 7) }
      i += 2 + buf.readUInt16BE(i + 2)
    }
  }
  // Format que ce script ne sait pas lire : on l'inventorie quand même, sans
  // dimensions. Mieux vaut une image proposée sans sa taille qu'une image
  // absente de la photothèque.
  return { largeur: 0, hauteur: 0 }
}

const fichiers = []
for (const nom of (await readdir(DOSSIER)).sort()) {
  if (!EXTENSIONS.has(extname(nom).toLowerCase())) continue
  const chemin = join(DOSSIER, nom)
  const [buf, infos] = await Promise.all([readFile(chemin), stat(chemin)])
  const { largeur, hauteur } = mesurer(buf)
  fichiers.push({ src: `/img/${nom}`, largeur, hauteur, octets: infos.size })
}

const lignes = fichiers
  .map((f) => `  { src: '${f.src}', largeur: ${f.largeur}, hauteur: ${f.hauteur}, octets: ${f.octets} },`)
  .join('\n')

await writeFile(
  SORTIE,
  `/**
 * Inventaire de \`public/img/\` — FICHIER GÉNÉRÉ, ne pas modifier à la main.
 *
 * Produit par \`scripts/construire-phototheque.mjs\`, relancé à chaque
 * construction. Pour le mettre à jour après avoir ajouté des images :
 *
 *     npm run phototheque
 *
 * Les légendes ne sont pas ici : elles vivent dans \`shared/phototheque.ts\`
 * (celles écrites dans le code) et dans Supabase (celles saisies au
 * back-office). Ce fichier ne dit que ce que le dossier contient.
 */
import type { FichierImage } from './phototheque'

export const FICHIERS_IMAGES: FichierImage[] = [
${lignes}
]
`,
  'utf8',
)

const total = fichiers.reduce((n, f) => n + f.octets, 0)
console.log(
  `${fichiers.length} image(s) inventoriée(s), ${(total / 1024 / 1024).toFixed(1)} Mo → shared/phototheque-fichiers.ts`,
)
