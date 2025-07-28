#!/bin/bash
# GudinoCustom Management Script

case "$1" in
    logs)
        docker-compose logs -f ${2:-}
        ;;
    restart)
        docker-compose restart ${2:-}
        ;;
    rebuild)
        echo "Rebuilding images..."
        echo "Stopping all containers..."
        docker-compose down
        echo "Removing project containers..."
        docker-compose rm -f
        echo "Removing project images (preserving volumes)..."
        docker-compose down --rmi all --volumes=false
        echo "Building project images..."
        docker-compose build --no-cache
        echo "Creating data directories if they don't exist..."
        mkdir -p ./data/uploads ./data/database ./data/certbot/conf ./data/certbot/www
        echo "Starting containers..."
        docker-compose up -d
        ;;
    status)
        echo "=== Container Status ==="
        docker-compose ps
        echo ""
        echo "=== Tunnel Status ==="
        sudo systemctl status cloudflared --no-pager -l
        ;;
    stop)
        docker-compose down
        sudo systemctl stop cloudflared
        ;;
    start)
        docker-compose up -d
        sudo systemctl start cloudflared
        ;;
    backup)
        echo "Creating backup of database and uploads..."
        BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        if [ -d "./data/database" ]; then
            cp -r ./data/database "$BACKUP_DIR/"
            echo "Database backed up to $BACKUP_DIR/database"
        fi
        
        if [ -d "./data/uploads" ]; then
            cp -r ./data/uploads "$BACKUP_DIR/"
            echo "Uploads backed up to $BACKUP_DIR/uploads"
        fi
        
        echo "Backup completed: $BACKUP_DIR"
        ;;
    restore)
        if [ -z "$2" ]; then
            echo "Usage: $0 restore <backup_directory>"
            echo "Available backups:"
            ls -la ./backups/ 2>/dev/null || echo "No backups found"
            exit 1
        fi
        
        BACKUP_PATH="./backups/$2"
        if [ ! -d "$BACKUP_PATH" ]; then
            echo "Backup directory not found: $BACKUP_PATH"
            exit 1
        fi
        
        echo "Stopping containers before restore..."
        docker-compose down
        
        if [ -d "$BACKUP_PATH/database" ]; then
            echo "Restoring database..."
            rm -rf ./data/database
            cp -r "$BACKUP_PATH/database" ./data/
        fi
        
        if [ -d "$BACKUP_PATH/uploads" ]; then
            echo "Restoring uploads..."
            rm -rf ./data/uploads
            cp -r "$BACKUP_PATH/uploads" ./data/
        fi
        
        echo "Starting containers..."
        docker-compose up -d
        echo "Restore completed from: $BACKUP_PATH"
        ;;
    *)
        echo "Usage: $0 {logs|restart|rebuild|status|stop|start|backup|restore} [service|backup_name]"
        echo ""
        echo "Commands:"
        echo "  logs [service]     - Show logs for all services or specific service"
        echo "  restart [service]  - Restart all services or specific service"
        echo "  rebuild           - Rebuild images (preserves data)"
        echo "  status            - Show container and tunnel status"
        echo "  stop              - Stop all services and tunnel"
        echo "  start             - Start all services and tunnel"
        echo "  backup            - Create backup of database and uploads"
        echo "  restore <name>    - Restore from backup"
        exit 1
        ;;
esac
