#!/bin/bash
# GudinoCustom Management Script
# Enhanced with Zero-Downtime Deployment

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups"
DEPLOY_TIMEOUT=300  # 5 minutes timeout for deployment
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=10

# Utility functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Health check function
check_service_health() {
    local service_name=$1
    local health_url=$2
    local retries=${3:-$HEALTH_CHECK_RETRIES}
    
    log_info "Checking health for $service_name..."
    
    for i in $(seq 1 $retries); do
        if curl -sf "$health_url" > /dev/null 2>&1; then
            log_success "$service_name is healthy"
            return 0
        fi
        
        log_info "Health check $i/$retries failed for $service_name, retrying in ${HEALTH_CHECK_INTERVAL}s..."
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    log_error "$service_name failed health checks after $retries attempts"
    return 1
}

# Create deployment backup
create_deployment_backup() {
    local backup_name="deployment_$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    log_info "Creating deployment backup: $backup_name"
    mkdir -p "$backup_path"
    
    # Backup current docker-compose state
    docker-compose ps --format json > "$backup_path/containers_state.json" 2>/dev/null
    
    # Backup data
    if [ -d "./data/database" ]; then
        cp -r ./data/database "$backup_path/"
        log_info "Database backed up"
    fi
    
    if [ -d "./data/uploads" ]; then
        cp -r ./data/uploads "$backup_path/"
        log_info "Uploads backed up"
    fi
    
    echo "$backup_name" > .last_deployment_backup
    log_success "Deployment backup created: $backup_path"
}

# Zero-downtime deployment function
deploy_zero_downtime() {
    local environment=${1:-production}
    log_info "Starting zero-downtime deployment for $environment..."
    
    # Ensure networks and volumes exist
    docker network create app-network 2>/dev/null || true
    
    # Create backup before deployment
    create_deployment_backup
    
    # Build new images using the deployment compose file
    log_info "Building new images for deployment..."
    if ! docker-compose -f docker-compose.deploy.yml build --no-cache; then
        log_error "Failed to build new images"
        return 1
    fi
    
    # Start new services alongside existing ones
    log_info "Starting new service instances..."
    if ! docker-compose -f docker-compose.deploy.yml up -d; then
        log_error "Failed to start new service instances"
        return 1
    fi
    
    # Wait for services to initialize
    log_info "Waiting for services to initialize..."
    sleep 30
    
    log_success "New containers started successfully!"
    
    # Create updated nginx config that points to new instances
    log_info "Preparing traffic switch configuration..."
    sed 's/http:\/\/backend:3001/http:\/\/backend-new:3001/g; s/http:\/\/frontend:80/http:\/\/frontend-new:80/g' nginx-tunnel.conf > nginx-tunnel.deploy.conf
    
    # Update nginx configuration
    log_info "Switching traffic to new instances..."
    
    # Backup current nginx config
    if ! docker exec kitchen-designer-proxy sh -c "cp /etc/nginx/conf.d/default.conf /tmp/default.conf.backup"; then
        log_error "Failed to backup nginx config"
        docker-compose -f docker-compose.deploy.yml down
        return 1
    fi
    
    # Stop nginx, replace config, then start it
    log_info "Stopping nginx to update configuration..."
    docker exec kitchen-designer-proxy nginx -s stop
    
    # Copy new config directly
    if ! docker cp nginx-tunnel.deploy.conf kitchen-designer-proxy:/etc/nginx/conf.d/default.conf; then
        log_error "Failed to copy nginx config"
        # Restore backup and restart nginx
        docker exec kitchen-designer-proxy cp /tmp/default.conf.backup /etc/nginx/conf.d/default.conf
        docker exec kitchen-designer-proxy nginx
        docker-compose -f docker-compose.deploy.yml down
        rm -f nginx-tunnel.deploy.conf
        return 1
    fi
    
    # Start nginx with new config
    if ! docker exec kitchen-designer-proxy nginx; then
        log_error "Failed to start nginx with new config"
        # Restore backup and restart nginx
        docker exec kitchen-designer-proxy cp /tmp/default.conf.backup /etc/nginx/conf.d/default.conf
        docker exec kitchen-designer-proxy nginx
        docker-compose -f docker-compose.deploy.yml down
        rm -f nginx-tunnel.deploy.conf
        return 1
    fi
    
    log_success "Nginx restarted with new configuration"
    
    log_success "Traffic switched to new instances"
    
    log_success "Traffic successfully switched to new version!"
    
    # Brief pause to ensure switch is stable
    sleep 10
    
    # Stop old instances gracefully
    log_info "Stopping old service instances..."
    docker-compose stop
    
    # Wait a moment for connections to drain
    sleep 10
    docker-compose down
    
    # Rename new instances to replace old ones
    log_info "Finalizing deployment..."
    docker rename kitchen-designer-frontend-new kitchen-designer-frontend 2>/dev/null || true
    docker rename cabinet-photo-backend-new cabinet-photo-backend 2>/dev/null || true
    
    # Update the main nginx config to use standard names
    log_info "Updating configuration for standard service names..."
    docker cp nginx-tunnel.conf kitchen-designer-proxy:/etc/nginx/conf.d/default.conf
    docker exec kitchen-designer-proxy nginx -s reload
    
    # Start the renamed containers with original compose file
    docker-compose up -d --no-recreate
    
    # Cleanup temporary files
    rm -f nginx-tunnel.deploy.conf
    
    log_success "Zero-downtime deployment completed successfully!"
    return 0
}

# Helper function for nginx rollback
perform_nginx_rollback() {
    log_info "Performing nginx rollback..."
    docker exec kitchen-designer-proxy cp /etc/nginx/conf.d/default.conf.backup /etc/nginx/conf.d/default.conf
    docker exec kitchen-designer-proxy nginx -s reload
    docker-compose -f docker-compose.deploy.yml down
    rm -f nginx-tunnel.deploy.conf
}

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
    fresh-start)
        echo "⚠️  WARNING: This will remove ALL existing data and start fresh!"
        echo "This includes all photos, designs, users, and analytics data."
        read -p "Are you sure? Type 'YES' to continue: " confirm
        if [ "$confirm" = "YES" ]; then
            ./scripts/fresh-start.sh
        else
            echo "Fresh start cancelled."
        fi
        ;;
    init-analytics)
        echo "Initializing system with analytics support..."
        ./scripts/init-with-analytics.sh
        ;;
    health-check)
        log_info "Performing comprehensive health check..."
        
        # Check if containers are running
        if ! docker-compose ps | grep -q "Up"; then
            log_error "Some containers are not running"
            docker-compose ps
            exit 1
        fi
        
        # Check service health
        if check_service_health "frontend" "http://localhost" 5; then
            if check_service_health "backend" "http://localhost:3001/api/health" 5; then
                log_success "All services are healthy!"
            else
                log_error "Backend health check failed"
                exit 1
            fi
        else
            log_error "Frontend health check failed"
            exit 1
        fi
        ;;
    *)
        echo "Usage: $0 {logs|restart|rebuild|status|stop|start|backup|restore|fresh-start|init-analytics|health-check} [service|backup_name]"
        echo ""
        echo "=== Standard Commands ==="
        echo "  logs [service]     - Show logs for all services or specific service"
        echo "  restart [service]  - Restart all services or specific service"
        echo "  rebuild           - Rebuild images (preserves data)"
        echo "  status            - Show container and tunnel status"
        echo "  stop              - Stop all services and tunnel"
        echo "  start             - Start all services and tunnel"
        echo "  backup            - Create backup of database and uploads"
        echo "  restore <name>    - Restore from backup"
        echo "  fresh-start       - Complete fresh deployment (removes all data)"
        echo "  init-analytics    - Initialize analytics on existing system"
        echo "  health-check      - Comprehensive health check of all services"
        echo ""
        echo "=== Deployment Workflow ==="
        echo "  1. Test locally"
        echo "  2. Push to GitHub"
        echo "  3. SSH to server: git pull"
        echo "  4. Run: ./manage.sh rebuild"
        exit 1
        ;;
esac
