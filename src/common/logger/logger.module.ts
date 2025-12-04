import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        LoggerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                pinoHttp: {
                    level: config.get('LOG_LEVEL', 'info'),
                    transport:
                        config.get('NODE_ENV') === 'development'
                            ? {
                                target: 'pino-pretty',
                                options: {
                                    colorize: true,
                                    singleLine: true,
                                    translateTime: 'SYS:standard',
                                },
                            }
                            : undefined,
                    serializers: {
                        req: (req) => ({
                            id: req.id,
                            method: req.method,
                            url: req.url,
                        }),
                        res: (res) => ({
                            statusCode: res.statusCode,
                        }),
                    },
                    redact: {
                        paths: ['req.headers.authorization', 'req.headers.cookie'],
                        remove: true,
                    },
                },
            }),
        }),
    ],
    exports: [LoggerModule],
})
export class CustomLoggerModule { }
