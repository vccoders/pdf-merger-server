import { Controller, Post, Body, Get, Param, NotFoundException } from '@nestjs/common';
import { CreateMergeJobDto } from './dto/create-merge-job.dto';
import { MergeService } from './merge.service';

@Controller('merge')
export class MergeController {
    constructor(private readonly mergeService: MergeService) { }

    @Post()
    async createMergeJob(@Body() createMergeJobDto: CreateMergeJobDto) {
        return this.mergeService.createJob(createMergeJobDto);
    }

    @Get('jobs/:id')
    async getJobStatus(@Param('id') id: string) {
        const job = await this.mergeService.getJob(id);
        if (!job) {
            throw new NotFoundException('Job not found');
        }
        return job;
    }

    @Get('jobs/:id/download')
    async getDownloadUrl(@Param('id') id: string) {
        return this.mergeService.getDownloadUrl(id);
    }
}
