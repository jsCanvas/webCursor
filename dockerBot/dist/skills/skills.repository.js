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
exports.SkillsRepository = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../persistence/db.service");
let SkillsRepository = class SkillsRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    upsertBuiltin(row) {
        const now = new Date().toISOString();
        const existing = this.findByName(row.name);
        if (!existing) {
            this.db.connection
                .prepare(`INSERT INTO skills(id,name,description,body,enabled,is_builtin,created_at,updated_at)
           VALUES (?,?,?,?,?,?,?,?)`)
                .run(row.id, row.name, row.description, row.body, row.enabled, row.is_builtin, now, now);
        }
        else {
            this.db.connection
                .prepare(`UPDATE skills
           SET description = ?, body = ?, is_builtin = ?, updated_at = ?
           WHERE name = ?`)
                .run(row.description, row.body, row.is_builtin, now, row.name);
        }
    }
    insert(row) {
        this.db.connection
            .prepare(`INSERT INTO skills(id,name,description,body,enabled,is_builtin,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?)`)
            .run(row.id, row.name, row.description, row.body, row.enabled, row.is_builtin, row.created_at, row.updated_at);
    }
    findById(id) {
        return this.db.connection
            .prepare('SELECT * FROM skills WHERE id = ?')
            .get(id);
    }
    findByName(name) {
        return this.db.connection
            .prepare('SELECT * FROM skills WHERE name = ?')
            .get(name);
    }
    list() {
        return this.db.connection
            .prepare('SELECT * FROM skills ORDER BY is_builtin DESC, name ASC')
            .all();
    }
    findByNames(names) {
        if (names.length === 0)
            return [];
        const placeholders = names.map(() => '?').join(',');
        return this.db.connection
            .prepare(`SELECT * FROM skills WHERE name IN (${placeholders})`)
            .all(...names);
    }
    update(id, patch) {
        const fields = Object.keys(patch).filter((k) => k !== 'id');
        if (fields.length === 0)
            return;
        const set = fields.map((f) => `${f} = ?`).join(', ');
        const values = fields.map((f) => patch[f]);
        this.db.connection.prepare(`UPDATE skills SET ${set} WHERE id = ?`).run(...values, id);
    }
    delete(id) {
        this.db.connection.prepare('DELETE FROM skills WHERE id = ?').run(id);
    }
};
exports.SkillsRepository = SkillsRepository;
exports.SkillsRepository = SkillsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], SkillsRepository);
//# sourceMappingURL=skills.repository.js.map