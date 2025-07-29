#!/bin/bash

# Script to initialize database with analytics support
echo "Initializing database with analytics support..."

# Create data directories with correct permissions
mkdir -p ./data/database ./data/uploads ./data/certbot/conf ./data/certbot/www

# Set correct ownership (this will be run by the user, not root)
chmod -R 755 ./data/

# Start containers
docker-compose up -d

# Wait for backend to be ready
echo "Waiting for backend to start..."
sleep 10

# Check if backend is running
if ! docker ps | grep -q cabinet-photo-backend; then
    echo "Backend container is not running. Starting it..."
    docker-compose restart backend
    sleep 10
fi

# Initialize database with all tables including analytics
echo "Initializing database with analytics tables..."
docker exec -it cabinet-photo-backend node init-database.js

# Check if initialization was successful
if [ $? -eq 0 ]; then
    echo "✅ Database initialized successfully with analytics support!"
    echo "🚀 System is ready to use"
    echo ""
    echo "Access your application at:"
    echo "  - Website: https://gudinocustom.com"
    echo "  - Admin Panel: https://gudinocustom.com/admin"
    echo "  - Default admin: username=superadmin, password=changeme123"
else
    echo "❌ Database initialization failed"
    echo "Check the container logs: docker-compose logs backend"
fi