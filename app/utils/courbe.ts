/**
 * Échantillonnage d'un tracé de Bézier cubique, sans DOM.
 *
 * La maquette posait les pierres du gué avec `SVGPathElement.getTotalLength()`
 * et `getPointAtLength()`. Ces méthodes n'existent que dans un navigateur : la
 * frise n'aurait alors rien affiché au rendu serveur, et serait apparue d'un
 * coup à l'hydratation. On refait donc le même calcul en TypeScript pur — même
 * géométrie, disponible des deux côtés.
 *
 * La longueur absolue, elle, n'a pas besoin d'être exacte au pixel : les
 * pointillés du tracé sont normalisés par l'attribut `pathLength` du SVG, qui
 * laisse le navigateur faire la conversion. Seule compte ici la position
 * RELATIVE d'un point le long de la courbe, que l'échantillonnage donne avec
 * une précision très supérieure à ce que l'œil distingue.
 */

export interface Point {
  x: number
  y: number
}

interface Segment {
  p0: Point
  c1: Point
  c2: Point
  p3: Point
}

/** Nombre d'échantillons par segment pour la table longueur → position. */
const ECHANTILLONS = 240

function bezier(s: Segment, t: number): Point {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const c = 3 * u * t * t
  const d = t * t * t
  return {
    x: a * s.p0.x + b * s.c1.x + c * s.c2.x + d * s.p3.x,
    y: a * s.p0.y + b * s.c1.y + c * s.c2.y + d * s.p3.y,
  }
}

/**
 * Analyse le sous-ensemble de la syntaxe `d` utilisé par le tracé de la
 * rivière : un `M`, un `C`, puis des `S`. Dans un `S`, le premier point de
 * contrôle est le symétrique du second point de contrôle précédent — c'est ce
 * qui rend la courbe lisse aux jonctions.
 */
function analyser(d: string): Segment[] {
  const jetons = d.match(/[MCS]|-?\d*\.?\d+/g)
  if (!jetons) return []

  const segments: Segment[] = []
  let position: Point = { x: 0, y: 0 }
  let dernierControle: Point | null = null
  let i = 0

  const nombre = () => Number(jetons[i++])
  const point = (): Point => ({ x: nombre(), y: nombre() })

  while (i < jetons.length) {
    const commande = jetons[i++]
    if (commande === 'M') {
      position = point()
      dernierControle = null
    } else if (commande === 'C' || commande === 'S') {
      const c1 =
        commande === 'C'
          ? point()
          : dernierControle
            ? { x: 2 * position.x - dernierControle.x, y: 2 * position.y - dernierControle.y }
            : { ...position }
      const c2 = point()
      const p3 = point()
      segments.push({ p0: position, c1, c2, p3 })
      position = p3
      dernierControle = c2
    } else {
      // Commande non gérée : le tracé de la rivière n'en utilise pas d'autre.
      break
    }
  }
  return segments
}

export interface Courbe {
  /** Longueur totale, dans l'unité des échantillons. */
  longueur: number
  /** Point situé à `l` le long de la courbe (`l` borné à [0, longueur]). */
  pointA(l: number): Point
  /** Point situé à la fraction `f` ∈ [0, 1] de la courbe. */
  pointAFraction(f: number): Point
}

export function echantillonner(d: string): Courbe {
  const segments = analyser(d)

  // Table cumulée : à chaque échantillon, la longueur parcourue depuis le début.
  const longueurs: number[] = [0]
  const points: Point[] = []

  let cumul = 0
  let precedent: Point | null = null
  for (const segment of segments) {
    for (let k = 0; k <= ECHANTILLONS; k++) {
      const p = bezier(segment, k / ECHANTILLONS)
      if (precedent) {
        // Le premier point d'un segment est le dernier du précédent : on
        // l'ignore pour ne pas ajouter deux fois la même position.
        if (k === 0) continue
        cumul += Math.hypot(p.x - precedent.x, p.y - precedent.y)
        longueurs.push(cumul)
      }
      points.push(p)
      precedent = p
    }
  }

  const longueur = cumul

  function pointA(l: number): Point {
    if (points.length === 0) return { x: 0, y: 0 }
    const cible = Math.max(0, Math.min(longueur, l))

    // Recherche dichotomique de l'échantillon qui encadre la longueur visée.
    let bas = 0
    let haut = longueurs.length - 1
    while (haut - bas > 1) {
      const milieu = (bas + haut) >> 1
      if (longueurs[milieu]! <= cible) bas = milieu
      else haut = milieu
    }

    const a = points[bas]!
    const b = points[haut] ?? a
    const portion = longueurs[haut]! - longueurs[bas]!
    const t = portion > 0 ? (cible - longueurs[bas]!) / portion : 0
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
  }

  return {
    longueur,
    pointA,
    pointAFraction: (f: number) => pointA(f * longueur),
  }
}
