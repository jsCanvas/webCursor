import type { AgentEvent, AgentTimelineState, ToolCallState } from './types';

export function reduceAgentEvent(state: AgentTimelineState, event: AgentEvent): AgentTimelineState {
  switch (event.type) {
    case 'run-started':
      return {
        ...state,
        runId: event.runId,
        claudeSessionId: event.claudeSessionId,
        status: 'running',
        assistantText: '',
        toolCalls: [],
        fileChanges: {},
        errors: [],
        stopReason: undefined,
        tokenUsage: undefined,
      };

    case 'assistant-text':
      return { ...state, assistantText: state.assistantText + event.delta };

    case 'tool-use': {
      const next: ToolCallState = {
        toolUseId: event.toolUseId,
        name: event.name,
        input: event.input,
      };
      return { ...state, toolCalls: [...state.toolCalls, next] };
    }

    case 'tool-result': {
      const idx = state.toolCalls.findIndex((c) => c.toolUseId === event.toolUseId);
      if (idx === -1) return state;
      const updated = [...state.toolCalls];
      updated[idx] = { ...updated[idx], ok: event.ok, summary: event.summary };
      return { ...state, toolCalls: updated };
    }

    case 'file-changed':
      return {
        ...state,
        fileChanges: {
          ...state.fileChanges,
          [event.path]: {
            path: event.path,
            action: event.action,
            observedAt: Date.now(),
          },
        },
      };

    case 'token-usage':
      return {
        ...state,
        tokenUsage: {
          inputTokens: event.inputTokens,
          outputTokens: event.outputTokens,
          cacheReadTokens: event.cacheReadTokens,
          cacheCreateTokens: event.cacheCreateTokens,
          costUsd: event.costUsd,
        },
      };

    case 'run-completed':
      return {
        ...state,
        status:
          event.status === 'success'
            ? 'completed'
            : event.status === 'aborted'
              ? 'aborted'
              : 'error',
        stopReason: event.stopReason,
      };

    case 'error':
      return {
        ...state,
        errors: [...state.errors, { code: event.code, message: event.message }],
      };
  }
}
