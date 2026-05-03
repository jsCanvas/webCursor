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
var AgentRunnerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentRunnerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const child_process_1 = require("child_process");
const rxjs_1 = require("rxjs");
const errors_1 = require("../common/errors");
const claude_stream_parser_1 = require("./claude-stream.parser");
const tool_event_mapper_1 = require("./tool-event.mapper");
let AgentRunnerService = AgentRunnerService_1 = class AgentRunnerService {
    logger = new common_1.Logger(AgentRunnerService_1.name);
    sandboxContainer;
    cliOverride;
    constructor(config) {
        this.sandboxContainer = config.get('PHONEBOT_SANDBOX_CONTAINER', { infer: true });
        this.cliOverride = process.env.PHONEBOT_AGENT_CLI_OVERRIDE;
    }
    run(opts) {
        const subject = new rxjs_1.Subject();
        void this.runInternal(opts, subject).catch((err) => {
            const message = err instanceof Error ? err.message : String(err);
            subject.next({ type: 'error', code: 'runner_failure', message });
            subject.next({ type: 'run-completed', status: 'error', stopReason: 'runner_failure' });
            subject.complete();
        });
        return subject.asObservable();
    }
    async runInternal(opts, out) {
        const parser = new claude_stream_parser_1.ClaudeStreamParser();
        const mapper = new tool_event_mapper_1.ToolEventMapper();
        let proc;
        let terminalEventEmitted = false;
        if (this.cliOverride) {
            const [bin, ...args] = this.cliOverride.split(/\s+/).filter(Boolean);
            proc = (0, child_process_1.spawn)(bin, args, { stdio: ['pipe', 'pipe', 'pipe'] });
        }
        else {
            const dockerArgs = [
                'exec',
                '-i',
                '--workdir',
                opts.sandboxWorkdir,
                this.sandboxContainer,
                'ccr',
                'code',
                '--print',
                '--output-format',
                'stream-json',
                '--input-format',
                'stream-json',
                '--include-partial-messages',
                '--permission-mode',
                'bypassPermissions',
                '--verbose',
            ];
            if (opts.claudeSessionId) {
                dockerArgs.push('--resume', opts.claudeSessionId);
            }
            if (opts.mcpConfigPath) {
                dockerArgs.push('--mcp-config', opts.mcpConfigPath);
            }
            proc = (0, child_process_1.spawn)('docker', dockerArgs, { stdio: ['pipe', 'pipe', 'pipe'] });
        }
        if (!proc.pid) {
            throw new errors_1.SandboxNotReadyError('failed to spawn agent process');
        }
        const onAbort = () => {
            try {
                proc.kill('SIGINT');
            }
            catch {
            }
        };
        opts.abortSignal.addEventListener('abort', onAbort, { once: true });
        const userLine = JSON.stringify({
            type: 'user',
            message: { role: 'user', content: opts.userContentBlocks },
        });
        proc.stdin?.write(userLine + '\n');
        proc.stdin?.end();
        const flush = (line) => {
            const trimmed = line.trim();
            if (!trimmed)
                return;
            let parsed;
            try {
                parsed = JSON.parse(trimmed);
            }
            catch {
                this.logger.warn(`Non-JSON line from agent: ${trimmed.slice(0, 200)}`);
                return;
            }
            const events = parser.translate(parsed);
            for (const e of events) {
                if (e.type === 'run-started') {
                    out.next({ ...e, runId: opts.runId });
                    continue;
                }
                out.next(e);
                if (e.type === 'run-completed') {
                    terminalEventEmitted = true;
                }
                for (const fileEvt of mapper.observe(e)) {
                    out.next(fileEvt);
                }
            }
        };
        const stdoutChunks = [];
        proc.stdout?.on('data', (chunk) => {
            stdoutChunks.push(chunk.toString('utf8'));
            const buf = stdoutChunks.join('');
            const lines = buf.split('\n');
            stdoutChunks.length = 0;
            stdoutChunks.push(lines.pop() ?? '');
            for (const ln of lines)
                flush(ln);
        });
        let stderrTail = '';
        proc.stderr?.on('data', (chunk) => {
            const piece = chunk.toString('utf8');
            stderrTail = (stderrTail + piece).slice(-2000);
        });
        await new Promise((resolve) => {
            proc.on('close', (code, signal) => {
                if (stdoutChunks.length > 0)
                    flush(stdoutChunks.join(''));
                opts.abortSignal.removeEventListener('abort', onAbort);
                if (signal === 'SIGINT' || opts.abortSignal.aborted) {
                    out.next({ type: 'run-completed', status: 'aborted', stopReason: 'aborted_by_user' });
                }
                else if (code !== 0 && !terminalEventEmitted) {
                    out.next({
                        type: 'error',
                        code: 'agent_exit_nonzero',
                        message: `agent exited with code ${code}: ${stderrTail.slice(-500)}`,
                    });
                    out.next({
                        type: 'run-completed',
                        status: 'error',
                        stopReason: `exit_${code}`,
                    });
                }
                out.complete();
                resolve();
            });
            proc.on('error', (err) => {
                out.next({ type: 'error', code: 'spawn_failure', message: err.message });
                out.next({ type: 'run-completed', status: 'error', stopReason: 'spawn_failure' });
                out.complete();
                resolve();
            });
        });
    }
};
exports.AgentRunnerService = AgentRunnerService;
exports.AgentRunnerService = AgentRunnerService = AgentRunnerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AgentRunnerService);
//# sourceMappingURL=agent-runner.service.js.map