import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import helmet from 'helmet';
import compression from 'compression';
import { Logger } from 'nestjs-pino';
import * as Sentry from '@sentry/node';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Initialize Sentry
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(
        process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1',
      ),
    });
  }

  // Use Pino logger
  app.useLogger(app.get(Logger));

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(compression());

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Disabled versioning for simpler routes
  // app.enableVersioning({
  //   type: VersioningType.URI,
  //   defaultVersion: '1',
  // });

  app.setGlobalPrefix('api');

  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
void bootstrap();
