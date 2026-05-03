"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcurrentRunError = exports.SlugConflictError = exports.RuntimeUpError = exports.AgentRunError = exports.SandboxNotReadyError = exports.GitOperationError = exports.FileNotFoundError = exports.FileConflictError = exports.FileTooLargeError = exports.PathTraversalError = exports.ModelConfigInactiveError = exports.ModelConfigNotFoundError = exports.SessionNotFoundError = exports.ProjectNotFoundError = exports.DomainError = void 0;
class DomainError extends Error {
    code;
    status;
    meta;
    constructor(code, status, message, meta) {
        super(message);
        this.code = code;
        this.status = status;
        this.meta = meta;
        this.name = this.constructor.name;
    }
}
exports.DomainError = DomainError;
class ProjectNotFoundError extends DomainError {
    constructor(id) {
        super('project_not_found', 404, `Project ${id} not found`, { id });
    }
}
exports.ProjectNotFoundError = ProjectNotFoundError;
class SessionNotFoundError extends DomainError {
    constructor(id) {
        super('session_not_found', 404, `Session ${id} not found`, { id });
    }
}
exports.SessionNotFoundError = SessionNotFoundError;
class ModelConfigNotFoundError extends DomainError {
    constructor(id) {
        super('model_config_not_found', 404, `Model config ${id} not found`, { id });
    }
}
exports.ModelConfigNotFoundError = ModelConfigNotFoundError;
class ModelConfigInactiveError extends DomainError {
    constructor() {
        super('no_active_model_config', 412, 'No active model config. POST /api/model-configs/:id/activate first.');
    }
}
exports.ModelConfigInactiveError = ModelConfigInactiveError;
class PathTraversalError extends DomainError {
    constructor(relPath) {
        super('path_traversal', 403, `Path escape attempt: ${relPath}`, { relPath });
    }
}
exports.PathTraversalError = PathTraversalError;
class FileTooLargeError extends DomainError {
    constructor(size, limit) {
        super('file_too_large', 413, `File exceeds limit (${size} > ${limit})`, { size, limit });
    }
}
exports.FileTooLargeError = FileTooLargeError;
class FileConflictError extends DomainError {
    constructor(currentSha) {
        super('file_conflict', 409, 'File changed concurrently', { currentSha });
    }
}
exports.FileConflictError = FileConflictError;
class FileNotFoundError extends DomainError {
    constructor(relPath) {
        super('file_not_found', 404, `File not found: ${relPath}`, { relPath });
    }
}
exports.FileNotFoundError = FileNotFoundError;
class GitOperationError extends DomainError {
    constructor(step, stderr) {
        super('git_operation_failed', 422, `Git ${step} failed: ${stderr.slice(0, 500)}`, {
            step,
            stderr: stderr.slice(0, 2000),
        });
    }
}
exports.GitOperationError = GitOperationError;
class SandboxNotReadyError extends DomainError {
    constructor(detail) {
        super('sandbox_not_ready', 503, `Sandbox not ready: ${detail}`, { detail });
    }
}
exports.SandboxNotReadyError = SandboxNotReadyError;
class AgentRunError extends DomainError {
    constructor(message, meta) {
        super('agent_run_failed', 500, message, meta);
    }
}
exports.AgentRunError = AgentRunError;
class RuntimeUpError extends DomainError {
    constructor(phase, detail) {
        super('runtime_up_failed', 422, `Runtime up failed at ${phase}: ${detail}`, {
            phase,
            detail: detail.slice(0, 2000),
        });
    }
}
exports.RuntimeUpError = RuntimeUpError;
class SlugConflictError extends DomainError {
    constructor(slug) {
        super('slug_conflict', 409, `Slug "${slug}" is already taken`, { slug });
    }
}
exports.SlugConflictError = SlugConflictError;
class ConcurrentRunError extends DomainError {
    constructor(sessionId) {
        super('concurrent_run', 409, `Session ${sessionId} already has a running agent`, {
            sessionId,
        });
    }
}
exports.ConcurrentRunError = ConcurrentRunError;
//# sourceMappingURL=errors.js.map