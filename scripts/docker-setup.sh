#!/bin/bash

# Script de configuration Docker pour GestiLab
set -e

echo "🐳 Configuration Docker pour GestiLab"
echo "======================================"

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

echo "✅ Docker et Docker Compose sont installés"

# Créer les répertoires nécessaires
mkdir -p nginx/ssl
mkdir -p logs

# Rendre les scripts exécutables
chmod +x backend/docker-entrypoint.sh
chmod +x scripts/*.sh

echo "📁 Répertoires créés et permissions définies"

# Fonction pour démarrer en mode développement
start_dev() {
    echo "🔧 Démarrage en mode développement..."
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml up --build -d
    
    echo "⏳ Attente du démarrage des services..."
    sleep 10
    
    echo "🌐 Services disponibles:"
    echo "  - Frontend: http://localhost:5173"
    echo "  - Backend API: http://localhost:3001"
    echo "  - Base de données: localhost:1433"
    
    echo "📊 Pour voir les logs:"
    echo "  docker-compose -f docker-compose.dev.yml logs -f"
}

# Fonction pour démarrer en mode production
start_prod() {
    echo "🚀 Démarrage en mode production..."
    docker-compose down
    docker-compose up --build -d
    
    echo "⏳ Attente du démarrage des services..."
    sleep 15
    
    echo "🌐 Services disponibles:"
    echo "  - Application: http://localhost:80"
    echo "  - API directe: http://localhost:3001"
    
    echo "📊 Pour voir les logs:"
    echo "  docker-compose logs -f"
}

# Fonction pour arrêter les services
stop_services() {
    echo "🛑 Arrêt des services..."
    docker-compose -f docker-compose.dev.yml down
    docker-compose down
    echo "✅ Services arrêtés"
}

# Fonction pour nettoyer
cleanup() {
    echo "🧹 Nettoyage des conteneurs et volumes..."
    docker-compose -f docker-compose.dev.yml down -v
    docker-compose down -v
    docker system prune -f
    echo "✅ Nettoyage terminé"
}

# Fonction pour voir les logs
show_logs() {
    echo "📊 Logs des services (Ctrl+C pour quitter):"
    if [ -f docker-compose.dev.yml ] && docker-compose -f docker-compose.dev.yml ps | grep -q "Up"; then
        docker-compose -f docker-compose.dev.yml logs -f
    else
        docker-compose logs -f
    fi
}

# Fonction pour afficher le statut
show_status() {
    echo "📈 Statut des services:"
    echo ""
    echo "Mode développement:"
    docker-compose -f docker-compose.dev.yml ps
    echo ""
    echo "Mode production:"
    docker-compose ps
}

# Menu principal
case "${1:-help}" in
    "dev")
        start_dev
        ;;
    "prod")
        start_prod
        ;;
    "stop")
        stop_services
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "cleanup")
        cleanup
        ;;
    "help"|*)
        echo "Usage: $0 {dev|prod|stop|logs|status|cleanup}"
        echo ""
        echo "Commandes disponibles:"
        echo "  dev      - Démarrer en mode développement avec hot reload"
        echo "  prod     - Démarrer en mode production"
        echo "  stop     - Arrêter tous les services"
        echo "  logs     - Afficher les logs en temps réel"
        echo "  status   - Afficher le statut des services"
        echo "  cleanup  - Nettoyer les conteneurs et volumes"
        echo ""
        echo "Exemples:"
        echo "  ./scripts/docker-setup.sh dev    # Développement"
        echo "  ./scripts/docker-setup.sh prod   # Production"
        echo "  ./scripts/docker-setup.sh logs   # Voir les logs"
        ;;
esac