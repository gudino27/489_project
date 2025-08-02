# Zero-Downtime Deployment Guide

## Overview

will now supports production-grade zero-downtime deployments using a blue-green deployment strategy. Your familiar workflow remains the same, but now with zero service interruption.

## New Deployment Commands

### Quick Reference
```bash
# Your new deployment workflow
git pull
./manage.sh deploy

# If something goes wrong
./manage.sh rollback

# Check system health
./manage.sh health-check
```

### Available Commands

#### Production Deployment
```bash
./manage.sh deploy
```
- **Zero-downtime deployment** to production
- Builds new containers while old ones serve traffic
- Automatically switches traffic only when new version is healthy
- Creates automatic backup before deployment
- Instant rollback if anything fails

#### Staging Deployment
```bash
./manage.sh deploy-staging
```
- Deploy to staging environment first for testing
- Same process as production but on different ports
- Validate changes before production deployment

#### Instant Rollback
```bash
./manage.sh rollback
```
- Instantly reverts to the last known good deployment
- Uses automatic backup created during deployment
- Restores both application and data if needed

#### Health Check
```bash
./manage.sh health-check
```
- Comprehensive system health validation
- Checks all services, database, and file systems
- Useful for monitoring and troubleshooting

#### Legacy Commands (Still Available)
```bash
./manage.sh rebuild    # OLD WAY - Causes downtime
./manage.sh logs       # View logs
./manage.sh status     # Check status
./manage.sh backup     # Manual backup
./manage.sh restart    # Restart services
```

## Deployment Process

### What Happens During Zero-Downtime Deployment

1. **Backup Creation** - Automatic backup of current state
2. **Image Building** - New containers built while old ones run
3. **Health Validation** - New containers tested before traffic switch
4. **Traffic Switch** - Nginx seamlessly routes to new containers
5. **Verification** - End-to-end testing of the live system
6. **Cleanup** - Old containers gracefully stopped and removed

### Timeline
- **Total Time**: ~10 minutes
- **Service Downtime**: 0 seconds
- **Traffic Interruption**: None

## Your New Workflow

### Before (With Downtime)
```bash
# Old process - caused 10 minutes downtime
ssh user@server
git pull
./manage.sh rebuild  # ❌ CAUSES DOWNTIME
```

### Now (Zero Downtime)
```bash
# New process - zero downtime
ssh user@server
git pull
./manage.sh deploy   # ✅ ZERO DOWNTIME
```

### If Issues Occur
```bash
# Instant rollback (takes ~30 seconds)
./manage.sh rollback
```

## Health Check Endpoints

### Backend Health Check
```
GET http://localhost:3001/api/health
```
**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "uptime": 3600,
  "memory": {...},
  "checks": {
    "database": {"status": "OK", "message": "Database connection successful"},
    "uploads": {"status": "OK", "message": "Uploads directory accessible"},
    "dependencies": {"status": "OK", "express": "5.1.0", "sharp": "0.34.2"}
  }
}
```

### Frontend Health Check
```
GET http://localhost/health
```
**Response:**
```json
{
  "status": "OK",
  "service": "frontend",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Safety Features

### Automatic Backup
- **When**: Before every deployment
- **What**: Database, uploads, container state
- **Location**: `./backups/deployment_YYYYMMDD_HHMMSS/`
- **Retention**: Manual cleanup (recommend keeping last 5)

### Health Validation
- **Database connectivity** - Ensures DB is accessible
- **File system checks** - Validates uploads directory
- **API responsiveness** - Tests all critical endpoints
- **End-to-end validation** - Full user journey testing

### Automatic Rollback Triggers
- New containers fail to start
- Health checks fail on new version
- Database connectivity issues
- API endpoints return errors
- Nginx configuration errors

## Troubleshooting

### Check Deployment Status
```bash
./manage.sh status
```

### View Logs During Deployment
```bash
# In another terminal window
./manage.sh logs
```

### Manual Health Checks
```bash
# Test backend health
curl http://localhost:3001/api/health

# Test frontend health  
curl http://localhost/health

# Full system validation
./scripts/deployment-validator.sh production
```

### Common Issues

#### "Failed to build new images"
- **Cause**: Build errors in code
- **Solution**: Check logs, fix code, commit, redeploy
```bash
./manage.sh logs
```

#### "Health checks failed"
- **Cause**: New version has runtime issues
- **Solution**: Automatic rollback occurs, check logs
```bash
./manage.sh logs
```

#### "Traffic switch failed"
- **Cause**: Nginx configuration issues
- **Solution**: Automatic rollback occurs
```bash
./manage.sh status
```

### Recovery Procedures

#### Manual Rollback
```bash
# List available backups
ls -la ./backups/

# Restore specific backup
./manage.sh restore deployment_20240115_103000
```

#### Emergency Recovery
```bash
# Stop everything and use last known good backup
./manage.sh stop
./manage.sh rollback
./manage.sh start
```

## File Structure

### New Files Added
```
project/
├── manage.sh                          # Enhanced with zero-downtime commands
├── docker-compose.deploy.yml          # Blue-green deployment configuration
├── scripts/
│   └── deployment-validator.sh        # Comprehensive validation script
├── nginx-tunnel.conf                  # Enhanced for traffic switching
└── DEPLOYMENT.md                      # This documentation
```

### Temporary Files During Deployment
```
project/
├── docker-compose.deploy.yml          # Temporary deployment containers
├── nginx-tunnel.deploy.conf           # Temporary nginx config
├── .last_deployment_backup             # Tracks last backup for rollback
└── backups/
    └── deployment_YYYYMMDD_HHMMSS/     # Automatic backups
```

## Best Practices

### Development Workflow
1. **Test Locally** - Always test changes locally first
2. **Commit & Push** - Push to GitHub when ready
3. **Deploy to Staging** - Use `./manage.sh deploy-staging` for testing
4. **Deploy to Production** - Use `./manage.sh deploy` when confident
5. **Monitor** - Watch logs and health checks post-deployment

### Monitoring
```bash
# Check system health every few minutes after deployment
./manage.sh health-check

# Monitor logs for any issues
./manage.sh logs -f
```

### Backup Management
```bash
# Create manual backup before major changes
./manage.sh backup

# Clean up old deployment backups (keep last 5)
ls -la ./backups/ | head -10
```

## Migration from Old System

### For Existing Deployments
 existing `./manage.sh rebuild` command still works but **causes downtime**. Start using `./manage.sh deploy` for zero-downtime deployments.

### No Configuration Changes Needed
-  existing `docker-compose.yml` remains unchanged
-  existing `nginx-tunnel.conf` remains unchanged  
- All environment variables and data remain the same

### Gradual Adoption
1. **First time**: Use `./manage.sh deploy` instead of `rebuild`
2. **If issues**: Use `./manage.sh rollback` to return to current state
3. **Confidence building**: Use staging deployments to test first

## Support

### Log Analysis
```bash
# View all logs
./manage.sh logs

# View specific service logs
./manage.sh logs frontend
./manage.sh logs backend

# Follow logs in real-time
./manage.sh logs -f
```

### System Status
```bash
# Container status
./manage.sh status

# Comprehensive health check
./manage.sh health-check

# Manual validation
./scripts/deployment-validator.sh full
```

Remember: Yur deployment process is now **production-grade** with zero downtime, automatic backups, health validation, and instant rollback capabilities!