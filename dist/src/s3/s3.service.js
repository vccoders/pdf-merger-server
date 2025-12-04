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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var S3Service_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const fs = __importStar(require("fs"));
const promises_1 = require("stream/promises");
let S3Service = S3Service_1 = class S3Service {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(S3Service_1.name);
        const region = this.configService.get('STORAGE_REGION', 'us-east-1');
        const accessKeyId = this.configService.get('STORAGE_ACCESS_KEY');
        const secretAccessKey = this.configService.get('STORAGE_SECRET_KEY');
        const endpoint = this.configService.get('STORAGE_ENDPOINT');
        this.bucketName = this.configService.get('STORAGE_BUCKET_NAME', 'pdf-merger-bucket');
        this.s3Client = new client_s3_1.S3Client({
            region,
            endpoint,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
            forcePathStyle: true,
        });
        this.logger.log(`S3 Service initialized for bucket: ${this.bucketName}`);
    }
    async getSignedUploadUrl(key, contentType, expiresIn = 3600, fileSize) {
        try {
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                ContentType: contentType,
                ContentLength: fileSize,
            });
            const url = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn });
            this.logger.debug(`Generated upload URL for key: ${key} (Size: ${fileSize})`);
            return url;
        }
        catch (error) {
            const err = error;
            this.logger.error(`Error generating upload URL for key ${key}: ${err.message}`, err.stack);
            throw err;
        }
    }
    async getSignedDownloadUrl(key, expiresIn = 3600, filename) {
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                ResponseContentDisposition: filename
                    ? `attachment; filename="${filename}"`
                    : undefined,
            });
            const url = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, command, { expiresIn });
            this.logger.debug(`Generated download URL for key: ${key}`);
            return url;
        }
        catch (error) {
            const err = error;
            this.logger.error(`Error generating download URL for key ${key}: ${err.message}`, err.stack);
            throw err;
        }
    }
    async deleteObject(key) {
        try {
            const command = new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });
            await this.s3Client.send(command);
            this.logger.log(`Deleted object: ${key}`);
        }
        catch (error) {
            const err = error;
            this.logger.error(`Error deleting object ${key}: ${err.message}`, err.stack);
            throw err;
        }
    }
    async checkFileExists(key) {
        if (process.env.MOCK_S3 === 'true') {
            this.logger.warn(`Mocking S3 check for key: ${key}`);
            return { exists: true, size: 1024, contentType: 'application/pdf' };
        }
        try {
            const command = new client_s3_1.HeadObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });
            const response = await this.s3Client.send(command);
            return {
                exists: true,
                size: response.ContentLength,
                contentType: response.ContentType,
            };
        }
        catch (error) {
            const err = error;
            if (err.name === 'NotFound') {
                return { exists: false };
            }
            this.logger.error(`Error checking file existence for key ${key}: ${err.message}`, err.stack);
            throw err;
        }
    }
    async downloadFile(key, localPath) {
        if (process.env.MOCK_S3 === 'true') {
            this.logger.warn(`Mocking download for ${key}`);
            if (!fs.existsSync(localPath)) {
                fs.writeFileSync(localPath, '%PDF-1.4\nMock PDF Content');
            }
            return;
        }
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });
            const response = await this.s3Client.send(command);
            await (0, promises_1.pipeline)(response.Body, fs.createWriteStream(localPath));
            this.logger.log(`Downloaded ${key} to ${localPath}`);
        }
        catch (error) {
            const err = error;
            this.logger.error(`Error downloading file ${key}: ${err.message}`, err.stack);
            throw err;
        }
    }
    async uploadFile(key, localPath, contentType) {
        if (process.env.MOCK_S3 === 'true') {
            this.logger.warn(`Mocking upload for ${key}`);
            return;
        }
        try {
            const fileStream = fs.createReadStream(localPath);
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: fileStream,
                ContentType: contentType,
            });
            await this.s3Client.send(command);
            this.logger.log(`Uploaded ${localPath} to ${key}`);
        }
        catch (error) {
            const err = error;
            this.logger.error(`Error uploading file ${key}: ${err.message}`, err.stack);
            throw err;
        }
    }
};
exports.S3Service = S3Service;
exports.S3Service = S3Service = S3Service_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], S3Service);
//# sourceMappingURL=s3.service.js.map