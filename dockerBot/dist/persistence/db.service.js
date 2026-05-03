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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var DbService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function resolveMigrationsDir() {
    const sibling = path.resolve(__dirname, 'migrations');
    if (fs.existsSync(sibling))
        return sibling;
    const srcFallback = path.resolve(__dirname, '..', '..', 'src', 'persistence', 'migrations');
    return srcFallback;
}
let DbService = DbService_1 = class DbService {
    config;
    logger = new common_1.Logger(DbService_1.name);
    db;
    constructor(config) {
        this.config = config;
    }
    onModuleInit() {
        const dataDir = path.resolve(this.config.get('PHONEBOT_DATA_DIR', { infer: true }));
        fs.mkdirSync(dataDir, { recursive: true });
        const dbPath = path.join(dataDir, 'phonebot.db');
        this.db = new better_sqlite3_1.default(dbPath);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
        this.logger.log(`SQLite open at ${dbPath}`);
        this.runMigrations();
    }
    useDatabase(db) {
        this.db = db;
        this.db.pragma('foreign_keys = ON');
        this.runMigrations();
    }
    get connection() {
        if (!this.db)
            throw new Error('DbService not initialized');
        return this.db;
    }
    onApplicationShutdown() {
        if (this.db?.open)
            this.db.close();
    }
    runMigrations() {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        filename   TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
    `);
        const applied = new Set(this.db
            .prepare('SELECT filename FROM _migrations')
            .all()
            .map((r) => r.filename));
        const dir = resolveMigrationsDir();
        if (!fs.existsSync(dir)) {
            this.logger.warn(`No migrations dir found at ${dir}`);
            return;
        }
        const files = fs
            .readdirSync(dir)
            .filter((f) => f.endsWith('.sql'))
            .sort();
        const insertApplied = this.db.prepare('INSERT INTO _migrations(filename, applied_at) VALUES (?, ?)');
        for (const file of files) {
            if (applied.has(file))
                continue;
            const sql = fs.readFileSync(path.join(dir, file), 'utf8');
            const tx = this.db.transaction(() => {
                this.db.exec(sql);
                insertApplied.run(file, new Date().toISOString());
            });
            tx();
            this.logger.log(`Migration applied: ${file}`);
        }
    }
};
exports.DbService = DbService;
exports.DbService = DbService = DbService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DbService);
//# sourceMappingURL=db.service.js.map