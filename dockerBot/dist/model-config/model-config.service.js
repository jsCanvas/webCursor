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
var ModelConfigService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelConfigService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const encryption_service_1 = require("../config/encryption.service");
const errors_1 = require("../common/errors");
const model_config_repository_1 = require("./model-config.repository");
let ModelConfigService = ModelConfigService_1 = class ModelConfigService {
    repo;
    encryption;
    logger = new common_1.Logger(ModelConfigService_1.name);
    constructor(repo, encryption) {
        this.repo = repo;
        this.encryption = encryption;
    }
    create(dto) {
        const id = (0, crypto_1.randomUUID)();
        const now = new Date().toISOString();
        const apiKeyEnc = this.encryption.encrypt(dto.apiKey);
        const isActive = dto.activate || this.repo.list().length === 0 ? 1 : 0;
        this.repo.insert({
            id,
            name: dto.name,
            base_url: dto.baseUrl,
            api_key_enc: apiKeyEnc,
            model: dto.model,
            is_active: isActive,
            created_at: now,
            updated_at: now,
        });
        if (dto.activate) {
            this.repo.activate(id);
        }
        return this.findById(id);
    }
    update(id, dto) {
        const row = this.repo.findById(id);
        if (!row)
            throw new errors_1.ModelConfigNotFoundError(id);
        const patch = { updated_at: new Date().toISOString() };
        if (dto.name !== undefined)
            patch.name = dto.name;
        if (dto.baseUrl !== undefined)
            patch.base_url = dto.baseUrl;
        if (dto.model !== undefined)
            patch.model = dto.model;
        if (dto.apiKey !== undefined)
            patch.api_key_enc = this.encryption.encrypt(dto.apiKey);
        this.repo.update(id, patch);
        return this.findById(id);
    }
    delete(id) {
        const row = this.repo.findById(id);
        if (!row)
            throw new errors_1.ModelConfigNotFoundError(id);
        this.repo.delete(id);
    }
    activate(id) {
        const row = this.repo.findById(id);
        if (!row)
            throw new errors_1.ModelConfigNotFoundError(id);
        this.repo.activate(id);
        return this.findById(id);
    }
    findById(id) {
        const row = this.repo.findById(id);
        if (!row)
            throw new errors_1.ModelConfigNotFoundError(id);
        return this.toDto(row);
    }
    list() {
        return this.repo.list().map((r) => this.toDto(r));
    }
    resolveActive() {
        const row = this.repo.findActive();
        if (!row)
            return null;
        return {
            id: row.id,
            name: row.name,
            baseUrl: row.base_url,
            apiKey: this.encryption.decrypt(row.api_key_enc),
            model: row.model,
        };
    }
    resolveById(id) {
        const row = this.repo.findById(id);
        if (!row)
            throw new errors_1.ModelConfigNotFoundError(id);
        return {
            id: row.id,
            name: row.name,
            baseUrl: row.base_url,
            apiKey: this.encryption.decrypt(row.api_key_enc),
            model: row.model,
        };
    }
    async probe(id) {
        const cfg = this.resolveById(id);
        const url = cfg.baseUrl.replace(/\/$/, '') + '/models';
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 5000);
        try {
            const res = await fetch(url, {
                headers: { Authorization: `Bearer ${cfg.apiKey}` },
                signal: ctrl.signal,
            });
            return { ok: res.ok, status: res.status };
        }
        catch (e) {
            const error = e instanceof Error ? e.message : String(e);
            return { ok: false, error };
        }
        finally {
            clearTimeout(timer);
        }
    }
    toDto(row) {
        let masked = '****';
        try {
            masked = encryption_service_1.EncryptionService.mask(this.encryption.decrypt(row.api_key_enc));
        }
        catch (e) {
            this.logger.error(`Failed to decrypt api key for ${row.id}: ${e.message}`);
        }
        return {
            id: row.id,
            name: row.name,
            baseUrl: row.base_url,
            apiKeyMasked: masked,
            model: row.model,
            isActive: row.is_active === 1,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
};
exports.ModelConfigService = ModelConfigService;
exports.ModelConfigService = ModelConfigService = ModelConfigService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [model_config_repository_1.ModelConfigRepository,
        encryption_service_1.EncryptionService])
], ModelConfigService);
//# sourceMappingURL=model-config.service.js.map