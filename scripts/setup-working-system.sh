#!/bin/bash

# Script to get a working system from scratch
echo "Setting up working system from scratch..."

# Stop everything
docker-compose down --volumes --remove-orphans

# Clean slate
sudo rm -rf ./data

# Start containers
docker-compose up -d

# Wait for containers to be ready
echo "Waiting for containers to start..."
sleep 15

# Initialize database manually in container
echo "Initializing database..."
docker exec cabinet-photo-backend node init-database.js

# Verify database works
echo "Testing database..."
if docker exec cabinet-photo-backend sqlite3 /app/database/cabinet_photos.db ".tables" | grep -q photos; then
    echo "✅ Database initialized successfully!"
    echo "Tables created:"
    docker exec cabinet-photo-backend sqlite3 /app/database/cabinet_photos.db ".tables"
else
    echo "❌ Database initialization failed"
    echo "Container logs:"
    docker-compose logs backend | tail -20
    exit 1
fi

echo ""
echo "🎯 System is ready!"
echo "🌐 Website: https://gudinocustom.com"
echo "🔐 Admin: https://gudinocustom.com/admin"
echo "👤 Login: superadmin / changeme123"
echo ""
echo "📊 Analytics tracking is now active"
echo "🗄️ Database will persist until you run docker-compose down --volumes"