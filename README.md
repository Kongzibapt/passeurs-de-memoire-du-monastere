# Les Passeurs de Mémoire du Monastère — site

Site de l'association de sauvegarde et de valorisation du patrimoine du
Monastère (Aveyron) : l'abbaye, l'église et le pont Vieux.

Portage en Nuxt 4 de la maquette réalisée sur Claude Design, reproduite au pixel
près (voir [Fidélité à la maquette](#fidélité-à-la-maquette)).

---

## Démarrer

```bash
npm install
cp .env.example .env      # puis compléter — le site tourne aussi sans
npm run dev               # http://localhost:3000
```

| Commande | Ce qu'elle fait |
| --- | --- |
| `npm run dev` | serveur de développement |
| `npm run build` | build de production (Nitro) |
| `npm run preview` | sert le build localement |
| `npm run images` | remet d'aplomb et redimensionne les photos ajoutées |
| `npm run typecheck` | vérification TypeScript (`vue-tsc`) |
| `npm test` | suite end-to-end Playwright |
| `npm run test:ui` | la même, en mode pas à pas |

---

## Ce que fait le site

Deux pages publiques, celles de la maquette :

- **`/`** — l'accueil déroule un récit : les trois monuments fondateurs, le bourg
  bâti avec eux, un comparateur « autrefois · aujourd'hui », le but de
  l'association, la frise chronologique en forme de rivière, le fonds
  d'archives, les rendez-vous, l'adhésion et le formulaire de contact.
- **`/actualites`** — les rendez-vous à venir, puis les souvenirs de ceux qui ont
  eu lieu.

S'y ajoutent, hors maquette, `/mentions-legales` et `/confidentialite` : un site
ouvert au public doit identifier son éditeur, et un formulaire qui recueille un
nom et une adresse e-mail doit dire ce qu'il en fait.

### Un événement n'a pas de bouton « publier »

C'est le point à comprendre avant de toucher au contenu. Un événement porte une
date, et cette date décide de tout :

```
date ≥ aujourd'hui   →  « À venir »  (accueil + page Actualités)
date < aujourd'hui   →  « C'était chez nous », s'il porte un bloc « souvenir »
                        sinon il disparaît, simplement
```

Personne n'a donc à dépublier quoi que ce soit : le site ne peut pas annoncer
une date dépassée, même si plus personne ne s'en occupe pendant six mois. C'est
la transposition de `evts.js` dans la maquette, qui retirait les dates périmées
au chargement.

La date affichée n'est pas saisie non plus : elle est calculée depuis la date
ISO, au format « Samedi 21 novembre 2026 », identique sur l'accueil, la page
Actualités et les souvenirs. Un libellé écrit à la main finit toujours par
diverger d'un écran à l'autre, et personne ne s'en aperçoit avant de voir les
deux côte à côte.

---

## Contenu : le code d'abord, la base ensuite

Tout le contenu existe **dans le code** (`shared/evenements.ts`,
`shared/archives.ts`, `app/data/`). Supabase ne le remplace pas : il s'y ajoute.

```
contenu du code  +  lignes Supabase   →  ce que le site affiche
                    (l'emportent à slug ou id égal)
```

Trois conséquences, voulues :

1. **Le site tourne sans base.** En développement, dans les tests, et en
   production tant que Supabase n'est pas branché, les pages s'affichent
   complètes. Aucune lecture ne lève d'erreur.
2. **Rien ne disparaît par accident.** Un incident sur la base ne vide pas le
   site : il le ramène à son contenu d'origine.
3. **Modifier un contenu d'origine depuis le back-office** crée en base une
   version de même identifiant, qui prend sa place. Les sources restent intactes
   et la modification est réversible en supprimant la ligne.

Le contenu historique (les trois monuments, la frise, le comparateur) vit dans
`app/data/` et n'est **pas** éditable depuis le back-office : ce sont des
notices sourcées, pas de l'actualité.

### `sizes` : préfixer **tous** les points de rupture

Sur un `<NuxtImg>`, l'attribut `sizes` doit préfixer chaque valeur par son point
de rupture :

```
sizes="xs:90vw sm:90vw md:90vw lg:50vw xl:560px xxl:560px"   ✅
sizes="100vw md:50vw lg:560px"                                ❌
```

La seconde forme est celle que la documentation laisse croire possible, et elle
produit un `srcset` silencieusement cassé : les deux plus petites variantes
reçoivent les descripteurs `1w` et `2w` au lieu de `320w` et `640w`. Un
navigateur ne les choisit alors jamais, et un téléphone télécharge une image
bien plus large que nécessaire. Rien ne le signale — ni erreur, ni avertissement,
et l'image s'affiche correctement.

Les valeurs sont mesurées, pas devinées : la largeur réellement occupée par
chaque image a été relevée de 320 px à 1920 px de fenêtre, puis arrondie vers le
haut. Demander un peu trop large ne coûte que des octets ; demander trop étroit
rend l'image floue.

### Affiches d'événement

Les affiches sont dessinées en HTML dans le bundle Claude Design, une planche
par `<section class="page">`. `node scripts/exporter-affiches.mjs` rend la
première planche de chacune et l'écrit dans `public/img/`, en masquant au
passage les mentions de travail en cours (« Lieu et horaires à confirmer »),
qui n'ont plus lieu d'être une fois l'événement passé.

Une photo de souvenir marquée `affiche: true` garde ses proportions A4 au lieu
du cadrage 4/3 de la charte : appliqué à une affiche, ce cadrage en couperait le
titre et la date, c'est-à-dire tout ce qu'elle sert à dire.

### Ajouter une photo : passer par `npm run images`

Les photos vont dans `public/img/`, versionnées avec le site. **Après en avoir
déposé une, lancer `npm run images`.**

Ce n'est pas une coquetterie. Un appareil photo tenu de travers n'enregistre pas
les pixels tournés : il les laisse tels quels et ajoute une balise EXIF
« oriente-moi de 90° ». L'aperçu de l'ordinateur lit cette balise et montre la
photo droite — mais `@nuxt/image` réencode les photos en AVIF sans l'appliquer,
et la photo s'affiche **couchée sur le site**, sans que rien dans le code ne
l'explique. C'est arrivé à deux des photos de l'église.

`npm run images` applique la rotation aux pixels eux-mêmes et ramène les images
à 2880 px de large (au-delà, les pixels ne sont jamais servis). Il ne touche que
ce qui en a besoin : le relancer ne dégrade rien.

```bash
npm run images -- --test   # signale sans modifier — utile en revue
```

---

## Back-office `/admin`

Trois écrans : **Événements**, **Archives**, **Réglages**.

L'accès tient à un mot de passe unique partagé (`ADMIN_PASSWORD`). Le cookie de
session ne contient pas ce mot de passe mais un HMAC qui en dérive : le changer
invalide toutes les sessions ouvertes, et aucun secret séparé n'est nécessaire.

Le seul réglage aujourd'hui est le **lien HelloAsso de la campagne d'adhésion**.
C'est celui qui change tous les ans, et que portent tous les boutons « Adhérer »
du site — le sortir du code évite un redéploiement annuel pour une URL.

`/admin` est exclu du sitemap, interdit dans `robots.txt`, marqué `noindex`, et
retiré des statistiques de fréquentation (voir `app/plugins/vercel.client.ts`).

### Base de données

Les **lectures** se passent de Supabase. Les **écritures** en ont besoin : jouer
une fois chacun des quatre fichiers de [`supabase/`](./supabase) dans l'éditeur
SQL du projet. Le back-office dit explicitement quelle table manque le cas
échéant.

Tout l'accès passe par le serveur avec la `service_role`, qui contourne le RLS.
Le navigateur ne voit jamais la base : il ne parle qu'aux routes `/api/…`. Les
tables ont donc le RLS activé **sans** politique publique.

---

## Pile technique

| | |
| --- | --- |
| Framework | Nuxt 4 (Vue 3.5, vue-router 5), TypeScript, SSR via Nitro |
| Bundler | Vite |
| État client | Pinia — un seul store (`app/stores/contact.ts`) |
| Style | Tailwind CSS 4 via `@tailwindcss/vite`, plus la charte portée telle quelle |
| Typographie | Schibsted Grotesk (titres), Mulish (corps), Newsreader italique (accents) |
| Images | `@nuxt/image` — AVIF/WebP, srcset jusqu'à 2880 px pour le Retina |
| Base | Supabase, côté serveur uniquement (`service_role`) |
| API | routes Nitro dans `server/api/` ; `/api/admin/*` sous mot de passe |
| E-mail | Nodemailer + SMTP Gmail |
| SEO | `@nuxtjs/sitemap`, `@nuxtjs/robots`, données structurées `NGO` |
| Hébergement | Vercel (preset `nuxtjs`), Analytics et Speed Insights hors `/admin` |
| Tests | Playwright (`npm test`), `vue-tsc` pour le typage |

### Organisation

```
app/
  assets/css/     main.css + la charte (tokens, base, site)
  components/     les sections du site, une par bloc de la maquette
  composables/    accès aux données, état du comparateur
  data/           contenu historique figé (monuments, frise, comparaisons)
  pages/          /, /actualites, pages légales, /admin/*
  stores/         formulaire de contact
  utils/          échantillonnage de courbe, données structurées
server/
  api/            routes publiques + /api/admin/* authentifiées
  utils/          Supabase, authentification, e-mail, accès au contenu
shared/           modèles et contenu partagés client + serveur
supabase/         le SQL à jouer une fois
scripts/          outils de vérification du portage
tests/e2e/        la suite Playwright
```

---

## Fidélité à la maquette

Les feuilles de la charte (`tokens.css`, `base.css`, `site.css`) sont reprises
**telles quelles** du bundle Claude Design, à une enveloppe `@layer design`
près. Une mise à jour de la maquette se recopie donc sans réécriture.

Cette enveloppe résout le conflit entre deux resets. L'ordre déclaré dans
`main.css` est :

```
theme → base (preflight Tailwind) → components → design (la charte) → utilities
```

La charte passe donc **après** le reset de Tailwind — les pages publiques
rendent exactement la maquette — mais **avant** les utilitaires, pour que le
back-office, écrit en Tailwind, puisse surcharger les styles d'éléments.

Deux reprises du preflight ont dû être défaites explicitement, parce que la
maquette avait été dessinée sans reset global : la position des `<sup>` (les
exposants de siècle montaient deux fois trop haut) et la marge des `<dl>` (le
programme horaire des événements se resserrait de 15 px). Elles sont commentées
dans `app/assets/css/main.css`.

### Vérifier

```bash
npm run dev
node scripts/verifier-geometrie.mjs   # compare la position et la taille de chaque élément
node scripts/comparer-maquette.mjs    # captures côte à côte dans .captures/
```

`verifier-geometrie.mjs` compare la position et la taille de chaque élément,
**section par section**, à 1440 px et à 430 px. Un diff d'images ne pourrait pas
trancher — les photos passent ici par AVIF redimensionné, donc leurs pixels
diffèrent forcément de ceux des JPEG de la maquette sans qu'aucune règle de mise
en page ait bougé.

Les coordonnées sont relevées par rapport à la section, pas au haut de la page :
sans cela, un seul écart volontaire décale tout ce qui suit et noie les vrais
écarts sous des centaines de faux positifs.

Les sections qui s'écartent volontairement de la maquette sont listées dans
`DIVERGENCES_ASSUMEES`, **avec leur raison**, en tête du script : c'est le seul
endroit où une divergence est admise. Aujourd'hui ce sont le format de date
unifié, le formulaire de contact ajouté à la page Actualités, et les deux liens
légaux du pied de page. Tout le reste doit correspondre au pixel.

---

## Déploiement

Vercel, preset `nuxtjs` (voir `vercel.json`). Poser dans *Settings →
Environment Variables* les clés de `.env.example` qui s'appliquent, au minimum
`ADMIN_PASSWORD` si le back-office doit servir.

L'image de partage `public/og-image.jpg` (1200 × 630) est un recadrage de
`public/img/pont-panorama.jpg` — région `150,90 2297×1206`, soit les arches et
leur reflet sans le ciel superflu. Pour la refaire à partir d'une autre photo,
c'est ce ratio de 1,905 qu'il faut viser : c'est celui qu'attendent Facebook,
WhatsApp, LinkedIn et X.

Domaine servi : **`www.passeurs-de-memoire-du-monastere.fr`**, l'apex redirigeant
vers lui. C'est la valeur par défaut du code, rien à poser. Si la redirection
devait être inversée un jour, poser `NUXT_PUBLIC_SITE_URL` sur l'hôte
réellement servi : la canonique, le sitemap, `robots.txt` et les balises Open
Graph doivent tous désigner celui-là, jamais celui qui redirige.

---

## À compléter avant la mise en ligne

- [ ] **Domaine** — confirmer l'hôte servi (apex ou `www`) et régler
      `NUXT_PUBLIC_SITE_URL` en conséquence.
- [ ] **Supabase** — créer le projet et jouer les quatre fichiers de `supabase/`.
- [ ] **Mot de passe d'application Gmail** — sans lui, le formulaire de contact
      ne peut ni envoyer ni archiver, et répond franchement qu'il n'est pas
      configuré plutôt que d'avaler les messages.
