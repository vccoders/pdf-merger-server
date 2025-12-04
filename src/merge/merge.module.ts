import { Module } from '@nestjs/common';
import { MergeController } from './merge.controller';
import { MergeService } from './merge.service';
import { QueueModule } from '../queue/queue.module';
import { PrismaModule } from '../prisma/prisma.module';
import { S3Module } from '../s3/s3.module';

@Module({
    imports: [QueueModule, PrismaModule, S3Module],
    controllers: [MergeController],
    providers: [MergeService],
})
export class MergeModule { }
