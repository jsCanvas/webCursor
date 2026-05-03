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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var GitService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitService = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const simple_git_1 = __importDefault(require("simple-git"));
const errors_1 = require("../common/errors");
const git_url_1 = require("./git-url");
let GitService = GitService_1 = class GitService {
    logger = new common_1.Logger(GitService_1.name);
    async clone(opts) {
        const { workdir, url, token, branch } = opts;
        await fs.promises.mkdir(workdir, { recursive: true });
        const dotGit = path.join(workdir, '.git');
        if (fs.existsSync(dotGit)) {
            throw new errors_1.GitOperationError('clone', 'workdir already initialized');
        }
        const { authUrl, publicUrl } = (0, git_url_1.composeAuthUrl)(url, token);
        const git = (0, simple_git_1.default)({ baseDir: workdir });
        try {
            await git.clone(authUrl, '.', branch ? ['-b', branch] : []);
        }
        catch (e) {
            throw new errors_1.GitOperationError('clone', extractStderr(e));
        }
        try {
            await git.removeRemote('origin').catch(() => undefined);
            await git.addRemote('origin', publicUrl);
        }
        catch (e) {
            this.logger.warn(`Failed to reset origin URL: ${e.message}`);
        }
        if (token && (await this.remoteContainsCredentials(workdir))) {
            throw new errors_1.GitOperationError('clone', 'remote URL still contains credentials after scrub');
        }
    }
    async status(workdir) {
        const git = (0, simple_git_1.default)({ baseDir: workdir });
        try {
            const s = await git.status();
            return {
                modified: [...s.modified],
                staged: [...s.staged],
                untracked: [...s.not_added],
                deleted: [...s.deleted],
                conflicted: [...s.conflicted],
                branch: s.current ?? null,
                ahead: s.ahead,
                behind: s.behind,
                clean: s.isClean(),
            };
        }
        catch (e) {
            throw new errors_1.GitOperationError('status', extractStderr(e));
        }
    }
    async diff(workdir, relPath, maxBytes = 200_000) {
        const git = (0, simple_git_1.default)({ baseDir: workdir });
        try {
            const args = relPath ? ['--', relPath] : [];
            const out = await git.diff(args);
            if (out.length > maxBytes) {
                return `${out.slice(0, maxBytes)}\n\n[truncated, original ${out.length} bytes]`;
            }
            return out;
        }
        catch (e) {
            throw new errors_1.GitOperationError('diff', extractStderr(e));
        }
    }
    async checkoutBranch(workdir, branch, opts = {}) {
        const git = (0, simple_git_1.default)({ baseDir: workdir });
        try {
            if (opts.create) {
                await git.checkoutLocalBranch(branch);
            }
            else {
                await git.checkout(branch);
            }
        }
        catch (e) {
            throw new errors_1.GitOperationError('checkout', extractStderr(e));
        }
    }
    async commit(workdir, opts) {
        const git = (0, simple_git_1.default)({ baseDir: workdir });
        try {
            if (opts.addAll) {
                await git.add(['-A']);
            }
            const status = await git.status();
            if (status.isClean()) {
                return { noop: true, files: 0 };
            }
            const stagedCount = status.staged.length + status.created.length + status.deleted.length + status.renamed.length;
            if (stagedCount === 0 && !opts.addAll) {
                return { noop: true, files: 0 };
            }
            const result = await git
                .env({ GIT_COMMITTER_NAME: 'dockerBot', GIT_COMMITTER_EMAIL: 'bot@dockerbot.local' })
                .commit(opts.message, undefined, {
                '--author': 'dockerBot <bot@dockerbot.local>',
            });
            return { noop: false, commit: result.commit, files: stagedCount };
        }
        catch (e) {
            throw new errors_1.GitOperationError('commit', extractStderr(e));
        }
    }
    async push(workdir, opts) {
        const git = (0, simple_git_1.default)({ baseDir: workdir });
        const { authUrl, publicUrl } = (0, git_url_1.composeAuthUrl)(opts.remoteUrl, opts.token);
        const branch = opts.branch ?? (await git.status()).current ?? 'main';
        try {
            await git.removeRemote('origin').catch(() => undefined);
            await git.addRemote('origin', authUrl);
            const args = ['origin', branch];
            if (opts.force)
                args.unshift('--force');
            await git.push(args);
            return { pushed: true, branch };
        }
        catch (e) {
            throw new errors_1.GitOperationError('push', extractStderr(e));
        }
        finally {
            try {
                await git.removeRemote('origin').catch(() => undefined);
                await git.addRemote('origin', publicUrl);
            }
            catch (e) {
                this.logger.warn(`Failed to reset origin URL after push: ${e.message}`);
            }
        }
    }
    async commitAndPush(workdir, opts) {
        if (opts.checkoutBranch && opts.branch) {
            await this.checkoutBranch(workdir, opts.branch, { create: true });
        }
        const commitResult = await this.commit(workdir, opts);
        if (commitResult.noop) {
            return { commit: commitResult, push: { skipped: true } };
        }
        const pushResult = await this.push(workdir, opts);
        return { commit: commitResult, push: pushResult };
    }
    async remoteContainsCredentials(workdir) {
        const git = (0, simple_git_1.default)({ baseDir: workdir });
        try {
            const remote = await git.remote(['get-url', 'origin']);
            if (typeof remote !== 'string')
                return false;
            return (0, git_url_1.urlHasCredentials)(remote.trim());
        }
        catch {
            return false;
        }
    }
};
exports.GitService = GitService;
exports.GitService = GitService = GitService_1 = __decorate([
    (0, common_1.Injectable)()
], GitService);
function extractStderr(e) {
    if (typeof e === 'object' && e !== null && 'message' in e) {
        return String(e.message);
    }
    return String(e);
}
//# sourceMappingURL=git.service.js.map