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
        echo "Removing project images..."
        docker-compose down --rmi all
        echo "Building project images..."
        docker-compose build --no-cache
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
    *)
        echo "Usage: $0 {logs|restart|rebuild|status|stop|start} [service]"
        exit 1
        ;;
esac
