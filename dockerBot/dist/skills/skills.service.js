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
var SkillsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillsService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const skills_repository_1 = require("./skills.repository");
let SkillsService = SkillsService_1 = class SkillsService {
    repo;
    logger = new common_1.Logger(SkillsService_1.name);
    constructor(repo) {
        this.repo = repo;
    }
    onModuleInit() {
        this.seedBuiltins();
    }
    list() {
        return this.repo.list().map((r) => this.toDto(r));
    }
    resolveByNames(names) {
        return this.repo.findByNames(names).filter((r) => r.enabled === 1);
    }
    create(input) {
        const id = (0, crypto_1.randomUUID)();
        const now = new Date().toISOString();
        this.repo.insert({
            id,
            name: input.name,
            description: input.description,
            body: input.body,
            enabled: 1,
            is_builtin: 0,
            created_at: now,
            updated_at: now,
        });
        return this.toDto(this.repo.findById(id));
    }
    update(id, patch) {
        const update = { updated_at: new Date().toISOString() };
        if (patch.description !== undefined)
            update.description = patch.description;
        if (patch.body !== undefined)
            update.body = patch.body;
        if (patch.enabled !== undefined)
            update.enabled = patch.enabled ? 1 : 0;
        this.repo.update(id, update);
        return this.toDto(this.repo.findById(id));
    }
    toggle(id) {
        const row = this.repo.findById(id);
        if (!row)
            throw new Error('skill not found');
        this.repo.update(id, { enabled: row.enabled === 1 ? 0 : 1, updated_at: new Date().toISOString() });
        return this.toDto(this.repo.findById(id));
    }
    delete(id) {
        const row = this.repo.findById(id);
        if (!row)
            return;
        if (row.is_builtin === 1) {
            throw new Error('cannot delete builtin skill; toggle to disable instead');
        }
        this.repo.delete(id);
    }
    seedBuiltins() {
        const dir = resolveBuiltinDir();
        if (!fs.existsSync(dir)) {
            this.logger.warn(`No builtin skills dir at ${dir}`);
            return;
        }
        for (const file of fs.readdirSync(dir)) {
            if (!file.endsWith('.md'))
                continue;
            const body = fs.readFileSync(path.join(dir, file), 'utf8');
            const front = parseFrontmatter(body);
            const name = front.name ?? file.replace(/\.md$/, '');
            const description = front.description ?? '';
            this.repo.upsertBuiltin({
                id: (0, crypto_1.randomUUID)(),
                name,
                description,
                body,
                enabled: 1,
                is_builtin: 1,
            });
        }
        this.logger.log('Builtin skills seeded');
    }
    toDto(row) {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            body: row.body,
            enabled: row.enabled === 1,
            isBuiltin: row.is_builtin === 1,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
        };
    }
};
exports.SkillsService = SkillsService;
exports.SkillsService = SkillsService = SkillsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [skills_repository_1.SkillsRepository])
], SkillsService);
function resolveBuiltinDir() {
    const sibling = path.resolve(__dirname, 'builtin');
    if (fs.existsSync(sibling))
        return sibling;
    return path.resolve(__dirname, '..', '..', 'src', 'skills', 'builtin');
}
function parseFrontmatter(md) {
    const m = /^---\n([\s\S]*?)\n---/.exec(md);
    if (!m)
        return {};
    const out = {};
    for (const line of m[1].split('\n')) {
        const idx = line.indexOf(':');
        if (idx === -1)
            continue;
        out[line.slice(0, idx).trim()] = line
            .slice(idx + 1)
            .trim()
            .replace(/^["']|["']$/g, '');
    }
    return out;
}
//# sourceMappingURL=skills.service.js.map