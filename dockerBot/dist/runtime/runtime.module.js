"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeModule = void 0;
const common_1 = require("@nestjs/common");
const projects_module_1 = require("../projects/projects.module");
const compose_template_service_1 = require("./compose-template.service");
const runtime_controller_1 = require("./runtime.controller");
const runtime_service_1 = require("./runtime.service");
const runtimes_repository_1 = require("./runtimes.repository");
let RuntimeModule = class RuntimeModule {
};
exports.RuntimeModule = RuntimeModule;
exports.RuntimeModule = RuntimeModule = __decorate([
    (0, common_1.Module)({
        imports: [projects_module_1.ProjectsModule],
        controllers: [runtime_controller_1.RuntimeController],
        providers: [runtime_service_1.RuntimeService, runtimes_repository_1.RuntimesRepository, compose_template_service_1.ComposeTemplateService],
        exports: [runtime_service_1.RuntimeService],
    })
], RuntimeModule);
//# sourceMappingURL=runtime.module.js.map