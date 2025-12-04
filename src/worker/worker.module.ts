import { Module } from '@nestjs/common';
import { MergeProcessor } from './merge.processor';
import { S3Module } from '../s3/s3.module';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule, S3Module, PrismaModule, QueueModule],
  providers: [MergeProcessor],
  exports: [MergeProcessor],
})
export class WorkerModule {}
