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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const fast_glob_1 = __importDefault(require("fast-glob"));
const fs = __importStar(require("fs"));
const mimeTypes = __importStar(require("mime-types"));
const path = __importStar(require("path"));
const errors_1 = require("../common/errors");
const project_path_service_1 = require("../projects/project-path.service");
const READ_LIMIT_BYTES = 2 * 1024 * 1024;
const DEFAULT_IGNORE = [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    '.next/**',
    '.phonebot/attachments/**',
    '**/.DS_Store',
];
let FilesService = class FilesService {
    path;
    constructor(path) {
        this.path = path;
    }
    async tree(projectId, relPath = '', depth) {
        const root = await this.path.workdir(projectId);
        const baseAbs = await this.path.resolveSafe(projectId, relPath);
        const rel = path.relative(root, baseAbs) || '.';
        const entries = (await (0, fast_glob_1.default)('**/*', {
            cwd: baseAbs,
            onlyFiles: false,
            markDirectories: false,
            dot: true,
            followSymbolicLinks: false,
            stats: true,
            ignore: DEFAULT_IGNORE,
            ...(depth === undefined ? {} : { deep: depth }),
        }));
        const nodes = entries.map((e) => {
            const isDir = e.dirent.isDirectory();
            const node = {
                name: path.basename(e.path),
                path: path.posix.join(rel === '.' ? '' : rel, e.path).replace(/^\/+/, ''),
                type: isDir ? 'dir' : 'file',
            };
            if (!isDir && e.stats) {
                node.size = e.stats.size;
                node.mtime = e.stats.mtime.toISOString();
            }
            return node;
        });
        return this.buildTree(rel, nodes);
    }
    async read(projectId, relPath) {
        const abs = await this.path.resolveSafe(projectId, relPath);
        if (!fs.existsSync(abs))
            throw new errors_1.FileNotFoundError(relPath);
        const stat = await fs.promises.stat(abs);
        if (stat.size > READ_LIMIT_BYTES) {
            throw new errors_1.FileTooLargeError(stat.size, READ_LIMIT_BYTES);
        }
        const buf = await fs.promises.readFile(abs);
        const sha = (0, crypto_1.createHash)('sha256').update(buf).digest('hex');
        const mime = (mimeTypes.lookup(relPath) || 'application/octet-stream');
        const isText = isProbablyText(buf, mime);
        return {
            path: relPath,
            size: stat.size,
            mime,
            sha,
            encoding: isText ? 'utf8' : 'base64',
            content: isText ? buf.toString('utf8') : buf.toString('base64'),
        };
    }
    async write(projectId, relPath, content, encoding = 'utf8', expectedSha) {
        const abs = await this.path.resolveSafe(projectId, relPath);
        if (expectedSha && fs.existsSync(abs)) {
            const buf = await fs.promises.readFile(abs);
            const cur = (0, crypto_1.createHash)('sha256').update(buf).digest('hex');
            if (cur !== expectedSha)
                throw new errors_1.FileConflictError(cur);
        }
        await fs.promises.mkdir(path.dirname(abs), { recursive: true });
        const buf = Buffer.from(content, encoding);
        await fs.promises.writeFile(abs, buf);
        const sha = (0, crypto_1.createHash)('sha256').update(buf).digest('hex');
        return { path: relPath, size: buf.length, sha };
    }
    async remove(projectId, relPath) {
        const abs = await this.path.resolveSafe(projectId, relPath);
        if (!fs.existsSync(abs))
            throw new errors_1.FileNotFoundError(relPath);
        await fs.promises.rm(abs, { recursive: true, force: true });
    }
    async move(projectId, from, to) {
        const src = await this.path.resolveSafe(projectId, from);
        const dst = await this.path.resolveSafe(projectId, to);
        if (!fs.existsSync(src))
            throw new errors_1.FileNotFoundError(from);
        await fs.promises.mkdir(path.dirname(dst), { recursive: true });
        await fs.promises.rename(src, dst);
    }
    buildTree(rootRel, nodes) {
        const sorted = [...nodes].sort((a, b) => a.path.localeCompare(b.path));
        const lookup = new Map();
        const root = {
            name: rootRel === '.' ? '' : path.basename(rootRel),
            path: rootRel === '.' ? '' : rootRel,
            type: 'dir',
            children: [],
        };
        lookup.set(root.path, root);
        for (const node of sorted) {
            const parentPath = path.posix.dirname(node.path);
            const parent = lookup.get(parentPath === '.' ? root.path : parentPath) ?? root;
            parent.children = parent.children ?? [];
            parent.children.push(node);
            if (node.type === 'dir') {
                node.children = node.children ?? [];
                lookup.set(node.path, node);
            }
        }
        return root;
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [project_path_service_1.ProjectPathService])
], FilesService);
function isProbablyText(buf, mime) {
    if (mime.startsWith('text/'))
        return true;
    if (mime === 'application/json' || mime === 'application/javascript' || mime.endsWith('+xml'))
        return true;
    const sample = buf.subarray(0, Math.min(buf.length, 1024));
    return !sample.includes(0);
}
//# sourceMappingURL=files.service.js.map