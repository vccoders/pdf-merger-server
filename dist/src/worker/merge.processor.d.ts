import { Job } from 'bull';
import { S3Service } from '../s3/s3.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EventsGateway } from '../events/events.gateway';
export declare class MergeProcessor {
    private readonly s3Service;
    private readonly prisma;
    private readonly configService;
    private readonly eventsGateway;
    private readonly logger;
    private tempDir;
    private initialized;
    constructor(s3Service: S3Service, prisma: PrismaService, configService: ConfigService, eventsGateway: EventsGateway);
    private ensureInitialized;
    handleMerge(job: Job): Promise<void>;
}
