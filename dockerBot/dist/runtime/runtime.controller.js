"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const runtime_service_1 = require("./runtime.service");
class UpDto {
    composePath;
    port;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(256),
    __metadata("design:type", String)
], UpDto.prototype, "composePath", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(65535),
    __metadata("design:type", Number)
], UpDto.prototype, "port", void 0);
let RuntimeController = class RuntimeController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    up(id, dto) {
        return this.svc.up({
            projectId: id,
            composePathOverride: dto.composePath,
            port: dto.port,
        });
    }
    down(id) {
        return this.svc.down(id);
    }
    status(id) {
        return this.svc.status(id);
    }
    async logs(id, service, tail, res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();
        const controller = new AbortController();
        res.on('close', () => controller.abort());
        try {
            for await (const item of this.svc.streamLogs(id, {
                service,
                tail: tail ? parseInt(tail, 10) : undefined,
                signal: controller.signal,
            })) {
                res.write(`event: log\n`);
                res.write(`data: ${JSON.stringify(item)}\n\n`);
            }
        }
        catch (e) {
            res.write(`event: error\n`);
            res.write(`data: ${JSON.stringify({ message: e.message })}\n\n`);
        }
        res.end();
    }
};
exports.RuntimeController = RuntimeController;
__decorate([
    (0, common_1.Post)('up'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpDto]),
    __metadata("design:returntype", void 0)
], RuntimeController.prototype, "up", null);
__decorate([
    (0, common_1.Post)('down'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RuntimeController.prototype, "down", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RuntimeController.prototype, "status", null);
__decorate([
    (0, common_1.Get)('logs'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('service')),
    __param(2, (0, common_1.Query)('tail')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], RuntimeController.prototype, "logs", null);
exports.RuntimeController = RuntimeController = __decorate([
    (0, common_1.Controller)('projects/:id/runtime'),
    __metadata("design:paramtypes", [runtime_service_1.RuntimeService])
], RuntimeController);
//# sourceMappingURL=runtime.controller.js.map