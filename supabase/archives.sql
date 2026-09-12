-- ───────────────────────────────────────────────────────────────────────────
-- Fonds d'archives : cartes postales, vues du bourg, photographies de famille.
--
-- Les six documents de la maquette vivent dans le code et restent toujours
-- affichés. Cette table les complète — « un fonds qui s'enrichit à chaque boîte
-- retrouvée dans un grenier ».
--
-- Les fichiers images, eux, ne sont PAS stockés ici : ils sont versionnés dans
-- `public/img/` avec le site. Un document d'archives est un objet qu'on
-- conserve, et le lier au dépôt le met à l'abri d'un compte de stockage fermé.
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.archives (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),

  src         text not null,        -- chemin depuis la racine du site : /img/…
  alt         text,                 -- ce que montre l'image, pour qui ne la voit pas
  titre       text not null,        -- partie en gras de la légende
  legende     text,                 -- suite : éditeur, imprimeur, provenance
  ordre       integer not null default 0
);

create index if not exists archives_ordre_idx on public.archives (ordre);

alter table public.archives enable row level security;
