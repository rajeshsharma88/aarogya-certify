// Language Context - Manages language state across the application

import React, { createContext, useEffect, useState } from 'react';
import type { Language } from '../types';
import { getPreferredLanguage, setPreferredLanguage, getTranslations, t as translate } from '../i18n';
import type { Translations } from '../i18n';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translations, defaultValue?: string) => string;
  translations: Translations;
  isLoading: boolean;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export interface LanguageProviderProps {
  children: React.ReactNode;
  defaultLanguage?: Language;
}

/**
 * LanguageProvider - Wraps the app to provide language context
 * Manages:
 * - Current language state
 * - Persistence to localStorage
 * - Translation dictionary
 * - Language switching
 */
export const LanguageProvider: React.FC<LanguageProviderProps> = ({
  children,
  defaultLanguage = 'en',
}) => {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [isLoading, setIsLoading] = useState(true);
  const [translations, setTranslations] = useState(getTranslations('en'));

  // Initialize language from localStorage on mount
  useEffect(() => {
    const savedLanguage = getPreferredLanguage();
    setLanguageState(savedLanguage);
    setTranslations(getTranslations(savedLanguage));
    setIsLoading(false);
  }, []);

  // Update language and persist to localStorage
  const setLanguage = (newLanguage: Language) => {
    if (newLanguage === language) return;

    setLanguageState(newLanguage);
    setTranslations(getTranslations(newLanguage));
    setPreferredLanguage(newLanguage);

    // Update document language attribute
    document.documentElement.lang = newLanguage;

    // Dispatch custom event for analytics/tracking
    window.dispatchEvent(
      new CustomEvent('languageChanged', { detail: { language: newLanguage } })
    );
  };

  // Translation helper
  const t = (key: keyof Translations, defaultValue?: string): string => {
    return translate(key, language) || defaultValue || String(key);
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    translations,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

/**
 * Hook to use LanguageContext
 * Throws error if used outside LanguageProvider
 */
export const useLanguageContext = (): LanguageContextType => {
  const context = React.useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguageContext must be used within LanguageProvider');
  }
  return context;
};
