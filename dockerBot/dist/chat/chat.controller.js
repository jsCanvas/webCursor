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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const chat_service_1 = require("./chat.service");
class CreateSessionDto {
    title;
}
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateSessionDto.prototype, "title", void 0);
class SendMessageDto {
    text;
    attachmentIds;
    skills;
    mcpServers;
    abortPrevious;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(50_000),
    __metadata("design:type", String)
], SendMessageDto.prototype, "text", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(20),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SendMessageDto.prototype, "attachmentIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(20),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SendMessageDto.prototype, "skills", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(20),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SendMessageDto.prototype, "mcpServers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SendMessageDto.prototype, "abortPrevious", void 0);
let ChatController = class ChatController {
    svc;
    constructor(svc) {
        this.svc = svc;
    }
    createSession(id, dto) {
        return this.svc.createSession({ projectId: id, title: dto.title });
    }
    listSessions(id) {
        return this.svc.listSessions(id);
    }
    getSession(sid) {
        return this.svc.findSession(sid);
    }
    deleteSession(sid) {
        this.svc.deleteSession(sid);
    }
    listMessages(sid, limit, before) {
        return this.svc.listMessages(sid, limit ? parseInt(limit, 10) : undefined, before);
    }
    async sendMessage(sid, dto, res) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders?.();
        const observable = this.svc.send({
            sessionId: sid,
            text: dto.text,
            attachmentIds: dto.attachmentIds,
            skills: dto.skills,
            mcpServers: dto.mcpServers,
            abortPrevious: dto.abortPrevious,
        });
        const aborter = () => this.svc.abort(sid);
        res.on('close', aborter);
        const sub = observable.subscribe({
            next: (event) => {
                const { type, ...rest } = event;
                res.write(`event: ${type}\n`);
                res.write(`data: ${JSON.stringify(rest)}\n\n`);
            },
            error: (err) => {
                res.write(`event: error\n`);
                res.write(`data: ${JSON.stringify({ code: 'stream_error', message: err.message })}\n\n`);
                res.end();
            },
            complete: () => {
                res.end();
            },
        });
        res.on('close', () => sub.unsubscribe());
    }
    abort(sid) {
        return { aborted: this.svc.abort(sid) };
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)('projects/:id/sessions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, CreateSessionDto]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('projects/:id/sessions'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "listSessions", null);
__decorate([
    (0, common_1.Get)('sessions/:sid'),
    __param(0, (0, common_1.Param)('sid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "getSession", null);
__decorate([
    (0, common_1.Delete)('sessions/:sid'),
    (0, common_1.HttpCode)(204),
    __param(0, (0, common_1.Param)('sid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "deleteSession", null);
__decorate([
    (0, common_1.Get)('sessions/:sid/messages'),
    __param(0, (0, common_1.Param)('sid')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('before')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "listMessages", null);
__decorate([
    (0, common_1.Post)('sessions/:sid/messages'),
    __param(0, (0, common_1.Param)('sid')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, SendMessageDto, Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
__decorate([
    (0, common_1.Post)('sessions/:sid/abort'),
    __param(0, (0, common_1.Param)('sid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "abort", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map