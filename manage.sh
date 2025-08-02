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
    sleep 45
    
    # Health check new instances with more retries
    log_info "Performing health checks on new instances..."
    
    if ! check_service_health "backend-new" "http://localhost:3002/api/health" 15; then
        log_error "New backend instance failed health checks"
        log_info "Backend logs:"
        docker-compose -f docker-compose.deploy.yml logs backend-new --tail=50
        docker-compose -f docker-compose.deploy.yml down
        return 1
    fi
    
    if ! check_service_health "frontend-new" "http://localhost:8080" 10; then
        log_error "New frontend instance failed health checks"
        log_info "Frontend logs:"
        docker-compose -f docker-compose.deploy.yml logs frontend-new --tail=50
        docker-compose -f docker-compose.deploy.yml down
        return 1
    fi
    
    log_success "All health checks passed!"
    
    # Create updated nginx config that points to new instances
    log_info "Preparing traffic switch configuration..."
    sed 's/http:\/\/backend:3001/http:\/\/backend-new:3001/g; s/http:\/\/frontend:80/http:\/\/frontend-new:80/g' nginx-tunnel.conf > nginx-tunnel.deploy.conf
    
    # Update nginx configuration
    log_info "Switching traffic to new instances..."
    
    # Backup current nginx config
    if ! docker exec kitchen-designer-proxy cp /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.backup 2>/dev/null; then
        log_error "Failed to backup nginx config"
        docker-compose -f docker-compose.deploy.yml down
        return 1
    fi
    
    # Copy new config
    if ! docker cp nginx-tunnel.deploy.conf kitchen-designer-proxy:/etc/nginx/conf.d/default.conf; then
        log_error "Failed to update nginx config"
        docker-compose -f docker-compose.deploy.yml down
        rm -f nginx-tunnel.deploy.conf
        return 1
    fi
    
    # Test nginx configuration
    if ! docker exec kitchen-designer-proxy nginx -t; then
        log_error "Invalid nginx configuration"
        # Restore backup
        docker exec kitchen-designer-proxy cp /etc/nginx/conf.d/default.conf.backup /etc/nginx/conf.d/default.conf
        docker-compose -f docker-compose.deploy.yml down
        rm -f nginx-tunnel.deploy.conf
        return 1
    fi
    
    # Reload nginx configuration
    if ! docker exec kitchen-designer-proxy nginx -s reload; then
        log_error "Failed to reload nginx configuration"
        # Restore backup
        docker exec kitchen-designer-proxy cp /etc/nginx/conf.d/default.conf.backup /etc/nginx/conf.d/default.conf
        docker exec kitchen-designer-proxy nginx -s reload
        docker-compose -f docker-compose.deploy.yml down
        rm -f nginx-tunnel.deploy.conf
        return 1
    fi
    
    log_success "Traffic switched to new instances"
    
    # Verify the switch worked with end-to-end test
    log_info "Verifying deployment success..."
    sleep 15
    
    # Test both frontend and API through the proxy
    if ! check_service_health "application-frontend" "http://localhost" 3; then
        log_warning "Frontend health check failed after traffic switch, performing rollback..."
        perform_nginx_rollback
        return 1
    fi
    
    if ! check_service_health "application-api" "http://localhost:3001/api/health" 3; then
        log_warning "API health check failed after traffic switch, performing rollback..."
        perform_nginx_rollback
        return 1
    fi
    
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
    
    # Verify final state
    sleep 10
    if check_service_health "final-frontend" "http://localhost" 3 && check_service_health "final-api" "http://localhost:3001/api/health" 3; then
        log_success "Zero-downtime deployment completed successfully!"
        return 0
    else
        log_warning "Final health check failed but deployment seems successful"
        return 0
    fi
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
    deploy)
        log_info "Starting zero-downtime deployment..."
        if deploy_zero_downtime production; then
            log_success "Deployment completed successfully!"
        else
            log_error "Deployment failed!"
            exit 1
        fi
        ;;
    deploy-staging)
        log_info "Starting staging deployment..."
        if deploy_zero_downtime staging; then
            log_success "Staging deployment completed successfully!"
        else
            log_error "Staging deployment failed!"
            exit 1
        fi
        ;;
    rollback)
        if [ ! -f .last_deployment_backup ]; then
            log_error "No deployment backup found for rollback"
            exit 1
        fi
        
        backup_name=$(cat .last_deployment_backup)
        log_warning "Rolling back to backup: $backup_name"
        
        # Use existing restore functionality
        $0 restore "$backup_name"
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
        echo "Usage: $0 {logs|restart|rebuild|status|stop|start|backup|restore|fresh-start|init-analytics|deploy|deploy-staging|rollback|health-check} [service|backup_name]"
        echo ""
        echo "=== Standard Commands ==="
        echo "  logs [service]     - Show logs for all services or specific service"
        echo "  restart [service]  - Restart all services or specific service"
        echo "  rebuild           - Rebuild images (preserves data) - CAUSES DOWNTIME"
        echo "  status            - Show container and tunnel status"
        echo "  stop              - Stop all services and tunnel"
        echo "  start             - Start all services and tunnel"
        echo "  backup            - Create backup of database and uploads"
        echo "  restore <name>    - Restore from backup"
        echo "  fresh-start       - Complete fresh deployment (removes all data)"
        echo "  init-analytics    - Initialize analytics on existing system"
        echo ""
        echo "=== Zero-Downtime Deployment Commands ==="
        echo "  deploy            - Zero-downtime production deployment"
        echo "  deploy-staging    - Deploy to staging environment first"
        echo "  rollback          - Instant rollback to previous deployment"
        echo "  health-check      - Comprehensive health check of all services"
        echo ""
        echo "=== Deployment Workflow ==="
        echo "  1. Test locally"
        echo "  2. Push to GitHub"
        echo "  3. SSH to server: git pull"
        echo "  4. Run: ./manage.sh deploy"
        echo "  5. If issues: ./manage.sh rollback"
        exit 1
        ;;
esac
