#!/bin/bash
set -e

echo "🚀 Démarrage du backend..."

# Attendre que la base de données soit prête
echo "⏳ Attente de la base de données..."
node wait-for-db.js

# Exécuter les migrations
echo "📊 Exécution des migrations..."
npm run migrate

# Insérer les données de test en développement
if [ "$NODE_ENV" != "production" ]; then
  echo "🌱 Insertion des données de test..."
  npm run seed
fi

# Démarrer l'application
echo "✅ Démarrage de l'application..."
exec "$@"