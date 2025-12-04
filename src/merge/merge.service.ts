import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMergeJobDto } from './dto/create-merge-job.dto';
import { MergeJobStatus } from '@prisma/client';

import { S3Service } from '../s3/s3.service';

@Injectable()
export class MergeService {
    private readonly logger = new Logger(MergeService.name);

    constructor(
        @InjectQueue('merge-queue') private mergeQueue: Queue,
        private prisma: PrismaService,
        private s3Service: S3Service,
    ) { }

    async createJob(createMergeJobDto: CreateMergeJobDto) {
        // 1. Create Job in DB
        const job = await this.prisma.job.create({
            data: {
                status: MergeJobStatus.PENDING,
                files: createMergeJobDto.files as any, // Cast to JSON
                options: createMergeJobDto.options as any,
            },
        });

        this.logger.log(`Created job ${job.id} in DB`);

        // 2. Add to Queue
        await this.mergeQueue.add(
            'merge-job',
            {
                jobId: job.id,
                files: createMergeJobDto.files,
                options: createMergeJobDto.options,
            },
            {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000,
                },
                removeOnComplete: true,
                removeOnFail: false, // Keep failed jobs for DLQ
            },
        );

        this.logger.log(`Enqueued job ${job.id}`);

        return job;
    }

    async getJob(id: string) {
        return this.prisma.job.findUnique({
            where: { id },
        });
    }

    async getDownloadUrl(id: string) {
        const job = await this.getJob(id);
        if (!job || !job.resultKey) {
            throw new Error('Job not found or not completed');
        }

        const options = job.options as any;
        const filename = options?.outputFilename || `merged-${id}.pdf`;
        // Ensure filename ends with .pdf
        const finalFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;

        const url = await this.s3Service.getSignedDownloadUrl(job.resultKey, 3600, finalFilename);
        return { downloadUrl: url }; // Return as downloadUrl to match frontend expectation
    }
}
