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
exports.GitController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const errors_1 = require("../common/errors");
const projects_service_1 = require("../projects/projects.service");
const git_service_1 = require("./git.service");
class CommitBodyDto {
    message;
    addAll;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CommitBodyDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CommitBodyDto.prototype, "addAll", void 0);
class PushBodyDto {
    branch;
    checkoutBranch;
    force;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], PushBodyDto.prototype, "branch", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PushBodyDto.prototype, "checkoutBranch", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PushBodyDto.prototype, "force", void 0);
class CommitAndPushBodyDto {
    message;
    addAll;
    branch;
    checkoutBranch;
    force;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], CommitAndPushBodyDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CommitAndPushBodyDto.prototype, "addAll", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], CommitAndPushBodyDto.prototype, "branch", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CommitAndPushBodyDto.prototype, "checkoutBranch", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CommitAndPushBodyDto.prototype, "force", void 0);
let GitController = class GitController {
    git;
    projects;
    constructor(git, projects) {
        this.git = git;
        this.projects = projects;
    }
    status(id) {
        const row = this.projects.rawRow(id);
        return this.git.status(row.workdir);
    }
    diff(id, path) {
        const row = this.projects.rawRow(id);
        return this.git.diff(row.workdir, path);
    }
    commit(id, dto) {
        const row = this.projects.rawRow(id);
        return this.git.commit(row.workdir, dto);
    }
    push(id, dto) {
        const row = this.projects.rawRow(id);
        if (!row.git_url)
            throw new errors_1.GitOperationError('push', 'project has no git url');
        const token = this.projects.resolveGitToken(id) ?? undefined;
        return this.git.push(row.workdir, {
            remoteUrl: row.git_url,
            token,
            branch: dto.branch ?? row.default_branch,
            checkoutBranch: dto.checkoutBranch,
            force: dto.force,
        });
    }
    commitAndPush(id, dto) {
        const row = this.projects.rawRow(id);
        if (!row.git_url)
            throw new errors_1.GitOperationError('push', 'project has no git url');
        const token = this.projects.resolveGitToken(id) ?? undefined;
        return this.git.commitAndPush(row.workdir, {
            message: dto.message,
            addAll: dto.addAll,
            remoteUrl: row.git_url,
            token,
            branch: dto.branch ?? row.default_branch,
            checkoutBranch: dto.checkoutBranch,
            force: dto.force,
        });
    }
};
exports.GitController = GitController;
__decorate([
    (0, common_1.Get)('status'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], GitController.prototype, "status", null);
__decorate([
    (0, common_1.Get)('diff'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('path')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], GitController.prototype, "diff", null);
__decorate([
    (0, common_1.Post)('commit'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CommitBodyDto]),
    __metadata("design:returntype", void 0)
], GitController.prototype, "commit", null);
__decorate([
    (0, common_1.Post)('push'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, PushBodyDto]),
    __metadata("design:returntype", void 0)
], GitController.prototype, "push", null);
__decorate([
    (0, common_1.Post)('commit-and-push'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CommitAndPushBodyDto]),
    __metadata("design:returntype", void 0)
], GitController.prototype, "commitAndPush", null);
exports.GitController = GitController = __decorate([
    (0, common_1.Controller)('projects/:id/git'),
    __metadata("design:paramtypes", [git_service_1.GitService,
        projects_service_1.ProjectsService])
], GitController);
//# sourceMappingURL=git.controller.js.map