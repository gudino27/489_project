#!/bin/bash

# Script for fresh start with analytics
echo "🔄 Starting fresh deployment with analytics..."

# Stop everything
echo "Stopping all containers..."
docker-compose down --volumes --remove-orphans

# Clean up old data (be careful - this removes everything!)
echo "⚠️  Removing old data directories..."
sudo rm -rf ./data/

# Create fresh data directories
echo "📁 Creating fresh data directories..."
mkdir -p ./data/database ./data/uploads ./data/certbot/conf ./data/certbot/www

# Set correct permissions
chmod -R 755 ./data/

# Rebuild images
echo "🔨 Rebuilding images..."
docker-compose build --no-cache

# Start containers
echo "🚀 Starting containers..."
docker-compose up -d

# Wait for backend to be ready
echo "⏳ Waiting for backend to initialize..."
sleep 15

# Initialize database with analytics
echo "🗄️  Initializing database with analytics tables..."
docker exec cabinet-photo-backend node init-database.js

# Check if successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Fresh deployment completed successfully!"
    echo "🎯 Analytics system is now active"
    echo ""
    echo "🌐 Access your application:"
    echo "  - Website: https://gudinocustom.com"
    echo "  - Admin Panel: https://gudinocustom.com/admin"
    echo "  - Default login: superadmin / changeme123"
    echo ""
    echo "📊 Analytics will be available in the admin panel under the 'Analytics' tab"
    echo "🔒 Only super admin users can access analytics"
else
    echo "❌ Database initialization failed"
    echo "📋 Check logs: docker-compose logs backend"
fi