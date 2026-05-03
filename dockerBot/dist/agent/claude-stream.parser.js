"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeStreamParser = void 0;
const common_1 = require("@nestjs/common");
let ClaudeStreamParser = class ClaudeStreamParser {
    claudeSessionId = null;
    reset() {
        this.claudeSessionId = null;
    }
    get capturedClaudeSessionId() {
        return this.claudeSessionId;
    }
    translate(line) {
        if (!line || typeof line !== 'object')
            return [];
        const obj = line;
        const type = obj.type;
        if (type === 'system' && obj.subtype === 'init') {
            const sid = obj.session_id ?? null;
            this.claudeSessionId = sid;
            return [{ type: 'run-started', runId: '', claudeSessionId: sid }];
        }
        if (type === 'stream_event') {
            const inner = obj.event;
            if (!inner)
                return [];
            if (inner.type === 'content_block_delta') {
                const delta = inner.delta;
                if (delta && delta.type === 'text_delta' && typeof delta.text === 'string') {
                    return [{ type: 'assistant-text', delta: delta.text }];
                }
            }
            return [];
        }
        if (type === 'assistant') {
            const message = obj.message;
            const content = message?.content ?? [];
            const out = [];
            for (const block of content) {
                if (typeof block !== 'object' || !block)
                    continue;
                const b = block;
                if (b.type === 'text' && typeof b.text === 'string') {
                    out.push({ type: 'assistant-text', delta: b.text });
                }
                if (b.type === 'tool_use') {
                    out.push({
                        type: 'tool-use',
                        toolUseId: b.id ?? '',
                        name: b.name ?? '',
                        input: b.input ?? {},
                    });
                }
            }
            return out;
        }
        if (type === 'user') {
            const message = obj.message;
            const content = message?.content ?? [];
            const out = [];
            for (const block of content) {
                if (typeof block !== 'object' || !block)
                    continue;
                const b = block;
                if (b.type === 'tool_result') {
                    const isError = b.is_error === true;
                    out.push({
                        type: 'tool-result',
                        toolUseId: b.tool_use_id ?? '',
                        ok: !isError,
                        summary: summarizeContent(b.content),
                    });
                }
            }
            return out;
        }
        if (type === 'result') {
            const subtype = obj.subtype;
            const usage = obj.usage;
            const out = [];
            if (usage) {
                out.push({
                    type: 'token-usage',
                    inputTokens: numOrUndef(usage.input_tokens),
                    outputTokens: numOrUndef(usage.output_tokens),
                    cacheReadTokens: numOrUndef(usage.cache_read_input_tokens),
                    cacheCreateTokens: numOrUndef(usage.cache_creation_input_tokens),
                    costUsd: numOrUndef(obj.total_cost_usd),
                });
            }
            if (subtype === 'success' && obj.is_error !== true) {
                out.push({ type: 'run-completed', status: 'success', stopReason: 'success' });
            }
            else {
                const apiStatus = numOrUndef(obj.api_error_status);
                const code = apiStatus ? `api_error_${apiStatus}` : (subtype ?? 'agent_error');
                const errMsg = (typeof obj.result === 'string' && obj.result) ||
                    (typeof obj.error === 'string' && obj.error) ||
                    subtype ||
                    'unknown error';
                out.push({ type: 'error', code, message: errMsg });
                out.push({ type: 'run-completed', status: 'error', stopReason: code });
            }
            return out;
        }
        return [];
    }
};
exports.ClaudeStreamParser = ClaudeStreamParser;
exports.ClaudeStreamParser = ClaudeStreamParser = __decorate([
    (0, common_1.Injectable)()
], ClaudeStreamParser);
function numOrUndef(v) {
    return typeof v === 'number' ? v : undefined;
}
function summarizeContent(c, max = 600) {
    if (typeof c === 'string')
        return c.slice(0, max);
    if (Array.isArray(c)) {
        const texts = c
            .map((b) => {
            if (b && typeof b === 'object' && b.type === 'text') {
                return String(b.text ?? '');
            }
            return '';
        })
            .filter(Boolean);
        return texts.join('\n').slice(0, max);
    }
    return '';
}
//# sourceMappingURL=claude-stream.parser.js.map