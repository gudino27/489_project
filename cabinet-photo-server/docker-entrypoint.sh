#!/bin/sh
set -e

echo "Starting Cabinet Photo Backend..."

# Create directories with proper permissions
mkdir -p /app/database /app/uploads

# Initialize database if it doesn't exist
if [ ! -f /app/database/cabinet_photos.db ]; then
    echo "Database not found. Initializing..."
    node init-database.js
    echo "Database initialized successfully"
else
    echo "Database exists, checking for analytics tables..."
    # Try to add analytics tables if they don't exist (this won't fail if they already exist)
    node -e "
        const { initializeDatabase } = require('./init-database.js');
        initializeDatabase().catch(err => {
            console.log('Database already up to date or analytics tables exist');
        });
    " 2>/dev/null || echo "Analytics tables already exist or database is up to date"
fi

# Start the main application
echo "Starting server..."
exec node server.js