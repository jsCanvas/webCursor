import { DEFAULT_API_BASE_URL } from '@phoneBot/config/defaults';
import { I18nProvider } from './i18n/I18nContext';
import { IdeApp } from './ide/IdeApp';

export default function App() {
  return (
    <I18nProvider>
      <IdeApp defaultApiBaseUrl={DEFAULT_API_BASE_URL} />
    </I18nProvider>
  );
}
