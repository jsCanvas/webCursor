export type Locale = 'en' | 'zh-CN';

/** Sync with `storage` listener in I18nContext */
export const LOCALE_STORAGE_KEY = 'clientBot.locale';

export function readStoredLocale(): Locale | null {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LOCALE_STORAGE_KEY) : null;
    if (raw === 'zh-CN' || raw === 'en') return raw;
  } catch {
    /* ignore */
  }
  return null;
}

export function writeStoredLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

function interpolate(template: string, vars: Record<string, string | number>): string {
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.split(`{{${k}}}`).join(String(v));
  }
  return s;
}

const EN = {
  'activity.bar': 'Activity Bar',
  'activity.explorer': 'Explorer',
  'activity.search': 'Search',
  'activity.scm': 'Source Control',
  'activity.extensions': 'Extensions',
  'activity.gear': 'Settings',
  'activity.chatToggle': 'Toggle chat sidebar',
  'activity.chat': 'Chat',
  'activity.newFile': 'New file',
  'activity.newFolder': 'New folder',
  'activity.refresh': 'Refresh',
  'activity.collapse': 'Collapse',

  'sidebar.noProject': 'No project selected.',

  'tree.runtime': 'Runtime',
  'tree.runtimeStartAria': 'Start runtime at {{path}}',
  'tree.runtimeStartWorkspaceAria': 'Start runtime at workspace root ({{path}})',
  'tree.deleteAria': 'Delete {{path}}',

  'search.filterHint': 'Filter file list',
  'search.placeholder': 'Path fragment…',

  'scm.title': 'Git status',
  'scm.notLoaded': 'Not loaded yet.',

  'extensions.blurb': 'Skills / MCP / agent capabilities match the companion mobile app against the dockerBot backend; send requests from the chat panel.',

  'tabs.welcome': 'Welcome to clientBot web',
  'tabs.closeAria': 'Close {{path}}',

  'editor.binaryHint': 'Binary file {{path}}, {{size}} bytes — cannot preview in the browser.',

  'bottom.problems': 'Problems',
  'bottom.output': 'Output',
  'bottom.terminal': 'Terminal',
  'bottom.ports': 'Ports',
  'bottom.collapse': 'Collapse',
  'bottom.expandStrip': '▲ Panel',
  'bottom.problemsEmpty': 'No workspace issues found.',
  'bottom.runtimeTitle': 'Container / Compose runtime',
  'bottom.runtimeNotLoaded': 'Not loaded yet.',
  'bottom.runtimeUp': 'Start',
  'bottom.runtimeDown': 'Stop',
  'bottom.previewOpen': 'Open preview ({{url}})',

  'terminal.welcome1': '$ clientBot sandbox shell.',
  'terminal.welcome2': '$ Try `git status`, `clear`, `pwd`.',
  'terminal.placeholder': 'Shell command',
  'terminal.simulatedHint': 'Tip: shell is browser-simulated · {{cmd}}',

  'chat.toolbar': 'Chat',
  'chat.newSession': 'New session',
  'chat.settings': 'Settings',
  'chat.stop': 'Stop',
  'chat.emptyTitle': 'Build with the agent',
  'chat.emptyDisclaimer': 'AI answers may be inaccurate',
  'chat.emptyLink': 'Agent output · see Output panel',
  'chat.sessions': 'Sessions',
  'chat.context': 'Context',
  'chat.skillChip': 'Skill · {{name}}',
  'chat.mcpChip': 'MCP · {{name}}',
  'chat.placeholder': 'Describe what to build · @ files/dirs/images · / skills',
  'chat.agentModeTitle': 'Agent mode',
  'chat.modeAuto': 'Auto',
  'chat.modePlan': 'Plan',
  'chat.modeCode': 'Code',
  'chat.fabTitle': 'clientBot Copilot',
  'chat.sessionTitle': 'Session {{date}}',

  'chat.errSelectProject': '[chat] Select a project',
  'chat.errNewSession': '[chat] Start a new session',
  'chat.errEmpty': '[chat] Message is empty',
  'chat.sending': '[chat] Sending agent request…',
  'chat.streamEnd': '[chat] Stream finished',
  'chat.aborted': '[agent] Aborted',

  'status.projectUnavailable': 'Project unavailable: {{message}}',
  'status.ready': 'Ready',
  'status.filePath': '{{path}}',
  'status.localeShortEn': 'EN',
  'status.localeShortZh': '中文',
  'status.localeAria': 'Switch language',

  'footer.flag': '⚑ clientBot · {{panel}} · session {{id}}',
  'footer.panelOpen': 'panel open',
  'footer.panelClosed': 'panel hidden',
  'footer.cursor': 'Ln {{ln}}, Col {{col}} · Spaces: 4 · UTF-8 · LF · clientBot IDE',

  'welcome.title': 'Welcome to clientBot',
  'welcome.lead':
    'Web workspace: connect to the dockerBot REST API, browse and edit files in the sidebar, drive development with agent chat, and inspect output and terminal in the bottom panel.',
  'welcome.hints':
    '<strong>First steps:</strong> tap <strong>Connect to workspace</strong>, set the API URL (try <code>/api</code> in dev), pick or create a project under Project, then attach an LLM under Models. Open files in the editor and send prompts in chat (<code>@</code> searches files/folders/attachments).',
  'welcome.connect': 'Connect to workspace',
  'welcome.openSettings': 'Open settings',
  'welcome.openSettingsTitle': 'Same entry as workspace connect',
  'welcome.foot': 'You can always use the ⚙ gear at the bottom of the activity bar.',

  'prompt.newFilePath': 'New file path (relative to repo root)',
  'prompt.newFolderPath': 'New folder path',

  'agentStream.title': 'Agent stream',
  'agentStream.status.idle': 'Idle',
  'agentStream.status.running': 'Running…',
  'agentStream.status.completed': 'Done',
  'agentStream.status.aborted': 'Aborted',
  'agentStream.status.error': 'Error',
  'agentStream.noReply': 'No reply yet.',
  'agentStream.tools': 'Tool calls',
  'agentStream.toolRunning': 'running',
  'agentStream.toolOk': 'ok',
  'agentStream.toolFail': 'failed',
  'agentStream.fileChanges': 'File changes',

  'delete.folderTitle': 'Delete folder?',
  'delete.folderMessage': 'This will permanently delete "{{path}}" and everything under it.',
  'delete.folderConfirm': 'Delete folder',
  'delete.fileTitle': 'Delete file?',
  'delete.fileMessage': 'This will permanently delete "{{path}}".',
  'delete.fileConfirm': 'Delete file',
  'delete.cancel': 'Cancel',
  'delete.back': 'Back',

  'mentions.suggestionsAria': '@ suggestions',
  'mentions.skillsAria': 'Skill suggestions',
  'mentions.kind.file': 'file',
  'mentions.kind.directory': 'dir',
  'mentions.kind.image': 'image',
  'mentions.skillBadge': 'skill',
  'mentions.builtin': 'built-in',
  'mentions.emptyMatch':
    'No matches. Upload images to @ them; files/dirs come from the loaded tree (expand folders in Explorer).',
  'mentions.noSkills':
    'No skills configured yet. Register skills on the server or in workspace settings, then retry.',
  'mentions.noSkillQuery': 'No skill names match "{{query}}".',
  'mentions.keyboardHint': '↑↓ pick · Enter insert · Shift+Enter newline',

  'settings.title': 'Workspace settings',
  'settings.subtitle':
    'Configure connection to the dockerBot backend, workspace projects, and model endpoints; saved settings apply to the sidebar session and editors.',
  'settings.closeAria': 'Close',
  'settings.tabConnection': 'Connection',
  'settings.tabProject': 'Project',
  'settings.tabModels': 'Models',
  'settings.connectionIntro':
    'Enter dockerBot REST base path (must end with <code>/api</code>). For local dev, try same-origin <code>/api</code> proxied by the dev server.',
  'settings.quick': 'Shortcuts',
  'settings.saveConnection': 'Save connection',
  'settings.projectNew': 'New project',
  'settings.projectNewIntro': 'Provide a Git URL and token to clone; leave Git empty for a blank workspace.',
  'settings.labelName': 'Name *',
  'settings.placeholderSlug': 'Auto from name if empty',
  'settings.labelSlug': 'Slug (optional)',
  'settings.labelGitUrl': 'Git URL',
  'settings.labelGitToken': 'Git token',
  'settings.labelBranch': 'Default branch',
  'settings.createProject': 'Create / clone',
  'settings.existingProjects': 'Existing projects',
  'settings.refreshLoading': 'Refreshing…',
  'settings.refreshList': 'Refresh list',
  'settings.noProjects': 'No projects yet. Create above or clone from Git.',
  'settings.current': 'Current',
  'settings.pick': 'Use',
  'settings.delete': 'Delete',
  'settings.confirmDeleteProject': 'Delete this project? Remote workspace data will be removed.',
  'settings.modelProviders': 'Providers / presets',
  'settings.modelProvidersIntro':
    'Pick an OpenAI-compatible provider and model (falls back to built-ins if the server list is unavailable). Add an API key below to create and activate.',
  'settings.labelProvider': 'Provider',
  'settings.labelModel': 'Model',
  'settings.newEndpoint': 'New OpenAI-compatible endpoint',
  'settings.newEndpointIntro': 'Name and key are required; Base URL / model can come from above.',
  'settings.labelCfgName': 'Config name *',
  'settings.labelBaseUrl': 'Base URL',
  'settings.labelApiKey': 'API Key *',
  'settings.labelModelId': 'Model id',
  'settings.createActivate': 'Create & activate',
  'settings.savedConfigs': 'Saved model configs',
  'settings.noModelConfigs': 'No saved configs. Pick a provider and add a key above.',
  'settings.active': 'Active',
  'settings.activate': 'Activate',
  'settings.probe': 'Probe',
  'settings.confirmDeleteModel': 'Delete this model config?',
  'settings.bannerLoadProjectsFail': 'Failed to load projects: {{msg}}',
  'settings.bannerLoadModelsFail': 'Failed to load model list: {{msg}}',
  'settings.bannerSavedConnection': 'Connection saved',
  'settings.bannerSaveFail': 'Save failed: {{msg}}',
  'settings.bannerNameRequired': 'Enter a project name.',
  'settings.bannerCreated': 'Created: {{name}} ({{status}})',
  'settings.bannerCreateFail': 'Create failed: {{msg}}',
  'settings.bannerSelectFail': 'Select project failed: {{msg}}',
  'settings.bannerDeleted': 'Project deleted',
  'settings.bannerDeleteFail': 'Delete failed: {{msg}}',
  'settings.bannerModelFields': 'Name and API key are required.',
  'settings.bannerModelCreated': 'Created and set as active model config',
  'settings.bannerModelSaveFail': 'Save failed: {{msg}}',
  'settings.bannerActivated': 'Switched active config',
  'settings.bannerActivateFail': 'Activate failed: {{msg}}',
  'settings.bannerProbeOk': 'Probe ok (HTTP {{status}})',
  'settings.bannerProbeFail': 'Probe failed ({{status}}): {{err}}',
  'settings.bannerProbeReqFail': 'Probe request failed: {{msg}}',
  'settings.bannerModelDeleted': 'Model config deleted',
  'settings.bannerModelDeleteFail': 'Delete failed: {{msg}}',
} as const;

export type MessageKey = keyof typeof EN;

const ZH: Record<MessageKey, string> = {
  ...EN,
  'activity.bar': '活动栏',
  'activity.explorer': '资源管理器',
  'activity.search': '搜索',
  'activity.scm': '源代码管理',
  'activity.extensions': '扩展',
  'activity.gear': '设置',
  'activity.chatToggle': '切换侧边聊天',
  'activity.chat': '聊天',
  'activity.newFile': '新建文件',
  'activity.newFolder': '新建文件夹',
  'activity.refresh': '刷新',
  'activity.collapse': '折叠',

  'sidebar.noProject': '未选择项目。',

  'tree.runtime': '运行时',
  'tree.runtimeStartAria': '启动运行时 {{path}}',
  'tree.runtimeStartWorkspaceAria': '在工作区根目录启动运行时（{{path}}）',
  'tree.deleteAria': '删除 {{path}}',

  'search.filterHint': '过滤文件列表',
  'search.placeholder': '输入路径片段…',

  'scm.title': 'Git 状态',
  'scm.notLoaded': '尚未载入',

  'extensions.blurb': 'Skills / MCP / Agent 能力与连接 dockerBot 后端的移动端一致，均在右侧聊天中发送请求。',

  'tabs.welcome': '欢迎使用 clientBot web',
  'tabs.closeAria': '关闭 {{path}}',

  'editor.binaryHint': '二进制文件 {{path}}，大小 {{size}} 字节 · 无法在浏览器内预览。',

  'bottom.problems': '问题',
  'bottom.output': '输出',
  'bottom.terminal': '终端',
  'bottom.ports': '端口',
  'bottom.collapse': '收起',
  'bottom.expandStrip': '▲ 面板',
  'bottom.problemsEmpty': '未发现工作区问题。',
  'bottom.runtimeTitle': '容器 / Compose 运行时',
  'bottom.runtimeNotLoaded': '尚未载入',
  'bottom.runtimeUp': '启动 / 拉起',
  'bottom.runtimeDown': '停止',
  'bottom.previewOpen': '打开预览 ({{url}})',

  'terminal.welcome1': '$ clientBot sandbox shell.',
  'terminal.welcome2': '$ 试试 `git status`、`clear`、`pwd`。',

  'terminal.placeholder': 'shell 指令',
  'terminal.simulatedHint': '提示: shell 仅在浏览器内模拟常用命令 · {{cmd}}',

  'chat.toolbar': '聊天',
  'chat.newSession': '新建会话',
  'chat.settings': '设置',
  'chat.stop': '停止',
  'chat.emptyTitle': '使用智能体构建',
  'chat.emptyDisclaimer': 'AI 答复可能不准确',
  'chat.emptyLink': '生成智能体指令 · 参见输出面板',
  'chat.sessions': '会话',
  'chat.context': '上下文',
  'chat.skillChip': 'Skill · {{name}}',
  'chat.mcpChip': 'MCP · {{name}}',
  'chat.placeholder': '描述要构建的内容 · @ 检索文件/目录/图片 · / 检索技能',
  'chat.agentModeTitle': 'Agent 模式',
  'chat.modeAuto': '自动',
  'chat.modePlan': '计划',
  'chat.modeCode': '编码',
  'chat.fabTitle': 'clientBot Copilot',
  'chat.sessionTitle': '会话 {{date}}',

  'chat.errSelectProject': '[chat] 请选择项目',
  'chat.errNewSession': '[chat] 请新建会话',
  'chat.errEmpty': '[chat] 内容为空',
  'chat.sending': '[chat] 发送 Agent 请求…',
  'chat.streamEnd': '[chat] 流结束',
  'chat.aborted': '[agent] 已中止',

  'status.projectUnavailable': '项目不可用: {{message}}',
  'status.ready': '就绪',
  'status.filePath': '{{path}}',
  'status.localeShortEn': 'EN',
  'status.localeShortZh': '中文',
  'status.localeAria': '切换语言',

  'footer.flag': '⚑ clientBot · {{panel}} · session {{id}}',
  'footer.panelOpen': '面板展开',
  'footer.panelClosed': '面板收起',
  'footer.cursor': '行 {{ln}} · 列 {{col}} · 缩进 4 · UTF-8 · LF · clientBot IDE',

  'welcome.title': '欢迎使用 clientBot',
  'welcome.lead':
    'Web 工作台：连接同源 dockerBot REST API，在侧边栏浏览与编辑仓库文件，右侧使用智能体会话驱动开发，底部面板查看输出与终端。',
  'welcome.hints':
    '<strong>初次使用：</strong>先点击<strong>连接到工作区</strong>填写 API（开发环境可填 <code>/api</code>），在「项目配置」中选择或创建项目，再在「模型配置」中绑定 LLM；然后即可在编辑器中打开文件，并在右侧聊天中发送需求（输入 <code>@</code> 可检索文件 / 目录 / 附件）。',
  'welcome.connect': '连接到工作区',
  'welcome.openSettings': '打开设置',
  'welcome.openSettingsTitle': '与工作区按钮相同入口',
  'welcome.foot': '也可随时点击左侧活动栏底部的 ⚙ 齿轮图标。',

  'prompt.newFilePath': '新文件路径（相对仓库根）',
  'prompt.newFolderPath': '新文件夹路径',

  'agentStream.title': '智能体流',
  'agentStream.status.idle': '空闲',
  'agentStream.status.running': '运行中…',
  'agentStream.status.completed': '完成',
  'agentStream.status.aborted': '已中止',
  'agentStream.status.error': '错误',
  'agentStream.noReply': '尚无回复。',
  'agentStream.tools': '工具调用',
  'agentStream.toolRunning': '运行中',
  'agentStream.toolOk': '成功',
  'agentStream.toolFail': '失败',
  'agentStream.fileChanges': '文件变动',

  'delete.folderTitle': '删除文件夹？',
  'delete.folderMessage': '将永久删除「{{path}}」及其下所有文件。',
  'delete.folderConfirm': '删除文件夹',
  'delete.fileTitle': '删除文件？',
  'delete.fileMessage': '将永久删除「{{path}}」。',
  'delete.fileConfirm': '删除文件',
  'delete.cancel': '取消',
  'delete.back': '返回',

  'mentions.suggestionsAria': '提及建议',
  'mentions.skillsAria': '技能建议',
  'mentions.kind.file': '文件',
  'mentions.kind.directory': '目录',
  'mentions.kind.image': '图片',
  'mentions.skillBadge': '技能',
  'mentions.builtin': '内置',
  'mentions.emptyMatch': '无匹配项。上传图片后可用 @ 引用；文件/目录来自当前已加载的文件树（请在资源管理器中展开子目录）。',
  'mentions.noSkills': '当前暂无技能配置，请先在服务端或工作台管理中注册技能后再试。',
  'mentions.noSkillQuery': '没有匹配「{{query}}」的技能名称。',
  'mentions.keyboardHint': '↑↓ 选择 · Enter 插入 · Shift+Enter 换行',

  'settings.title': '工作台设置',
  'settings.subtitle': '配置与 dockerBot 后端的连接、工作区项目与推理模型；保存后侧边栏会话与编辑器将沿用当前 API。',
  'settings.closeAria': '关闭',
  'settings.tabConnection': '连接',
  'settings.tabProject': '项目配置',
  'settings.tabModels': '模型配置',
  'settings.connectionIntro':
    '填写 dockerBot REST 基址路径（必须以 <code>/api</code> 结尾）。本地开发可先试与 Vite 同源的 <code>/api</code>，由开发服务器转发到后端。',
  'settings.quick': '快捷',
  'settings.saveConnection': '保存连接',
  'settings.projectNew': '新建项目',
  'settings.projectNewIntro': '可填写 Git URL 与个人访问令牌由服务端克隆；不填 Git 则创建空白工作区。',
  'settings.labelName': '名称 *',
  'settings.placeholderSlug': '留空则由名称自动生成',
  'settings.labelSlug': 'Slug（可选）',
  'settings.labelGitUrl': 'Git URL',
  'settings.labelGitToken': 'Git Token',
  'settings.labelBranch': '默认分支',
  'settings.createProject': '创建 / 克隆',
  'settings.existingProjects': '已有项目',
  'settings.refreshLoading': '刷新中…',
  'settings.refreshList': '刷新列表',
  'settings.noProjects': '暂无项目。可在上方创建或通过 Git 克隆。',
  'settings.current': '当前',
  'settings.pick': '选用',
  'settings.delete': '删除',
  'settings.confirmDeleteProject': '确定删除该项目？远端工作区数据将一并移除。',
  'settings.modelProviders': '服务商 / 预设模型',
  'settings.modelProvidersIntro':
    '下拉选择 OpenAI-compatible 服务商与型号（服务端列表不可用时退回内置预设）。随后在下方填入 API Key 即可创建并激活。',
  'settings.labelProvider': '服务商',
  'settings.labelModel': '模型',
  'settings.newEndpoint': '新增 OpenAI 兼容端点',
  'settings.newEndpointIntro': '名称与 Key 必填；可与上方面板联动填入 Base URL / Model。',
  'settings.labelCfgName': '配置名称 *',
  'settings.labelBaseUrl': 'Base URL',
  'settings.labelApiKey': 'API Key *',
  'settings.labelModelId': 'Model id',
  'settings.createActivate': '创建并激活',
  'settings.savedConfigs': '已有模型配置',
  'settings.noModelConfigs': '暂无已保存模型配置。选择服务商后在上方填写 Key 创建。',
  'settings.active': '生效中',
  'settings.activate': '激活',
  'settings.probe': '探活',
  'settings.confirmDeleteModel': '确定删除该模型配置？',
  'settings.bannerLoadProjectsFail': '加载项目失败: {{msg}}',
  'settings.bannerLoadModelsFail': '加载模型列表失败: {{msg}}',
  'settings.bannerSavedConnection': '已保存连接配置',
  'settings.bannerSaveFail': '保存失败: {{msg}}',
  'settings.bannerNameRequired': '请填写项目名称。',
  'settings.bannerCreated': '已创建: {{name}} ({{status}})',
  'settings.bannerCreateFail': '创建失败: {{msg}}',
  'settings.bannerSelectFail': '选择项目失败: {{msg}}',
  'settings.bannerDeleted': '项目已删除',
  'settings.bannerDeleteFail': '删除失败: {{msg}}',
  'settings.bannerModelFields': '请填写名称与 API Key。',
  'settings.bannerModelCreated': '已创建并设为当前生效模型配置',
  'settings.bannerModelSaveFail': '保存失败: {{msg}}',
  'settings.bannerActivated': '已切换生效配置',
  'settings.bannerActivateFail': '激活失败: {{msg}}',
  'settings.bannerProbeOk': '探活成功 (HTTP {{status}})',
  'settings.bannerProbeFail': '探活失败 ({{status}}): {{err}}',
  'settings.bannerProbeReqFail': '探活请求失败: {{msg}}',
  'settings.bannerModelDeleted': '已删除模型配置',
  'settings.bannerModelDeleteFail': '删除失败: {{msg}}',
};

const DICTS: Record<Locale, Record<MessageKey, string>> = {
  en: EN,
  'zh-CN': ZH,
};

export type TFunction = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function makeTranslator(locale: Locale): TFunction {
  return (key, vars?) => {
    let raw = DICTS[locale][key] ?? DICTS.en[key] ?? key;
    return vars ? interpolate(raw, vars) : raw;
  };
}

export const defaultLocale: Locale = 'en';
