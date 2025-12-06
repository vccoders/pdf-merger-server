"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationSchema = void 0;
const Joi = __importStar(require("joi"));
exports.validationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test')
        .default('development'),
    PORT: Joi.number().default(3000),
    DATABASE_URL: Joi.string().required(),
    DIRECT_URL: Joi.string().optional(),
    REDIS_HOST: Joi.string().optional(),
    REDIS_PORT: Joi.number().default(6379),
    REDIS_PASSWORD: Joi.string().allow('').optional(),
    SYNC_PROCESSING: Joi.boolean().default(false),
    STORAGE_REGION: Joi.string().default('us-east-1'),
    STORAGE_ACCESS_KEY: Joi.string().required(),
    STORAGE_SECRET_KEY: Joi.string().required(),
    STORAGE_BUCKET_NAME: Joi.string().default('pdf-merger-bucket'),
    STORAGE_ENDPOINT: Joi.string().uri().required(),
    WORKER_CONCURRENCY: Joi.number().min(1).max(20).default(5),
    TEMP_DIR: Joi.string().default('./tmp'),
    LOG_LEVEL: Joi.string()
        .valid('error', 'warn', 'info', 'debug', 'trace')
        .default('info'),
    SENTRY_DSN: Joi.string().uri().optional(),
    SENTRY_TRACES_SAMPLE_RATE: Joi.number().min(0).max(1).default(0.1),
    THROTTLE_TTL: Joi.number().default(60000),
    THROTTLE_LIMIT: Joi.number().default(10),
});
//# sourceMappingURL=env.validation.js.map