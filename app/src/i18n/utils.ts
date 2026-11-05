// Localization utility functions

import type { Language } from '../types';
import { EN_TRANSLATIONS, HI_TRANSLATIONS, type Translations } from './types';

/**
 * Get the appropriate translation object for a language
 */
export const getTranslations = (language: Language): Translations => {
  return language === 'hi' ? HI_TRANSLATIONS : EN_TRANSLATIONS;
};

/**
 * Translate a key using the current language
 */
export const t = (key: keyof Translations, language: Language = 'en'): string => {
  const translations = getTranslations(language);
  return (translations[key] as string) || key;
};

/**
 * Localize content fields based on language preference
 * Returns content with appropriate language fields
 */
export const localizeContent = <T extends Record<string, any>>(
  content: T,
  language: Language,
  textFieldMap: Record<string, string> = {}
): T => {
  if (language === 'en') {
    return content;
  }

  // For Hindi, create a copy with Hindi fields where available
  const localized = { ...content };

  // Map English fields to Hindi alternatives if available
  const defaultMap: Record<string, string> = {
    title: 'titleHi',
    shortDesc: 'shortDescHi',
    description: 'descriptionHi',
    eligibility: 'eligibilityHi',
    name: 'nameHi',
    body: 'bodyHi',
    explanation: 'explanationHi',
    label: 'labelHi',
    ...textFieldMap,
  };

  Object.keys(defaultMap).forEach((enField) => {
    const hiField = defaultMap[enField];
    if (enField in localized && hiField in content) {
      const hiValue = (content as Record<string, any>)[hiField];
      // Only use Hindi value if it exists and is not empty
      if (hiValue) {
        (localized as Record<string, any>)[enField] = hiValue;
      }
    }
  });

  return localized;
};

/**
 * Localize a certification object
 */
export const localizeCertification = (certification: any, language: Language) => {
  return localizeContent(certification, language, {
    title: 'titleHi',
    shortDesc: 'shortDescHi',
    description: 'descriptionHi',
    eligibility: 'eligibilityHi',
  });
};

/**
 * Localize a domain object
 */
export const localizeDomain = (domain: any, language: Language) => {
  return localizeContent(domain, language, {
    name: 'nameHi',
    description: 'descriptionHi',
  });
};

/**
 * Localize a question object with options
 */
export const localizeQuestion = (question: any, language: Language) => {
  const localized = localizeContent(question, language, {
    body: 'bodyHi',
    explanation: 'explanationHi',
  });

  // Localize options as well
  if (localized.options && Array.isArray(localized.options)) {
    localized.options = localized.options.map((option: any) =>
      localizeContent(option, language, { label: 'labelHi' })
    );
  }

  return localized;
};

/**
 * Get preferred language from localStorage
 */
export const getPreferredLanguage = (): Language => {
  const stored = localStorage.getItem('preferredLanguage');
  if (stored === 'en' || stored === 'hi') {
    return stored;
  }
  // Check browser language
  const browserLang = navigator.language.split('-')[0];
  return browserLang === 'hi' ? 'hi' : 'en';
};

/**
 * Set preferred language in localStorage
 */
export const setPreferredLanguage = (language: Language): void => {
  localStorage.setItem('preferredLanguage', language);
};

/**
 * Get the display name for a language
 */
export const getLanguageName = (language: Language): string => {
  return language === 'hi' ? 'हिंदी' : 'English';
};

/**
 * Get the opposite language code
 */
export const getAlternateLanguage = (language: Language): Language => {
  return language === 'en' ? 'hi' : 'en';
};

/**
 * Check if a piece of content has Hindi translation available
 */
export const hasHindiTranslation = (content: Record<string, any>): boolean => {
  return !!(
    content.titleHi ||
    content.shortDescHi ||
    content.descriptionHi ||
    content.bodyHi ||
    content.labelHi ||
    content.nameHi
  );
};

/**
 * Get translation coverage percentage for a certification
 */
export const getTranslationCoverage = (certification: any): number => {
  const totalFields = 4; // title, shortDesc, description, eligibility
  let translatedFields = 0;

  if (certification.titleHi) translatedFields++;
  if (certification.shortDescHi) translatedFields++;
  if (certification.descriptionHi) translatedFields++;
  if (certification.eligibilityHi) translatedFields++;

  return Math.round((translatedFields / totalFields) * 100);
};

/**
 * Format text with proper language-specific attributes
 */
export const getLanguageAttributes = (language: Language) => {
  return {
    lang: language,
    dir: language === 'hi' ? ('ltr' as const) : ('ltr' as const), // Hindi uses LTR, not RTL
    className: language === 'hi' ? 'text-hindi' : 'text-english',
  };
};
