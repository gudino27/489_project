# Docker Bake Configuration for Gudino Custom Cabinets
# Optimized for build speed and zero-downtime deployments

variable "TAG" {
  default = "latest"
}

variable "REGISTRY" {
  default = "local"
}

variable "BUILD_DATE" {
  default = null
}

variable "GIT_SHA" {
  default = null
}

# Common group for all services
group "default" {
  targets = ["backend", "frontend"]
}

group "deploy" {
  targets = ["backend-deploy", "frontend-deploy"]
}

# Backend service with optimized build
target "backend" {
  context = "./cabinet-photo-server"
  dockerfile = "Dockerfile.optimized"
  tags = [
    "${REGISTRY}/cabinet-photo-backend:${TAG}",
    "${REGISTRY}/cabinet-photo-backend:latest"
  ]
  platforms = ["linux/amd64"]
  
  # Build arguments
  args = {
    NODE_VERSION = "20-alpine"
    BUILD_DATE = BUILD_DATE
    GIT_SHA = GIT_SHA
  }
  
  # Advanced caching strategies
  cache-from = [
    "type=local,src=/tmp/.buildx-cache/backend",
    "type=registry,ref=${REGISTRY}/cabinet-photo-backend:cache"
  ]
  cache-to = [
    "type=local,dest=/tmp/.buildx-cache/backend,mode=max",
    "type=registry,ref=${REGISTRY}/cabinet-photo-backend:cache,mode=max"
  ]
  
  # Build optimization
  target = "production"
}

# Frontend service with optimized build
target "frontend" {
  context = "./kitchen-designer"
  dockerfile = "Dockerfile.optimized"
  tags = [
    "${REGISTRY}/kitchen-designer-frontend:${TAG}",
    "${REGISTRY}/kitchen-designer-frontend:latest"
  ]
  platforms = ["linux/amd64"]
  
  # Build arguments
  args = {
    NODE_VERSION = "20-alpine"
    NGINX_VERSION = "alpine"
    BUILD_DATE = BUILD_DATE
    GIT_SHA = GIT_SHA
  }
  
  # Advanced caching strategies
  cache-from = [
    "type=local,src=/tmp/.buildx-cache/frontend",
    "type=registry,ref=${REGISTRY}/kitchen-designer-frontend:cache"
  ]
  cache-to = [
    "type=local,dest=/tmp/.buildx-cache/frontend,mode=max",
    "type=registry,ref=${REGISTRY}/kitchen-designer-frontend:cache,mode=max"
  ]
  
  # Build optimization
  target = "production"
}

# Deployment variants with blue-green naming
target "backend-deploy" {
  inherits = ["backend"]
  tags = [
    "${REGISTRY}/cabinet-photo-backend:deploy-${TAG}",
    "${REGISTRY}/cabinet-photo-backend:deploy-latest"
  ]
}

target "frontend-deploy" {
  inherits = ["frontend"]
  tags = [
    "${REGISTRY}/kitchen-designer-frontend:deploy-${TAG}",
    "${REGISTRY}/kitchen-designer-frontend:deploy-latest"
  ]
}

# Development target for faster iteration
target "backend-dev" {
  context = "./cabinet-photo-server"
  dockerfile = "Dockerfile.optimized"
  target = "development"
  tags = ["cabinet-photo-backend:dev"]
  
  cache-from = ["type=local,src=/tmp/.buildx-cache/backend-dev"]
  cache-to = ["type=local,dest=/tmp/.buildx-cache/backend-dev,mode=max"]
}

target "frontend-dev" {
  context = "./kitchen-designer"
  dockerfile = "Dockerfile.optimized"
  target = "development"
  tags = ["kitchen-designer-frontend:dev"]
  
  cache-from = ["type=local,src=/tmp/.buildx-cache/frontend-dev"]
  cache-to = ["type=local,dest=/tmp/.buildx-cache/frontend-dev,mode=max"]
}

# Testing targets
target "backend-test" {
  inherits = ["backend"]
  target = "test"
  output = ["type=local,dest=./test-results/backend"]
}

target "frontend-test" {
  inherits = ["frontend"]
  target = "test"
  output = ["type=local,dest=./test-results/frontend"]
}

# Multi-platform builds for production
target "backend-multi" {
  inherits = ["backend"]
  platforms = ["linux/amd64", "linux/arm64"]
}

target "frontend-multi" {
  inherits = ["frontend"]
  platforms = ["linux/amd64", "linux/arm64"]
}