import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import { pipeline } from 'stream/promises';

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(S3Service.name);

  constructor(private readonly configService: ConfigService) {
    // Validate that ConfigService is properly injected
    if (!this.configService) {
      throw new Error(
        'ConfigService is not available. Ensure ConfigModule is properly imported.',
      );
    }

    const region = this.configService.get<string>(
      'STORAGE_REGION',
      'us-east-1',
    );
    const accessKeyId = this.configService.get<string>('STORAGE_ACCESS_KEY');
    const secretAccessKey =
      this.configService.get<string>('STORAGE_SECRET_KEY');
    const endpoint = this.configService.get<string>('STORAGE_ENDPOINT');

    this.bucketName = this.configService.get<string>(
      'STORAGE_BUCKET_NAME',
      'pdf-merger-bucket',
    );

    // Log configuration for debugging (without sensitive data)
    this.logger.debug(
      `S3 Configuration: region=${region}, endpoint=${endpoint}, bucket=${this.bucketName}`,
    );

    if (!accessKeyId || !secretAccessKey || !endpoint) {
      throw new Error(
        `Missing required S3 configuration: ${!accessKeyId ? 'STORAGE_ACCESS_KEY ' : ''}${!secretAccessKey ? 'STORAGE_SECRET_KEY ' : ''}${!endpoint ? 'STORAGE_ENDPOINT' : ''}`,
      );
    }

    this.s3Client = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Required for MinIO/Supabase
    });

    this.logger.log(`S3 Service initialized for bucket: ${this.bucketName}`);
  }

  /**
   * Generate a presigned URL for uploading a file
   */
  async getSignedUploadUrl(
    key: string,
    contentType: string,
    expiresIn = 3600,
    fileSize?: number,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
        ContentLength: fileSize,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      this.logger.debug(
        `Generated upload URL for key: ${key} (Size: ${fileSize})`,
      );
      return url;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error generating upload URL for key ${key}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  /**
   * Generate a presigned URL for downloading a file
   */
  async getSignedDownloadUrl(
    key: string,
    expiresIn = 3600,
    filename?: string,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ResponseContentDisposition: filename
          ? `attachment; filename="${filename}"`
          : undefined,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      this.logger.debug(`Generated download URL for key: ${key}`);
      return url;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error generating download URL for key ${key}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  /**
   * Delete an object from S3
   */
  async deleteObject(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      this.logger.log(`Deleted object: ${key}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error deleting object ${key}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  /**
   * Check if a file exists in S3 and return its metadata
   */
  async checkFileExists(
    key: string,
  ): Promise<{ exists: boolean; size?: number; contentType?: string }> {
    if (process.env.MOCK_S3 === 'true') {
      this.logger.warn(`Mocking S3 check for key: ${key}`);
      return { exists: true, size: 1024, contentType: 'application/pdf' };
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);
      return {
        exists: true,
        size: response.ContentLength,
        contentType: response.ContentType,
      };
    } catch (error) {
      const err = error as Error;
      if (err.name === 'NotFound') {
        return { exists: false };
      }
      this.logger.error(
        `Error checking file existence for key ${key}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  /**
   * Download a file from S3 to a local path
   */
  async downloadFile(key: string, localPath: string): Promise<void> {
    if (process.env.MOCK_S3 === 'true') {
      this.logger.warn(`Mocking download for ${key}`);
      if (!fs.existsSync(localPath)) {
        fs.writeFileSync(localPath, '%PDF-1.4\nMock PDF Content');
      }
      return;
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const response = await this.s3Client.send(command);

      await pipeline(response.Body as any, fs.createWriteStream(localPath));

      this.logger.log(`Downloaded ${key} to ${localPath}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error downloading file ${key}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }

  /**
   * Upload a local file to S3
   */
  async uploadFile(
    key: string,
    localPath: string,
    contentType: string,
  ): Promise<void> {
    if (process.env.MOCK_S3 === 'true') {
      this.logger.warn(`Mocking upload for ${key}`);
      return;
    }

    try {
      const fileStream = fs.createReadStream(localPath);

      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: fileStream,
        ContentType: contentType,
      });

      await this.s3Client.send(command);
      this.logger.log(`Uploaded ${localPath} to ${key}`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Error uploading file ${key}: ${err.message}`,
        err.stack,
      );
      throw err;
    }
  }
}
