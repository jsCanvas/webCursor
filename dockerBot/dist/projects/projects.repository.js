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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsRepository = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../persistence/db.service");
let ProjectsRepository = class ProjectsRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    insert(row) {
        this.db.connection
            .prepare(`INSERT INTO projects(
           id,name,slug,git_url,git_token_enc,default_branch,workdir,
           status,last_error,created_at,updated_at
         ) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
            .run(row.id, row.name, row.slug, row.git_url, row.git_token_enc, row.default_branch, row.workdir, row.status, row.last_error, row.created_at, row.updated_at);
    }
    findById(id) {
        return this.db.connection
            .prepare('SELECT * FROM projects WHERE id = ?')
            .get(id);
    }
    findBySlug(slug) {
        return this.db.connection
            .prepare('SELECT * FROM projects WHERE slug = ?')
            .get(slug);
    }
    list() {
        return this.db.connection
            .prepare('SELECT * FROM projects ORDER BY updated_at DESC')
            .all();
    }
    update(id, patch) {
        const fields = Object.keys(patch).filter((k) => k !== 'id');
        if (fields.length === 0)
            return;
        const set = fields.map((f) => `${f} = ?`).join(', ');
        const values = fields.map((f) => patch[f]);
        this.db.connection.prepare(`UPDATE projects SET ${set} WHERE id = ?`).run(...values, id);
    }
    delete(id) {
        this.db.connection.prepare('DELETE FROM projects WHERE id = ?').run(id);
    }
};
exports.ProjectsRepository = ProjectsRepository;
exports.ProjectsRepository = ProjectsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], ProjectsRepository);
//# sourceMappingURL=projects.repository.js.map