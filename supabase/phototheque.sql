-- ───────────────────────────────────────────────────────────────────────────
-- Photothèque : les légendes des images de `public/img/`.
--
-- Les FICHIERS ne sont pas ici. Ils sont versionnés avec le site, et leur
-- inventaire est dressé à la construction (shared/phototheque-fichiers.ts) :
-- une image du dépôt ne peut pas disparaître parce qu'un compte de stockage a
-- été fermé, et son ajout se voit dans un commit.
--
-- Cette table ne porte que ce qui se dit d'une image et qui peut changer sans
-- redéployer : son titre, son texte alternatif, son crédit, ses mots-clés. Elle
-- complète les légendes écrites dans `shared/phototheque.ts` et l'emporte sur
-- elles à `src` égal — le même partage que pour les événements et les archives.
--
-- Une ligne dont le `src` ne correspond plus à aucun fichier est simplement
-- ignorée à la lecture : retirer une image du dépôt ne casse rien.
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.phototheque (
  src         text primary key,     -- chemin depuis la racine du site : /img/…
  updated_at  timestamptz not null default now(),

  titre       text,                 -- partie en gras de la légende
  alt         text,                 -- ce que montre l'image, pour qui ne la voit pas
  credit      text,                 -- « Photo de l'association », éditeur, imprimeur…
  mots_cles   text[] not null default '{}'   -- pour la recherche du back-office
);

-- Les lignes sont écrites par le serveur avec la service role key, jamais
-- depuis le navigateur : aucune politique publique n'est ouverte.
alter table public.phototheque enable row level security;
