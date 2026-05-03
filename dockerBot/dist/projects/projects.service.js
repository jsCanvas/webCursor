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
var ProjectsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const encryption_service_1 = require("../config/encryption.service");
const errors_1 = require("../common/errors");
const git_service_1 = require("../git/git.service");
const project_path_service_1 = require("./project-path.service");
const projects_repository_1 = require("./projects.repository");
const RESERVED_SLUGS = new Set(['api', 'traefik', 'admin', 'www', 'phonebot']);
let ProjectsService = ProjectsService_1 = class ProjectsService {
    repo;
    path;
    encryption;
    git;
    config;
    logger = new common_1.Logger(ProjectsService_1.name);
    constructor(repo, path, encryption, git, config) {
        this.repo = repo;
        this.path = path;
        this.encryption = encryption;
        this.git = git;
        this.config = config;
    }
    async create(dto) {
        const id = makeProjectId();
        const slug = dto.slug ?? this.deriveSlug(dto.name, id);
        if (RESERVED_SLUGS.has(slug))
            throw new errors_1.SlugConflictError(slug);
        if (this.repo.findBySlug(slug))
            throw new errors_1.SlugConflictError(slug);
        const workdir = await this.path.workdir(id);
        const now = new Date().toISOString();
        const row = {
            id,
            name: dto.name,
            slug,
            git_url: dto.gitUrl ?? null,
            git_token_enc: dto.gitToken ? this.encryption.encrypt(dto.gitToken) : null,
            default_branch: dto.defaultBranch ?? 'main',
            workdir,
            status: dto.gitUrl ? 'cloning' : 'ready',
            last_error: null,
            created_at: now,
            updated_at: now,
        };
        this.repo.insert(row);
        if (dto.gitUrl) {
            setImmediate(() => {
                void this.startClone(id);
            });
        }
        return this.toDto(this.repo.findById(id));
    }
    list() {
        return this.repo.list().map((r) => this.toDto(r));
    }
    findById(id) {
        const row = this.repo.findById(id);
        if (!row)
            throw new errors_1.ProjectNotFoundError(id);
        return this.toDto(row);
    }
    async delete(id, force) {
        const row = this.repo.findById(id);
        if (!row)
            throw new errors_1.ProjectNotFoundError(id);
        this.repo.delete(id);
        if (force) {
            await this.path.destroy(id);
        }
    }
    async retryClone(id) {
        const row = this.repo.findById(id);
        if (!row)
            throw new errors_1.ProjectNotFoundError(id);
        if (!row.git_url)
            return this.toDto(row);
        this.repo.update(id, {
            status: 'cloning',
            last_error: null,
            updated_at: new Date().toISOString(),
        });
        setImmediate(() => {
            void this.startClone(id);
        });
        return this.findById(id);
    }
    resolveGitToken(id) {
        const row = this.repo.findById(id);
        if (!row)
            throw new errors_1.ProjectNotFoundError(id);
        if (!row.git_token_enc)
            return null;
        return this.encryption.decrypt(row.git_token_enc);
    }
    rawRow(id) {
        const row = this.repo.findById(id);
        if (!row)
            throw new errors_1.ProjectNotFoundError(id);
        return row;
    }
    async startClone(id) {
        const row = this.repo.findById(id);
        if (!row || !row.git_url)
            return;
        const token = row.git_token_enc ? this.encryption.decrypt(row.git_token_enc) : undefined;
        try {
            await this.git.clone({
                workdir: row.workdir,
                url: row.git_url,
                token,
                branch: row.default_branch,
            });
            this.repo.update(id, { status: 'ready', updated_at: new Date().toISOString() });
            this.logger.log(`Project ${id} cloned successfully`);
        }
        catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            this.repo.update(id, {
                status: 'error',
                last_error: msg.slice(0, 1000),
                updated_at: new Date().toISOString(),
            });
            this.logger.error(`Project ${id} clone failed: ${msg}`);
        }
    }
    deriveSlug(name, id) {
        const base = name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 24);
        if (!base)
            return `proj-${id.slice(0, 6)}`;
        if (this.repo.findBySlug(base)) {
            return `${base}-${id.slice(0, 6)}`;
        }
        return base;
    }
    toDto(row) {
        const baseDomain = this.config.get('PHONEBOT_BASE_DOMAIN', { infer: true });
        const profile = this.config.get('PHONEBOT_PROFILE', { infer: true });
        const proto = profile === 'production' ? 'https' : 'http';
        return {
            id: row.id,
            name: row.name,
            slug: row.slug,
            gitUrl: row.git_url,
            hasGitToken: !!row.git_token_enc,
            defaultBranch: row.default_branch,
            workdir: row.workdir,
            status: row.status,
            lastError: row.last_error,
            previewUrl: `${proto}://${row.slug}.${baseDomain}`,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = ProjectsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [projects_repository_1.ProjectsRepository,
        project_path_service_1.ProjectPathService,
        encryption_service_1.EncryptionService,
        git_service_1.GitService,
        config_1.ConfigService])
], ProjectsService);
function makeProjectId() {
    const t = Date.now().toString(36);
    const r = (0, crypto_1.randomUUID)().replace(/-/g, '').slice(0, 8);
    return `p-${t}-${r}`;
}
//# sourceMappingURL=projects.service.js.map