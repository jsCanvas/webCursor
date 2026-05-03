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
var RuntimeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeService = void 0;
exports.isDockerComposePluginMissing = isDockerComposePluginMissing;
exports.isComposeNetworkRecreateRequired = isComposeNetworkRecreateRequired;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const child_process_1 = require("child_process");
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const util_1 = require("util");
const YAML = __importStar(require("yaml"));
const errors_1 = require("../common/errors");
const projects_service_1 = require("../projects/projects.service");
const compose_template_service_1 = require("./compose-template.service");
const runtimes_repository_1 = require("./runtimes.repository");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
const DEFAULT_PORT = 3000;
const PHONEBOT_NETWORK = 'phonebot-traefik';
const COMPOSE_NAMES = ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml'];
function isDockerComposePluginMissing(message) {
    return (message.includes("docker: 'compose' is not a docker command") ||
        message.includes('unknown shorthand flag'));
}
function isComposeNetworkRecreateRequired(message) {
    return message.includes('needs to be recreated') && message.includes('Network');
}
let RuntimeService = RuntimeService_1 = class RuntimeService {
    repo;
    projects;
    template;
    logger = new common_1.Logger(RuntimeService_1.name);
    baseDomain;
    profile;
    composeCommand;
    constructor(repo, projects, template, config) {
        this.repo = repo;
        this.projects = projects;
        this.template = template;
        this.baseDomain = config.get('PHONEBOT_BASE_DOMAIN', { infer: true });
        this.profile = config.get('PHONEBOT_PROFILE', { infer: true });
    }
    async up(input) {
        const project = this.projects.rawRow(input.projectId);
        const port = input.port ?? DEFAULT_PORT;
        const existing = this.repo.findByProject(input.projectId);
        let composeFile;
        if (input.composePathOverride) {
            const overridePath = path.resolve(project.workdir, input.composePathOverride);
            if (!fs.existsSync(overridePath)) {
                throw new errors_1.RuntimeUpError('locate', `compose file not found: ${input.composePathOverride}`);
            }
            const stat = await fs.promises.stat(overridePath);
            composeFile = stat.isDirectory()
                ? await this.locateOrGenerateCompose(overridePath, project.slug, port, project.workdir)
                : await this.patchComposeFile(overridePath, project.slug, port);
        }
        else {
            composeFile = await this.locateOrGenerateCompose(project.workdir, project.slug, port);
        }
        const relativeComposeFile = path.relative(project.workdir, composeFile);
        await this.stopPreviousRuntimeIfComposeChanged(project.workdir, existing, relativeComposeFile);
        await this.ensureNetwork();
        await this.composeUp(composeFile);
        const row = {
            id: existing?.id ?? (0, crypto_1.randomUUID)(),
            project_id: input.projectId,
            status: 'running',
            compose_file: relativeComposeFile,
            preview_url: this.previewUrl(project.slug),
            meta_json: JSON.stringify({ port, profile: this.profile }),
            started_at: new Date().toISOString(),
            stopped_at: null,
            updated_at: new Date().toISOString(),
        };
        this.repo.upsert(row);
        return row;
    }
    async down(projectId) {
        const existing = this.repo.findByProject(projectId);
        const project = this.projects.rawRow(projectId);
        if (!existing || !existing.compose_file) {
            const row = {
                id: existing?.id ?? (0, crypto_1.randomUUID)(),
                project_id: projectId,
                status: 'stopped',
                compose_file: null,
                preview_url: null,
                meta_json: null,
                started_at: null,
                stopped_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };
            this.repo.upsert(row);
            return row;
        }
        const composeFile = path.resolve(project.workdir, existing.compose_file);
        try {
            await this.execCompose(['-f', composeFile, 'down'], { maxBuffer: 4 << 20 });
        }
        catch (e) {
            this.logger.warn(`compose down failed: ${e.message}`);
        }
        const row = {
            ...existing,
            status: 'stopped',
            stopped_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };
        this.repo.upsert(row);
        return row;
    }
    status(projectId) {
        return this.repo.findByProject(projectId) ?? null;
    }
    async *streamLogs(projectId, opts = {}) {
        const existing = this.repo.findByProject(projectId);
        if (!existing || !existing.compose_file)
            return;
        const project = this.projects.rawRow(projectId);
        const composeFile = path.resolve(project.workdir, existing.compose_file);
        const composeCommand = await this.resolveComposeCommand();
        const args = [...composeCommand.argsPrefix, '-f', composeFile, 'logs', '-f', '--no-color'];
        if (opts.tail)
            args.push('--tail', String(opts.tail));
        if (opts.service)
            args.push(opts.service);
        const { spawn } = await Promise.resolve().then(() => __importStar(require('child_process')));
        const proc = spawn(composeCommand.command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
        opts.signal?.addEventListener('abort', () => {
            try {
                proc.kill('SIGTERM');
            }
            catch {
            }
        });
        const queue = [];
        let resolveNext = null;
        let done = false;
        const handleLine = (raw) => {
            const line = raw.trimEnd();
            if (!line)
                return;
            const m = /^(\S+?)\s*\|\s*(.*)$/.exec(line);
            const item = m ? { service: m[1], line: m[2] } : { service: null, line };
            if (resolveNext) {
                resolveNext({ value: item, done: false });
                resolveNext = null;
            }
            else {
                queue.push(item);
            }
        };
        proc.stdout.setEncoding('utf8');
        proc.stderr.setEncoding('utf8');
        let buf = '';
        proc.stdout.on('data', (chunk) => {
            buf += chunk;
            const parts = buf.split('\n');
            buf = parts.pop() ?? '';
            for (const ln of parts)
                handleLine(ln);
        });
        proc.stderr.on('data', (chunk) => {
            for (const ln of chunk.split('\n'))
                handleLine(ln);
        });
        proc.on('close', () => {
            if (buf)
                handleLine(buf);
            done = true;
            if (resolveNext) {
                resolveNext({ value: undefined, done: true });
                resolveNext = null;
            }
        });
        while (!done || queue.length > 0) {
            if (queue.length > 0) {
                yield queue.shift();
            }
            else {
                const next = await new Promise((resolve) => {
                    resolveNext = resolve;
                });
                if (next.done)
                    return;
                yield next.value;
            }
        }
    }
    async locateOrGenerateCompose(workdir, slug, port, projectRoot = workdir) {
        for (const name of COMPOSE_NAMES) {
            const p = path.join(workdir, name);
            if (fs.existsSync(p)) {
                return this.patchComposeFile(p, slug, port);
            }
        }
        if (fs.existsSync(path.join(workdir, 'Dockerfile'))) {
            const ancestorCompose = await this.findAncestorComposeForDirectory(workdir, projectRoot);
            if (ancestorCompose) {
                return this.patchComposeFile(ancestorCompose, slug, port);
            }
            const yamlOut = this.template.generateForDockerfile({
                slug,
                baseDomain: this.baseDomain,
                port,
                profile: this.profile,
                hasDockerfile: true,
            });
            const generated = this.generatedComposePath(workdir);
            await fs.promises.writeFile(generated, yamlOut);
            return generated;
        }
        throw new errors_1.RuntimeUpError('locate', 'no docker-compose.yml or Dockerfile found; let the AI generate one first');
    }
    async patchComposeFile(composeFile, slug, port) {
        const yamlIn = await fs.promises.readFile(composeFile, 'utf8');
        const yamlOut = this.template.patchExistingCompose(yamlIn, {
            slug,
            baseDomain: this.baseDomain,
            port,
            profile: this.profile,
            hasDockerfile: false,
        });
        const generated = this.generatedComposePath(path.dirname(composeFile));
        await fs.promises.writeFile(generated, yamlOut);
        return generated;
    }
    generatedComposePath(workdir) {
        return path.join(workdir, 'docker-compose.phonebot.generated.yml');
    }
    async findAncestorComposeForDirectory(targetDir, projectRoot) {
        const relativeTarget = path.relative(projectRoot, targetDir);
        if (relativeTarget.startsWith('..') || path.isAbsolute(relativeTarget))
            return null;
        let current = path.dirname(targetDir);
        while (current.startsWith(projectRoot)) {
            for (const name of COMPOSE_NAMES) {
                const composeFile = path.join(current, name);
                if (fs.existsSync(composeFile) &&
                    (await this.composeReferencesDirectory(composeFile, targetDir))) {
                    return composeFile;
                }
            }
            if (current === projectRoot)
                break;
            current = path.dirname(current);
        }
        return null;
    }
    async composeReferencesDirectory(composeFile, targetDir) {
        const yamlIn = await fs.promises.readFile(composeFile, 'utf8');
        const doc = YAML.parse(yamlIn);
        const services = doc?.services;
        if (!services)
            return false;
        return Object.values(services).some((service) => {
            if (!service || typeof service !== 'object')
                return false;
            const build = service.build;
            const context = typeof build === 'string'
                ? build
                : build && typeof build === 'object'
                    ? build.context
                    : undefined;
            if (typeof context !== 'string')
                return false;
            return path.resolve(path.dirname(composeFile), context) === targetDir;
        });
    }
    async stopPreviousRuntimeIfComposeChanged(workdir, existing, nextComposeFile) {
        if (!existing?.compose_file || existing.compose_file === nextComposeFile)
            return;
        const previousComposeFile = path.resolve(workdir, existing.compose_file);
        if (!fs.existsSync(previousComposeFile))
            return;
        try {
            await this.execCompose(['-f', previousComposeFile, 'down', '--remove-orphans'], {
                maxBuffer: 4 << 20,
            });
        }
        catch (e) {
            this.logger.warn(`previous compose down failed: ${e.message}`);
        }
    }
    async ensureNetwork() {
        try {
            await execFileAsync('docker', ['network', 'inspect', PHONEBOT_NETWORK]);
        }
        catch {
            try {
                await execFileAsync('docker', ['network', 'create', PHONEBOT_NETWORK]);
            }
            catch (e) {
                throw new errors_1.RuntimeUpError('network', e.message);
            }
        }
    }
    async composeUp(composeFile) {
        try {
            await this.execCompose(['-f', composeFile, 'up', '-d', '--build'], { maxBuffer: 16 << 20 });
        }
        catch (e) {
            const stderr = e.stderr ?? e.message;
            if (isComposeNetworkRecreateRequired(stderr)) {
                await this.execCompose(['-f', composeFile, 'down', '--remove-orphans'], { maxBuffer: 4 << 20 });
                await this.execCompose(['-f', composeFile, 'up', '-d', '--build'], { maxBuffer: 16 << 20 });
                return;
            }
            throw new errors_1.RuntimeUpError('compose_up', stderr);
        }
    }
    async execCompose(args, options) {
        const composeCommand = await this.resolveComposeCommand();
        return execFileAsync(composeCommand.command, [...composeCommand.argsPrefix, ...args], options);
    }
    async resolveComposeCommand() {
        if (this.composeCommand)
            return this.composeCommand;
        try {
            await execFileAsync('docker', ['compose', 'version']);
            this.composeCommand = { command: 'docker', argsPrefix: ['compose'] };
            return this.composeCommand;
        }
        catch (e) {
            const stderr = e.stderr ?? e.message;
            if (!isDockerComposePluginMissing(stderr)) {
                throw e;
            }
        }
        await execFileAsync('docker-compose', ['version']);
        this.composeCommand = { command: 'docker-compose', argsPrefix: [] };
        return this.composeCommand;
    }
    previewUrl(slug) {
        const proto = this.profile === 'production' ? 'https' : 'http';
        return `${proto}://${slug}.${this.baseDomain}`;
    }
};
exports.RuntimeService = RuntimeService;
exports.RuntimeService = RuntimeService = RuntimeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [runtimes_repository_1.RuntimesRepository,
        projects_service_1.ProjectsService,
        compose_template_service_1.ComposeTemplateService,
        config_1.ConfigService])
], RuntimeService);
//# sourceMappingURL=runtime.service.js.map