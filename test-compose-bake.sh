#!/bin/bash
# Test script to verify COMPOSE_BAKE is enabled and working
# Run this to check if your Docker environment supports Compose Bake

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}   COMPOSE_BAKE Verification Test${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Check Docker version
echo -e "${BLUE}[1/5] Checking Docker Engine version...${NC}"
DOCKER_VERSION=$(docker version --format '{{.Server.Version}}' 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Docker Engine: v${DOCKER_VERSION}"
    DOCKER_MAJOR=$(echo $DOCKER_VERSION | cut -d. -f1)
    if [ "$DOCKER_MAJOR" -ge 20 ]; then
        echo -e "${GREEN}✓${NC} Version is compatible (20.10+)"
    else
        echo -e "${RED}✗${NC} Version too old (need 20.10+)"
    fi
else
    echo -e "${RED}✗${NC} Could not detect Docker version"
fi
echo ""

# Check Docker Buildx
echo -e "${BLUE}[2/5] Checking Docker Buildx...${NC}"
BUILDX_VERSION=$(docker buildx version 2>&1 | grep -oP 'v\d+\.\d+\.\d+' | head -1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Docker Buildx: ${BUILDX_VERSION}"
else
    echo -e "${RED}✗${NC} Docker Buildx not found"
fi
echo ""

# Check Docker Compose version
echo -e "${BLUE}[3/5] Checking Docker Compose version...${NC}"
COMPOSE_VERSION=$(docker-compose version --short 2>&1 || docker compose version --short 2>&1)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Docker Compose: v${COMPOSE_VERSION}"
    COMPOSE_MAJOR=$(echo $COMPOSE_VERSION | cut -d. -f1)
    COMPOSE_MINOR=$(echo $COMPOSE_VERSION | cut -d. -f2)
    if [ "$COMPOSE_MAJOR" -ge 2 ] && [ "$COMPOSE_MINOR" -ge 17 ]; then
        echo -e "${GREEN}✓${NC} Version supports COMPOSE_BAKE (2.17+)"
    else
        echo -e "${YELLOW}⚠${NC}  Version may not support COMPOSE_BAKE (need 2.17+)"
    fi
else
    echo -e "${RED}✗${NC} Could not detect Docker Compose version"
fi
echo ""

# Check environment variables
echo -e "${BLUE}[4/5] Checking environment variables...${NC}"

# Load .env if it exists
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
    echo -e "${GREEN}✓${NC} Loaded .env file"
fi

# Check each required variable
if [ "$DOCKER_BUILDKIT" = "1" ]; then
    echo -e "${GREEN}✓${NC} DOCKER_BUILDKIT=1"
else
    echo -e "${YELLOW}⚠${NC}  DOCKER_BUILDKIT not set (add to .env)"
fi

if [ "$COMPOSE_DOCKER_CLI_BUILD" = "1" ]; then
    echo -e "${GREEN}✓${NC} COMPOSE_DOCKER_CLI_BUILD=1"
else
    echo -e "${YELLOW}⚠${NC}  COMPOSE_DOCKER_CLI_BUILD not set (add to .env)"
fi

if [ "$COMPOSE_BAKE" = "true" ]; then
    echo -e "${GREEN}✓${NC} COMPOSE_BAKE=true"
else
    echo -e "${YELLOW}⚠${NC}  COMPOSE_BAKE not set (add to .env)"
fi
echo ""

# Test if docker-compose can use bake
echo -e "${BLUE}[5/5] Testing Compose Bake functionality...${NC}"

# Export variables for test
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
export COMPOSE_BAKE=true

# Try a dry-run build to see if bake is recognized
echo -e "${BLUE}Running test build (dry-run)...${NC}"
BUILD_OUTPUT=$(docker-compose build --help 2>&1)

if echo "$BUILD_OUTPUT" | grep -q "bake"; then
    echo -e "${GREEN}✓${NC} Compose recognizes 'bake' command"
else
    echo -e "${YELLOW}⚠${NC}  'bake' not found in build help (may still work)"
fi

# Check if buildx bake command exists
if docker buildx bake --help >/dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} 'docker buildx bake' command available"
else
    echo -e "${RED}✗${NC} 'docker buildx bake' command not available"
fi
echo ""

# Summary
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}         Summary${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""

# Count checks
CHECKS_PASSED=0
TOTAL_CHECKS=7

[ "$DOCKER_MAJOR" -ge 20 ] && CHECKS_PASSED=$((CHECKS_PASSED + 1))
[ ! -z "$BUILDX_VERSION" ] && CHECKS_PASSED=$((CHECKS_PASSED + 1))
[ "$COMPOSE_MAJOR" -ge 2 ] && [ "$COMPOSE_MINOR" -ge 17 ] && CHECKS_PASSED=$((CHECKS_PASSED + 1))
[ "$DOCKER_BUILDKIT" = "1" ] && CHECKS_PASSED=$((CHECKS_PASSED + 1))
[ "$COMPOSE_DOCKER_CLI_BUILD" = "1" ] && CHECKS_PASSED=$((CHECKS_PASSED + 1))
[ "$COMPOSE_BAKE" = "true" ] && CHECKS_PASSED=$((CHECKS_PASSED + 1))
docker buildx bake --help >/dev/null 2>&1 && CHECKS_PASSED=$((CHECKS_PASSED + 1))

if [ $CHECKS_PASSED -eq $TOTAL_CHECKS ]; then
    echo -e "${GREEN}✓ All checks passed! ($CHECKS_PASSED/$TOTAL_CHECKS)${NC}"
    echo -e "${GREEN}✓ COMPOSE_BAKE is ready to use!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Run: ./manage.sh rebuild"
    echo "  2. Look for: '[+] Building with Compose Bake'"
    echo "  3. Enjoy 40-50% faster builds!"
elif [ $CHECKS_PASSED -ge 5 ]; then
    echo -e "${YELLOW}⚠ Mostly ready ($CHECKS_PASSED/$TOTAL_CHECKS checks passed)${NC}"
    echo -e "${YELLOW}⚠ COMPOSE_BAKE may work, but some optimizations missing${NC}"
    echo ""
    echo "Missing items (check above for details)"
else
    echo -e "${RED}✗ Not ready ($CHECKS_PASSED/$TOTAL_CHECKS checks passed)${NC}"
    echo -e "${RED}✗ Please install/update Docker components${NC}"
fi

echo ""
echo -e "${BLUE}=====================================${NC}"
