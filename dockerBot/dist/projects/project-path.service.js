"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ProjectPathService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectPathService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const errors_1 = require("../common/errors");
let ProjectPathService = ProjectPathService_1 = class ProjectPathService {
    logger = new common_1.Logger(ProjectPathService_1.name);
    hostBase;
    sandboxBase;
    constructor(config) {
        this.hostBase = path.resolve(config.get('PHONEBOT_DATA_DIR', { infer: true }), 'projects');
        this.sandboxBase = config.get('PHONEBOT_SANDBOX_WORKDIR_BASE', { infer: true });
    }
    async workdir(projectId) {
        this.assertSafeId(projectId);
        const dir = path.join(this.hostBase, projectId);
        await fs.promises.mkdir(dir, { recursive: true });
        return await fs.promises.realpath(dir);
    }
    sandboxWorkdir(projectId) {
        this.assertSafeId(projectId);
        return path.posix.join(this.sandboxBase, projectId);
    }
    async resolveSafe(projectId, relPath) {
        if (typeof relPath !== 'string')
            throw new errors_1.PathTraversalError(String(relPath));
        if (relPath.includes('\0'))
            throw new errors_1.PathTraversalError(relPath);
        const root = await this.workdir(projectId);
        const joined = path.resolve(root, relPath || '.');
        let real;
        try {
            real = await fs.promises.realpath(joined);
        }
        catch {
            real = joined;
        }
        if (real !== root && !real.startsWith(root + path.sep)) {
            throw new errors_1.PathTraversalError(relPath);
        }
        return real;
    }
    async destroy(projectId) {
        this.assertSafeId(projectId);
        const dir = path.join(this.hostBase, projectId);
        if (!fs.existsSync(dir))
            return;
        await fs.promises.rm(dir, { recursive: true, force: true });
        this.logger.warn(`Destroyed workdir for project ${projectId}`);
    }
    assertSafeId(id) {
        if (!/^[A-Za-z0-9_-]{6,64}$/.test(id)) {
            throw new errors_1.PathTraversalError(`unsafe project id: ${id}`);
        }
    }
};
exports.ProjectPathService = ProjectPathService;
exports.ProjectPathService = ProjectPathService = ProjectPathService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ProjectPathService);
//# sourceMappingURL=project-path.service.js.map