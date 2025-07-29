#!/bin/bash

# Manual backup script that actually works
echo "Creating manual backup..."

# Create backup directory with timestamp
BACKUP_DIR="./manual-backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Stop containers to get consistent backup
echo "Stopping containers for backup..."
docker-compose down

# Copy database directly from container data
if [ -d "./data" ]; then
    echo "Backing up data directory..."
    cp -r ./data "$BACKUP_DIR/"
fi

# Also backup from container volumes if they exist
echo "Checking for database in container..."
if docker-compose up -d backend; then
    sleep 5
    # Copy database file from container
    docker exec cabinet-photo-backend tar czf /tmp/db-backup.tar.gz -C /app database/ || true
    docker cp cabinet-photo-backend:/tmp/db-backup.tar.gz "$BACKUP_DIR/container-database.tar.gz" || true
    
    # Copy uploads from container
    docker exec cabinet-photo-backend tar czf /tmp/uploads-backup.tar.gz -C /app uploads/ || true
    docker cp cabinet-photo-backend:/tmp/uploads-backup.tar.gz "$BACKUP_DIR/container-uploads.tar.gz" || true
    
    docker-compose down
fi

echo "Backup completed at: $BACKUP_DIR"
ls -la "$BACKUP_DIR"