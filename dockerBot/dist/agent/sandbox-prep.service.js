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
var SandboxPrepService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SandboxPrepService = void 0;
exports.buildRouterConfigWriteCommand = buildRouterConfigWriteCommand;
exports.buildRouterConfig = buildRouterConfig;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const util_1 = require("util");
const child_process_2 = require("child_process");
const execFileAsync = (0, util_1.promisify)(child_process_2.execFile);
function buildRouterConfigWriteCommand(json) {
    const encoded = Buffer.from(json, 'utf8').toString('base64');
    return [
        'CONFIG_PATH="${HOME}/.claude-code-router/config.json"',
        'mkdir -p "$(dirname "$CONFIG_PATH")"',
        `node -e 'const fs = require("fs"); fs.writeFileSync(process.argv[1], Buffer.from(process.argv[2], "base64"));' "$CONFIG_PATH" '${encoded}'`,
        'chmod 600 "$CONFIG_PATH"',
    ].join(' && ');
}
function buildRouterConfig(model) {
    return {
        LOG: false,
        Providers: [
            {
                name: 'user',
                api_base_url: normalizeChatCompletionsUrl(model.baseUrl),
                api_key: model.apiKey,
                models: [model.model],
            },
        ],
        Router: {
            default: `user,${model.model}`,
            background: `user,${model.model}`,
            think: `user,${model.model}`,
            longContext: `user,${model.model}`,
            webSearch: `user,${model.model}`,
        },
    };
}
function normalizeChatCompletionsUrl(baseUrl) {
    const trimmed = baseUrl.replace(/\/+$/, '');
    if (trimmed.endsWith('/chat/completions')) {
        return trimmed;
    }
    return `${trimmed}/chat/completions`;
}
let SandboxPrepService = SandboxPrepService_1 = class SandboxPrepService {
    logger = new common_1.Logger(SandboxPrepService_1.name);
    sandboxContainer;
    constructor(config) {
        this.sandboxContainer = config.get('PHONEBOT_SANDBOX_CONTAINER', { infer: true });
    }
    async prepare(input) {
        await this.writeRouterConfig(input.modelConfig);
        await this.writeSkillFiles(input.workdirHost, input.skills);
        const mcpConfigPath = await this.writeMcpConfig(input.workdirHost, input.mcpServers);
        return { mcpConfigPath };
    }
    async writeRouterConfig(model) {
        const cfg = buildRouterConfig(model);
        const json = JSON.stringify(cfg);
        const cmd = buildRouterConfigWriteCommand(json);
        await execFileAsync('docker', ['exec', '-i', this.sandboxContainer, 'bash', '-lc', cmd], {
            maxBuffer: 1024 * 1024,
        });
        await execFileAsync('docker', [
            'exec',
            '-i',
            this.sandboxContainer,
            'bash',
            '-lc',
            'ccr stop >/dev/null 2>&1 || true',
        ]);
    }
    async writeSkillFiles(workdirHost, skills) {
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const skillsRoot = path.join(workdirHost, '.claude', 'skills');
        await fs.promises.rm(skillsRoot, { recursive: true, force: true });
        if (skills.length === 0)
            return;
        await fs.promises.mkdir(skillsRoot, { recursive: true });
        for (const skill of skills) {
            const dir = path.join(skillsRoot, skill.name);
            await fs.promises.mkdir(dir, { recursive: true });
            await fs.promises.writeFile(path.join(dir, 'SKILL.md'), skill.body, 'utf8');
        }
    }
    async writeMcpConfig(workdirHost, servers) {
        if (servers.length === 0)
            return null;
        const fs = await Promise.resolve().then(() => __importStar(require('fs')));
        const dir = path.join(workdirHost, '.phonebot');
        await fs.promises.mkdir(dir, { recursive: true });
        const cfgPath = path.join(dir, 'mcp.json');
        const mcpServers = {};
        for (const s of servers) {
            const c = s.config;
            if (s.transport === 'stdio') {
                mcpServers[s.name] = {
                    type: 'stdio',
                    command: c.command,
                    args: c.args ?? [],
                    env: c.env ?? {},
                };
            }
            else {
                mcpServers[s.name] = {
                    type: s.transport,
                    url: c.url,
                    headers: c.headers ?? {},
                };
            }
        }
        await fs.promises.writeFile(cfgPath, JSON.stringify({ mcpServers }, null, 2));
        const sandboxPath = path
            .posix.join('.phonebot', 'mcp.json');
        return sandboxPath;
    }
    static spawnDocker(args) {
        return (0, child_process_1.spawn)('docker', args, { stdio: ['pipe', 'pipe', 'pipe'] });
    }
};
exports.SandboxPrepService = SandboxPrepService;
exports.SandboxPrepService = SandboxPrepService = SandboxPrepService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SandboxPrepService);
//# sourceMappingURL=sandbox-prep.service.js.map