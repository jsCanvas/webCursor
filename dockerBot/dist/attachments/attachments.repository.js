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
exports.AttachmentsRepository = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../persistence/db.service");
let AttachmentsRepository = class AttachmentsRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    insert(row) {
        this.db.connection
            .prepare(`INSERT INTO attachments(id,project_id,session_id,filename,mime_type,size_bytes,rel_path,created_at)
         VALUES (?,?,?,?,?,?,?,?)`)
            .run(row.id, row.project_id, row.session_id, row.filename, row.mime_type, row.size_bytes, row.rel_path, row.created_at);
    }
    findByIds(ids) {
        if (ids.length === 0)
            return [];
        const placeholders = ids.map(() => '?').join(',');
        return this.db.connection
            .prepare(`SELECT * FROM attachments WHERE id IN (${placeholders})`)
            .all(...ids);
    }
    listByProject(projectId) {
        return this.db.connection
            .prepare('SELECT * FROM attachments WHERE project_id = ? ORDER BY created_at DESC')
            .all(projectId);
    }
};
exports.AttachmentsRepository = AttachmentsRepository;
exports.AttachmentsRepository = AttachmentsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], AttachmentsRepository);
//# sourceMappingURL=attachments.repository.js.map