/**
 * Client-side settings shape shared with dockerBot-backed clients.
 * Web uses `WebPersistence`; this module only declares types (no RN AsyncStorage).
 */
export type ClientSettings = {
  apiBaseUrl: string;
  selectedProjectId?: string;
  selectedSessionId?: string;
  activeModelConfigId?: string;
  enabledSkillNames?: string[];
  enabledMcpNames?: string[];
};

export type SettingsStorage = {
  load(): Promise<ClientSettings | null>;
  save(settings: ClientSettings): Promise<void>;
  patch(patch: Partial<ClientSettings>): Promise<ClientSettings>;
  clear(): Promise<void>;
};
