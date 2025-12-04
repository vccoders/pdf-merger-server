"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const merge_module_1 = require("./merge/merge.module");
const upload_module_1 = require("./upload/upload.module");
const prisma_module_1 = require("./prisma/prisma.module");
const worker_module_1 = require("./worker/worker.module");
const events_module_1 = require("./events/events.module");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const logger_module_1 = require("./common/logger/logger.module");
const health_module_1 = require("./health/health.module");
const bull_board_module_1 = require("./queue/bull-board.module");
const env_validation_1 = require("./config/env.validation");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                validationSchema: env_validation_1.validationSchema,
                validationOptions: {
                    abortEarly: false,
                },
            }),
            logger_module_1.CustomLoggerModule,
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => [{
                        ttl: config.get('THROTTLE_TTL', 60000),
                        limit: config.get('THROTTLE_LIMIT', 10),
                    }],
            }),
            prisma_module_1.PrismaModule,
            merge_module_1.MergeModule,
            upload_module_1.UploadModule,
            worker_module_1.WorkerModule,
            events_module_1.EventsModule,
            health_module_1.HealthModule,
            bull_board_module_1.BullBoardConfigModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map