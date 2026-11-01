# Base Supabase — Les Passeurs de Mémoire du Monastère

Cinq fichiers, à jouer **une fois chacun** dans l'éditeur SQL du projet
Supabase (*SQL Editor → New query → coller → Run*), dans cet ordre :

1. `contact.sql` — archivage des messages du formulaire de contact
2. `evenements.sql` — les rendez-vous et leurs souvenirs
3. `archives.sql` — le fonds de cartes postales et photographies
4. `phototheque.sql` — les images du site (bucket et table)
5. `reglages.sql` — les quelques valeurs éditables (lien HelloAsso)

## Les images : toutes dans le bucket `phototheque`

Toutes les images du site sont dans le bucket public `phototheque` (créé par
`phototheque.sql`) : le fonds d'origine sous `historique/`, les photos déposées
depuis `/admin/phototheque` sous leur année. La table du même nom porte une
ligne par fichier — adresse, dimensions — et la légende retouchée au
back-office.

**Ce bucket n'a pas de copie ailleurs.** Avant de fermer le projet ou de vider
le bucket, télécharger son contenu : le site affiche ces adresses telles
quelles, et l'historique git ne garde que le fonds d'origine.

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
