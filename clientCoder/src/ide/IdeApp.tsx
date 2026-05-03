import Editor from '@monaco-editor/react';
import { PhoneBotApiClient } from '@phoneBot/api/phoneBotApi';
import { buildSendMessageInput, type UploadedAttachment } from '@phoneBot/chat/chatPayload';
import { DEFAULT_API_BASE_URL } from '@phoneBot/config/defaults';
import type { AgentTimelineState } from '@phoneBot/events/types';
import { useAgentSession } from '@phoneBot/hooks/useAgentSession';
import {
  flattenVisibleTree,
  getFileTreeRequestOptions,
  mergeFileTreeChildren,
  removeFileTreeNode,
  shouldLoadDirectoryChildren,
  toggleExpandedPath,
  WORKSPACE_ROOT_PATH,
} from '@phoneBot/screens/fileTree';
import { getMonacoLanguage } from '@phoneBot/screens/fileEditor';
import {
  ensureChatSession,
  saveFileContent,
  selectProject,
  selectSession,
} from '@phoneBot/screens/screenActions';
import type {
  FileContentDto,
  FileTreeNode,
  GitStatusDto,
  MessageDto,
  McpServerDto,
  ProjectDto,
  RuntimeDto,
  SessionDto,
  SkillDto,
} from '@phoneBot/types/api';
import { getErrorMessage } from '@phoneBot/utils/errorMessage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TFunction } from '../i18n/I18nContext';
import { useI18n } from '../i18n/I18nContext';
import { phoneBotStorage, WebPersistence } from '../storage/webSettingsStorage';
import { ChatMentionComposer } from './ChatMentionComposer';
import { WorkspaceSettingsModal } from './WorkspaceSettingsModal';

export type IdeAppProps = {
  defaultApiBaseUrl?: string;
};

type ActivityKey = 'explorer' | 'search' | 'scm' | 'extensions';

type BottomKey = 'problems' | 'output' | 'terminal' | 'ports';

type EditorTab = {
  path: string;
  content: FileContentDto;
  draft: string;
};

function unique(arr: string[]): string[] {
  return Array.from(new Set(arr.filter(Boolean)));
}

function stringify(content: unknown): string {
  if (typeof content === 'string') return content;
  return JSON.stringify(content, null, 2);
}

function AgentTimelineWeb({ state }: { state: AgentTimelineState }) {
  const { t } = useI18n();
  const fileChanges = Object.values(state.fileChanges);
  const labels: Record<AgentTimelineState['status'], string> = {
    idle: t('agentStream.status.idle'),
    running: t('agentStream.status.running'),
    completed: t('agentStream.status.completed'),
    aborted: t('agentStream.status.aborted'),
    error: t('agentStream.status.error'),
  };
  const toolOutcome = (ok?: boolean) => {
    if (ok === undefined) return t('agentStream.toolRunning');
    return ok ? t('agentStream.toolOk') : t('agentStream.toolFail');
  };
  return (
    <div className="ide-chat-history">
      <div className="ide-assistant-banner">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <strong>{t('agentStream.title')}</strong>
          <span>{labels[state.status]}</span>
        </div>
        {state.assistantText ? (
          <div style={{ marginTop: 6 }}>{state.assistantText}</div>
        ) : (
          <div className="ide-muted">{t('agentStream.noReply')}</div>
        )}
      </div>
      {state.toolCalls.length > 0 ? (
        <div>
          <div className="ide-muted" style={{ fontWeight: 700, marginBottom: 6 }}>
            {t('agentStream.tools')}
          </div>
          {state.toolCalls.map((call) => (
            <div key={call.toolUseId} className="ide-tool-mini" style={{ marginBottom: 6 }}>
              <div style={{ fontWeight: 700 }}>
                {call.name}
                {' · '}
                {toolOutcome(call.ok)}
              </div>
              {call.summary ? <div className="ide-muted">{call.summary}</div> : null}
            </div>
          ))}
        </div>
      ) : null}
      {fileChanges.length > 0 ? (
        <div>
          <div className="ide-muted" style={{ fontWeight: 700, marginBottom: 6 }}>
            {t('agentStream.fileChanges')}
          </div>
          {fileChanges.map((entry) => (
            <div key={entry.path} className="ide-muted">
              [{entry.action}] {entry.path}
            </div>
          ))}
        </div>
      ) : null}
      {state.tokenUsage ? (
        <div className="ide-muted">
          tokens: in={state.tokenUsage.inputTokens ?? 0} out={state.tokenUsage.outputTokens ?? 0}
          {state.tokenUsage.costUsd != null ? ` · $${state.tokenUsage.costUsd.toFixed(4)}` : ''}
        </div>
      ) : null}
      {state.errors.map((err, idx) => (
        <div key={`${err.code}-${idx}`} style={{ color: '#f85149' }}>
          [{err.code}] {err.message}
        </div>
      ))}
    </div>
  );
}

export function IdeApp({ defaultApiBaseUrl = DEFAULT_API_BASE_URL }: IdeAppProps) {
  const { t, locale, toggleLocale } = useI18n();
  const persistence = useMemo(() => new WebPersistence(), []);
  const storage = useMemo(() => phoneBotStorage(persistence), [persistence]);

  const [apiBaseUrlInput, setApiBaseUrlInput] = useState(defaultApiBaseUrl);
  const [apiBaseUrlEffective, setApiBaseUrlEffective] = useState(defaultApiBaseUrl);
  const apiClient = useMemo(() => new PhoneBotApiClient(apiBaseUrlEffective), [apiBaseUrlEffective]);

  const [project, setProject] = useState<ProjectDto | null>(null);
  const [sessions, setSessions] = useState<SessionDto[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [tree, setTree] = useState<FileTreeNode[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [editorTabs, setEditorTabs] = useState<EditorTab[]>([]);
  const [activeTabPath, setActiveTabPath] = useState<string | null>(null);

  const [activity, setActivity] = useState<ActivityKey>('explorer');
  const [bottomVisible, setBottomVisible] = useState(true);
  const [bottomKey, setBottomKey] = useState<BottomKey>('output');
  const [chatCollapsed, setChatCollapsed] = useState(false);

  const [skills, setSkills] = useState<SkillDto[]>([]);
  const [mcps, setMcps] = useState<McpServerDto[]>([]);
  const [enabledSkills, setEnabledSkills] = useState<string[]>([]);
  const [enabledMcps, setEnabledMcps] = useState<string[]>([]);

  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [history, setHistory] = useState<MessageDto[]>([]);
  const [outputLines, setOutputLines] = useState<string[]>([]);

  const [statusLineLeft, setStatusLineLeft] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [treeBusy, setTreeBusy] = useState(false);

  const [sidebarPx, setSidebarPx] = useState(278);
  const [chatPx, setChatPx] = useState(380);
  const [bottomPx, setBottomPx] = useState(180);

  const [searchFilter, setSearchFilter] = useState('');
  const [gitStatus, setGitStatus] = useState<GitStatusDto | null>(null);
  const [runtime, setRuntime] = useState<RuntimeDto | null>(null);

  /** Keep fixed English intro so locale toggle does not fight user shell history */
  const [terminalLines, setTerminalLines] = useState<string[]>(() => [
    '$ clientBot sandbox shell.',
    '$ Try `git status`, `clear`, `pwd`.',
  ]);

  const [problemMock] = useState<string[]>(() => []);

  const [pendingDelete, setPendingDelete] = useState<{ path: string; type: FileTreeNode['type'] } | null>(
    null,
  );

  const [includeOpenFileChip, setIncludeOpenFileChip] = useState(true);
  const [shellCommand, setShellCommand] = useState('');
  const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { state: agentState, send, stop } = useAgentSession({
    apiClient,
    sessionId,
  });

  const appendOutput = useCallback((line: string) => {
    setOutputLines((rows) => [...rows, line]);
  }, []);

  useEffect(() => {
    void persistence.load().then((loaded) => {
      const normalized = (loaded?.apiBaseUrl || defaultApiBaseUrl).replace(/\/$/, '');
      setApiBaseUrlInput(normalized);
      setApiBaseUrlEffective(normalized);
      void bootstrapCatalogsBase(normalized);
      if (loaded?.selectedProjectId) void hydrateProject(normalized, loaded.selectedProjectId, loaded.selectedSessionId ?? null);
      if (loaded?.enabledSkillNames?.length) setEnabledSkills(loaded.enabledSkillNames);
      if (loaded?.enabledMcpNames?.length) setEnabledMcps(loaded.enabledMcpNames);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function bootstrapCatalogsBase(base: string) {
    const cli = new PhoneBotApiClient(base.replace(/\/$/, ''));
    try {
      const [s, m] = await Promise.all([cli.listSkills(), cli.listMcpServers()]);
      setSkills(s);
      setMcps(m);
    } catch (error) {
      appendOutput(`[bootstrap] ${getErrorMessage(error)}`);
    }
  }

  async function hydrateProject(base: string, projectId: string, preferredSessionId?: string | null) {
    const cli = new PhoneBotApiClient(base.replace(/\/$/, ''));
    try {
      const dto = await cli.getProject(projectId);
      setProject(dto);
      const nextSessions = await cli.listSessions(projectId);
      setSessions(nextSessions);
      let sid = preferredSessionId ?? null;
      if (!sid || !nextSessions.some((row) => row.id === sid)) sid = nextSessions[0]?.id ?? null;
      setSessionId(sid);
      if (sid) await loadHistory(cli, sid);
      setStatusLineLeft(`${dto.name} · ${dto.status}`);
    } catch (error) {
      setStatusLineLeft(t('status.projectUnavailable', { message: getErrorMessage(error) }));
    }
  }

  useEffect(() => {
    void bootstrapCatalogsBase(apiBaseUrlEffective.replace(/\/$/, ''));
  }, [apiBaseUrlEffective]);

  useEffect(() => {
    if (!project) {
      setTree([]);
      setEditorTabs([]);
      setActiveTabPath(null);
      return;
    }
    setExpanded(new Set([WORKSPACE_ROOT_PATH]));
    void loadRootTree(project.id);
    void bootstrapGitRuntime(project.id);
    void refreshSessions(project.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  useEffect(() => {
    if (!sessionId) {
      setHistory([]);
      return;
    }
    void loadHistory(apiClient, sessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, apiBaseUrlEffective]);

  async function loadHistory(cli: PhoneBotApiClient, sid: string) {
    try {
      setHistory(await cli.listMessages(sid));
    } catch (error) {
      setHistory([]);
      appendOutput(`[history error] ${getErrorMessage(error)}`);
    }
  }

  async function refreshSessions(pid: string) {
    try {
      setSessions(await apiClient.listSessions(pid));
    } catch {
      /* ignore */
    }
  }

  async function bootstrapGitRuntime(pid: string) {
    try {
      setGitStatus(await apiClient.gitStatus(pid));
    } catch {
      setGitStatus(null);
    }
    try {
      setRuntime(await apiClient.getRuntime(pid));
    } catch {
      setRuntime(null);
    }
  }

  async function loadRootTree(pid: string) {
    try {
      setTreeBusy(true);
      const next = await apiClient.listFiles(pid, getFileTreeRequestOptions());
      setTree(next);
    } catch (error) {
      appendOutput(`Load tree failed: ${getErrorMessage(error)}`);
    } finally {
      setTreeBusy(false);
    }
  }

  const explorerTree = useMemo((): FileTreeNode[] => {
    if (!project) return [];
    const segments = project.workdir.replace(/\\/g, '/').split('/').filter(Boolean);
    const rootLabel = segments.length ? segments[segments.length - 1]! : project.slug || project.name;
    return [{ name: rootLabel, path: WORKSPACE_ROOT_PATH, type: 'dir', children: tree }];
  }, [project, tree]);

  const flatTree = useMemo(() => flattenVisibleTree(explorerTree, expanded), [explorerTree, expanded]);

  const filteredTreeRows = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return flatTree;
    return flatTree.filter((node) => node.path.toLowerCase().includes(q) || node.name.toLowerCase().includes(q));
  }, [flatTree, searchFilter]);

  async function toggleDirectory(item: FileTreeNode) {
    if (!project) return;
    if (item.path === WORKSPACE_ROOT_PATH) {
      setExpanded((current) => toggleExpandedPath(current, item.path));
      return;
    }
    const wasExpanded = expanded.has(item.path);
    setExpanded((current) => toggleExpandedPath(current, item.path));
    if (!shouldLoadDirectoryChildren(item, wasExpanded)) return;
    try {
      setTreeBusy(true);
      const children = await apiClient.listFiles(project.id, { dir: item.path });
      setTree((current) => mergeFileTreeChildren(current, item.path, children));
    } catch (error) {
      appendOutput(`[tree] ${getErrorMessage(error)}`);
      setExpanded((current) => toggleExpandedPath(current, item.path));
    } finally {
      setTreeBusy(false);
    }
  }

  async function openFile(path: string) {
    if (!project) return;
    const existing = editorTabs.find((tab) => tab.path === path);
    if (existing) {
      setActiveTabPath(path);
      setStatusLineLeft(path.replace(/\\/g, '/'));
      return;
    }
    try {
      const result = await apiClient.readFile(project.id, path);
      const draft = result.encoding === 'utf8' ? result.content : '';
      const tab: EditorTab = { path, content: result, draft };
      setEditorTabs((curr) => [...curr, tab]);
      setActiveTabPath(path);
      setStatusLineLeft(`${path}`);
      setIncludeOpenFileChip(true);
    } catch (error) {
      appendOutput(`[read] ${getErrorMessage(error)}`);
    }
  }

  function updateActiveDraft(value: string | undefined) {
    const path = activeTabPath;
    if (!path) return;
    setEditorTabs((curr) => curr.map((tab) => (tab.path === path ? { ...tab, draft: value ?? '' } : tab)));
    const nl = String(value ?? '').split('\n').length;
    setCursorPos((prev) => ({ ln: nl, col: prev.col }));
  }

  async function saveActive() {
    if (!project || !activeTabPath) return;
    const tab = editorTabs.find((t) => t.path === activeTabPath);
    if (!tab || tab.content.encoding !== 'utf8') return;
    try {
      const saved = await saveFileContent({
        apiClient,
        projectId: project.id,
        form: {
          path: tab.content.path,
          content: tab.draft,
          encoding: 'utf8',
          expectedSha: tab.content.sha,
        },
      });
      setEditorTabs((curr) =>
        curr.map((t) =>
          t.path === tab.path ? { ...t, content: { ...t.content, sha: saved.sha, size: saved.size, content: t.draft } } : t,
        ),
      );
      appendOutput(`Saved ${saved.path}`);
    } catch (error) {
      appendOutput(`Save failed: ${getErrorMessage(error)}`);
    }
  }

  function closeTab(pathToClose: string) {
    setEditorTabs((curr) => curr.filter((t) => t.path !== pathToClose));
    setActiveTabPath((prevActive) => {
      if (prevActive !== pathToClose) return prevActive;
      const remaining = editorTabs.filter((t) => t.path !== pathToClose);
      return remaining[remaining.length - 1]?.path ?? null;
    });
  }

  const collapseExplorer = useCallback(() => {
    setExpanded(new Set());
  }, []);

  async function finalizeDeletion() {
    if (!pendingDelete || !project) return;
    const node = pendingDelete;
    try {
      await apiClient.deleteFile(project.id, node.path);
      setTree((curr) => removeFileTreeNode(curr, node.path));
      setExpanded((current) => {
        const next = new Set<string>();
        for (const p of current) if (p !== node.path && !p.startsWith(`${node.path}/`)) next.add(p);
        return next;
      });
      closeTab(node.path);
      appendOutput(`Deleted ${node.type === 'dir' ? 'directory' : 'file'} ${node.path}`);
    } catch (error) {
      appendOutput(`Delete failed: ${getErrorMessage(error)}`);
    } finally {
      setPendingDelete(null);
    }
  }

  async function createFileOrFolder(kind: 'file' | 'dir') {
    if (!project) return;
    const rel = prompt(kind === 'file' ? t('prompt.newFilePath') : t('prompt.newFolderPath'));
    if (!rel) return;
    const normalized = rel.replace(/\\/g, '/').replace(/^\/+/, '');
    try {
      if (kind === 'file') await apiClient.writeFile(project.id, { path: normalized, content: '', encoding: 'utf8' });
      else await apiClient.writeFile(project.id, { path: `${normalized.replace(/\/$/, '')}/.gitkeep`, content: '', encoding: 'utf8' });
      await loadRootTree(project.id);
      appendOutput(`Created ${normalized}`);
    } catch (error) {
      appendOutput(`Create failed: ${getErrorMessage(error)}`);
    }
  }

  async function persistApiBase(nextRaw: string) {
    const trimmed = nextRaw.replace(/\/+$/, '');
    await persistence.patch({ apiBaseUrl: trimmed });
    setApiBaseUrlEffective(trimmed);
    setApiBaseUrlInput(trimmed);
    appendOutput(`API base: ${trimmed}`);
    await bootstrapCatalogsBase(trimmed);
  }

  async function handleProjectRemoved(deletedId: string) {
    if (project?.id === deletedId) {
      setProject(null);
      setSessionId(null);
      setSessions([]);
      setEditorTabs([]);
      setActiveTabPath(null);
      setTree([]);
      setExpanded(new Set());
      await persistence.patch({ selectedProjectId: undefined, selectedSessionId: undefined });
    }
    await bootstrapCatalogsBase(apiBaseUrlEffective.replace(/\/$/, ''));
  }

  async function handlePickProject(pid: string) {
    await selectProject({ storage, projectId: pid });
    await hydrateProject(apiBaseUrlEffective.replace(/\/$/, ''), pid, null);
    await refreshSessions(pid);
    setSettingsOpen(false);
  }

  async function startSession() {
    if (!project) return;
    const created = await ensureChatSession({
      apiClient,
      storage,
      projectId: project.id,
      title: t('chat.sessionTitle', {
        date: new Date().toLocaleString(locale === 'zh-CN' ? 'zh-CN' : 'en-US'),
      }),
    });
    setSessionId(created.id);
    await refreshSessions(project.id);
  }

  async function switchSession(nextId: string) {
    await selectSession({ storage, sessionId: nextId });
    setSessionId(nextId);
  }

  async function abortRun() {
    stop();
    if (!sessionId) return;
    try {
      await apiClient.abortSession(sessionId);
      appendOutput(t('chat.aborted'));
    } catch (error) {
      appendOutput(`Abort failed: ${getErrorMessage(error)}`);
    }
  }

  const activeTab = editorTabs.find((t) => t.path === activeTabPath) ?? null;

  async function submitChat() {
    if (!project) return appendOutput(t('chat.errSelectProject'));
    if (!sessionId) return appendOutput(t('chat.errNewSession'));
    let message = text.trim();
    if (includeOpenFileChip && activeTab?.path && activeTab.content.encoding === 'utf8') {
      const snippet = `\n<context path="${activeTab.path}">\n${activeTab.draft.slice(0, 6000)}\n</context>`;
      message = `${message}\n@${activeTab.path}${snippet}`;
    }
    if (!message.trim() && attachments.length === 0) return appendOutput(t('chat.errEmpty'));
    try {
      const payload = buildSendMessageInput({ text: message, attachments });
      const mergedSkills = unique([...(payload.skills ?? []), ...enabledSkills]);
      const mergedMcps = unique([...(payload.mcpServers ?? []), ...enabledMcps]);
      appendOutput(t('chat.sending'));
      await send({
        ...payload,
        skills: mergedSkills,
        mcpServers: mergedMcps,
        abortPrevious: true,
      });
      setText('');
      setAttachments([]);
      await persistence.patch({ enabledSkillNames: enabledSkills, enabledMcpNames: enabledMcps });
      if (sessionId) await loadHistory(apiClient, sessionId);
      appendOutput(t('chat.streamEnd'));
    } catch (error) {
      appendOutput(`[chat] ${getErrorMessage(error)}`);
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!project || !files?.length) return;
    for (const file of Array.from(files)) {
      try {
        const uploaded = await apiClient.uploadAttachment(project.id, {
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          source: file,
        });
        setAttachments((curr) => [...curr, { id: uploaded.id, name: uploaded.filename }]);
      } catch (error) {
        appendOutput(`Upload failed (${file.name}): ${getErrorMessage(error)}`);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function toggleRuntime(direction: 'up' | 'down') {
    if (!project) return;
    try {
      const dto = direction === 'up' ? await apiClient.runtimeUp(project.id) : await apiClient.runtimeDown(project.id);
      setRuntime(dto);
      appendOutput(`[runtime:${direction}] ${JSON.stringify(dto)}`);
      if (direction === 'up' && dto.preview_url) window.open(dto.preview_url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      appendOutput(`Runtime ${direction}: ${getErrorMessage(error)}`);
    }
  }

  const resizeRef = useRef<{
    kind: 'left' | 'right' | 'bottom';
    startX: number;
    startY: number;
    startSidebar: number;
    startChat: number;
    startBottom: number;
  } | null>(null);

  const onMouseMove = useCallback((event: MouseEvent) => {
    const dragging = resizeRef.current;
    if (!dragging) return;
    if (dragging.kind === 'left') {
      const delta = event.clientX - dragging.startX;
      setSidebarPx(Math.min(560, Math.max(180, dragging.startSidebar + delta)));
    } else if (dragging.kind === 'right') {
      const delta = dragging.startX - event.clientX;
      setChatPx(Math.min(680, Math.max(280, dragging.startChat + delta)));
    } else if (dragging.kind === 'bottom') {
      const delta = dragging.startY - event.clientY;
      setBottomPx(Math.min(520, Math.max(96, dragging.startBottom + delta)));
    }
  }, []);

  const stopDragging = useCallback(() => {
    resizeRef.current = null;
    document.body.style.cursor = '';
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', stopDragging);
  }, [onMouseMove]);

  function startResize(kind: 'left' | 'right' | 'bottom', event: React.MouseEvent) {
    event.preventDefault();
    resizeRef.current = {
      kind,
      startX: event.clientX,
      startY: event.clientY,
      startSidebar: sidebarPx,
      startChat: chatPx,
      startBottom: bottomPx,
    };
    document.body.style.cursor = kind === 'bottom' ? 'row-resize' : 'col-resize';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopDragging);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      if (event.key.toLowerCase() === 's') {
        event.preventDefault();
        void saveActive();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabPath, editorTabs, project?.id]);

  async function execTerminal(cmd: string) {
    const line = `$ ${cmd}`;
    setTerminalLines((curr) => [...curr, line]);
    if (!cmd.trim()) return;
    if (cmd === 'clear') {
      setTerminalLines([]);
      return;
    }
    appendOutput(line);
    if (cmd === 'git status' && project) {
      try {
        const dto = await apiClient.gitStatus(project.id);
        setGitStatus(dto);
        setTerminalLines((curr) => [...curr, JSON.stringify(dto, null, 2)]);
      } catch (error) {
        setTerminalLines((curr) => [...curr, `error ${getErrorMessage(error)}`]);
      }
      return;
    }
    if (cmd === 'pwd' && project) {
      setTerminalLines((curr) => [...curr, project.workdir]);
      return;
    }
    setTerminalLines((curr) => [...curr, t('terminal.simulatedHint', { cmd })]);
  }

  const toggleSkill = useCallback((name: string) => {
    setEnabledSkills((curr) => (curr.includes(name) ? curr.filter((item) => item !== name) : [...curr, name]));
  }, []);

  const toggleMcp = useCallback((name: string) => {
    setEnabledMcps((curr) => (curr.includes(name) ? curr.filter((item) => item !== name) : [...curr, name]));
  }, []);

  const bottomPanelTabs = useMemo(
    () =>
      (
        [
          { key: 'problems', labelKey: 'bottom.problems' as const },
          { key: 'output', labelKey: 'bottom.output' as const },
          { key: 'terminal', labelKey: 'bottom.terminal' as const },
          { key: 'ports', labelKey: 'bottom.ports' as const },
        ] as const
      ).map((row) => ({ key: row.key, label: t(row.labelKey) })),
    [t],
  );

  return (
    <div className="ide-shell">
      <div className="ide-body">
      <aside className="ide-activity" aria-label={t('activity.bar')}>
        <button
          type="button"
          className={`ide-activity-item ${activity === 'explorer' ? 'active' : ''}`}
          aria-label={t('activity.explorer')}
          onClick={() => setActivity('explorer')}
          title={t('activity.explorer')}
        >
          ≡
        </button>
        <button
          type="button"
          className={`ide-activity-item ${activity === 'search' ? 'active' : ''}`}
          aria-label={t('activity.search')}
          onClick={() => {
            setActivity('search');
            setBottomVisible(true);
            setBottomKey('terminal');
          }}
          title={t('activity.search')}
        >
          ⌕
        </button>
        <button
          type="button"
          className={`ide-activity-item ${activity === 'scm' ? 'active' : ''}`}
          aria-label={t('activity.scm')}
          onClick={() => setActivity('scm')}
          title={t('activity.scm')}
        >
          ⧉
        </button>
        <button
          type="button"
          className={`ide-activity-item ${activity === 'extensions' ? 'active' : ''}`}
          aria-label={t('activity.extensions')}
          onClick={() => setActivity('extensions')}
          title={t('activity.extensions')}
        >
          ⧈
        </button>
        <div className="ide-activity-spacer" />
        <button type="button" className="ide-activity-item" title={t('activity.gear')} aria-label={t('activity.gear')} onClick={() => setSettingsOpen(true)}>
          ⚙︎
        </button>
        <button
          type="button"
          className="ide-activity-item"
          title={t('activity.chatToggle')}
          aria-label={t('activity.chat')}
          onClick={() => setChatCollapsed((c) => !c)}
        >
          ✉
        </button>
      </aside>

      <section className="ide-left" style={{ width: sidebarPx }}>
        <div className="ide-sidebar-header">
          <span className="ide-sidebar-title">{activityHeader(activity, t)}</span>
          <div className="ide-explorer-toolbar">
            <button
              type="button"
              aria-label={t('activity.newFile')}
              title={t('activity.newFile')}
              disabled={!project || activity !== 'explorer'}
              onClick={() => void createFileOrFolder('file')}
            >
              +
            </button>
            <button
              type="button"
              aria-label={t('activity.newFolder')}
              title={t('activity.newFolder')}
              disabled={!project || activity !== 'explorer'}
              onClick={() => void createFileOrFolder('dir')}
            >
              📁
            </button>
            <button
              type="button"
              aria-label={t('activity.refresh')}
              title={t('activity.refresh')}
              disabled={!project || activity !== 'explorer'}
              onClick={() => project && void loadRootTree(project.id)}
            >
              ↻
            </button>
            <button
              type="button"
              className="ide-exp-collapse"
              aria-label={t('activity.collapse')}
              title={t('activity.collapse')}
              disabled={!project || activity !== 'explorer'}
              onClick={() => collapseExplorer()}
            >
              <span aria-hidden className="ide-exp-collapse-glyphs">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
        {!project ? (
          <div className="ide-tree-scroll ide-muted">{t('sidebar.noProject')}</div>
        ) : activity === 'explorer' ? (
          <>
            <div className="ide-explorer-context" title={`${project.name} · ${project.slug}`}>
              {project.name.toUpperCase()} · {project.slug}
            </div>
            <div className="ide-tree-scroll">
              {filteredTreeRows.map((node) => {
                const indent = ''.padStart(node.depth * 2, ' ');
                const isActive = activeTab?.path === node.path;
                return (
                  <div
                    role="presentation"
                    key={node.path}
                    className={`ide-tree-row ${isActive ? 'active' : ''}`}
                    onClick={() =>
                      node.type === 'dir' ? void toggleDirectory(node) : void openFile(node.path)
                    }
                  >
                    <span className="ide-tree-cell-label">
                      <span className="ide-tree-indent">{indent}</span>
                      <span className="ide-tree-twistie" aria-hidden>
                        {node.type === 'dir' ? (node.isExpanded ? '▾' : '▸') : ''}
                      </span>
                      <span className="ide-tree-name">
                        {node.name}
                        {treeBusy ? '\u2009…' : null}
                      </span>
                    </span>
                    <span className="ide-tree-actions">
                      {node.type === 'dir' ? (
                        <button
                          type="button"
                          className="ide-tree-act ide-tree-act-runtime"
                          title={t('tree.runtime')}
                          aria-label={
                            node.path === WORKSPACE_ROOT_PATH
                              ? t('tree.runtimeStartWorkspaceAria', { path: project.workdir })
                              : t('tree.runtimeStartAria', { path: node.path })
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!project) return;
                            if (node.path === WORKSPACE_ROOT_PATH) {
                              void apiClient
                                .runtimeUp(project.id)
                                .then((dto) => {
                                  setRuntime(dto);
                                  if (dto.preview_url) window.open(dto.preview_url, '_blank', 'noopener,noreferrer');
                                })
                                .catch(() => {});
                              return;
                            }
                            void apiClient.runtimeUp(project.id, { composePath: node.path }).catch(() => {});
                          }}
                        >
                          🐋
                        </button>
                      ) : null}
                      {node.path === WORKSPACE_ROOT_PATH ? null : (
                        <button
                          type="button"
                          className="ide-tree-act ide-tree-act-delete"
                          aria-label={t('tree.deleteAria', { path: node.path })}
                          title={t('tree.deleteAria', { path: node.path })}
                          onClick={(event) => {
                            event.stopPropagation();
                            setPendingDelete({ path: node.path, type: node.type });
                          }}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        ) : activity === 'search' ? (
          <div style={{ padding: 10 }}>
            <div className="ide-muted" style={{ marginBottom: 8 }}>
              {t('search.filterHint')}
            </div>
            <input
              className="field"
              placeholder={t('search.placeholder')}
              value={searchFilter}
              style={{ width: '100%', borderRadius: 8, padding: '8px 10px', border: '1px solid #444', background: '#1e1e1e', color: '#eee' }}
              onChange={(event) => setSearchFilter(event.target.value)}
            />
          </div>
        ) : activity === 'scm' ? (
          <div style={{ padding: 10 }} className="ide-muted">
            <div style={{ fontWeight: 800, marginBottom: 8, color: '#ccc' }}>{t('scm.title')}</div>
            <pre className="ide-panel-pre">{gitStatus ? JSON.stringify(gitStatus, null, 2) : t('scm.notLoaded')}</pre>
          </div>
        ) : (
          <div className="ide-tree-scroll ide-muted">{t('extensions.blurb')}</div>
        )}
      </section>

      <div className="ide-split-vertical" onMouseDown={(event) => startResize('left', event)} aria-hidden />

      <main className="ide-main">
        <div className="ide-editor-stack">
          <div className="ide-tabs-row">
            {editorTabs.length === 0 ? (
              <div className="ide-tab active">{t('tabs.welcome')}</div>
            ) : (
              editorTabs.map((tab) => (
                <div key={tab.path} className={`ide-tab ${tab.path === activeTabPath ? 'active' : ''}`} role="presentation" onClick={() => setActiveTabPath(tab.path)}>
                  <span>{tab.path.split('/').pop()}</span>
                  <button
                    type="button"
                    className="ide-tab-close"
                    aria-label={t('tabs.closeAria', { path: tab.path })}
                    onClick={(event) => {
                      event.stopPropagation();
                      closeTab(tab.path);
                    }}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="ide-editor-mount">
            {activeTab ? (
              activeTab.content.encoding === 'utf8' ? (
                <Editor
                  height="100%"
                  width="100%"
                  theme="vs-dark"
                  language={getMonacoLanguage(activeTab.path, activeTab.content.mime)}
                  path={activeTab.path}
                  value={activeTab.draft}
                  onChange={(v) => updateActiveDraft(v)}
                  options={{
                    automaticLayout: true,
                    minimap: { enabled: true },
                    fontSize: 13,
                    wordWrap: 'on',
                  }}
                  onMount={(editor) => {
                    editor.onDidChangeCursorPosition((evt) =>
                      setCursorPos({ ln: evt.position.lineNumber, col: evt.position.column }),
                    );
                  }}
                />
              ) : (
                <div className="ide-muted" style={{ padding: 20 }}>
                  {t('editor.binaryHint', { path: activeTab.path, size: activeTab.content.size })}
                </div>
              )
            ) : (
              <WelcomePane onOpenWorkspace={() => setSettingsOpen(true)} t={t} />
            )}
          </div>
        </div>

        {bottomVisible ? (
          <>
            <div className="ide-bottom-drag" onMouseDown={(event) => startResize('bottom', event)} />
            <section className="ide-bottom" style={{ height: bottomPx }}>
              <div className="ide-bottom-tabbar">
                {bottomPanelTabs.map((tab) => (
                  <button type="button" key={tab.key} className={bottomKey === tab.key ? 'active' : ''} onClick={() => setBottomKey(tab.key)}>
                    {tab.label}
                  </button>
                ))}
                <button type="button" style={{ marginLeft: 'auto' }} onClick={() => setBottomVisible(false)}>
                  {t('bottom.collapse')}
                </button>
              </div>
              <div className="ide-bottom-body">
                {bottomKey === 'problems' ? (
                  <pre className="ide-panel-pre">{problemMock.length ? problemMock.join('\n') : t('bottom.problemsEmpty')}</pre>
                ) : null}
                {bottomKey === 'output' ? (
                  <>
                    <pre className="ide-panel-pre">
                      {[...outputLines, agentState.status !== 'idle' ? `[agent@${agentState.status}]` : '[agent]', agentState.stopReason ?? ''].join('\n')}
                      {`\n`}
                      {agentState.assistantText}
                    </pre>
                  </>
                ) : null}
                {bottomKey === 'terminal' ? (
                  <>
                    <pre className="ide-panel-pre" style={{ minHeight: 120 }}>
                      {terminalLines.join('\n')}
                    </pre>
                    <div style={{ display: 'flex', gap: 8, padding: '0 12px 10px', alignItems: 'center' }}>
                      <span style={{ color: '#bbb' }}>{'> '}</span>
                      <input
                        style={{
                          flex: 1,
                          borderRadius: 6,
                          border: '1px solid #444',
                          background: '#111',
                          padding: '6px 10px',
                          color: '#eee',
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo',
                        }}
                        value={shellCommand}
                        placeholder={t('terminal.placeholder')}
                        onChange={(event) => setShellCommand(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            void execTerminal(shellCommand.trim());
                            setShellCommand('');
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="ide-send"
                        style={{ marginLeft: 0 }}
                        onClick={() => {
                          void execTerminal(shellCommand.trim());
                          setShellCommand('');
                        }}
                      >
                        ⏎
                      </button>
                    </div>
                  </>
                ) : null}
                {bottomKey === 'ports' ? (
                  <div style={{ padding: 12, color: '#ccc' }}>
                    <div style={{ fontWeight: 800, marginBottom: 10 }}>{t('bottom.runtimeTitle')}</div>
                    <pre className="ide-panel-pre">{runtime ? JSON.stringify(runtime, null, 2) : t('bottom.runtimeNotLoaded')}</pre>
                    <button type="button" className="ide-toggle-chip on" style={{ marginTop: 8 }} disabled={!project} onClick={() => void toggleRuntime('up')}>
                      {t('bottom.runtimeUp')}
                    </button>
                    <button type="button" className="ide-toggle-chip" style={{ marginTop: 8, marginLeft: 8 }} disabled={!project} onClick={() => void toggleRuntime('down')}>
                      {t('bottom.runtimeDown')}
                    </button>
                    {runtime?.preview_url ? (
                      <button type="button" className="ide-link-btn" style={{ marginLeft: 12 }} onClick={() => window.open(runtime.preview_url!, '_blank', 'noopener')}>
                        {t('bottom.previewOpen', { url: runtime.preview_url })}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>
          </>
        ) : (
          <button type="button" style={{ height: 18 }} onClick={() => setBottomVisible(true)}>
            {t('bottom.expandStrip')}
          </button>
        )}
      </main>

      {!chatCollapsed ? (
        <>
          <div className="ide-split-right ide-split-vertical" onMouseDown={(event) => startResize('right', event)} />

          <aside className="ide-chat" style={{ width: chatPx }}>
            <div className="ide-chat-toolbar">
              <span className="ide-chat-toolbar-title">{t('chat.toolbar')}</span>
              <button type="button" className="icon" aria-label={t('chat.newSession')} title={t('chat.newSession')} onClick={() => void startSession()} disabled={!project}>
                +
              </button>
              <button type="button" className="icon" aria-label={t('chat.settings')} title={t('chat.settings')} onClick={() => setSettingsOpen(true)}>
                ⚙︎
              </button>
              <button type="button" className="icon" title={t('chat.stop')} aria-label={t('chat.stop')} disabled={agentState.status !== 'running'} onClick={() => void abortRun()}>
                ■
              </button>
            </div>

            <div className="ide-chat-stage">
              {!history.length && agentState.status === 'idle' ? (
                <div className="ide-empty-chat">
                  <div style={{ fontSize: 48, marginBottom: 8 }}>✨</div>
                  <h2>{t('chat.emptyTitle')}</h2>
                  <p className="ide-muted">{t('chat.emptyDisclaimer')}</p>
                  <button type="button" className="ide-link-btn" onClick={() => setBottomVisible(true)}>
                    {t('chat.emptyLink')}
                  </button>
                </div>
              ) : null}
              <div style={{ overflow: 'auto' }}>
                <div style={{ marginBottom: 8, color: '#8b949e', fontWeight: 700 }}>{t('chat.sessions')}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {sessions.map((row) => (
                    <button
                      type="button"
                      key={row.id}
                      className={`ide-toggle-chip ${row.id === sessionId ? 'on' : ''}`}
                      onClick={() => void switchSession(row.id)}
                    >
                      {row.title}
                    </button>
                  ))}
                </div>
                <div style={{ margin: '14px 0', maxHeight: 140, overflow: 'auto', borderBottom: '1px solid #2b2b2b', paddingBottom: 8 }}>
                  {history.slice(-8).map((msg) => (
                    <div key={msg.id} className="ide-msg">
                      <div className="ide-msg-role">{msg.role}</div>
                      <div>{stringify(msg.content)}</div>
                    </div>
                  ))}
                </div>
              </div>
              <AgentTimelineWeb state={agentState} />
            </div>

            <div style={{ padding: '0 8px 10px', color: '#8b949e', fontSize: 12 }}>
              <strong>{t('chat.context')}</strong>
              <div className="ide-chip-list">
                {skills.slice(0, 24).map((skill) => {
                  const active = enabledSkills.includes(skill.name);
                  return (
                    <button type="button" key={skill.id} className={`ide-toggle-chip ${active ? 'on' : ''}`} onClick={() => toggleSkill(skill.name)}>
                      {t('chat.skillChip', { name: skill.name })}
                    </button>
                  );
                })}
                {mcps.slice(0, 16).map((mcp) => {
                  const active = enabledMcps.includes(mcp.name);
                  return (
                    <button type="button" key={mcp.id} className={`ide-toggle-chip ${active ? 'on' : ''}`} onClick={() => toggleMcp(mcp.name)}>
                      {t('chat.mcpChip', { name: mcp.name })}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="ide-chat-input">
              <div className="ide-context-chips">
                <input ref={fileInputRef} hidden type="file" multiple accept="image/*,application/octet-stream" onChange={(event) => void uploadFiles(event.target.files)} />
                {activeTab?.path ? (
                  <button type="button" className="ide-chip" onClick={() => setIncludeOpenFileChip((curr) => !curr)}>
                    {includeOpenFileChip ? '●' : '○'} @{activeTab.path.split('/').pop()}
                  </button>
                ) : null}
                {attachments.map((attachment) => (
                  <span key={attachment.id} className="ide-chip">
                    @{attachment.name}
                  </span>
                ))}
              </div>
              <div className="ide-input-row">
                <ChatMentionComposer
                  value={text}
                  onChange={setText}
                  fileTreeRoots={tree}
                  attachments={attachments}
                  skills={skills}
                  disabled={!project || !sessionId || agentState.status === 'running'}
                  placeholder={t('chat.placeholder')}
                />
                <div className="ide-chat-actions">
                  <button type="button" className="ide-toggle-chip" onClick={() => fileInputRef.current?.click()} disabled={!project}>
                    +
                  </button>
                  <select className="ide-toggle-chip" defaultValue="auto" title={t('chat.agentModeTitle')}>
                    <option value="auto">{t('chat.modeAuto')}</option>
                    <option value="plan">{t('chat.modePlan')}</option>
                    <option value="code">{t('chat.modeCode')}</option>
                  </select>
                  <button
                    type="button"
                    className="ide-send"
                    disabled={!project || !sessionId || agentState.status === 'running'}
                    onClick={() => void submitChat()}
                  >
                    ⬆︎
                  </button>
                </div>
              </div>
            </div>

            <button type="button" className="ide-fab-chat" title={t('chat.fabTitle')}>
              ❖
            </button>
          </aside>
        </>
      ) : null}
      </div>

      <footer className="ide-status-bar">
        <span>{statusLineLeft || t('status.ready')}</span>
        <span>
          {t('footer.flag', {
            panel: bottomVisible ? t('footer.panelOpen') : t('footer.panelClosed'),
            id: sessionId?.slice(0, 8) ?? '—',
          })}
        </span>
        <button
          type="button"
          className="ide-status-locale ide-link-btn"
          onClick={() => toggleLocale()}
          aria-label={t('status.localeAria')}
          title={t('status.localeAria')}
        >
          {locale === 'zh-CN' ? t('status.localeShortZh') : t('status.localeShortEn')}
        </button>
        <span className="ide-status-push">
          {t('footer.cursor', { ln: cursorPos.ln, col: cursorPos.col })}
        </span>
      </footer>

      <WorkspaceSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiClient={apiClient}
        apiBaseUrlDraft={apiBaseUrlInput}
        onApiBaseUrlDraftChange={setApiBaseUrlInput}
        onSaveApiBase={() => persistApiBase(apiBaseUrlInput)}
        storage={storage}
        selectedProjectId={project?.id ?? null}
        onApplyProject={handlePickProject}
        onProjectDeleted={handleProjectRemoved}
      />

      {pendingDelete ? <DeleteModal target={pendingDelete} onDismiss={() => setPendingDelete(null)} onConfirm={() => void finalizeDeletion()} /> : null}
    </div>
  );
}

function WelcomePane(props: { onOpenWorkspace(): void; t: TFunction }) {
  const { onOpenWorkspace, t } = props;
  return (
    <div className="ide-welcome">
      <div className="ide-welcome-card">
        <div className="ide-welcome-icon" aria-hidden>
          ❖
        </div>
        <h2>{t('welcome.title')}</h2>
        <p className="ide-welcome-lead">{t('welcome.lead')}</p>
        <p className="ide-welcome-hints" dangerouslySetInnerHTML={{ __html: t('welcome.hints') }} />
        <div className="ide-welcome-actions">
          <button type="button" className="ide-btn-primary" onClick={onOpenWorkspace}>
            {t('welcome.connect')}
          </button>
          <button type="button" className="ide-btn-secondary" onClick={onOpenWorkspace} title={t('welcome.openSettingsTitle')}>
            {t('welcome.openSettings')}
          </button>
        </div>
        <p className="ide-welcome-foot">{t('welcome.foot')}</p>
      </div>
    </div>
  );
}

function activityHeader(activity: ActivityKey, t: TFunction): string {
  switch (activity) {
    case 'explorer':
      return t('activity.explorer');
    case 'search':
      return t('activity.search');
    case 'scm':
      return t('activity.scm');
    case 'extensions':
      return t('activity.extensions');
    default:
      return t('tabs.welcome');
  }
}

type DeleteModalProps = {
  target: { path: string; type: FileTreeNode['type'] };
  onDismiss(): void;
  onConfirm(): void;
};

function DeleteModal({ target, onDismiss, onConfirm }: DeleteModalProps) {
  const { t } = useI18n();
  const folder = target.type === 'dir';
  const title = folder ? t('delete.folderTitle') : t('delete.fileTitle');
  const message = folder
    ? t('delete.folderMessage', { path: target.path })
    : t('delete.fileMessage', { path: target.path });
  const confirmLabel = folder ? t('delete.folderConfirm') : t('delete.fileConfirm');
  return (
    <dialog open className="ide-modal-mask" aria-modal role="presentation">
      <div className="ide-modal-card" role="dialog" aria-labelledby="confirm-title">
        <div className="ide-modal-header" id="confirm-title">
          <span>{title}</span>
          <button type="button" className="ide-link-btn" onClick={onDismiss}>
            {t('delete.cancel')}
          </button>
        </div>
        <div className="ide-modal-body">
          <div className="ide-muted">{message}</div>
          <div style={{ marginTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button type="button" className="ide-toggle-chip" onClick={onDismiss}>
              {t('delete.back')}
            </button>
            <button type="button" className="ide-btn-primary" onClick={() => onConfirm()}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
