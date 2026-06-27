# ibirdui — Roadmap des composants

> En clair : `ibirdui` est une boîte de **briques d'interface** (boutons, listes,
> tableaux…) que tu copies dans ton projet. La particularité : chaque brique sait
> déjà gérer les moments "réels" d'une appli — _ça charge_, _il n'y a rien_, _ça a
> planté_, _c'est prêt_ — et reste utilisable par tout le monde (clavier, lecteurs
> d'écran). Ce document liste les briques à construire.

**Le "feu tricolore" de chaque brique** (`AsyncState`) : `chargement` →
`vide` → `erreur` → `prêt`. Tu décris seulement le cas "prêt" ; le reste est
fourni.

Légende : ✅ fait · 🔜 prochain · ⬜ à venir

---

## Couche 0 — Fondation (les outils invisibles qui font marcher le reste)

| Brique | En clair | Statut |
| --- | --- | --- |
| `async-state` | Le "feu tricolore" commun : dit si les données chargent, manquent, ont planté, ou sont prêtes. | ✅ |
| `theme` | La palette de couleurs et les règles de style, pour que toutes les briques aient un air de famille. | ✅ |
| `use-async` | Un assistant qui transforme "va chercher ces données" en états du feu tricolore, automatiquement. | ✅ |
| `use-optimistic-list` | Met l'écran à jour tout de suite quand on ajoute/supprime, puis corrige si le serveur refuse. | ✅ |
| `use-online` | Sait quand l'utilisateur perd internet, pour que les briques réagissent. | ✅ |
| `skeleton` | Les rectangles gris qui "clignotent" pendant que le vrai contenu arrive. | ✅ |

## Couche 1 — Les briques d'état (ce qui rend ibirdui différent)

| Brique | En clair | Statut |
| --- | --- | --- |
| `state-boundary` | Affiche la bonne chose selon le feu tricolore (spinner, "rien ici", erreur + réessayer, ou le contenu). | ✅ |
| `empty-state` | Un panneau sympa "il n'y a rien pour l'instant", avec un bouton pour agir. | ✅ |
| `error-state` | Un panneau clair "quelque chose a planté" avec un bouton _Réessayer_. | ✅ |
| `async-button` | Un bouton qui se sait occupé : il montre un spinner, bloque les double-clics, et dit si ça a marché. | ✅ |

## Couche 2 — Affichage de données (montrer des contenus)

| Brique | En clair | Statut |
| --- | --- | --- |
| `data-list` | Une liste simple qui gère chargement/vide/erreur ; tu ne décris qu'une ligne. | ✅ |
| `data-table` | Un tableau type tableur, avec colonnes triables, qui gère aussi tous les états. | ✅ |
| `card-collection` | Une grille de cartes (comme une galerie) avec les mêmes états intégrés. | ✅ |
| `detail-view` | Une page qui montre le détail d'un seul élément (gère "ça charge" et "introuvable"). | ✅ |
| `avatar` | Une photo de profil qui affiche les initiales si l'image ne charge pas. | ✅ |

## Couche 3 — Champs qui vont chercher des données

| Brique | En clair | Statut |
| --- | --- | --- |
| `async-combobox` | Un menu déroulant "recherche en tapant" qui va chercher les options sur le serveur. | ✅ |
| `command-palette` | La barre de recherche Cmd+K (comme dans Slack/VSCode) pour aller partout vite. | ✅ |
| `file-upload` | Un dépôt de fichiers glisser-déposer qui montre la progression, avec réessai si un fichier échoue. | ✅ |

## Couche 4 — Retours & fenêtres superposées

| Brique | En clair | Statut |
| --- | --- | --- |
| `toast` | Les petites bulles de message dans un coin ; peut afficher "enregistrement… / enregistré !" tout seul. | ✅ |
| `confirm-dialog` | Le pop-up "Êtes-vous sûr ?" qui attend pendant l'action et montre l'erreur dedans si ça rate. | ✅ |
| `sheet` / `drawer` | Un panneau qui glisse depuis le côté de l'écran. | ✅ |

## Couche 5 — Navigation (se déplacer dans les contenus)

| Brique | En clair | Statut |
| --- | --- | --- |
| `pagination` / `load-more` | Des boutons pour charger la page suivante ou "voir plus" de résultats. | ✅ |
| `infinite-list` | Une liste qui charge la suite automatiquement quand on descend. | ✅ |
| `tabs` | Des onglets qui ne chargent leur contenu qu'à l'ouverture. | ✅ |

## Couche 6 — Formulaires (saisir et envoyer des données)

> Le plus gros manque actuel : aucune brique de saisie. C'est pourtant là que
> l'async brille le plus (validation serveur, envoi occupé, erreur replacée sur
> le bon champ).

| Brique | En clair | Statut |
| --- | --- | --- |
| `use-form` | Le "feu tricolore" d'un formulaire : il suit les valeurs, les erreurs, et l'envoi en cours / raté. | ✅ |
| `field` | Un champ complet : libellé, saisie, message d'erreur et aide, déjà reliés pour le clavier et les lecteurs d'écran. | ✅ |
| `async-form` | Quand le serveur refuse, il replace l'erreur sur le bon champ, garde le focus et l'annonce. | ✅ |
| `async-validator` | Vérifie à la frappe contre le serveur ("ce pseudo est déjà pris"), avec attente et erreur. | ✅ |
| `multi-select` | Un menu pour choisir plusieurs options, avec les mêmes états intégrés. | ✅ |
| `tag-input` | Un champ où on ajoute des étiquettes (mots-clés) une par une. | ✅ |
| `date-picker` | Un calendrier pour choisir une date, accessible au clavier. | ✅ |

## Couche 7 — Temps réel & optimiste (les données qui bougent toutes seules)

| Brique | En clair | Statut |
| --- | --- | --- |
| `use-stream` | Reçoit des données en continu (flux serveur / WebSocket) et les transforme en états du feu tricolore. | ✅ |
| `streaming-list` | Une liste qui se remplit en direct à mesure que les données arrivent. | ✅ |
| `presence` | Montre qui est en ligne en ce moment. | ✅ |
| `offline-banner` | Un bandeau "tu es hors ligne" qui apparaît tout seul (donne enfin un usage à `use-online`). | ✅ |
| `optimistic-toggle` | Un bouton like/favori qui change tout de suite, puis se corrige si le serveur refuse (vitrine de `use-optimistic-list`). | ✅ |

## Idées à explorer (non encore planifiées)

- **Overlays & menus :** `dropdown-menu` (motif ARIA menu), `popover`, `tooltip`, `accordion` (panneaux chargés à l'ouverture, comme `tabs`), `stepper` / `wizard` (étapes à validation async), `progress` autonome.
- **Petits hooks (Couche 0) :** `use-debounce`, `use-intersection` (à extraire d'`infinite-list`), `use-clipboard` (état "copié !"), `use-media-query`, `use-poll`.
- **DX / IA :** un **serveur MCP** exposant le registry aux assistants, `ibirdui doctor` / `ibirdui upgrade` (diff via les hashes déjà calculés au build), un playground dark-mode dans le site.

---

## Ordre de construction

1. **`theme`** — d'abord, car les briques actuelles supposent déjà ses couleurs.
2. **`use-async`** — pour rendre la démo et les briques réalistes.
3. **`async-button`** — petit mais frappant : montre l'état "occupé".
4. **`data-table`** — la vitrine n°2 après `data-list`.
5. **`async-combobox`** → **`toast`** → **`confirm-dialog`** — le trio "appli réelle".
6. Le reste au fil de l'eau.

Chaque brique livrée embarque un **test d'accessibilité** (axe) et une **fiche
lisible par l'IA** (pour `ibirdui gen`).

**Prochaines priorités :** Couches 6 (Formulaires) et 7 (Temps réel) ✅
livrées — la roadmap initiale est complète. Ensuite, piocher dans les
**Idées à explorer** ci-dessus : overlays & menus (`dropdown-menu`, `popover`,
`tooltip`, `accordion`), petits hooks de Couche 0, et le côté DX/IA (serveur MCP,
`ibirdui doctor` / `upgrade`).

**Total : 36 briques livrées 🎉 · roadmap initiale (Couches 0→7) complète.**
