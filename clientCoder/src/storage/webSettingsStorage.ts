import type { ClientSettings, SettingsStorage } from '@phoneBot/storage/settingsStorage';

export type { ClientSettings };

const SETTINGS_KEY = 'phonebot.client.settings';

const adapter = {
  getItem(key: string): Promise<string | null> {
    return Promise.resolve(globalThis.localStorage?.getItem(key) ?? null);
  },
  setItem(key: string, value: string): Promise<void> {
    globalThis.localStorage?.setItem(key, value);
    return Promise.resolve();
  },
  removeItem(key: string): Promise<void> {
    globalThis.localStorage?.removeItem(key);
    return Promise.resolve();
  },
};

/**
 * DOM localStorage-backed client settings compatible with dockerBot-side `SettingsStorage` APIs (shared shape with Expo client).
 */
export class WebPersistence {
  async load(): Promise<ClientSettings | null> {
    const raw = await adapter.getItem(SETTINGS_KEY);
    return raw ? (JSON.parse(raw) as ClientSettings) : null;
  }

  async save(settings: ClientSettings): Promise<void> {
    await adapter.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  async patch(patch: Partial<ClientSettings>): Promise<ClientSettings> {
    const current = (await this.load()) ?? { apiBaseUrl: '' };
    const next: ClientSettings = { ...current, ...patch };
    await adapter.setItem(SETTINGS_KEY, JSON.stringify(next));
    return next;
  }

  async clear(): Promise<void> {
    await adapter.removeItem(SETTINGS_KEY);
  }
}

/** API helpers expect `SettingsStorage` — `WebPersistence` is structurally compatible. */
export function phoneBotStorage(persistence: WebPersistence): SettingsStorage {
  return persistence;
}
