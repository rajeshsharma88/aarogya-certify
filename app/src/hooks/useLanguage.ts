// Custom hook for language management

import { useLanguageContext } from '../context/LanguageContext';
import type { Language } from '../types';
import {
  getAlternateLanguage,
  getLanguageName,
  localizeCertification,
  localizeDomain,
  localizeQuestion,
  hasHindiTranslation,
  getTranslationCoverage,
} from '../i18n';

/**
 * useLanguage - Comprehensive hook for language management
 * Provides language state, switching, and localization utilities
 */
export const useLanguage = () => {
  const { language, setLanguage, t, translations, isLoading } = useLanguageContext();

  return {
    // Language state
    language,
    isLoading,
    translations,

    // Translation function
    t,

    // Language switching
    setLanguage,
    toggleLanguage: () => setLanguage(getAlternateLanguage(language)),
    getAlternateLanguage: () => getAlternateLanguage(language),

    // Language info
    getLanguageName: (lang?: Language) => getLanguageName(lang || language),
    isHindi: language === 'hi',
    isEnglish: language === 'en',

    // Content localization
    localizeCertification: (cert: any) => localizeCertification(cert, language),
    localizeDomain: (domain: any) => localizeDomain(domain, language),
    localizeQuestion: (question: any) => localizeQuestion(question, language),

    // Translation checking
    hasHindiTranslation: (content: Record<string, any>) => hasHindiTranslation(content),
    getTranslationCoverage: (cert: any) => getTranslationCoverage(cert),
  };
};

/**
 * useLanguageToggle - Simple hook for just language toggling
 * Useful for minimal components
 */
export const useLanguageToggle = () => {
  const { language, setLanguage } = useLanguageContext();
  return {
    language,
    setLanguage,
    toggle: () => setLanguage(getAlternateLanguage(language)),
  };
};

/**
 * useTranslation - Alias for useLanguage (common pattern)
 */
export const useTranslation = () => useLanguage();
