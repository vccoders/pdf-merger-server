import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMergeJobDto } from './dto/create-merge-job.dto';
import { MergeJobStatus } from '@prisma/client';

import { S3Service } from '../s3/s3.service';
import { MergeProcessor } from '../worker/merge.processor';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MergeService {
    private readonly logger = new Logger(MergeService.name);

    constructor(
        @InjectQueue('merge-queue') private mergeQueue: Queue,
        private prisma: PrismaService,
        private s3Service: S3Service,
        private mergeProcessor: MergeProcessor,
        private configService: ConfigService,
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

        // 2. Check for Sync Processing (Netlify Mode)
        const isSync = this.configService.get('SYNC_PROCESSING') === 'true';

        if (isSync) {
            this.logger.log(`Processing job ${job.id} synchronously (Netlify Mode)`);
            const mockJob = {
                data: {
                    jobId: job.id,
                    files: createMergeJobDto.files,
                    options: createMergeJobDto.options,
                },
                progress: async (p: number) => { this.logger.debug(`Job ${job.id} progress: ${p}`); },
            } as any;

            try {
                await this.mergeProcessor.handleMerge(mockJob);
            } catch (error) {
                this.logger.error(`Sync processing failed for job ${job.id}`, error);
                // Error is already handled in processor (DB update), but we catch here to ensure we return the job
            }
        } else {
            // 3. Add to Queue (Standard Mode)
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
        }

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
