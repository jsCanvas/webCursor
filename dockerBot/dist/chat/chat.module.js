"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatModule = void 0;
const common_1 = require("@nestjs/common");
const agent_module_1 = require("../agent/agent.module");
const attachments_module_1 = require("../attachments/attachments.module");
const mcp_module_1 = require("../mcp/mcp.module");
const model_config_module_1 = require("../model-config/model-config.module");
const projects_module_1 = require("../projects/projects.module");
const skills_module_1 = require("../skills/skills.module");
const chat_controller_1 = require("./chat.controller");
const chat_service_1 = require("./chat.service");
const sessions_repository_1 = require("./sessions.repository");
let ChatModule = class ChatModule {
};
exports.ChatModule = ChatModule;
exports.ChatModule = ChatModule = __decorate([
    (0, common_1.Module)({
        imports: [
            projects_module_1.ProjectsModule,
            model_config_module_1.ModelConfigModule,
            skills_module_1.SkillsModule,
            mcp_module_1.McpModule,
            attachments_module_1.AttachmentsModule,
            agent_module_1.AgentModule,
        ],
        controllers: [chat_controller_1.ChatController],
        providers: [chat_service_1.ChatService, sessions_repository_1.SessionsRepository],
        exports: [chat_service_1.ChatService],
    })
], ChatModule);
//# sourceMappingURL=chat.module.js.map