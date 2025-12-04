"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const core_1 = require("@nestjs/core");
const app_module_1 = require("../../src/app.module");
const serverless_http_1 = __importDefault(require("serverless-http"));
const common_1 = require("@nestjs/common");
let server;
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    const expressApp = app.getHttpAdapter().getInstance();
    return (0, serverless_http_1.default)(expressApp);
}
const handler = async (event, context) => {
    if (!server) {
        server = await bootstrap();
    }
    return server(event, context);
};
exports.handler = handler;
//# sourceMappingURL=api.js.map