import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../src/app.module';
import serverless from 'serverless-http';
import { ValidationPipe } from '@nestjs/common';

let server: any;

async function bootstrap() {
    try {
        const app = await NestFactory.create(AppModule, {
            logger: ['error', 'warn', 'log'],
            abortOnError: false, // Don't abort on validation errors in serverless
        });
        app.setGlobalPrefix('api');
        app.enableCors({
            origin: '*',
            methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
            credentials: true,
        });
        app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
        await app.init();

        const expressApp = app.getHttpAdapter().getInstance();
        return serverless(expressApp);
    } catch (error) {
        console.error('Failed to bootstrap NestJS application:', error);
        throw error;
    }
}

export const handler = async (event: any, context: any) => {
    if (!server) {
        server = await bootstrap();
    }
    return server(event, context);
};
