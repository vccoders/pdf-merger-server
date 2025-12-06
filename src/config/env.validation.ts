import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Application
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  DATABASE_URL: Joi.string().required(),
  DIRECT_URL: Joi.string().optional(),

  // Redis (Optional - not needed if SYNC_PROCESSING=true)
  REDIS_HOST: Joi.string().optional(),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),

  // Sync Processing Mode (for serverless without Redis)
  SYNC_PROCESSING: Joi.boolean().default(false),

  // Storage (S3-compatible)
  STORAGE_REGION: Joi.string().default('us-east-1'),
  STORAGE_ACCESS_KEY: Joi.string().required(),
  STORAGE_SECRET_KEY: Joi.string().required(),
  STORAGE_BUCKET_NAME: Joi.string().default('pdf-merger-bucket'),
  STORAGE_ENDPOINT: Joi.string().uri().required(),

  // Worker
  WORKER_CONCURRENCY: Joi.number().min(1).max(20).default(5),
  TEMP_DIR: Joi.string().default('./tmp'),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'trace')
    .default('info'),

  // Sentry (Optional)
  SENTRY_DSN: Joi.string().uri().optional(),
  SENTRY_TRACES_SAMPLE_RATE: Joi.number().min(0).max(1).default(0.1),

  // Rate Limiting
  THROTTLE_TTL: Joi.number().default(60000),
  THROTTLE_LIMIT: Joi.number().default(10),
});
