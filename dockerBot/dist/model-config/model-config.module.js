"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelConfigModule = void 0;
const common_1 = require("@nestjs/common");
const model_config_controller_1 = require("./model-config.controller");
const model_config_repository_1 = require("./model-config.repository");
const model_config_service_1 = require("./model-config.service");
let ModelConfigModule = class ModelConfigModule {
};
exports.ModelConfigModule = ModelConfigModule;
exports.ModelConfigModule = ModelConfigModule = __decorate([
    (0, common_1.Module)({
        controllers: [model_config_controller_1.ModelConfigController],
        providers: [model_config_service_1.ModelConfigService, model_config_repository_1.ModelConfigRepository],
        exports: [model_config_service_1.ModelConfigService],
    })
], ModelConfigModule);
//# sourceMappingURL=model-config.module.js.map