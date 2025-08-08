# Backend API - Gestion des Stocks de Laboratoires

## Description

API REST pour la gestion des stocks dans les laboratoires d'électrique des lycées. Cette API fournit toutes les fonctionnalités nécessaires pour gérer les utilisateurs, les établissements, les laboratoires, les articles, les mouvements de stock, les fournisseurs, les audits et les rapports.

## Technologies utilisées

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL** - Base de données relationnelle
- **JWT** - Authentification par tokens
- **bcryptjs** - Hachage des mots de passe
- **express-validator** - Validation des données

## Installation

### Prérequis

- Node.js (version 16 ou supérieure)
- PostgreSQL (version 12 ou supérieure)
- npm ou yarn

### Étapes d'installation

1. **Cloner le projet**
```bash
git clone <repository-url>
cd backend
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configuration de l'environnement**
```bash
cp .env .env
```

Modifier le fichier `.env` avec vos paramètres :
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lab_stock_management
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

4. **Créer la base de données**
```sql
CREATE DATABASE lab_stock_management;
```

5. **Exécuter les migrations**
```bash
npm run migrate
```

6. **Démarrer le serveur**
```bash
# Mode développement
npm run dev

# Mode production
npm start
```

## Structure du projet

```
backend/
├── src/
│   ├── database/
│   │   ├── connection.js      # Configuration de la base de données
│   │   ├── schema.sql         # Schéma de la base de données
│   │   ├── migrate.js         # Script de migration
│   │   └── seed.js           # Données de test
│   ├── middleware/
│   │   ├── auth.js           # Middleware d'authentification
│   │   ├── validation.js     # Validation des données
│   │   └── errorHandler.js   # Gestion des erreurs
│   ├── routes/
│   │   ├── auth.js           # Routes d'authentification
│   │   ├── users.js          # Routes utilisateurs
│   │   ├── lycees.js         # Routes lycées
│   │   ├── laboratories.js   # Routes laboratoires
│   │   ├── suppliers.js      # Routes fournisseurs
│   │   ├── articles.js       # Routes articles
│   │   ├── movements.js      # Routes mouvements
│   │   ├── supplyRequests.js # Routes demandes
│   │   ├── audits.js         # Routes audits
│   │   ├── reports.js        # Routes rapports
│   │   └── dashboard.js      # Routes dashboard
│   └── server.js             # Point d'entrée de l'application
├── package.json
├── .env.example
└── README.md
```

## API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion utilisateur
- `GET /api/auth/verify` - Vérification du token

### Utilisateurs
- `GET /api/users` - Liste des utilisateurs (admin)
- `GET /api/users/:id` - Détails d'un utilisateur
- `POST /api/users` - Créer un utilisateur (admin)
- `PUT /api/users/:id` - Modifier un utilisateur
- `DELETE /api/users/:id` - Supprimer un utilisateur (admin)
- `PATCH /api/users/:id/toggle-active` - Activer/désactiver (admin)

### Lycées
- `GET /api/lycees` - Liste des lycées
- `GET /api/lycees/:id` - Détails d'un lycée
- `POST /api/lycees` - Créer un lycée (admin)
- `PUT /api/lycees/:id` - Modifier un lycée (admin)
- `DELETE /api/lycees/:id` - Supprimer un lycée (admin)
- `GET /api/lycees/:id/laboratories` - Laboratoires d'un lycée

### Laboratoires
- `GET /api/laboratories` - Liste des laboratoires
- `GET /api/laboratories/:id` - Détails d'un laboratoire
- `POST /api/laboratories` - Créer un laboratoire (admin)
- `PUT /api/laboratories/:id` - Modifier un laboratoire (admin)
- `DELETE /api/laboratories/:id` - Supprimer un laboratoire (admin)

### Fournisseurs
- `GET /api/suppliers` - Liste des fournisseurs
- `GET /api/suppliers/:id` - Détails d'un fournisseur
- `POST /api/suppliers` - Créer un fournisseur
- `PUT /api/suppliers/:id` - Modifier un fournisseur
- `DELETE /api/suppliers/:id` - Supprimer un fournisseur

### Articles
- `GET /api/articles` - Liste des articles
- `GET /api/articles/:id` - Détails d'un article
- `POST /api/articles` - Créer un article
- `PUT /api/articles/:id` - Modifier un article
- `DELETE /api/articles/:id` - Supprimer un article
- `GET /api/articles/low-stock` - Articles en stock faible

### Mouvements de stock
- `GET /api/movements` - Liste des mouvements
- `GET /api/movements/:id` - Détails d'un mouvement
- `POST /api/movements` - Créer un mouvement
- `DELETE /api/movements/:id` - Supprimer un mouvement

### Demandes de réapprovisionnement
- `GET /api/supply-requests` - Liste des demandes
- `GET /api/supply-requests/:id` - Détails d'une demande
- `POST /api/supply-requests` - Créer une demande
- `PUT /api/supply-requests/:id` - Modifier une demande
- `DELETE /api/supply-requests/:id` - Supprimer une demande
- `PATCH /api/supply-requests/:id/status` - Changer le statut

### Audits
- `GET /api/audits` - Liste des audits
- `GET /api/audits/:id` - Détails d'un audit
- `POST /api/audits` - Créer un audit
- `PUT /api/audits/:id` - Modifier un audit
- `DELETE /api/audits/:id` - Supprimer un audit
- `POST /api/audits/:id/findings` - Ajouter des résultats

### Dashboard
- `GET /api/dashboard/stats` - Statistiques générales
- `GET /api/dashboard/charts` - Données pour graphiques
- `GET /api/dashboard/recent-activity` - Activité récente
- `GET /api/dashboard/alerts` - Alertes actives

### Rapports
- `GET /api/reports/inventory` - Rapport d'inventaire
- `GET /api/reports/movements` - Rapport des mouvements
- `GET /api/reports/supply-requests` - Rapport des demandes
- `GET /api/reports/audits` - Rapport des audits

## Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification. Après connexion, incluez le token dans l'en-tête Authorization :

```
Authorization: Bearer <your-jwt-token>
```

## Rôles et permissions

- **admin** : Accès complet à toutes les fonctionnalités
- **professor** : Gestion des stocks de ses laboratoires, demandes de réapprovisionnement
- **auditor** : Consultation, audits et inventaires

## Gestion des erreurs

L'API retourne des codes de statut HTTP appropriés :

- `200` - Succès
- `201` - Créé avec succès
- `400` - Erreur de validation
- `401` - Non authentifié
- `403` - Permissions insuffisantes
- `404` - Ressource non trouvée
- `409` - Conflit (ex: email déjà utilisé)
- `500` - Erreur interne du serveur

## Sécurité

- Hachage des mots de passe avec bcrypt
- Protection CORS configurée
- Limitation du taux de requêtes
- Validation stricte des données d'entrée
- Headers de sécurité avec Helmet
- Tokens JWT avec expiration

## Développement

### Scripts disponibles

```bash
npm run dev      # Démarrage en mode développement avec nodemon
npm start        # Démarrage en mode production
npm run migrate  # Exécution des migrations
npm run seed     # Insertion des données de test
```

### Variables d'environnement

Toutes les variables d'environnement sont documentées dans `.env.example`.

## Déploiement

1. Configurer les variables d'environnement de production
2. Exécuter les migrations sur la base de données de production
3. Démarrer l'application avec `npm start`

## Support

Pour toute question ou problème, veuillez consulter la documentation ou contacter l'équipe de développement.