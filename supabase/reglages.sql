-- ───────────────────────────────────────────────────────────────────────────
-- Réglages du site : les quelques valeurs éditables depuis le back-office.
--
-- Table clé/valeur volontairement minuscule. Le serveur n'en lit QUE les clés
-- d'une liste blanche (server/utils/reglages.ts) : une table de configuration
-- sans garde-fou finit toujours par publier quelque chose qu'on n'avait pas
-- prévu d'exposer.
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.reglages (
  cle         text primary key,
  valeur      text not null,
  updated_at  timestamptz not null default now()
);

-- Lien HelloAsso de la campagne en cours. Il change chaque année : c'est
-- précisément ce que ce réglage évite de redéployer.
insert into public.reglages (cle, valeur)
values (
  'url_adhesion',
  'https://www.helloasso.com/associations/les-passeurs-de-memoire-du-monastere/adhesions/adhesion-2026'
)
on conflict (cle) do nothing;

alter table public.reglages enable row level security;
