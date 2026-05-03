"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentModule = void 0;
const common_1 = require("@nestjs/common");
const mcp_module_1 = require("../mcp/mcp.module");
const model_config_module_1 = require("../model-config/model-config.module");
const skills_module_1 = require("../skills/skills.module");
const agent_runner_service_1 = require("./agent-runner.service");
const claude_stream_parser_1 = require("./claude-stream.parser");
const sandbox_prep_service_1 = require("./sandbox-prep.service");
let AgentModule = class AgentModule {
};
exports.AgentModule = AgentModule;
exports.AgentModule = AgentModule = __decorate([
    (0, common_1.Module)({
        imports: [model_config_module_1.ModelConfigModule, skills_module_1.SkillsModule, mcp_module_1.McpModule],
        providers: [agent_runner_service_1.AgentRunnerService, sandbox_prep_service_1.SandboxPrepService, claude_stream_parser_1.ClaudeStreamParser],
        exports: [agent_runner_service_1.AgentRunnerService, sandbox_prep_service_1.SandboxPrepService],
    })
], AgentModule);
//# sourceMappingURL=agent.module.js.map