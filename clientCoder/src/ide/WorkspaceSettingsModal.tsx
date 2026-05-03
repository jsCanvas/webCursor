import type { PhoneBotApiClient } from '@phoneBot/api/phoneBotApi';
import type { SettingsStorage } from '@phoneBot/storage/settingsStorage';
import {
  activateModelConfig,
  createModelConfigFromForm,
  createProjectFromForm,
  selectProject,
} from '@phoneBot/screens/screenActions';
import { BUILTIN_MODEL_PROVIDERS, pickDefaultProviderModel } from '@phoneBot/screens/modelPresets';
import type { ModelConfigDto, ModelProviderDto, ProjectDto, ProviderModelDto } from '@phoneBot/types/api';
import { getErrorMessage } from '@phoneBot/utils/errorMessage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '../i18n/I18nContext';

export type WorkspaceSettingsModalProps = {
  open: boolean;
  onClose(): void;
  apiClient: PhoneBotApiClient;
  /** dockerBot REST 基址草稿（`/api` 或完整 URL） */
  apiBaseUrlDraft: string;
  onApiBaseUrlDraftChange(value: string): void;
  onSaveApiBase(): Promise<void>;
  storage: SettingsStorage;
  selectedProjectId: string | null;
  onApplyProject(projectId: string): Promise<void>;
  onProjectDeleted?(projectId: string): Promise<void>;
};

type SettingsTab = 'connection' | 'project' | 'model';

export function WorkspaceSettingsModal(props: WorkspaceSettingsModalProps) {
  const {
    open,
    onClose,
    apiClient,
    apiBaseUrlDraft,
    onApiBaseUrlDraftChange,
    onSaveApiBase,
    storage,
    selectedProjectId,
    onApplyProject,
    onProjectDeleted,
  } = props;

  const { t } = useI18n();

  const [tab, setTab] = useState<SettingsTab>('connection');

  const [projects, setProjects] = useState<ProjectDto[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [banner, setBanner] = useState('');

  const [pName, setPName] = useState('');
  const [pSlug, setPSlug] = useState('');
  const [pGitUrl, setPGitUrl] = useState('');
  const [pGitToken, setPGitToken] = useState('');
  const [pBranch, setPBranch] = useState('main');

  const [configs, setConfigs] = useState<ModelConfigDto[]>([]);
  const [configsLoading, setConfigsLoading] = useState(false);
  const [modelProviders, setModelProviders] = useState<ModelProviderDto[]>(BUILTIN_MODEL_PROVIDERS);
  const [providerOpen, setProviderOpen] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);
  const [selectedProviderId, setSelectedProviderId] = useState(BUILTIN_MODEL_PROVIDERS[0].id);
  const [mName, setMName] = useState('');
  const [mBaseUrl, setMBaseUrl] = useState(BUILTIN_MODEL_PROVIDERS[0].baseUrl);
  const [mApiKey, setMApiKey] = useState('');
  const [mModel, setMModel] = useState(pickDefaultProviderModel(BUILTIN_MODEL_PROVIDERS[0]).model);

  const selectedProvider = useMemo(
    () => modelProviders.find((p) => p.id === selectedProviderId) ?? modelProviders[0],
    [modelProviders, selectedProviderId],
  );
  const selectedProviderModel = useMemo(() => {
    const match = selectedProvider.models.find((opt) => opt.model === mModel);
    return match ?? pickDefaultProviderModel(selectedProvider);
  }, [selectedProvider, mModel]);

  const loadProjects = useCallback(async () => {
    try {
      setProjectsLoading(true);
      setProjects(await apiClient.listProjects());
      setBanner('');
    } catch (error) {
      setBanner(t('settings.bannerLoadProjectsFail', { msg: getErrorMessage(error) }));
    } finally {
      setProjectsLoading(false);
    }
  }, [apiClient, t]);

  const loadModelConfigs = useCallback(async () => {
    try {
      setConfigsLoading(true);
      setConfigs(await apiClient.listModelConfigs());
    } catch (error) {
      setBanner(t('settings.bannerLoadModelsFail', { msg: getErrorMessage(error) }));
    } finally {
      setConfigsLoading(false);
    }
  }, [apiClient, t]);

  const loadModelProviders = useCallback(async () => {
    try {
      const next = await apiClient.listModelProviders();
      if (next.length > 0) setModelProviders(next);
    } catch {
      setModelProviders(BUILTIN_MODEL_PROVIDERS);
    }
  }, [apiClient]);

  /** 服务端下发的 provider 列表与当前选中 id 不一致时，回填表单到首个服务商。 */
  useEffect(() => {
    if (!open || modelProviders.length === 0) return;
    const hasMatch = modelProviders.some((p) => p.id === selectedProviderId);
    if (!hasMatch) {
      const p = modelProviders[0];
      setSelectedProviderId(p.id);
      setMName(p.name);
      setMBaseUrl(p.baseUrl);
      setMModel(pickDefaultProviderModel(p).model);
    }
  }, [open, modelProviders, selectedProviderId]);

  useEffect(() => {
    if (!open) return;
    void loadProjects();
    void loadModelConfigs();
    void loadModelProviders();
  }, [open, loadProjects, loadModelConfigs, loadModelProviders]);

  useEffect(() => {
    setBanner('');
  }, [tab]);

  function selectProviderPreset(provider: ModelProviderDto) {
    const def = pickDefaultProviderModel(provider);
    setSelectedProviderId(provider.id);
    setMName(provider.name);
    setMBaseUrl(provider.baseUrl);
    setMModel(def.model);
    setProviderOpen(false);
    setModelOpen(false);
  }

  function selectModelOption(provider: ModelProviderDto, option: ProviderModelDto) {
    setSelectedProviderId(provider.id);
    setMName(provider.name);
    setMBaseUrl(provider.baseUrl);
    setMModel(option.model);
    setModelOpen(false);
  }

  async function saveConnectionDraft() {
    try {
      await onSaveApiBase();
      setBanner(t('settings.bannerSavedConnection'));
      void loadProjects();
      void loadModelConfigs();
      void loadModelProviders();
    } catch (error) {
      setBanner(t('settings.bannerSaveFail', { msg: getErrorMessage(error) }));
    }
  }

  async function createProject() {
    if (!pName.trim()) {
      setBanner(t('settings.bannerNameRequired'));
      return;
    }
    try {
      const created = await createProjectFromForm({
        apiClient,
        storage,
        form: {
          name: pName.trim(),
          slug: pSlug.trim() || undefined,
          gitUrl: pGitUrl.trim() || undefined,
          gitToken: pGitToken.trim() || undefined,
          defaultBranch: pBranch.trim() || 'main',
        },
      });
      setBanner(t('settings.bannerCreated', { name: created.name, status: created.status }));
      setPName('');
      setPSlug('');
      setPGitUrl('');
      setPGitToken('');
      setPBranch('main');
      await loadProjects();
      await onApplyProject(created.id);
    } catch (error) {
      setBanner(t('settings.bannerCreateFail', { msg: getErrorMessage(error) }));
    }
  }

  async function activateProject(pid: string) {
    try {
      await selectProject({ storage, projectId: pid });
      await onApplyProject(pid);
    } catch (error) {
      setBanner(t('settings.bannerSelectFail', { msg: getErrorMessage(error) }));
    }
  }

  async function deleteProject(pid: string) {
    if (!confirm(t('settings.confirmDeleteProject'))) return;
    try {
      await apiClient.deleteProject(pid);
      setBanner(t('settings.bannerDeleted'));
      await loadProjects();
      await onProjectDeleted?.(pid);
    } catch (error) {
      setBanner(t('settings.bannerDeleteFail', { msg: getErrorMessage(error) }));
    }
  }

  async function createModelConfig() {
    if (!mName.trim() || !mApiKey.trim()) {
      setBanner(t('settings.bannerModelFields'));
      return;
    }
    try {
      await createModelConfigFromForm({
        apiClient,
        storage,
        form: {
          name: mName.trim(),
          baseUrl: mBaseUrl.trim(),
          apiKey: mApiKey.trim(),
          model: mModel.trim(),
          activate: true,
        },
      });
      setBanner(t('settings.bannerModelCreated'));
      setMApiKey('');
      await loadModelConfigs();
    } catch (error) {
      setBanner(t('settings.bannerModelSaveFail', { msg: getErrorMessage(error) }));
    }
  }

  async function activateCfg(id: string) {
    try {
      await activateModelConfig({ apiClient, storage, id });
      setBanner(t('settings.bannerActivated'));
      await loadModelConfigs();
    } catch (error) {
      setBanner(t('settings.bannerActivateFail', { msg: getErrorMessage(error) }));
    }
  }

  async function probeCfg(id: string) {
    try {
      const result = await apiClient.testModelConfig(id);
      setBanner(
        result.ok
          ? t('settings.bannerProbeOk', { status: result.status ?? 'ok' })
          : t('settings.bannerProbeFail', {
              status: result.status ?? '—',
              err: result.error ?? 'unknown',
            }),
      );
    } catch (error) {
      setBanner(t('settings.bannerProbeReqFail', { msg: getErrorMessage(error) }));
    }
  }

  async function deleteCfg(id: string) {
    if (!confirm(t('settings.confirmDeleteModel'))) return;
    try {
      await apiClient.deleteModelConfig(id);
      await loadModelConfigs();
      setBanner(t('settings.bannerModelDeleted'));
    } catch (error) {
      setBanner(t('settings.bannerDeleteFail', { msg: getErrorMessage(error) }));
    }
  }

  const bannerTone = useMemo(() => {
    if (!banner) return null as 'info' | 'success' | 'error' | null;
    if (
      /失败|错误|没有匹配|无法连接|不可用|Fail|fail|failed|error|Error|unknown/.test(banner)
    )
      return 'error';
    if (
      /已保存|已成功|已创建|已删除|切换|探活成功|项目已|Saved|saved|Created|deleted|activated|Probe ok|ok\s*\(/i.test(
        banner,
      )
    )
      return 'success';
    return 'info';
  }, [banner]);

  const hintClass =
    banner === ''
      ? ''
      : `ide-settings-hint${bannerTone === 'error' ? ' is-error' : bannerTone === 'success' ? ' is-success' : ''}`;

  if (!open) return null;

  return (
    <dialog open className="ide-modal-mask" aria-modal role="presentation">
      <div className="ide-settings-modal ide-modal-card" role="document">
        <header className="ide-settings-head">
          <div>
            <h2 id="workspace-settings-title" className="ide-settings-title">
              {t('settings.title')}
            </h2>
            <p className="ide-settings-subtitle">{t('settings.subtitle')}</p>
          </div>
          <button
            type="button"
            className="ide-modal-close"
            aria-label={t('settings.closeAria')}
            title={t('settings.closeAria')}
            onClick={onClose}
          >
            ×
          </button>
        </header>

        <div className="ide-settings-tabs" role="tablist" aria-labelledby="workspace-settings-title">
          {(
            [
              { id: 'connection' as const, label: t('settings.tabConnection') },
              { id: 'project' as const, label: t('settings.tabProject') },
              { id: 'model' as const, label: t('settings.tabModels') },
            ] satisfies { id: SettingsTab; label: string }[]
          ).map((row) => (
            <button
              key={row.id}
              type="button"
              role="tab"
              aria-selected={tab === row.id}
              className={`ide-settings-tab ${tab === row.id ? 'active' : ''}`}
              onClick={() => setTab(row.id)}
            >
              {row.label}
            </button>
          ))}
        </div>

        <div className="ide-modal-body ide-settings-scroll">
          {banner ? <p className={hintClass}>{banner}</p> : null}
          {tab === 'connection' ? (
            <section className="ide-settings-panel">
              <p
                className="ide-panel-intro"
                dangerouslySetInnerHTML={{ __html: t('settings.connectionIntro') }}
              />
              <div className="ide-presets-row">
                <span className="ide-presets-label">{t('settings.quick')}</span>
                {['/api', 'http://127.0.0.1:8080/api', 'http://localhost:8080/api'].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    className="ide-preset-chip"
                    onClick={() => onApiBaseUrlDraftChange(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <div className="ide-field ide-settings-field ide-settings-field--mono">
                <label htmlFor="ws-api-url">API Base URL</label>
                <input
                  id="ws-api-url"
                  value={apiBaseUrlDraft}
                  onChange={(e) => onApiBaseUrlDraftChange(e.target.value)}
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
              <div className="ide-settings-actions">
                <button type="button" className="ide-btn-primary" onClick={() => void saveConnectionDraft()}>
                  {t('settings.saveConnection')}
                </button>
              </div>
            </section>
          ) : null}

          {tab === 'project' ? (
            <>
              <section className="ide-settings-panel">
                <h3 className="ide-settings-h3">{t('settings.projectNew')}</h3>
                <p className="ide-panel-intro">{t('settings.projectNewIntro')}</p>
                <div className="ide-field ide-settings-field">
                  <label>{t('settings.labelName')}</label>
                  <input value={pName} onChange={(e) => setPName(e.target.value)} placeholder="my-app" />
                </div>
                <div className="ide-field ide-settings-field">
                  <label>{t('settings.labelSlug')}</label>
                  <input
                    value={pSlug}
                    onChange={(e) => setPSlug(e.target.value)}
                    placeholder={t('settings.placeholderSlug')}
                  />
                </div>
                <div className="ide-field ide-settings-field ide-settings-field--mono">
                  <label>{t('settings.labelGitUrl')}</label>
                  <input value={pGitUrl} onChange={(e) => setPGitUrl(e.target.value)} placeholder="https://github.com/org/repo.git" />
                </div>
                <div className="ide-field ide-settings-field">
                  <label>{t('settings.labelGitToken')}</label>
                  <input type="password" value={pGitToken} onChange={(e) => setPGitToken(e.target.value)} placeholder="ghp_…" />
                </div>
                <div className="ide-field ide-settings-field">
                  <label>{t('settings.labelBranch')}</label>
                  <input value={pBranch} onChange={(e) => setPBranch(e.target.value)} />
                </div>
                <div className="ide-settings-actions">
                  <button type="button" className="ide-btn-primary" onClick={() => void createProject()}>
                    {t('settings.createProject')}
                  </button>
                </div>
              </section>

              <section className="ide-settings-panel">
                <div className="ide-section-head">
                  <h3 className="ide-settings-h3">{t('settings.existingProjects')}</h3>
                  <button
                    type="button"
                    className="ide-toggle-chip ide-btn-quiet"
                    disabled={projectsLoading}
                    onClick={() => void loadProjects()}
                  >
                    {projectsLoading ? t('settings.refreshLoading') : t('settings.refreshList')}
                  </button>
                </div>
                <div className="ide-settings-list-scroll">
                  {projects.length === 0 ? (
                    <p className="ide-settings-empty-msg">{t('settings.noProjects')}</p>
                  ) : (
                    projects.map((p) => (
                      <div key={p.id} className={`ide-config-card ${selectedProjectId === p.id ? 'active' : ''}`}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>
                            {p.name}{' '}
                            {selectedProjectId === p.id ? (
                              <span className="ide-badge-active">{t('settings.current')}</span>
                            ) : null}
                          </div>
                          <div className="ide-muted">{p.slug} · {p.status}</div>
                          {p.gitUrl ? <div className="ide-muted">git: {p.gitUrl}</div> : null}
                          {p.lastError ? <div style={{ color: '#f85149', fontSize: 12 }}>error: {p.lastError}</div> : null}
                        </div>
                        <div className="ide-config-actions">
                          <button type="button" className="ide-mini-btn" disabled={selectedProjectId === p.id} onClick={() => void activateProject(p.id)}>
                            {t('settings.pick')}
                          </button>
                          <button type="button" className="ide-mini-btn danger" onClick={() => void deleteProject(p.id)}>
                            {t('settings.delete')}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          ) : null}

          {tab === 'model' ? (
            <>
              <section className="ide-settings-panel">
                <h3 className="ide-settings-h3">{t('settings.modelProviders')}</h3>
                <p className="ide-panel-intro">{t('settings.modelProvidersIntro')}</p>

                <div className="ide-field ide-settings-field">
                  <label>{t('settings.labelProvider')}</label>
                  <button type="button" className="ide-dropdown-trigger" onClick={() => setProviderOpen((x) => !x)}>
                    <span>
                      <strong>{selectedProvider.label}</strong>
                      <span className="ide-muted" style={{ display: 'block', fontSize: 12 }}>
                        {selectedProvider.description}
                      </span>
                    </span>
                    <span aria-hidden>{providerOpen ? '▲' : '▼'}</span>
                  </button>
                  {providerOpen ? (
                    <div className="ide-dropdown-menu">
                      {modelProviders.map((provider) => (
                        <button
                          key={provider.id}
                          type="button"
                          className={`ide-dropdown-item ${provider.id === selectedProvider.id ? 'active' : ''}`}
                          onClick={() => selectProviderPreset(provider)}
                        >
                          <div style={{ fontWeight: 700 }}>{provider.label}</div>
                          <div className="ide-muted" style={{ fontSize: 12 }}>
                            {provider.baseUrl}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="ide-field ide-settings-field">
                  <label>{t('settings.labelModel')}</label>
                  <button type="button" className="ide-dropdown-trigger" onClick={() => setModelOpen((x) => !x)}>
                    <span>
                      <strong>
                        {selectedProviderModel.label}
                        {selectedProviderModel.isLatest ? ' · latest' : ''}
                      </strong>
                      <span className="ide-muted" style={{ display: 'block', fontSize: 12 }}>
                        {selectedProviderModel.model}
                      </span>
                    </span>
                    <span aria-hidden>{modelOpen ? '▲' : '▼'}</span>
                  </button>
                  {modelOpen ? (
                    <div className="ide-dropdown-menu">
                      {selectedProvider.models.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          className={`ide-dropdown-item ${option.model === mModel ? 'active' : ''}`}
                          onClick={() => selectModelOption(selectedProvider, option)}
                        >
                          <div style={{ fontWeight: 700 }}>
                            {option.label}
                            {option.isLatest ? ' · latest' : ''}
                          </div>
                          <div className="ide-muted" style={{ fontSize: 12 }}>
                            {option.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </section>

              <section className="ide-settings-panel">
                <h3 className="ide-settings-h3">{t('settings.newEndpoint')}</h3>
                <p className="ide-panel-intro">{t('settings.newEndpointIntro')}</p>
                <div className="ide-field ide-settings-field">
                  <label>{t('settings.labelCfgName')}</label>
                  <input value={mName} onChange={(e) => setMName(e.target.value)} placeholder="deepseek-prod" />
                </div>
                <div className="ide-field ide-settings-field ide-settings-field--mono">
                  <label>{t('settings.labelBaseUrl')}</label>
                  <input value={mBaseUrl} onChange={(e) => setMBaseUrl(e.target.value)} spellCheck={false} />
                </div>
                <div className="ide-field ide-settings-field">
                  <label>{t('settings.labelApiKey')}</label>
                  <input type="password" value={mApiKey} onChange={(e) => setMApiKey(e.target.value)} placeholder="sk-…" />
                </div>
                <div className="ide-field ide-settings-field ide-settings-field--mono">
                  <label>{t('settings.labelModelId')}</label>
                  <input value={mModel} onChange={(e) => setMModel(e.target.value)} spellCheck={false} />
                </div>
                <div className="ide-settings-actions">
                  <button type="button" className="ide-btn-primary" onClick={() => void createModelConfig()}>
                    {t('settings.createActivate')}
                  </button>
                </div>
              </section>

              <section className="ide-settings-panel">
                <div className="ide-section-head">
                  <h3 className="ide-settings-h3">{t('settings.savedConfigs')}</h3>
                  <button type="button" className="ide-toggle-chip ide-btn-quiet" disabled={configsLoading} onClick={() => void loadModelConfigs()}>
                    {configsLoading ? t('settings.refreshLoading') : t('settings.refreshList')}
                  </button>
                </div>
                <div className="ide-settings-list-scroll" style={{ maxHeight: 340 }}>
                  {configs.length === 0 ? (
                    <p className="ide-settings-empty-msg">{t('settings.noModelConfigs')}</p>
                  ) : (
                    configs.map((c) => (
                      <div key={c.id} className={`ide-config-card ${c.isActive ? 'active' : ''}`}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700 }}>
                            {c.name} {c.isActive ? <span className="ide-badge-active">{t('settings.active')}</span> : null}
                          </div>
                          <div className="ide-muted">
                            {c.model} · {c.baseUrl}
                          </div>
                          <div className="ide-muted">key: {c.apiKeyMasked}</div>
                        </div>
                        <div className="ide-config-actions">
                          {!c.isActive ? (
                            <button type="button" className="ide-mini-btn" onClick={() => void activateCfg(c.id)}>
                              {t('settings.activate')}
                            </button>
                          ) : null}
                          <button type="button" className="ide-mini-btn" onClick={() => void probeCfg(c.id)}>
                            {t('settings.probe')}
                          </button>
                          <button type="button" className="ide-mini-btn danger" onClick={() => void deleteCfg(c.id)}>
                            {t('settings.delete')}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
