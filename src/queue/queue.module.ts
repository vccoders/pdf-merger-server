import { Module, DynamicModule, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({})
export class QueueModule {
  static register(): DynamicModule {
    // Check if we're in serverless mode
    const isSyncMode = process.env.SYNC_PROCESSING === 'true';

    if (isSyncMode) {
      // Return mock queue module (no Bull dependencies)
      return {
        module: QueueModule,
        providers: [
          {
            provide: 'BullQueue_merge-queue',
            useValue: {
              add: () => Promise.resolve({ id: 'mock-job' }),
              process: () => {},
              on: () => {},
            },
          },
        ],
        exports: ['BullQueue_merge-queue'],
      };
    }

    // Standard mode with real Bull Queue
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
