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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttachmentsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const project_path_service_1 = require("../projects/project-path.service");
const attachments_repository_1 = require("./attachments.repository");
let AttachmentsService = class AttachmentsService {
    repo;
    path;
    constructor(repo, path) {
        this.repo = repo;
        this.path = path;
    }
    async ingest(projectId, file, sessionId) {
        const id = (0, crypto_1.randomUUID)();
        const safeName = sanitizeFilename(file.originalname || 'upload.bin');
        const relDir = path.posix.join('.phonebot', 'attachments');
        const relPath = path.posix.join(relDir, `${id}-${safeName}`);
        const absDir = await this.path.resolveSafe(projectId, relDir);
        await fs.promises.mkdir(absDir, { recursive: true });
        const abs = await this.path.resolveSafe(projectId, relPath);
        await fs.promises.writeFile(abs, file.buffer);
        const row = {
            id,
            project_id: projectId,
            session_id: sessionId ?? null,
            filename: safeName,
            mime_type: file.mimetype || 'application/octet-stream',
            size_bytes: file.size,
            rel_path: relPath,
            created_at: new Date().toISOString(),
        };
        this.repo.insert(row);
        return this.toDto(row);
    }
    resolve(ids) {
        return this.repo.findByIds(ids);
    }
    list(projectId) {
        return this.repo.listByProject(projectId).map((r) => this.toDto(r));
    }
    toDto(r) {
        return {
            id: r.id,
            filename: r.filename,
            mimeType: r.mime_type,
            size: r.size_bytes,
            relPath: r.rel_path,
            createdAt: r.created_at,
        };
    }
};
exports.AttachmentsService = AttachmentsService;
exports.AttachmentsService = AttachmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [attachments_repository_1.AttachmentsRepository,
        project_path_service_1.ProjectPathService])
], AttachmentsService);
function sanitizeFilename(name) {
    return name.replace(/[^A-Za-z0-9._-]+/g, '_').slice(0, 96) || 'upload.bin';
}
//# sourceMappingURL=attachments.service.js.map