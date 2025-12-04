"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomLoggerModule = void 0;
const common_1 = require("@nestjs/common");
const nestjs_pino_1 = require("nestjs-pino");
const config_1 = require("@nestjs/config");
let CustomLoggerModule = class CustomLoggerModule {
};
exports.CustomLoggerModule = CustomLoggerModule;
exports.CustomLoggerModule = CustomLoggerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            nestjs_pino_1.LoggerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    pinoHttp: {
                        level: config.get('LOG_LEVEL', 'info'),
                        transport: config.get('NODE_ENV') === 'development'
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
        exports: [nestjs_pino_1.LoggerModule],
    })
], CustomLoggerModule);
//# sourceMappingURL=logger.module.js.map