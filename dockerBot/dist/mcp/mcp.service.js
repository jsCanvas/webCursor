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
var McpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.McpService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const encryption_service_1 = require("../config/encryption.service");
const mcp_repository_1 = require("./mcp.repository");
const ENCRYPTED_FIELDS_BY_TRANSPORT = {
    stdio: ['env'],
    http: ['headers'],
    sse: ['headers'],
};
let McpService = McpService_1 = class McpService {
    repo;
    encryption;
    logger = new common_1.Logger(McpService_1.name);
    constructor(repo, encryption) {
        this.repo = repo;
        this.encryption = encryption;
    }
    onModuleInit() {
        this.seedBuiltins();
    }
    list() {
        return this.repo.list().map((r) => this.toDto(r));
    }
    resolveByNames(names) {
        return this.repo
            .findByNames(names)
            .filter((r) => r.enabled === 1)
            .map((r) => this.toDto(r));
    }
    create(input) {
        const id = (0, crypto_1.randomUUID)();
        const now = new Date().toISOString();
        this.repo.insert({
            id,
            name: input.name,
            transport: input.transport,
            config_json: this.encryptConfig(input.transport, input.config),
            enabled: 1,
            created_at: now,
            updated_at: now,
        });
        return this.toDto(this.repo.findById(id));
    }
    update(id, patch) {
        const row = this.repo.findById(id);
        if (!row)
            throw new Error('mcp server not found');
        const update = { updated_at: new Date().toISOString() };
        if (patch.transport !== undefined)
            update.transport = patch.transport;
        if (patch.config !== undefined) {
            update.config_json = this.encryptConfig(patch.transport ?? row.transport, patch.config);
        }
        if (patch.enabled !== undefined)
            update.enabled = patch.enabled ? 1 : 0;
        this.repo.update(id, update);
        return this.toDto(this.repo.findById(id));
    }
    delete(id) {
        this.repo.delete(id);
    }
    async probe(id) {
        const row = this.repo.findById(id);
        if (!row)
            return { ok: false, transport: 'stdio', error: 'not found' };
        return { ok: true, transport: row.transport };
    }
    seedBuiltins() {
        const existingNames = new Set(this.repo.list().map((row) => row.name));
        const now = new Date().toISOString();
        for (const builtin of BUILTIN_MCP_SERVERS) {
            if (existingNames.has(builtin.name))
                continue;
            this.repo.insert({
                id: (0, crypto_1.randomUUID)(),
                name: builtin.name,
                transport: builtin.transport,
                config_json: this.encryptConfig(builtin.transport, builtin.config),
                enabled: 1,
                created_at: now,
                updated_at: now,
            });
            this.logger.log(`Builtin MCP installed: ${builtin.name}`);
        }
    }
    encryptConfig(transport, config) {
        const sensitiveKeys = ENCRYPTED_FIELDS_BY_TRANSPORT[transport];
        const src = config;
        const out = { ...src };
        const encryptedFields = [];
        for (const key of sensitiveKeys) {
            const v = src[key];
            if (v && typeof v === 'object') {
                const encMap = {};
                for (const [k, val] of Object.entries(v)) {
                    encMap[k] = this.encryption.encrypt(val);
                }
                out[key] = encMap;
                encryptedFields.push(key);
            }
        }
        out._encrypted = encryptedFields;
        return JSON.stringify(out);
    }
    decryptConfig(json) {
        const parsed = JSON.parse(json);
        const encryptedFields = parsed._encrypted ?? [];
        delete parsed._encrypted;
        for (const f of encryptedFields) {
            const v = parsed[f];
            if (v && typeof v === 'object') {
                const dec = {};
                for (const [k, val] of Object.entries(v)) {
                    try {
                        dec[k] = this.encryption.decrypt(val);
                    }
                    catch {
                        dec[k] = '';
                    }
                }
                parsed[f] = dec;
            }
        }
        return parsed;
    }
    toDto(row) {
        return {
            id: row.id,
            name: row.name,
            transport: row.transport,
            enabled: row.enabled === 1,
            config: this.decryptConfig(row.config_json),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
};
exports.McpService = McpService;
exports.McpService = McpService = McpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mcp_repository_1.McpRepository,
        encryption_service_1.EncryptionService])
], McpService);
const BUILTIN_MCP_SERVERS = [
    {
        name: 'Figma',
        transport: 'http',
        config: {
            url: 'https://mcp.figma.com/mcp',
            headers: {},
        },
    },
];
//# sourceMappingURL=mcp.service.js.map