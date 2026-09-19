import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES, LanguageOption, translations } from './translations';

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  currentOption: LanguageOption;
  setLanguage: (lang: SupportedLanguage) => void;
  supportedLanguages: LanguageOption[];
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguage>(() => {
    const saved = localStorage.getItem('app_language') as SupportedLanguage;
    if (saved && ['en', 'es', 'fr', 'de', 'zh', 'vi'].includes(saved)) {
      return saved;
    }
    return 'en';
  });

  const setLanguage = (lang: SupportedLanguage) => {
    setCurrentLanguageState(lang);
    try {
      localStorage.setItem('app_language', lang);
    } catch (e) {
      console.warn('Failed to persist language preference in localStorage', e);
    }
  };

  const currentOption = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const t = (key: string, fallback?: string): string => {
    const langDict = translations[currentLanguage];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English
    const enDict = translations['en'];
    if (enDict && enDict[key]) {
      return enDict[key];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      currentOption,
      setLanguage,
      supportedLanguages: SUPPORTED_LANGUAGES,
      t
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if rendered outside provider
    return {
      currentLanguage: 'en',
      currentOption: SUPPORTED_LANGUAGES[0],
      setLanguage: () => {},
      supportedLanguages: SUPPORTED_LANGUAGES,
      t: (k: string, fb?: string) => fb || k
    };
  }
  return context;
};
