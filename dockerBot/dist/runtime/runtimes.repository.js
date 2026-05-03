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
exports.RuntimesRepository = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../persistence/db.service");
let RuntimesRepository = class RuntimesRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    upsert(row) {
        const existing = this.findByProject(row.project_id);
        if (existing) {
            this.db.connection
                .prepare(`UPDATE runtimes
           SET status=?, compose_file=?, preview_url=?, meta_json=?, started_at=?, stopped_at=?, updated_at=?
           WHERE project_id=?`)
                .run(row.status, row.compose_file, row.preview_url, row.meta_json, row.started_at, row.stopped_at, row.updated_at, row.project_id);
        }
        else {
            this.db.connection
                .prepare(`INSERT INTO runtimes(id,project_id,status,compose_file,preview_url,meta_json,started_at,stopped_at,updated_at)
           VALUES (?,?,?,?,?,?,?,?,?)`)
                .run(row.id, row.project_id, row.status, row.compose_file, row.preview_url, row.meta_json, row.started_at, row.stopped_at, row.updated_at);
        }
    }
    findByProject(projectId) {
        return this.db.connection
            .prepare('SELECT * FROM runtimes WHERE project_id = ?')
            .get(projectId);
    }
};
exports.RuntimesRepository = RuntimesRepository;
exports.RuntimesRepository = RuntimesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], RuntimesRepository);
//# sourceMappingURL=runtimes.repository.js.map