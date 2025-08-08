#!/bin/bash

# Script de sauvegarde de la base de données
set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="lab_stock_backup_${TIMESTAMP}.bak"

echo "💾 Sauvegarde de la base de données..."

# Créer le répertoire de sauvegarde
mkdir -p $BACKUP_DIR

# Exécuter la sauvegarde via Docker
docker exec lab_stock_db /opt/mssql-tools/bin/sqlcmd \
    -S localhost -U sa -P StrongPassword123! \
    -Q "BACKUP DATABASE lab_stock_management TO DISK = '/var/opt/mssql/backup/${BACKUP_FILE}'"

# Copier la sauvegarde vers l'hôte
docker cp lab_stock_db:/var/opt/mssql/backup/${BACKUP_FILE} ${BACKUP_DIR}/

echo "✅ Sauvegarde créée: ${BACKUP_DIR}/${BACKUP_FILE}"

# Nettoyer les sauvegardes anciennes (garder les 7 dernières)
find $BACKUP_DIR -name "lab_stock_backup_*.bak" -type f -mtime +7 -delete

echo "🧹 Anciennes sauvegardes nettoyées"