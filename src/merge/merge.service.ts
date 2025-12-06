import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMergeJobDto } from './dto/create-merge-job.dto';
import { MergeJobStatus, Prisma } from '@prisma/client';

import { S3Service } from '../s3/s3.service';
import { MergeProcessor } from '../worker/merge.processor';
import { ConfigService } from '@nestjs/config';

// Type for Queue (either real Bull queue or mock)
interface IQueue {
  add(name: string, data: any, options?: any): Promise<any>;
}

@Injectable()
export class MergeService {
  private readonly logger = new Logger(MergeService.name);

  constructor(
    @Inject('BullQueue_merge-queue') private mergeQueue: IQueue,
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
        files: createMergeJobDto.files as unknown as Prisma.InputJsonValue,
        options: createMergeJobDto.options as unknown as Prisma.InputJsonValue,
      },
    });

    this.logger.log(`Created job ${job.id} in DB`);

    // Default to sync processing on Render (no Redis available on free tier)
    const isSync = this.configService.get('SYNC_PROCESSING', 'true') === 'true';
    console.log(`[DEBUG] SYNC_PROCESSING=${this.configService.get('SYNC_PROCESSING', 'true')}, isSync=${isSync}`);
    this.logger.log(`SYNC_PROCESSING=${this.configService.get('SYNC_PROCESSING', 'true')}, isSync=${isSync}`);

    if (isSync) {
      console.log(`[DEBUG] Processing job ${job.id} synchronously`);
      this.logger.log(`Processing job ${job.id} synchronously (Netlify Mode)`);
      const mockJob: any = {
        data: {
          jobId: job.id,
          files: createMergeJobDto.files,
          options: createMergeJobDto.options,
        },
        progress: (p: number) => {
          console.log(`[DEBUG] Job ${job.id} progress: ${p}%`);
          this.logger.log(`Job ${job.id} progress: ${p}%`);
        },
      };

      try {
        console.log(`[DEBUG] Starting merge processor for job ${job.id}`);
        this.logger.log(`Starting merge processor for job ${job.id}`);
        await this.mergeProcessor.handleMerge(mockJob);
        console.log(`[DEBUG] Merge processor completed for job ${job.id}`);
        this.logger.log(`Merge processor completed for job ${job.id}`);
      } catch (error) {
        const err = error as Error;
        console.error(`[ERROR] Sync processing failed for job ${job.id}:`, err.message, err.stack);
        this.logger.error(
          `Sync processing failed for job ${job.id}: ${err.message}`,
          err.stack,
        );
        // Re-throw to ensure caller knows about the failure
        throw err;
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

    const options = job.options as { outputFilename?: string };
    const filename = options?.outputFilename || `merged-${id}.pdf`;
    // Ensure filename ends with .pdf
    const finalFilename = filename.toLowerCase().endsWith('.pdf')
      ? filename
      : `${filename}.pdf`;

    const url = await this.s3Service.getSignedDownloadUrl(
      job.resultKey,
      3600,
      finalFilename,
    );
    return { downloadUrl: url }; // Return as downloadUrl to match frontend expectation
  }
}
