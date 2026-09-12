-- ───────────────────────────────────────────────────────────────────────────
-- Messages du formulaire de contact.
--
-- L'envoi par e-mail reste le canal principal ; cette table en garde une copie,
-- pour qu'un message ne soit pas perdu si la boîte Gmail est encombrée, mal
-- filtrée, ou si quelqu'un supprime le courriel par erreur.
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.messages_contact (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  nom         text not null,
  email       text not null,
  sujet       text,
  message     text not null,
  user_agent  text
);

-- Lecture courante : les derniers messages arrivés.
create index if not exists messages_contact_created_at_idx
  on public.messages_contact (created_at desc);

-- Aucun accès anonyme. Les insertions passent par le serveur avec la
-- service-role key, qui contourne le RLS : aucune policy n'est nécessaire.
alter table public.messages_contact enable row level security;
