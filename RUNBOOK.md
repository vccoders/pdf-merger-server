# PDF Merger Server - Runbook

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Deployment](#deployment)
3. [Monitoring](#monitoring)
4. [Common Operations](#common-operations)
5. [Troubleshooting](#troubleshooting)
6. [Rollback Procedures](#rollback-procedures)
7. [Emergency Contacts](#emergency-contacts)

---

## Architecture Overview

### Components
- **API Server**: NestJS application (Node.js 20)
- **Worker**: Bull queue processor for PDF merging
- **Database**: PostgreSQL (Supabase)
- **Cache/Queue**: Redis
- **Storage**: S3-compatible (Supabase Storage)

### Infrastructure
- **Hosting**: Render.com
- **Database**: Supabase PostgreSQL
- **Redis**: Render Redis
- **Storage**: Supabase Storage

---

## Deployment

### Prerequisites
- Access to Render dashboard
- GitHub repository access
- Environment variables configured

### Deployment Process

#### Automatic Deployment
1. Push to `main` branch triggers production deployment
2. Push to `develop` branch triggers staging deployment
3. GitHub Actions runs:
   - Lint and tests
   - Docker build
   - Deploy to Render
   - Smoke tests

#### Manual Deployment
```bash
# Via Render Dashboard
1. Go to https://dashboard.render.com
2. Select the service
3. Click "Manual Deploy" → "Deploy latest commit"

# Via Render API
curl -X POST "https://api.render.com/v1/services/$SERVICE_ID/deploys" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"clearCache": false}'
```

### Environment Variables

Required variables in Render:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=<supabase-connection-string>
DIRECT_URL=<supabase-direct-connection>
REDIS_HOST=<render-redis-host>
REDIS_PORT=6379
STORAGE_REGION=ap-south-1
STORAGE_ACCESS_KEY=<supabase-access-key>
STORAGE_SECRET_KEY=<supabase-secret-key>
STORAGE_BUCKET_NAME=pdf-merger-bucket
STORAGE_ENDPOINT=<supabase-storage-endpoint>
SENTRY_DSN=<sentry-dsn>
LOG_LEVEL=info
```

---

## Monitoring

### Health Checks

```bash
# Liveness probe
curl https://pdf-merger.example.com/health/live

# Readiness probe
curl https://pdf-merger.example.com/health/ready

# Full health check
curl https://pdf-merger.example.com/health
```

### Queue Dashboard
- URL: `https://pdf-merger.example.com/admin/queues`
- Monitor job counts, failures, and processing times

### Logs

```bash
# Via Render Dashboard
1. Go to service → Logs tab
2. Filter by severity or search

# Via Render CLI
render logs -s <service-name> --tail 100
```

### Metrics

Key metrics to monitor:
- **Request Rate**: Requests per second
- **Error Rate**: 4xx/5xx responses
- **Response Time**: p50, p95, p99
- **Queue Length**: Pending jobs in Redis
- **Worker Utilization**: Active vs idle workers
- **Database Connections**: Active connections
- **Memory Usage**: Heap usage
- **Disk Usage**: Temp directory size

---

## Common Operations

### Restart Service

```bash
# Via Render Dashboard
Service → Settings → Manual Deploy → "Clear build cache & deploy"

# Via API
curl -X POST "https://api.render.com/v1/services/$SERVICE_ID/restart" \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

### Scale Workers

Update `WORKER_CONCURRENCY` environment variable:
```bash
# Via Render Dashboard
Service → Environment → Edit WORKER_CONCURRENCY → Save

# Recommended values:
# - Low traffic: 3-5
# - Medium traffic: 5-10
# - High traffic: 10-15
```

### Clear Queue

```bash
# Access Bull Board
https://pdf-merger.example.com/admin/queues

# Or via Redis CLI
redis-cli -h <redis-host> -p 6379
> DEL bull:merge-queue:*
```

### Database Maintenance

```bash
# Run migrations
npm run prisma:migrate:deploy

# Generate Prisma client
npm run prisma:generate

# Check connection
npm run prisma:studio
```

### Clean Up Old Jobs

```sql
-- Connect to Supabase SQL Editor
DELETE FROM merge_jobs
WHERE status = 'COMPLETED'
  AND "updatedAt" < NOW() - INTERVAL '30 days';
```

---

## Troubleshooting

### High Error Rate

**Symptoms**: Increased 5xx errors

**Diagnosis**:
1. Check logs for error patterns
2. Verify database connectivity
3. Check Redis connectivity
4. Monitor memory usage

**Resolution**:
```bash
# Check health endpoint
curl https://pdf-merger.example.com/health

# Restart if needed
render services restart <service-name>

# Scale up if resource constrained
# Render Dashboard → Service → Settings → Instance Type
```

### Jobs Stuck in Queue

**Symptoms**: Jobs remain in PENDING status

**Diagnosis**:
1. Check Bull Board for worker status
2. Verify Redis connectivity
3. Check worker logs

**Resolution**:
```bash
# Restart workers
render services restart <service-name>

# Retry failed jobs via Bull Board
# Navigate to failed jobs → Retry All
```

### Out of Memory

**Symptoms**: Service crashes, OOM errors in logs

**Diagnosis**:
1. Check memory usage in Render dashboard
2. Review heap snapshots
3. Check for memory leaks

**Resolution**:
```bash
# Immediate: Restart service
render services restart <service-name>

# Long-term: Upgrade instance
# Render Dashboard → Service → Settings → Instance Type → Upgrade

# Or optimize WORKER_CONCURRENCY
# Reduce concurrent jobs to lower memory usage
```

### Database Connection Pool Exhausted

**Symptoms**: "Too many connections" errors

**Diagnosis**:
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;
```

**Resolution**:
1. Restart service to reset connections
2. Review Prisma connection pool settings
3. Consider upgrading database plan

### S3/Storage Issues

**Symptoms**: Upload/download failures

**Diagnosis**:
1. Verify credentials
2. Check bucket permissions
3. Test presigned URLs

**Resolution**:
```bash
# Test S3 connectivity
curl -I <presigned-url>

# Verify credentials in environment variables
# Render Dashboard → Service → Environment
```

---

## Rollback Procedures

### Quick Rollback (Render)

```bash
# Via Dashboard
1. Go to Service → Deploys
2. Find previous successful deploy
3. Click "Rollback to this deploy"

# Via API
curl -X POST "https://api.render.com/v1/services/$SERVICE_ID/deploys/$DEPLOY_ID/rollback" \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

### Database Rollback

```bash
# Revert migration
npx prisma migrate resolve --rolled-back <migration-name>

# Apply previous migration
npx prisma migrate deploy
```

### Rollback Checklist

- [ ] Identify last known good deploy
- [ ] Check if database migrations need rollback
- [ ] Notify team of rollback
- [ ] Execute rollback
- [ ] Verify health checks pass
- [ ] Monitor for 15 minutes
- [ ] Document incident

---

## Emergency Contacts

### On-Call Rotation
- **Primary**: [Name] - [Phone/Slack]
- **Secondary**: [Name] - [Phone/Slack]
- **Manager**: [Name] - [Phone/Slack]

### External Services
- **Render Support**: support@render.com
- **Supabase Support**: support@supabase.com
- **Sentry**: https://sentry.io/support

### Escalation Path
1. Check runbook for solution
2. Contact primary on-call
3. If no response in 15 min, contact secondary
4. If critical, escalate to manager

---

## Maintenance Windows

### Scheduled Maintenance
- **Day**: Sunday
- **Time**: 2:00 AM - 4:00 AM UTC
- **Frequency**: Monthly
- **Notification**: 48 hours advance notice

### Pre-Maintenance Checklist
- [ ] Notify users
- [ ] Backup database
- [ ] Test rollback procedure
- [ ] Prepare monitoring dashboard
- [ ] Have rollback plan ready

### Post-Maintenance Checklist
- [ ] Verify all health checks pass
- [ ] Check error rates
- [ ] Monitor for 1 hour
- [ ] Update status page
- [ ] Document any issues

---

## Useful Commands

```bash
# Check service status
render services list

# View logs
render logs -s pdf-merger-server --tail 100

# SSH into container (if enabled)
render shell -s pdf-merger-server

# Run database migrations
render run -s pdf-merger-server -- npm run prisma:migrate:deploy

# Check environment variables
render env list -s pdf-merger-server
```

---

## Additional Resources

- [API Documentation](./API.md)
- [Architecture Diagram](./architecture.png)
- [Security Policy](./docs/s3-security.md)
- [Retention Policy](./docs/retention-policy.md)
- [Load Testing Guide](./test/load/README.md)
