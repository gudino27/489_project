#!/bin/sh
set -e

echo "Starting Cabinet Photo Backend..."

# Create directories with proper permissions
mkdir -p /app/database /app/uploads

# Always try to initialize/update database
echo "Initializing/updating database..."
if node init-database.js; then
    echo "Database initialization completed successfully"
else
    echo "Database initialization failed, but continuing..."
fi

# Check if database file exists now
if [ -f /app/database/cabinet_photos.db ]; then
    echo "Database file exists at /app/database/cabinet_photos.db"
    ls -la /app/database/cabinet_photos.db
else
    echo "WARNING: Database file not found!"
fi

# Start the main application
echo "Starting server..."
exec node server.js