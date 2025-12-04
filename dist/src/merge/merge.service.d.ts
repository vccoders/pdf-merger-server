import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMergeJobDto } from './dto/create-merge-job.dto';
import { S3Service } from '../s3/s3.service';
export declare class MergeService {
    private mergeQueue;
    private prisma;
    private s3Service;
    private readonly logger;
    constructor(mergeQueue: Queue, prisma: PrismaService, s3Service: S3Service);
    createJob(createMergeJobDto: CreateMergeJobDto): Promise<{
        files: import("@prisma/client/runtime/client").JsonValue;
        options: import("@prisma/client/runtime/client").JsonValue | null;
        error: string | null;
        id: string;
        status: import(".prisma/client").$Enums.MergeJobStatus;
        progress: number;
        resultKey: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getJob(id: string): Promise<{
        files: import("@prisma/client/runtime/client").JsonValue;
        options: import("@prisma/client/runtime/client").JsonValue | null;
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
