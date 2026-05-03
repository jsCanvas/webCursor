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
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const files_service_1 = require("./files.service");
class WriteFileDto {
    path;
    content;
    encoding;
    expectedSha;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(1024),
    __metadata("design:type", String)
], WriteFileDto.prototype, "path", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WriteFileDto.prototype, "content", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['utf8', 'base64']),
    __metadata("design:type", String)
], WriteFileDto.prototype, "encoding", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WriteFileDto.prototype, "expectedSha", void 0);
class MoveFileDto {
    from;
    to;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], MoveFileDto.prototype, "from", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], MoveFileDto.prototype, "to", void 0);
let FilesController = class FilesController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    tree(id, path = '', depth) {
        const parsedDepth = depth === undefined ? undefined : parseInt(depth, 10);
        return this.svc.tree(id, path, parsedDepth !== undefined && Number.isFinite(parsedDepth) && parsedDepth > 0
            ? parsedDepth
            : undefined);
    }
    read(id, path) {
        return this.svc.read(id, path);
    }
    write(id, dto) {
        return this.svc.write(id, dto.path, dto.content, dto.encoding ?? 'utf8', dto.expectedSha);
    }
    async remove(id, path) {
        if (!path)
            throw new common_1.BadRequestException('path is required');
        await this.svc.remove(id, path);
    }
    async move(id, dto) {
        await this.svc.move(id, dto.from, dto.to);
        return { ok: true };
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('path')),
    __param(2, (0, common_1.Query)('depth')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "tree", null);
__decorate([
    (0, common_1.Get)('content'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('path')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "read", null);
__decorate([
    (0, common_1.Put)('content'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, WriteFileDto]),
    __metadata("design:returntype", void 0)
], FilesController.prototype, "write", null);
__decorate([
    (0, common_1.Delete)(),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('path')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('move'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, MoveFileDto]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "move", null);
exports.FilesController = FilesController = __decorate([
    (0, common_1.Controller)('projects/:id/files'),
    __metadata("design:paramtypes", [files_service_1.FilesService])
], FilesController);
//# sourceMappingURL=files.controller.js.map