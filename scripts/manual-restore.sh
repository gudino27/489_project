#!/bin/bash

# Manual restore script
if [ -z "$1" ]; then
    echo "Usage: $0 <backup_directory>"
    echo "Available backups:"
    ls -la ./manual-backups/ 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_PATH="./manual-backups/$1"
if [ ! -d "$BACKUP_PATH" ]; then
    echo "Backup directory not found: $BACKUP_PATH"
    exit 1
fi

echo "Restoring from: $BACKUP_PATH"

# Stop containers
docker-compose down

# Remove old data
sudo rm -rf ./data

# Restore data directory if it exists in backup
if [ -d "$BACKUP_PATH/data" ]; then
    echo "Restoring data directory..."
    cp -r "$BACKUP_PATH/data" ./
    sudo chown -R 1000:1000 ./data
    chmod -R 755 ./data
fi

# Start containers
docker-compose up -d

# Wait for backend
sleep 10

# Restore from container backups if they exist
if [ -f "$BACKUP_PATH/container-database.tar.gz" ]; then
    echo "Restoring database from container backup..."
    docker cp "$BACKUP_PATH/container-database.tar.gz" cabinet-photo-backend:/tmp/
    docker exec cabinet-photo-backend sh -c "cd /app && tar xzf /tmp/container-database.tar.gz"
fi

if [ -f "$BACKUP_PATH/container-uploads.tar.gz" ]; then
    echo "Restoring uploads from container backup..."
    docker cp "$BACKUP_PATH/container-uploads.tar.gz" cabinet-photo-backend:/tmp/
    docker exec cabinet-photo-backend sh -c "cd /app && tar xzf /tmp/container-uploads.tar.gz"
fi

# Restart to pick up changes
docker-compose restart backend

echo "Restore completed"