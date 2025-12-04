import { Module } from '@nestjs/common';
import { MergeController } from './merge.controller';
import { MergeService } from './merge.service';
import { QueueModule } from '../queue/queue.module';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Module } from '../s3/s3.module';
import { WorkerModule } from '../worker/worker.module';

@Module({
    imports: [QueueModule, PrismaModule, S3Module, WorkerModule],
    controllers: [MergeController],
    providers: [MergeService],
})
export class MergeModule { }
