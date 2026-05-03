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
exports.SessionsRepository = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../persistence/db.service");
let SessionsRepository = class SessionsRepository {
    db;
    constructor(db) {
        this.db = db;
    }
    insertSession(row) {
        this.db.connection
            .prepare(`INSERT INTO sessions(id,project_id,title,claude_session_id,created_at,updated_at)
         VALUES (?,?,?,?,?,?)`)
            .run(row.id, row.project_id, row.title, row.claude_session_id, row.created_at, row.updated_at);
    }
    findSession(id) {
        return this.db.connection
            .prepare('SELECT * FROM sessions WHERE id = ?')
            .get(id);
    }
    listSessionsByProject(projectId) {
        return this.db.connection
            .prepare('SELECT * FROM sessions WHERE project_id = ? ORDER BY updated_at DESC')
            .all(projectId);
    }
    updateSession(id, patch) {
        const fields = Object.keys(patch).filter((k) => k !== 'id');
        if (!fields.length)
            return;
        const set = fields.map((f) => `${f} = ?`).join(', ');
        const values = fields.map((f) => patch[f]);
        this.db.connection.prepare(`UPDATE sessions SET ${set} WHERE id = ?`).run(...values, id);
    }
    deleteSession(id) {
        this.db.connection.prepare('DELETE FROM sessions WHERE id = ?').run(id);
    }
    insertMessage(row) {
        this.db.connection
            .prepare(`INSERT INTO messages(id,session_id,role,content,run_id,created_at)
         VALUES (?,?,?,?,?,?)`)
            .run(row.id, row.session_id, row.role, row.content, row.run_id, row.created_at);
    }
    listMessages(sessionId, limit = 200, before) {
        if (before) {
            return this.db.connection
                .prepare(`SELECT * FROM messages WHERE session_id = ? AND created_at < ?
           ORDER BY created_at DESC LIMIT ?`)
                .all(sessionId, before, limit)
                .reverse();
        }
        return this.db.connection
            .prepare(`SELECT * FROM messages WHERE session_id = ?
         ORDER BY created_at ASC LIMIT ?`)
            .all(sessionId, limit);
    }
    insertRun(row) {
        this.db.connection
            .prepare(`INSERT INTO agent_runs(
           id,session_id,status,started_at,finished_at,total_input_tokens,
           total_output_tokens,cost_usd,stop_reason,error_message
         ) VALUES (?,?,?,?,?,?,?,?,?,?)`)
            .run(row.id, row.session_id, row.status, row.started_at, row.finished_at, row.total_input_tokens, row.total_output_tokens, row.cost_usd, row.stop_reason, row.error_message);
    }
    updateRun(id, patch) {
        const fields = Object.keys(patch).filter((k) => k !== 'id');
        if (!fields.length)
            return;
        const set = fields.map((f) => `${f} = ?`).join(', ');
        const values = fields.map((f) => patch[f]);
        this.db.connection.prepare(`UPDATE agent_runs SET ${set} WHERE id = ?`).run(...values, id);
    }
};
exports.SessionsRepository = SessionsRepository;
exports.SessionsRepository = SessionsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], SessionsRepository);
//# sourceMappingURL=sessions.repository.js.map