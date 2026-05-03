import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  defaultLocale,
  LOCALE_STORAGE_KEY,
  readStoredLocale,
  writeStoredLocale,
  type Locale,
  type MessageKey,
  type TFunction,
  makeTranslator,
} from './strings';

type I18nValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  toggleLocale: () => void;
  t: TFunction;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider(props: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale() ?? defaultLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writeStoredLocale(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const next = prev === 'en' ? 'zh-CN' : 'en';
      writeStoredLocale(next);
      return next;
    });
  }, []);

  /** Keep React state in sync if another tab changes localStorage */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== LOCALE_STORAGE_KEY || !e.newValue) return;
      if (e.newValue === 'en' || e.newValue === 'zh-CN') setLocaleState(e.newValue);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const t = useMemo(() => makeTranslator(locale), [locale]);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      toggleLocale,
      t,
    }),
    [locale, setLocale, toggleLocale, t],
  );

  return <I18nContext.Provider value={value}>{props.children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export type { Locale, MessageKey, TFunction };
