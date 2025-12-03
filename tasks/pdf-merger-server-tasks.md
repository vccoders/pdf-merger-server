# PDF Merger Server - Implementation Tasks

This document outlines the step-by-step plan to build, harden, and deploy the `pdf-merger-server`.
The goal is a production-ready, scalable backend handling 1M+ monthly users.

## Phase 1: MVP (Core Functionality)

### 1. Repo Setup & Analysis
- **Description**: Initialize NestJS project and align structure with `pdf-compressor-server`. Configure TypeScript, ESLint, Prettier, and basic env vars.
- **Acceptance Criteria**: 
  - NestJS app running.
  - Folder structure matches `pdf-compressor-server` (`src/config`, `src/jobs`, `src/worker`, `src/s3`).
  - `npm run start:dev` works.
- **Complexity**: Small
- **Files**: `package.json`, `tsconfig.json`, `.eslintrc.js`, `src/main.ts`, `src/app.module.ts`
- **Command**:
  ```bash
  npx @nestjs/cli new pdf-merger-server --package-manager npm --skip-git
  # (Run inside the root if not already created, or just scaffold src)
  ```

### 2. API Contract & DTOs
- **Description**: Define the input/output schemas for the merge API.
- **Acceptance Criteria**: 
  - `POST /api/v1/merge` DTO defined (files list, options).
  - `GET /api/v1/jobs/:id` DTO defined.
  - Validation pipes enabled.
- **Complexity**: Small
- **Files**: `src/merge/dto/create-merge-job.dto.ts`, `src/merge/merge.controller.ts`

### 3. S3 Module & Presigned Uploads
- **Description**: Implement S3 service for generating presigned URLs for uploads. Reuse logic from `pdf-compressor-server`.
- **Acceptance Criteria**: 
  - `POST /api/v1/uploads/presign` returns valid S3 URL.
  - Localstack or Dev S3 bucket connectivity verified.
- **Complexity**: Medium
- **Files**: `src/s3/s3.service.ts`, `src/s3/s3.module.ts`, `src/upload/upload.controller.ts`

### 4. Job Model & DB Migration
- **Description**: Create `Job` model in Prisma schema to track status, progress, and result.
- **Acceptance Criteria**: 
  - `Job` table exists in Postgres (id, status, progress, resultKey, createdAt).
  - Migration applied.
  - Seed script creates a dummy job.
- **Complexity**: Medium
- **Files**: `prisma/schema.prisma`, `src/prisma/prisma.service.ts`
- **Command**:
  ```bash
  npx prisma migrate dev --name init_job_model
  ```

### 5. Queue Producer Setup
- **Description**: Configure BullMQ (or Bull) with Redis. Create a producer to enqueue merge jobs.
- **Acceptance Criteria**: 
  - `POST /api/v1/merge` creates a DB record AND enqueues a job in Redis.
  - Job ID returned to client.
- **Complexity**: Medium
- **Files**: `src/queue/queue.module.ts`, `src/merge/merge.service.ts`

### 6. Worker & Merge Implementation
- **Description**: Implement the worker processor. Download files from S3, use `qpdf` or `ghostscript` to merge, upload result to S3.
- **Acceptance Criteria**: 
  - Worker picks up job.
  - Files downloaded to temp dir.
  - `qpdf` merges files correctly.
  - Result uploaded to S3.
  - DB updated with `resultKey` and `status: COMPLETED`.
- **Complexity**: Large
- **Files**: `src/worker/merge.processor.ts`, `src/worker/worker.module.ts`

### 7. Progress Updates
- **Description**: Implement progress tracking in the worker (downloading -> merging -> uploading). Publish updates to Redis PubSub.
- **Acceptance Criteria**: 
  - Job progress updates in DB (0% -> 100%).
  - Redis channel receives progress events.
- **Complexity**: Medium
- **Files**: `src/worker/merge.processor.ts`

### 8. WebSocket/SSE Gateway
- **Description**: Create a Gateway to push progress updates to the client via WebSockets or SSE.
- **Acceptance Criteria**: 
  - Client connected to WS receives real-time progress for their Job ID.
- **Complexity**: Medium
- **Files**: `src/events/events.gateway.ts`, `src/events/events.module.ts`

### 9. Result Presign Endpoint
- **Description**: Endpoint to generate a download URL for the merged file.
- **Acceptance Criteria**: 
  - `GET /api/v1/jobs/:id/download` returns presigned S3 URL.
  - URL allows downloading the final PDF.
- **Complexity**: Small
- **Files**: `src/merge/merge.controller.ts`

## Phase 2: Hardening & Scale

### 10. Worker Concurrency & Config
- **Description**: Configure worker concurrency via env vars. Ensure graceful shutdown.
- **Acceptance Criteria**: 
  - `WORKER_CONCURRENCY` env var controls parallel jobs.
  - Worker shuts down gracefully on SIGTERM.
- **Complexity**: Small
- **Files**: `src/config/configuration.ts`, `src/worker/worker.module.ts`

### 11. Rate Limiting
- **Description**: Implement rate limiting (Throttler) and per-user active job limits.
- **Acceptance Criteria**: 
  - 429 Too Many Requests if limit exceeded.
  - User cannot have >N active jobs.
- **Complexity**: Medium
- **Files**: `src/app.module.ts`, `src/common/guards/rate-limit.guard.ts`

### 12. Streaming & Optimization
- **Description**: Optimize file handling. Use streams where possible (S3 download/upload). Monitor memory usage.
- **Acceptance Criteria**: 
  - Large files (e.g., 500MB) processed without OOM.
  - Temp files cleaned up immediately.
- **Complexity**: Large
- **Files**: `src/worker/merge.processor.ts`

### 13. Retry & Dead Letter Queue
- **Description**: Configure retry logic for failed jobs and DLQ for unrecoverable errors.
- **Acceptance Criteria**: 
  - Transient errors trigger retry.
  - Permanent failures move to DLQ and update DB status to `FAILED`.
- **Complexity**: Medium
- **Files**: `src/queue/queue.config.ts`

### 14. Dockerfile & Multi-stage Build
- **Description**: Create production Dockerfile with `qpdf` and `ghostscript` installed.
- **Acceptance Criteria**: 
  - `docker build` succeeds.
  - Image size optimized.
  - Container runs and processes jobs.
- **Complexity**: Medium
- **Files**: `Dockerfile`, `.dockerignore`

## Phase 3: Observability & Ops

### 15. Structured Logging & Sentry
- **Description**: Replace console logs with `nestjs-pino`. Integrate Sentry for error tracking.
- **Acceptance Criteria**: 
  - JSON logs in production.
  - Exceptions captured in Sentry.
- **Complexity**: Medium
- **Files**: `src/main.ts`, `src/common/logger/logger.module.ts`

### 16. Metrics & Health
- **Description**: Expose Prometheus metrics and Health checks (Terminus).
- **Acceptance Criteria**: 
  - `/metrics` endpoint returns Prometheus data.
  - `/health` checks Redis, DB, S3 connectivity.
- **Complexity**: Medium
- **Files**: `src/health/health.controller.ts`

### 17. Queue Dashboard
- **Description**: Mount `bull-board` for monitoring queues (protected by basic auth).
- **Acceptance Criteria**: 
  - `/admin/queues` accessible with credentials.
  - Shows job counts and statuses.
- **Complexity**: Small
- **Files**: `src/queue/bull-board.provider.ts`

### 18. Load Testing
- **Description**: Create k6 script to simulate load (upload -> merge -> download).
- **Acceptance Criteria**: 
  - Script runs successfully.
  - Baseline performance metrics recorded.
- **Complexity**: Medium
- **Files**: `test/load/k6-script.js`

## Phase 4: Security & Compliance

### 19. IAM & S3 Security
- **Description**: Review and restrict S3 bucket policies. Ensure backend has least-privilege access.
- **Acceptance Criteria**: 
  - Bucket not public.
  - Presigned URLs have short expiration.
- **Complexity**: Small
- **Files**: `terraform/s3.tf` (if applicable) or AWS Console check.

### 20. Secrets & Env Validation
- **Description**: Use `joi` or `class-validator` to validate all env vars on startup.
- **Acceptance Criteria**: 
  - App fails to start if `AWS_REGION` is missing.
- **Complexity**: Small
- **Files**: `src/config/env.validation.ts`

### 21. Security Headers & Validation
- **Description**: Ensure Helmet, CORS, and Input Validation are strict.
- **Acceptance Criteria**: 
  - Security headers present.
  - Malformed JSON rejected.
- **Complexity**: Small
- **Files**: `src/main.ts`

### 22. Backup & Retention
- **Description**: Define lifecycle policy for S3 (delete merged files after X days).
- **Acceptance Criteria**: 
  - S3 Lifecycle rule configured.
- **Complexity**: Small
- **Files**: `docs/retention-policy.md`

## Phase 5: CI/CD & Infra

### 23. Terraform / IaC
- **Description**: Define infrastructure as code.
- **Acceptance Criteria**: 
  - Terraform plan includes Autoscaling Group, Redis, RDS.
- **Complexity**: Large
- **Files**: `terraform/main.tf`

### 24. GitHub Actions Pipeline
- **Description**: CI/CD workflow for testing, building, and deploying.
- **Acceptance Criteria**: 
  - Push to main triggers build & deploy.
  - PR triggers lint & test.
- **Complexity**: Medium
- **Files**: `.github/workflows/deploy.yml`

### 25. Runbook & Rollback
- **Description**: Document operational procedures.
- **Acceptance Criteria**: 
  - `RUNBOOK.md` exists with "How to restart", "How to rollback", "Troubleshooting".
- **Complexity**: Small
- **Files**: `RUNBOOK.md`

---

## PR Plan

- **Branch**: `feature/pdf-merger-server`
- **Strategy**: Squash and merge per task or small groups of tasks.
- **PR Template**:
  ```markdown
  ## Task ID: [X]
  ## Description
  [Brief description]
  ## Changes
  - [File 1]
  - [File 2]
  ## Verification
  - [ ] Local test passed
  - [ ] Unit tests passed
  ```
- **Testing Checklist**:
  - `npm run test`
  - `npm run lint`
  - Manual verification of API endpoints.
