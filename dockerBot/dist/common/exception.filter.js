"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GlobalExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const errors_1 = require("./errors");
let GlobalExceptionFilter = GlobalExceptionFilter_1 = class GlobalExceptionFilter {
    logger = new common_1.Logger(GlobalExceptionFilter_1.name);
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const res = ctx.getResponse();
        const req = ctx.getRequest();
        const requestId = req.headers['x-request-id'] ?? cryptoRandom();
        if (exception instanceof errors_1.DomainError) {
            res.setHeader('x-request-id', requestId);
            res.status(exception.status).json({
                code: exception.code,
                message: exception.message,
                meta: exception.meta ?? null,
                requestId,
            });
            return;
        }
        if (exception instanceof common_1.HttpException) {
            const status = exception.getStatus();
            const resp = exception.getResponse();
            const body = typeof resp === 'string'
                ? { code: 'http_error', message: resp }
                : resp;
            res.setHeader('x-request-id', requestId);
            res.status(status).json({ ...body, requestId });
            return;
        }
        this.logger.error(`Unhandled exception (requestId=${requestId})`, exception instanceof Error ? exception.stack : String(exception));
        res.setHeader('x-request-id', requestId);
        res.status(500).json({
            code: 'internal_error',
            message: 'Internal server error',
            requestId,
        });
    }
};
exports.GlobalExceptionFilter = GlobalExceptionFilter;
exports.GlobalExceptionFilter = GlobalExceptionFilter = GlobalExceptionFilter_1 = __decorate([
    (0, common_1.Catch)()
], GlobalExceptionFilter);
function cryptoRandom() {
    return require('crypto').randomBytes(8).toString('hex');
}
//# sourceMappingURL=exception.filter.js.map