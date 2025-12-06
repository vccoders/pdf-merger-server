import { ConfigService } from '@nestjs/config';
export declare class S3Service {
    private readonly configService;
    private s3Client;
    private bucketName;
    private readonly logger;
    private initialized;
    constructor(configService: ConfigService);
    private ensureInitialized;
    getSignedUploadUrl(key: string, contentType: string, expiresIn?: number, fileSize?: number): Promise<string>;
    getSignedDownloadUrl(key: string, expiresIn?: number, filename?: string): Promise<string>;
    deleteObject(key: string): Promise<void>;
    checkFileExists(key: string): Promise<{
        exists: boolean;
        size?: number;
        contentType?: string;
    }>;
    downloadFile(key: string, localPath: string): Promise<void>;
    uploadFile(key: string, localPath: string, contentType: string): Promise<void>;
}
