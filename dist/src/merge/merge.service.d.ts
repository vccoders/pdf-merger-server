import { PrismaService } from '../prisma/prisma.service';
import { CreateMergeJobDto } from './dto/create-merge-job.dto';
import { Prisma } from '@prisma/client';
import { S3Service } from '../s3/s3.service';
import { MergeProcessor } from '../worker/merge.processor';
import { ConfigService } from '@nestjs/config';
interface IQueue {
    add(name: string, data: any, options?: any): Promise<any>;
}
export declare class MergeService {
    private mergeQueue;
    private prisma;
    private s3Service;
    private mergeProcessor;
    private configService;
    private readonly logger;
    constructor(mergeQueue: IQueue, prisma: PrismaService, s3Service: S3Service, mergeProcessor: MergeProcessor, configService: ConfigService);
    createJob(createMergeJobDto: CreateMergeJobDto): Promise<{
        files: Prisma.JsonValue;
        options: Prisma.JsonValue | null;
        error: string | null;
        id: string;
        status: import(".prisma/client").$Enums.MergeJobStatus;
        progress: number;
        resultKey: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getJob(id: string): Promise<{
        files: Prisma.JsonValue;
        options: Prisma.JsonValue | null;
        error: string | null;
        id: string;
        status: import(".prisma/client").$Enums.MergeJobStatus;
        progress: number;
        resultKey: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getDownloadUrl(id: string): Promise<{
        downloadUrl: string;
    }>;
}
export {};
