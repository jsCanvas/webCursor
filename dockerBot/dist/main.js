"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const exception_filter_1 = require("./common/exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: false });
    const config = app.get((config_1.ConfigService));
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.useGlobalFilters(new exception_filter_1.GlobalExceptionFilter());
    app.enableCors({
        origin: true,
        credentials: true,
        exposedHeaders: ['x-request-id'],
    });
    app.enableShutdownHooks();
    const port = config.get('PORT', { infer: true });
    await app.listen(port, '0.0.0.0');
    common_1.Logger.log(`dockerBot listening on http://0.0.0.0:${port}/api`, 'Bootstrap');
}
bootstrap().catch((err) => {
    console.error('Fatal bootstrap error:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map