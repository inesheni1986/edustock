# GestiLab - Système de Gestion des Stocks pour Laboratoires

Application web complète pour la gestion des stocks dans les laboratoires d'électrique des lycées techniques et professionnels.

## 🚀 Démarrage Rapide avec Docker

### Prérequis

- [Docker](https://docs.docker.com/get-docker/) (version 20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0+)

### Installation et Démarrage

1. **Cloner le projet**
```bash
git clone <repository-url>
cd gestilab
```

2. **Démarrer en mode développement**
```bash
./scripts/docker-setup.sh dev
```

3. **Accéder à l'application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Base de données: localhost:1433

### Comptes de Démonstration

- **Administrateur**: admin@lycee.fr / password123
- **Professeur**: prof@lycee.fr / password123  
- **Auditeur**: auditeur@lycee.fr / password123

## 📋 Commandes Docker

```bash
# Mode développement (avec hot reload)
./scripts/docker-setup.sh dev

# Mode production
./scripts/docker-setup.sh prod

# Voir les logs en temps réel
./scripts/docker-setup.sh logs

# Statut des services
./scripts/docker-setup.sh status

# Arrêter tous les services
./scripts/docker-setup.sh stop

# Nettoyage complet
./scripts/docker-setup.sh cleanup
```

## 🏗️ Architecture Docker

### Services

- **database**: SQL Server 2022 Express
- **backend**: API Node.js/Express
- **frontend**: Application React avec Nginx
- **nginx**: Reverse proxy (mode production)

### Volumes

- `db_data`: Données persistantes de la base de données
- `backend_node_modules`: Modules Node.js du backend
- `frontend_node_modules`: Modules Node.js du frontend

### Réseaux

- `lab_stock_network`: Réseau interne pour la communication entre services

## 🔧 Configuration

### Variables d'Environnement

#### Backend (.env.docker)
```env
NODE_ENV=production
PORT=3001
DB_SERVER=database
DB_NAME=lab_stock_management
DB_USER=sa
DB_PASSWORD=StrongPassword123!
JWT_SECRET=your_super_secret_jwt_key
```

#### Frontend (.env.docker)
```env
VITE_API_URL=http://localhost:3001/api
```

### Personnalisation

1. **Modifier les mots de passe** dans `docker-compose.yml`
2. **Configurer SSL** dans `nginx/ssl/` pour la production
3. **Ajuster les ressources** selon vos besoins

## 💾 Sauvegarde et Restauration

### Sauvegarde Automatique
```bash
./scripts/backup-db.sh
```

### Restauration
```bash
./scripts/restore-db.sh ./backups/lab_stock_backup_YYYYMMDD_HHMMSS.bak
```

## 🔍 Monitoring et Logs

### Voir les logs d'un service spécifique
```bash
# Backend
docker-compose logs -f backend

# Frontend  
docker-compose logs -f frontend

# Base de données
docker-compose logs -f database
```

### Accéder aux conteneurs
```bash
# Backend
docker exec -it lab_stock_backend_dev bash

# Base de données
docker exec -it lab_stock_db_dev bash
```

## 🛠️ Développement

### Structure des Conteneurs

```
├── backend/
│   ├── Dockerfile              # Production
│   ├── Dockerfile.dev          # Développement
│   └── docker-entrypoint.sh    # Script d'initialisation
├── nginx/
│   ├── nginx.conf              # Configuration reverse proxy
│   └── frontend.conf           # Configuration frontend
├── scripts/
│   ├── docker-setup.sh         # Script principal
│   ├── backup-db.sh           # Sauvegarde
│   └── restore-db.sh          # Restauration
├── docker-compose.yml          # Production
└── docker-compose.dev.yml     # Développement
```

### Hot Reload

En mode développement, les modifications du code sont automatiquement détectées:
- **Frontend**: Rechargement automatique via Vite
- **Backend**: Rechargement automatique via Nodemon

### Debugging

1. **Logs en temps réel**
```bash
./scripts/docker-setup.sh logs
```

2. **Accès aux conteneurs**
```bash
docker exec -it lab_stock_backend_dev sh
```

3. **Inspection de la base de données**
```bash
docker exec -it lab_stock_db_dev /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P StrongPassword123!
```

## 🚀 Déploiement en Production

### Préparation

1. **Modifier les mots de passe** dans `docker-compose.yml`
2. **Configurer SSL** si nécessaire
3. **Ajuster les variables d'environnement**

### Démarrage
```bash
./scripts/docker-setup.sh prod
```

### Monitoring
```bash
# Statut des services
docker-compose ps

# Utilisation des ressources
docker stats

# Logs
docker-compose logs -f
```

## 🔒 Sécurité

### Recommandations de Production

1. **Changer tous les mots de passe par défaut**
2. **Utiliser des secrets Docker** pour les données sensibles
3. **Configurer SSL/TLS** avec des certificats valides
4. **Limiter l'accès réseau** avec des firewalls
5. **Mettre en place des sauvegardes automatiques**
6. **Surveiller les logs** pour détecter les intrusions

### Secrets Docker (Recommandé pour la production)

```yaml
# Exemple dans docker-compose.yml
secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt

services:
  backend:
    secrets:
      - db_password
      - jwt_secret
```

## 📊 Performance

### Optimisations Incluses

- **Nginx** avec compression gzip
- **Cache** pour les assets statiques
- **Health checks** pour tous les services
- **Restart policies** pour la haute disponibilité
- **Connection pooling** pour la base de données

### Monitoring des Ressources

```bash
# Utilisation CPU/Mémoire
docker stats

# Espace disque des volumes
docker system df

# Logs de performance
docker-compose logs database | grep -i performance
```

## 🆘 Dépannage

### Problèmes Courants

1. **Port déjà utilisé**
```bash
# Vérifier les ports utilisés
netstat -tulpn | grep :3001
# Modifier les ports dans docker-compose.yml si nécessaire
```

2. **Base de données non accessible**
```bash
# Vérifier le statut
docker-compose ps database
# Voir les logs
docker-compose logs database
```

3. **Problèmes de permissions**
```bash
# Reconstruire les images
docker-compose build --no-cache
```

### Commandes Utiles

```bash
# Redémarrer un service
docker-compose restart backend

# Reconstruire un service
docker-compose up --build backend

# Nettoyer complètement
docker system prune -a --volumes
```

## 📝 Notes de Version

### v1.0.0
- Configuration Docker complète
- Support développement et production
- Scripts d'automatisation
- Sauvegarde/restauration automatisée
- Monitoring et health checks

---

Pour plus d'informations, consultez la documentation dans le dossier `backend/README.md`.