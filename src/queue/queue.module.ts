import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

const isSyncMode = process.env.SYNC_PROCESSING === 'true';

// Mock queue provider for serverless
const mockQueueProvider = {
  provide: 'BullQueue_merge-queue',
  useValue: {
    add: async () => ({ id: 'mock' }),
    process: () => { },
    on: () => { },
  },
};

@Global()
@Module({})
export class QueueModule {
  static async register(): Promise<DynamicModule> {
    if (isSyncMode) {
      // Serverless mode - return mock queue (no Redis needed)
      return {
        module: QueueModule,
        providers: [mockQueueProvider],
        exports: ['BullQueue_merge-queue'],
      };
    }

    // Standard mode - dynamically import Bull
    const { BullModule } = await import('@nestjs/bull');

    return {
      module: QueueModule,
      imports: [
        BullModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            redis: {
              host: configService.get('REDIS_HOST', 'localhost'),
              port: configService.get('REDIS_PORT', 6379),
              password: configService.get('REDIS_PASSWORD'),
            },
          }),
          inject: [ConfigService],
        }),
        BullModule.registerQueue({
          name: 'merge-queue',
        }),
      ],
      exports: [BullModule],
    };
  }
}
