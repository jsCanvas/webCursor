"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_module_1 = require("./config/config.module");
const persistence_module_1 = require("./persistence/persistence.module");
const health_module_1 = require("./common/health/health.module");
const request_id_middleware_1 = require("./common/request-id.middleware");
const model_config_module_1 = require("./model-config/model-config.module");
const projects_module_1 = require("./projects/projects.module");
const git_module_1 = require("./git/git.module");
const files_module_1 = require("./files/files.module");
const attachments_module_1 = require("./attachments/attachments.module");
const agent_module_1 = require("./agent/agent.module");
const chat_module_1 = require("./chat/chat.module");
const skills_module_1 = require("./skills/skills.module");
const mcp_module_1 = require("./mcp/mcp.module");
const runtime_module_1 = require("./runtime/runtime.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(request_id_middleware_1.RequestIdMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_module_1.AppConfigModule,
            persistence_module_1.PersistenceModule,
            health_module_1.HealthModule,
            model_config_module_1.ModelConfigModule,
            projects_module_1.ProjectsModule,
            git_module_1.GitModule,
            files_module_1.FilesModule,
            attachments_module_1.AttachmentsModule,
            skills_module_1.SkillsModule,
            mcp_module_1.McpModule,
            agent_module_1.AgentModule,
            chat_module_1.ChatModule,
            runtime_module_1.RuntimeModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map