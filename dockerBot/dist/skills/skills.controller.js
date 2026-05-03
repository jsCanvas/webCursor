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
exports.SkillsController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const skills_service_1 = require("./skills.service");
class CreateSkillDto {
    name;
    description;
    body;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[a-z][a-z0-9-]{1,40}$/),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(50_000),
    __metadata("design:type", String)
], CreateSkillDto.prototype, "body", void 0);
class UpdateSkillDto {
    description;
    body;
    enabled;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateSkillDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50_000),
    __metadata("design:type", String)
], UpdateSkillDto.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateSkillDto.prototype, "enabled", void 0);
let SkillsController = class SkillsController {
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
    toggle(id) {
        return this.svc.toggle(id);
    }
    remove(id) {
        this.svc.delete(id);
    }
};
exports.SkillsController = SkillsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SkillsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [CreateSkillDto]),
    __metadata("design:returntype", void 0)
], SkillsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, UpdateSkillDto]),
    __metadata("design:returntype", void 0)
], SkillsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/toggle'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SkillsController.prototype, "toggle", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SkillsController.prototype, "remove", null);
exports.SkillsController = SkillsController = __decorate([
    (0, common_1.Controller)('skills'),
    __metadata("design:paramtypes", [skills_service_1.SkillsService])
], SkillsController);
//# sourceMappingURL=skills.controller.js.map