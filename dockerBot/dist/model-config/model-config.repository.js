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
exports.ModelConfigRepository = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../persistence/db.service");
let ModelConfigRepository = class ModelConfigRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    insert(row) {
        this.db.connection
            .prepare(`INSERT INTO model_configs(id,name,base_url,api_key_enc,model,is_active,created_at,updated_at)
         VALUES (?,?,?,?,?,?,?,?)`)
            .run(row.id, row.name, row.base_url, row.api_key_enc, row.model, row.is_active, row.created_at, row.updated_at);
    }
    findById(id) {
        return this.db.connection
            .prepare('SELECT * FROM model_configs WHERE id = ?')
            .get(id);
    }
    findActive() {
        return this.db.connection
            .prepare('SELECT * FROM model_configs WHERE is_active = 1 LIMIT 1')
            .get();
    }
    list() {
        return this.db.connection
            .prepare('SELECT * FROM model_configs ORDER BY is_active DESC, updated_at DESC')
            .all();
    }
    update(id, patch) {
        const fields = Object.keys(patch).filter((k) => k !== 'id');
        if (fields.length === 0)
            return;
        const set = fields.map((f) => `${f} = ?`).join(', ');
        const values = fields.map((f) => patch[f]);
        this.db.connection.prepare(`UPDATE model_configs SET ${set} WHERE id = ?`).run(...values, id);
    }
    delete(id) {
        this.db.connection.prepare('DELETE FROM model_configs WHERE id = ?').run(id);
    }
    activate(id) {
        const tx = this.db.connection.transaction((targetId) => {
            this.db.connection.prepare('UPDATE model_configs SET is_active = 0').run();
            this.db.connection
                .prepare('UPDATE model_configs SET is_active = 1, updated_at = ? WHERE id = ?')
                .run(new Date().toISOString(), targetId);
        });
        tx(id);
    }
};
exports.ModelConfigRepository = ModelConfigRepository;
exports.ModelConfigRepository = ModelConfigRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], ModelConfigRepository);
//# sourceMappingURL=model-config.repository.js.map