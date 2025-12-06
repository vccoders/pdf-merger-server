import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { CreateMergeJobDto } from './dto/create-merge-job.dto';
import { MergeService } from './merge.service';

@Controller('merge')
export class MergeController {
  private readonly logger = new Logger(MergeController.name);

  constructor(private readonly mergeService: MergeService) { }

  @Post()
  async createMergeJob(@Body() createMergeJobDto: CreateMergeJobDto) {
    this.logger.log(`Received merge job request with ${createMergeJobDto.files.length} files`);
    const job = await this.mergeService.createJob(createMergeJobDto);
    this.logger.log(`Created job ${job.id}, status: ${job.status}`);
    return job;
  }

  @SkipThrottle()
  @Get('jobs/:id')
  async getJobStatus(@Param('id') id: string) {
    const job = await this.mergeService.getJob(id);
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  @SkipThrottle()
  @Get('jobs/:id/download')
  async getDownloadUrl(@Param('id') id: string) {
    return this.mergeService.getDownloadUrl(id);
  }
}
