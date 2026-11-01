-- ───────────────────────────────────────────────────────────────────────────
-- Photothèque : une ligne par image du site.
--
-- Les fichiers sont dans le bucket `phototheque` (créé plus bas) ; cette table
-- porte leur adresse, leurs dimensions, et ce qui se dit d'une image et peut
-- changer sans redéployer : titre, texte alternatif, crédit, mots-clés. Ces
-- légendes complètent celles écrites dans `shared/phototheque.ts` et l'emportent
-- sur elles à `src` égal — le même partage que pour les événements et les archives.
--
-- La table n'a d'abord porté que des légendes, pour des fichiers versionnés
-- dans `public/img/` ; le fonds d'origine a rejoint le bucket en novembre 2026.
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.phototheque (
  src         text primary key,     -- adresse publique complète de l'image
  updated_at  timestamptz not null default now(),

  titre       text,                 -- partie en gras de la légende
  alt         text,                 -- ce que montre l'image, pour qui ne la voit pas
  credit      text,                 -- « Photo de l'association », éditeur, imprimeur…
  mots_cles   text[] not null default '{}'   -- pour la recherche du back-office
);

-- Les lignes sont écrites par le serveur avec la service role key, jamais
-- depuis le navigateur : aucune politique publique n'est ouverte.
alter table public.phototheque enable row level security;

-- ───────────────────────────────────────────────────────────────────────────
-- Les fichiers : bucket public, et ce qu'on sait de chacun.
--
-- `depose` vaut vrai pour toute image du bucket ; `chemin` est sa place dans le
-- bucket (`historique/…` pour le fonds d'origine, `<année>/…` pour un dépôt).
-- À rejouer sans risque : tout est `if not exists`.
-- ───────────────────────────────────────────────────────────────────────────

alter table public.phototheque add column if not exists depose  boolean not null default false;
alter table public.phototheque add column if not exists chemin  text;     -- chemin dans le bucket
alter table public.phototheque add column if not exists largeur integer;
alter table public.phototheque add column if not exists hauteur integer;
alter table public.phototheque add column if not exists octets  integer;

-- Lecture publique du bucket (les photos s'affichent sur le site) ; l'écriture
-- ne passe que par le serveur, avec la service-role key.
insert into storage.buckets (id, name, public)
values ('phototheque', 'phototheque', true)
on conflict (id) do nothing;
