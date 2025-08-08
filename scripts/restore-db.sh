#!/bin/bash

# Script de restauration de la base de données
set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    echo "Exemple: $0 ./backups/lab_stock_backup_20240122_143000.bak"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Fichier de sauvegarde non trouvé: $BACKUP_FILE"
    exit 1
fi

echo "🔄 Restauration de la base de données depuis: $BACKUP_FILE"

# Copier le fichier de sauvegarde dans le conteneur
docker cp "$BACKUP_FILE" lab_stock_db:/var/opt/mssql/backup/restore.bak

# Restaurer la base de données
docker exec lab_stock_db /opt/mssql-tools/bin/sqlcmd \
    -S localhost -U sa -P StrongPassword123! \
    -Q "RESTORE DATABASE lab_stock_management FROM DISK = '/var/opt/mssql/backup/restore.bak' WITH REPLACE"

echo "✅ Base de données restaurée avec succès"