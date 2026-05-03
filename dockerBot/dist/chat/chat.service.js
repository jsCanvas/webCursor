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
var ChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const rxjs_1 = require("rxjs");
const agent_runner_service_1 = require("../agent/agent-runner.service");
const sandbox_prep_service_1 = require("../agent/sandbox-prep.service");
const attachments_service_1 = require("../attachments/attachments.service");
const errors_1 = require("../common/errors");
const mcp_service_1 = require("../mcp/mcp.service");
const model_config_service_1 = require("../model-config/model-config.service");
const project_path_service_1 = require("../projects/project-path.service");
const projects_service_1 = require("../projects/projects.service");
const skills_service_1 = require("../skills/skills.service");
const sessions_repository_1 = require("./sessions.repository");
let ChatService = ChatService_1 = class ChatService {
    repo;
    projects;
    path;
    modelConfig;
    skills;
    mcp;
    attachments;
    runner;
    prep;
    logger = new common_1.Logger(ChatService_1.name);
    active = new Map();
    maxConcurrent;
    constructor(repo, projects, path, modelConfig, skills, mcp, attachments, runner, prep, config) {
        this.repo = repo;
        this.projects = projects;
        this.path = path;
        this.modelConfig = modelConfig;
        this.skills = skills;
        this.mcp = mcp;
        this.attachments = attachments;
        this.runner = runner;
        this.prep = prep;
        this.maxConcurrent = config.get('PHONEBOT_MAX_CONCURRENT_RUNS', { infer: true });
    }
    createSession(opts) {
        const project = this.projects.rawRow(opts.projectId);
        if (!project)
            throw new errors_1.ProjectNotFoundError(opts.projectId);
        const id = (0, crypto_1.randomUUID)();
        const now = new Date().toISOString();
        const row = {
            id,
            project_id: opts.projectId,
            title: opts.title ?? 'New conversation',
            claude_session_id: null,
            created_at: now,
            updated_at: now,
        };
        this.repo.insertSession(row);
        return row;
    }
    listSessions(projectId) {
        return this.repo.listSessionsByProject(projectId);
    }
    findSession(sessionId) {
        const s = this.repo.findSession(sessionId);
        if (!s)
            throw new errors_1.SessionNotFoundError(sessionId);
        return s;
    }
    listMessages(sessionId, limit, before) {
        return this.repo.listMessages(sessionId, limit, before).map(parseMessageRow);
    }
    deleteSession(sessionId) {
        this.repo.deleteSession(sessionId);
    }
    abort(sessionId) {
        const run = this.active.get(sessionId);
        if (!run)
            return false;
        run.controller.abort();
        return true;
    }
    send(opts) {
        const subject = new rxjs_1.Subject();
        void this.sendInternal(opts, subject).catch((err) => {
            const message = err instanceof Error ? err.message : String(err);
            const code = err instanceof Error ? err.code ?? 'send_failed' : 'send_failed';
            subject.next({ type: 'error', code, message });
            subject.next({ type: 'run-completed', status: 'error', stopReason: code });
            subject.complete();
        });
        return subject.asObservable();
    }
    async sendInternal(opts, out) {
        const session = this.findSession(opts.sessionId);
        const existing = this.active.get(opts.sessionId);
        if (existing) {
            if (opts.abortPrevious) {
                existing.controller.abort();
            }
            else {
                throw new errors_1.ConcurrentRunError(opts.sessionId);
            }
        }
        if (this.active.size >= this.maxConcurrent) {
            throw new errors_1.ConcurrentRunError('global_max_concurrent');
        }
        const project = this.projects.rawRow(session.project_id);
        const modelConfig = this.modelConfig.resolveActive();
        if (!modelConfig)
            throw new errors_1.ModelConfigInactiveError();
        const attachments = opts.attachmentIds?.length
            ? this.attachments.resolve(opts.attachmentIds)
            : [];
        const userBlocks = buildUserContent(opts.text, attachments);
        const userMessage = {
            id: (0, crypto_1.randomUUID)(),
            session_id: opts.sessionId,
            role: 'user',
            content: JSON.stringify(userBlocks),
            run_id: null,
            created_at: new Date().toISOString(),
        };
        this.repo.insertMessage(userMessage);
        const runId = (0, crypto_1.randomUUID)();
        const run = {
            id: runId,
            session_id: opts.sessionId,
            status: 'running',
            started_at: new Date().toISOString(),
            finished_at: null,
            total_input_tokens: null,
            total_output_tokens: null,
            cost_usd: null,
            stop_reason: null,
            error_message: null,
        };
        this.repo.insertRun(run);
        const skillRows = this.skills.resolveByNames(opts.skills ?? []);
        const mcpRows = this.mcp.resolveByNames(opts.mcpServers ?? []);
        const { mcpConfigPath } = await this.prep.prepare({
            workdirHost: project.workdir,
            workdirSandbox: this.path.sandboxWorkdir(session.project_id),
            modelConfig,
            skills: skillRows,
            mcpServers: mcpRows,
        });
        const controller = new AbortController();
        this.active.set(opts.sessionId, { controller, runId });
        const events$ = this.runner.run({
            runId,
            sandboxWorkdir: this.path.sandboxWorkdir(session.project_id),
            mcpConfigPath,
            userContentBlocks: userBlocks,
            claudeSessionId: session.claude_session_id,
            abortSignal: controller.signal,
        });
        const aggregator = {
            tokens: [],
            assistantText: '',
        };
        let finalStatus = 'running';
        let stopReason = null;
        await new Promise((resolve) => {
            const sub = events$.subscribe({
                next: (e) => {
                    if (e.type === 'run-started' && e.claudeSessionId) {
                        aggregator.capturedSessionId = e.claudeSessionId;
                    }
                    if (e.type === 'assistant-text') {
                        aggregator.assistantText += e.delta;
                    }
                    if (e.type === 'token-usage') {
                        aggregator.tokens.push(e);
                    }
                    if (e.type === 'run-completed') {
                        finalStatus = e.status === 'success' ? 'completed' : e.status;
                        stopReason = e.stopReason ?? null;
                    }
                    out.next(e);
                },
                error: (err) => {
                    this.logger.error(`Runner error for run ${runId}: ${err.message}`);
                    out.next({
                        type: 'error',
                        code: 'runner_error',
                        message: err.message,
                    });
                    out.next({ type: 'run-completed', status: 'error', stopReason: 'runner_error' });
                    finalStatus = 'error';
                    stopReason = 'runner_error';
                    sub.unsubscribe();
                    resolve();
                },
                complete: () => resolve(),
            });
        });
        if (aggregator.assistantText.trim()) {
            this.repo.insertMessage({
                id: (0, crypto_1.randomUUID)(),
                session_id: opts.sessionId,
                role: 'assistant',
                content: JSON.stringify([{ type: 'text', text: aggregator.assistantText }]),
                run_id: runId,
                created_at: new Date().toISOString(),
            });
        }
        if (aggregator.capturedSessionId) {
            this.repo.updateSession(opts.sessionId, {
                claude_session_id: aggregator.capturedSessionId,
                updated_at: new Date().toISOString(),
            });
        }
        const lastUsage = aggregator.tokens.at(-1);
        this.repo.updateRun(runId, {
            status: finalStatus,
            finished_at: new Date().toISOString(),
            stop_reason: stopReason,
            total_input_tokens: lastUsage && lastUsage.type === 'token-usage' ? lastUsage.inputTokens ?? null : null,
            total_output_tokens: lastUsage && lastUsage.type === 'token-usage' ? lastUsage.outputTokens ?? null : null,
            cost_usd: lastUsage && lastUsage.type === 'token-usage' ? lastUsage.costUsd ?? null : null,
        });
        this.active.delete(opts.sessionId);
        out.complete();
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = ChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [sessions_repository_1.SessionsRepository,
        projects_service_1.ProjectsService,
        project_path_service_1.ProjectPathService,
        model_config_service_1.ModelConfigService,
        skills_service_1.SkillsService,
        mcp_service_1.McpService,
        attachments_service_1.AttachmentsService,
        agent_runner_service_1.AgentRunnerService,
        sandbox_prep_service_1.SandboxPrepService,
        config_1.ConfigService])
], ChatService);
function buildUserContent(text, attachments) {
    const blocks = [{ type: 'text', text }];
    for (const a of attachments) {
        if (a.mime_type.startsWith('image/')) {
            blocks.push({
                type: 'text',
                text: `[Attached image: ${a.filename} (saved at ./${a.rel_path}). Read it via the Read tool if needed.]`,
            });
        }
        else {
            blocks.push({
                type: 'text',
                text: `[Attached file: ${a.filename} (saved at ./${a.rel_path}). Read it via the Read tool if needed.]`,
            });
        }
    }
    return blocks;
}
function parseMessageRow(row) {
    let content;
    try {
        content = JSON.parse(row.content);
    }
    catch {
        content = row.content;
    }
    return {
        id: row.id,
        role: row.role,
        content,
        runId: row.run_id,
        createdAt: row.created_at,
    };
}
//# sourceMappingURL=chat.service.js.map