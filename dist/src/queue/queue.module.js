"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var QueueModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const config_1 = require("@nestjs/config");
let QueueModule = QueueModule_1 = class QueueModule {
    static register() {
        const isSyncMode = process.env.SYNC_PROCESSING === 'true';
        if (isSyncMode) {
            return {
                module: QueueModule_1,
                providers: [
                    {
                        provide: 'BullQueue_merge-queue',
                        useValue: {
                            add: async () => ({ id: 'mock-job' }),
                            process: () => { },
                            on: () => { },
                        },
                    },
                ],
                exports: ['BullQueue_merge-queue'],
            };
        }
        return {
            module: QueueModule_1,
            imports: [
                bull_1.BullModule.forRootAsync({
                    imports: [config_1.ConfigModule],
                    useFactory: (configService) => ({
                        redis: {
                            host: configService.get('REDIS_HOST', 'localhost'),
                            port: configService.get('REDIS_PORT', 6379),
                            password: configService.get('REDIS_PASSWORD'),
                        },
                    }),
                    inject: [config_1.ConfigService],
                }),
                bull_1.BullModule.registerQueue({
                    name: 'merge-queue',
                }),
            ],
            exports: [bull_1.BullModule],
        };
    }
};
exports.QueueModule = QueueModule;
exports.QueueModule = QueueModule = QueueModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], QueueModule);
//# sourceMappingURL=queue.module.js.map