import { Module, Global } from '@nestjs/common';

// Mock Bull Queue for serverless - no Redis/Bull dependencies
@Global()
@Module({
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
})
export class MockQueueModule {}
