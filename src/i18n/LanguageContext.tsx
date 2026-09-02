import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, TranslationKey } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey | string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('gtaw_app_language');
    if (saved && ['en', 'tr', 'ru', 'fr', 'es'].includes(saved)) return saved as Language;
    return 'en'; // Varsayılan olarak İngilizce
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('gtaw_app_language', lang);
    localStorage.setItem('gtaw_lang_selected', 'true');
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.savePersistedSettings) {
      electronAPI.savePersistedSettings({ language: lang });
    }
  };

  // Açılışta diskten kalıcı dil tercihini yükle
  useEffect(() => {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI?.getPersistedSettings) {
      electronAPI.getPersistedSettings().then((data: any) => {
        if (data?.language && ['en', 'tr', 'ru', 'fr', 'es'].includes(data.language)) {
          setLanguageState(data.language as Language);
          localStorage.setItem('gtaw_app_language', data.language);
          localStorage.setItem('gtaw_lang_selected', 'true');
        }
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    (window as any).electronAPI?.updateAppLanguage?.(language);
  }, [language]);

  const t = (key: TranslationKey | string, fallback?: string): string => {
    const allTranslations = translations as Record<string, Record<string, string>>;
    const langDict = allTranslations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English dictionary
    if (allTranslations.en && allTranslations.en[key]) {
      return allTranslations.en[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
