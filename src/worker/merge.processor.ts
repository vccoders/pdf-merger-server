import { Process, Processor } from '@nestjs/bull';
import { Logger, OnModuleInit } from '@nestjs/common';
import { Job } from 'bull';
import { S3Service } from '../s3/s3.service';
import { PrismaService } from '../prisma/prisma.service';
import { MergeJobStatus } from '@prisma/client';
import * as fs from 'fs-extra';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';
import { ConfigService } from '@nestjs/config';
import { EventsGateway } from '../events/events.gateway';

@Processor('merge-queue')
export class MergeProcessor implements OnModuleInit {
  private readonly logger = new Logger(MergeProcessor.name);
  private tempDir: string;

  constructor(
    private readonly s3Service: S3Service,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly eventsGateway: EventsGateway,
  ) {
    this.logger.log('MergeProcessor constructor called');
  }

  onModuleInit() {
    this.logger.log('Initializing MergeProcessor...');
    this.tempDir = this.configService.get<string>('TEMP_DIR', './tmp');
    fs.ensureDirSync(this.tempDir);
    this.logger.log(`MergeProcessor initialized with tempDir: ${this.tempDir}`);
  }

  @Process('merge-job')
  async handleMerge(job: Job) {
    const { jobId, files, options } = job.data as {
      jobId: string;
      files: { fileKey: string }[];
      options: { outputFilename?: string };
    };
    this.logger.log(`Processing job ${jobId}`);

    const jobDir = path.join(this.tempDir, jobId);
    await fs.ensureDir(jobDir);

    try {
      // 1. Update Status to PROCESSING
      await this.prisma.job.update({
        where: { id: jobId },
        data: { status: MergeJobStatus.PROCESSING, progress: 10 },
      });
      this.eventsGateway.emitProgress(jobId, 10, MergeJobStatus.PROCESSING);

      // 2. Download Files
      const localFilePaths: string[] = [];
      for (const [index, file] of files.entries()) {
        const localPath = path.join(
          jobDir,
          `${index}-${path.basename(file.fileKey)}`,
        );
        await this.s3Service.downloadFile(file.fileKey, localPath);
        localFilePaths.push(localPath);

        // Update progress (10% to 50%)
        const progress = 10 + Math.round(((index + 1) / files.length) * 40);
        await job.progress(progress);
        await this.prisma.job.update({
          where: { id: jobId },
          data: { progress },
        });
        this.eventsGateway.emitProgress(
          jobId,
          progress,
          MergeJobStatus.PROCESSING,
        );
      }

      // 3. Merge Files (Using pdf-lib for cross-platform compatibility)
      // Note: For production with qpdf, we would use execa('qpdf', args) here.
      const mergedPdf = await PDFDocument.create();

      for (const filePath of localFilePaths) {
        const fileBuffer = await fs.readFile(filePath);
        const pdf = await PDFDocument.load(fileBuffer);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices(),
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      const outputFilename = options?.outputFilename || `merged-${jobId}.pdf`;
      const outputPath = path.join(jobDir, outputFilename);
      await fs.writeFile(outputPath, mergedPdfBytes);

      // Update progress (50% to 80%)
      await job.progress(80);
      await this.prisma.job.update({
        where: { id: jobId },
        data: { progress: 80 },
      });
      this.eventsGateway.emitProgress(jobId, 80, MergeJobStatus.PROCESSING);

      // 4. Upload Result
      const resultKey = `merged/${jobId}/${outputFilename}`;
      await this.s3Service.uploadFile(resultKey, outputPath, 'application/pdf');

      // 5. Update Status to COMPLETED
      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: MergeJobStatus.COMPLETED,
          progress: 100,
          resultKey,
        },
      });
      this.eventsGateway.emitProgress(
        jobId,
        100,
        MergeJobStatus.COMPLETED,
        resultKey,
      );

      this.logger.log(`Job ${jobId} completed successfully`);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Job ${jobId} failed: ${err.message}`, err.stack);

      await this.prisma.job.update({
        where: { id: jobId },
        data: {
          status: MergeJobStatus.FAILED,
          error: err.message,
        },
      });
      this.eventsGateway.emitProgress(jobId, 0, MergeJobStatus.FAILED);

      throw err;
    } finally {
      // 6. Cleanup
      await fs.remove(jobDir);
    }
  }
}
