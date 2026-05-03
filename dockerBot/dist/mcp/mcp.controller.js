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
exports.McpController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const mcp_service_1 = require("./mcp.service");
const TRANSPORTS = ['stdio', 'http', 'sse'];
class CreateMcpDto {
    name;
    transport;
    config;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[a-z][a-z0-9_-]{1,40}$/),
    __metadata("design:type", String)
], CreateMcpDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(TRANSPORTS),
    __metadata("design:type", String)
], CreateMcpDto.prototype, "transport", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateMcpDto.prototype, "config", void 0);
class UpdateMcpDto {
    transport;
    config;
    enabled;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TRANSPORTS),
    __metadata("design:type", String)
], UpdateMcpDto.prototype, "transport", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], UpdateMcpDto.prototype, "config", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateMcpDto.prototype, "enabled", void 0);
let McpController = class McpController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    list() {
        return this.svc.list();
    }
    create(dto) {
        return this.svc.create(dto);
    }
    update(id, dto) {
        return this.svc.update(id, dto);
    }
    remove(id) {
        this.svc.delete(id);
    }
    test(id) {
        return this.svc.probe(id);
    }
};
exports.McpController = McpController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], McpController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateMcpDto]),
    __metadata("design:returntype", void 0)
], McpController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateMcpDto]),
    __metadata("design:returntype", void 0)
], McpController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], McpController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/test'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], McpController.prototype, "test", null);
exports.McpController = McpController = __decorate([
    (0, common_1.Controller)('mcp-servers'),
    __metadata("design:paramtypes", [mcp_service_1.McpService])
], McpController);
//# sourceMappingURL=mcp.controller.js.map