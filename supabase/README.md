# Base Supabase — Les Passeurs de Mémoire du Monastère

Quatre fichiers, à jouer **une fois chacun** dans l'éditeur SQL du projet
Supabase (*SQL Editor → New query → coller → Run*), dans cet ordre :

1. `contact.sql` — archivage des messages du formulaire de contact
2. `evenements.sql` — les rendez-vous et leurs souvenirs
3. `archives.sql` — le fonds de cartes postales et photographies
4. `reglages.sql` — les quelques valeurs éditables (lien HelloAsso)

## Pourquoi aucune table n'a de politique publique

Tout l'accès à la base passe par le serveur Nitro, avec la *service-role key*
— qui contourne le RLS. Le navigateur ne voit jamais cette clé, ni la base :
il ne parle qu'aux routes `/api/…`. Le RLS est donc activé **sans** politique
publique, ce qui verrouille la table pour tout ce qui n'est pas le serveur.

## Le site marche sans la base

Chaque lecture retombe sur le contenu défini dans le code (`shared/*.ts`) quand
Supabase n'est pas configuré ou qu'une table manque. Les **écritures**, elles,
ont besoin de la base : c'est le seul moment où un fichier oublié se fait
sentir, et le back-office le dit alors explicitement.
