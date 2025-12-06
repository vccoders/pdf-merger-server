# PDF Merger Server

A production-ready NestJS backend service for merging PDF files with S3 storage integration.

## 🚀 Features

- ✅ PDF merging with multiple files
- ✅ S3-compatible storage (Supabase/MinIO/AWS)
- ✅ PostgreSQL database with Prisma ORM
- ✅ Sync processing mode (no Redis required)
- ✅ Health check endpoints
- ✅ Rate limiting & throttling
- ✅ WebSocket support for real-time updates
- ✅ Production-ready logging

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- S3-compatible storage (Supabase Storage recommended)

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Build the application
npm run build
```

## ⚙️ Environment Variables

Copy `.env.example` to `.env` and configure:

### Required Variables

```bash
# Application
NODE_ENV=production
PORT=3000
SYNC_PROCESSING=true

# Database
DATABASE_URL=postgresql://user:password@host:5432/database
DIRECT_URL=postgresql://user:password@host:5432/database

# S3 Storage
STORAGE_REGION=ap-south-1
STORAGE_ACCESS_KEY=your-access-key
STORAGE_SECRET_KEY=your-secret-key
STORAGE_BUCKET_NAME=pdf-merger-bucket
STORAGE_ENDPOINT=https://your-storage-endpoint.com

# Worker
WORKER_CONCURRENCY=5
TEMP_DIR=/tmp

# Logging
LOG_LEVEL=info

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=10
```

## 🚀 Deployment

### Deploy to Render (Recommended - Free Tier)

1. **Fork/Clone** this repository
2. **Sign up** at [render.com](https://render.com)
3. **Create New Web Service**
4. **Connect** your GitHub repository
5. **Configure**:
   - Build Command: `npx prisma generate && npm install && npm run build`
   - Start Command: `node dist/src/main`
   - Add all environment variables from `.env`
6. **Deploy** ✅

### Manual Deployment

```bash
# Build
npm run build

# Start production server
npm run start:prod
```

## 📡 API Endpoints

### Health Checks
- `GET /api/health/live` - Liveness check
- `GET /api/health/ready` - Readiness check (includes DB)
- `GET /api/health` - Full health check

### Upload
- `POST /api/uploads/presign` - Get presigned upload URL

### Merge
- `POST /api/merge` - Create merge job
- `GET /api/merge/jobs/:id` - Get job status
- `GET /api/merge/jobs/:id/download` - Download merged PDF

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📊 Performance

- **Memory**: 512 MB (Render free tier)
- **Processing**: Sync mode (no background jobs)
- **Timeout**: 30 seconds per request
- **Concurrency**: 5 workers

## 🔒 Security

- Rate limiting enabled
- CORS configured
- Environment variables for secrets
- Input validation with class-validator
- SQL injection protection with Prisma

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📧 Support

For issues and questions, please open a GitHub issue.

---

**Built with ❤️ using NestJS**
