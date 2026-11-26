# ToolShare – application web (React) + API

ToolShare met du matériel professionnel à disposition dans plusieurs magasins. Ce dépôt contient :

- `frontend/` : application React (Vite) avec trois espaces **Client**, **Manager** et **Administrateur** ;
- `backend/` : l'API REST Node.js/Express + MongoDB du Sprint 2 (complétée, voir « Compléments du backend ») ;
- `docker-compose.yml` : lance MongoDB, le backend et le frontend ensemble ;
- `.github/workflows/` : pipeline CI (ESLint, tests, build) et CD (publication des images sur Docker Hub).

## Fonctionnalités

| Espace | Ce que l'on peut faire |
|---|---|
| Client | consulter les magasins et leur matériel (recherche, filtre de disponibilité), réserver un créneau (vérification de disponibilité en direct, conflit 409 géré), voir ses réservations à venir / en cours / son historique, annuler |
| Manager | tableau de bord de **son** magasin, gérer le matériel (ajout, modification, retrait), enregistrer la **remise** puis le **retour** d'un matériel |
| Administrateur | gérer les magasins (création, modification, fermeture), les utilisateurs et managers (création, affectation à un magasin), superviser toutes les réservations (filtres statut / magasin) |

Premier lancement : si aucun administrateur n'existe, la page `/install` permet de créer le premier.

## Prérequis

- Node.js 20+ et npm
- Docker et Docker Compose (pour la méthode recommandée)
- MongoDB 6+ uniquement si vous lancez le backend sans Docker

## Lancer le projet avec Docker (recommandé)

```bash
cp .env.example .env            # puis remplacez JWT_SECRET par une longue valeur aléatoire (openssl rand -hex 32)
docker compose up --build
```

- Application : http://localhost:8080
- Documentation de l'API (Swagger) : http://localhost:3000/api-docs

Données de démonstration (optionnel, à lancer une fois les conteneurs démarrés) :

```bash
docker compose exec backend node scripts/seed.js
```

| Compte | Email | Mot de passe |
|---|---|---|
| Administrateur | `admin@toolshare.test` | `Password123!` |
| Manager (Safi) | `manager.safi@toolshare.test` | `Password123!` |
| Client | `client@toolshare.test` | `Password123!` |

Ces mots de passe sont réservés à la démonstration locale. `seed.js` **efface** les données existantes : ne l'utilisez jamais sur une vraie base.

### Fonctionnement de Docker

- **Deux images applicatives distinctes** :
  - `frontend/Dockerfile` : build multi-étapes. Node compile le site, puis **nginx** sert uniquement les fichiers statiques (aucun Node dans l'image finale).
  - `backend/Dockerfile` : Node 20 Alpine, dépendances de production seulement, exécution avec l'utilisateur non-root `node`.
- **nginx** sert aussi de proxy : il transmet `/api/*` au conteneur `backend`. Le navigateur ne parle qu'à une seule origine, donc pas de CORS à configurer, et l'URL de l'API (`/api`) est la même partout.
- **MongoDB** n'est pas exposé sur la machine hôte : seul le backend peut l'atteindre (réseau Compose). Les données sont conservées dans le volume `mongo-data`.
- Le backend attend que MongoDB soit « healthy » avant de démarrer (`depends_on` + `healthcheck`).
- `JWT_SECRET` est obligatoire : Compose refuse de démarrer s'il manque (aucun secret par défaut).

## Lancer sans Docker (développement)

```bash
# 1. MongoDB doit tourner sur localhost:27017

# 2. Backend
cd backend
cp .env.example .env            # puis changez JWT_SECRET
npm install
npm run seed                    # optionnel : données de démonstration
npm run dev                     # http://localhost:3000

# 3. Frontend (autre terminal)
cd frontend
cp .env.example .env            # optionnel
npm install
npm run dev                     # http://localhost:5173 (le proxy Vite transmet /api vers :3000)
```

## Variables d'environnement

| Fichier | Variable | Rôle |
|---|---|---|
| `.env` (racine) | `JWT_SECRET` | secret de signature des JWT (**obligatoire**, jamais committé) |
| `.env` (racine) | `FRONTEND_PORT`, `BACKEND_PORT` | ports publiés (8080 / 3000 par défaut) |
| `backend/.env` | `PORT`, `MONGO_URI`, `JWT_SECRET` | configuration du backend hors Docker |
| `frontend/.env` | `VITE_API_URL` | URL de l'API vue par le navigateur (`/api` par défaut) |
| `frontend/.env` | `VITE_PROXY_TARGET` | cible du proxy Vite en développement |

Toute variable préfixée `VITE_` est **intégrée au code JavaScript public** : ne jamais y mettre de secret.

## Tests

```bash
cd frontend && npm test        # 48 tests (Vitest + React Testing Library + MSW)
cd frontend && npm run lint    # ESLint
cd backend  && npm test        # tests unitaires + intégration (télécharge un binaire MongoDB la première fois)
cd backend  && npm run lint
```

Frontend : l'API est **simulée avec MSW** (Mock Service Worker). Chaque test crée son propre `QueryClient` et une base de
données factice remise à zéro : les tests sont reproductibles et n'ont besoin ni de réseau ni de backend. Ils couvrent,
avec des cas de réussite **et** d'échec : connexion / inscription (validation, 401, 409, erreur réseau), protection des routes
et des rôles (401, 403, 404, persistance de session), parcours client (filtres, réservation, conflit, historique,
annulation), parcours manager (remise, retour, statut refusé, ajout de matériel), parcours administrateur (magasins,
utilisateurs, supervision).

Le framework de test est **Vitest** (même API que Jest : `describe`, `it`, `expect`, `vi.fn`), choisi car il s'intègre
directement à Vite.

## Intégration continue et livraison continue (GitHub Actions)

| Workflow | Déclencheur | Rôle |
|---|---|---|
| `ci.yml` | pull request, push hors `main` | frontend : `npm ci` → **ESLint** → **tests** → **build** ; backend : ESLint → tests. Une étape en erreur fait échouer le workflow. |
| `cd.yml` | push sur `main` | rejoue d'abord `ci.yml`, puis, **seulement si tout est vert**, construit et publie les deux images Docker. |

Les images sont publiées dans **deux dépôts Docker Hub distincts**, chacun avec deux tags : `latest` et le **SHA du commit**.

- `<utilisateur>/toolshare-frontend:latest` et `:<sha>`
- `<utilisateur>/toolshare-backend:latest` et `:<sha>`

Configuration à faire une fois :

1. Sur Docker Hub, créer les dépôts `toolshare-frontend` et `toolshare-backend`, puis un *Access Token*.
2. Sur GitHub : *Settings → Secrets and variables → Actions → New repository secret* :
   `DOCKERHUB_USERNAME` et `DOCKERHUB_TOKEN`.
3. Pousser sur `main` : l'onglet *Actions* montre CI puis la publication.

> Le dossier racine de ce projet doit être la racine du dépôt GitHub (le dossier `.github/` doit s'y trouver).
> Les fonctionnalités optionnelles (Redux Toolkit, déploiement automatique sur Render) ne sont pas incluses.

## Architecture du frontend

```
frontend/src
├── api/          client.js (instance Axios + interceptors) · services.js (un module par ressource)
├── context/      AuthContext + AuthProvider (session : utilisateur, login, logout)
├── hooks/        useAuth · queries.js (tous les hooks React Query + clés de cache)
├── components/   ui/ (Button, Field, Modal, Feedback, StatusBadge…) · ProtectedRoute · ReservationForm · ReservationsTable
├── layouts/      AppLayout (espaces connectés) · AuthLayout (connexion / inscription)
├── pages/        auth/ · client/ · manager/ · admin/ · StatusPages (403 / 404)
├── utils/        validators · errors · format · session
└── test/         serveur MSW, utilitaires de rendu, tests d'intégration
```

- **Hooks** : `useState` (formulaires, filtres, onglets), `useEffect` (abonnement du handler 401, touche Échap des modales),
  `useContext` via `useAuth`, `useMemo` (filtrage du matériel, compteurs du manager, index matériel → nom, valeur du contexte),
  `useCallback` (actions du contexte), hooks personnalisés. Le **lifting state** est utilisé dans `StoreDetailPage` :
  la recherche et le filtre de disponibilité vivent dans le parent et pilotent la même liste.
- **React Query** : `useQuery` pour la lecture (états `isPending` / `isError` gérés par `QueryState`), `useMutation` pour
  les écritures, et **invalidation du cache** après chaque modification (ex. réserver invalide `['me']`, `['availability']`,
  `['manager','reservations']`…). Les erreurs 4xx ne sont jamais rejouées.
- **Axios** : une seule instance. L'intercepteur de requête ajoute le JWT ; celui de réponse normalise les erreurs
  (`ApiError`) et, sur un **401** en session ouverte, déconnecte l'utilisateur.
- **React Router** : routes publiques (`/login`, `/register`, `/install`), privées (`ProtectedRoute`), restreintes par rôle
  (`RoleRoute`), imbriquées (layout + `<Outlet />`), paramétrées (`/client/stores/:storeId`), redirections selon le rôle,
  pages 403 et 404. Les pages Manager et Admin sont chargées à la demande (`React.lazy`).

## Sécurité côté client

- **Pas d'exécution de HTML utilisateur** : tout contenu (noms de matériel, de magasin, de client…) est rendu comme du texte
  par React ; `dangerouslySetInnerHTML` n'est utilisé nulle part. nginx ajoute une Content-Security-Policy stricte.
- **401** : session expirée ou token invalide → déconnexion, vidage du cache, retour à `/login` avec un message.
  **403** : message « Accès refusé » (sans déconnexion) ; les routes réservées à un autre rôle mènent à `/forbidden`.
- **Aucun secret exposé** : le frontend ne contient que `VITE_API_URL` (public). `JWT_SECRET` n'existe que côté serveur.
- **Validation** des formulaires avant envoi (le backend valide à nouveau : le client n'est qu'un confort).
- **Limite connue** : le JWT est conservé dans `localStorage` (il survit au rafraîchissement). Un cookie `HttpOnly`
  serait plus robuste face au XSS mais demande de modifier le backend ; la CSP et l'absence de HTML injecté réduisent ce risque.
- Masquer une page selon le rôle n'est **pas** une protection : le backend contrôle aussi chaque rôle et chaque périmètre
  de magasin (un manager ne peut agir que sur son magasin).

## Compléments du backend

Le dépôt de départ ne contenait qu'une partie de l'API (installation, magasins, catalogue, réservations). Pour que
l'application fonctionne de bout en bout, les endpoints manquants ont été ajoutés dans des fichiers séparés, sans modifier
les endpoints existants (liste dans `backend/README.md`) : inscription / connexion, matériel (CRUD du manager),
remise / retour, liste des utilisateurs, supervision des réservations. Si votre version complète du Sprint 2 contient déjà
ces routes, adaptez `frontend/src/api/services.js` (c'est le seul fichier qui connaît les URL).

## Règles métier respectées par l'interface

- Début sur :00 ou :30, durée par pas de 30 min (max 168 h), début dans le futur (le backend vérifie en UTC).
- Conflit de créneau : alerte dès la sélection (endpoint `availability`) **et** gestion du 409 à la confirmation.
- Annulation : seulement pour une réservation confirmée qui n'a pas commencé.
- Remise : réservation confirmée uniquement ; retour : réservation en cours uniquement ; un manager n'agit que dans son magasin.























































npm install react-router






<Routers>
<Router path="/home" element={}></Roiter>
<Router path="/abute" element={}></Roiter>

</Routes>