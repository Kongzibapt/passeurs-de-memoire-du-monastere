-- ───────────────────────────────────────────────────────────────────────────
-- Événements : les rendez-vous à venir et les souvenirs de ceux qui ont eu lieu.
--
-- Le site fusionne ces lignes avec les événements définis dans le code
-- (shared/evenements.ts). À `slug` égal, la ligne de la base l'emporte :
-- modifier un événement fondateur depuis le back-office revient donc à créer
-- ici une ligne de même slug, sans toucher aux sources ni redéployer.
--
-- Il n'y a pas de colonne « publié » : c'est la DATE qui décide. Un événement
-- s'annonce tant qu'elle n'est pas passée, puis bascule dans « C'était chez
-- nous » s'il porte un souvenir. Rien à basculer à la main, donc rien à oublier.
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.evenements (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  slug          text not null unique,
  date          date not null,

  -- Deux graphies de la même date : compacte sur l'accueil (« 20 sept. 2026 »),
  -- longue sur la page Actualités (« Samedi 21 novembre 2026 »). Ce sont des
  -- textes libres parce que l'association les écrit comme elle les dit.
  date_courte   text,
  date_longue   text,

  cadre         text,           -- surtitre : lieu, ou cadre national de l'événement
  titre         text not null,
  titre_accueil text,           -- version raccourcie pour la liste de l'accueil
  resume        text,           -- texte de l'accueil
  description   text,           -- texte de la page Actualités

  -- Programme horaire : [{ "heure": "14h30", "quoi": "Conférence" }, …]
  programme     jsonb not null default '[]'::jsonb,

  -- Bouton de l'événement : { "label": …, "href": …, "variant": "primary"|"secondary" }
  -- `href` accepte deux raccourcis résolus à l'affichage : « adhesion » (lien
  -- HelloAsso courant) et « mailto:?sujet=… ».
  cta           jsonb,

  -- Bloc souvenir : { "recit": …, "question": …, "photos": [...], "cta": {...} }
  -- Nul tant que l'événement n'a pas eu lieu.
  souvenir      jsonb
);

-- Le tri à venir / passé se fait toujours sur la date.
create index if not exists evenements_date_idx on public.evenements (date desc);

-- `updated_at` doit refléter la dernière modification, pas la dernière fois que
-- quelqu'un a pensé à la saisir.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists evenements_touch on public.evenements;
create trigger evenements_touch
  before update on public.evenements
  for each row execute function public.touch_updated_at();

alter table public.evenements enable row level security;
