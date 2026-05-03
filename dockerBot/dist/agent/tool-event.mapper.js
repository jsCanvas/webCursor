"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolEventMapper = void 0;
const FILE_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit', 'Create']);
class ToolEventMapper {
    inFlight = new Map();
    observe(event) {
        if (event.type === 'tool-use') {
            this.inFlight.set(event.toolUseId, {
                name: event.name,
                input: event.input ?? {},
            });
            return [];
        }
        if (event.type === 'tool-result') {
            const seen = this.inFlight.get(event.toolUseId);
            this.inFlight.delete(event.toolUseId);
            if (!seen || !event.ok || !FILE_TOOLS.has(seen.name))
                return [];
            const path = pickPath(seen.input);
            if (!path)
                return [];
            const action = seen.name === 'Write' || seen.name === 'Create' ? 'create' : 'update';
            return [{ type: 'file-changed', path, action }];
        }
        return [];
    }
}
exports.ToolEventMapper = ToolEventMapper;
function pickPath(input) {
    for (const k of ['file_path', 'path', 'notebook_path']) {
        const v = input[k];
        if (typeof v === 'string')
            return v;
    }
    return null;
}
//# sourceMappingURL=tool-event.mapper.js.map