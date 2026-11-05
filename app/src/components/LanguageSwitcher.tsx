// Language Switcher Component

import React from 'react';
import { useLanguage } from '../hooks/useLanguage';
import type { Language } from '../types';

interface LanguageSwitcherProps {
  variant?: 'button' | 'dropdown' | 'pills';
  compact?: boolean;
  showLabel?: boolean;
}

/**
 * LanguageSwitcher - Component to switch between English and Hindi
 * Three variants:
 * - button: Simple toggle button
 * - dropdown: Select dropdown (default)
 * - pills: Pill-style toggle buttons
 */
export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'dropdown',
  compact = false,
  showLabel = false,
}) => {
  const { language, setLanguage, t } = useLanguage();

  const handleChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  // Dropdown variant (default)
  if (variant === 'dropdown') {
    return (
      <div className={`flex items-center gap-2 ${compact ? 'text-sm' : ''}`}>
        {showLabel && (
          <label className="text-sm font-medium text-slate-700">
            {t('language')}
          </label>
        )}
        <select
          value={language}
          onChange={(e) => handleChange(e.target.value as Language)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
          aria-label={t('selectLanguage')}
        >
          <option value="en">{t('english')}</option>
          <option value="hi">{t('hindi')}</option>
        </select>
      </div>
    );
  }

  // Button variant - simple toggle
  if (variant === 'button') {
    return (
      <button
        onClick={() => handleChange(language === 'en' ? 'hi' : 'en')}
        className={`rounded-lg border border-slate-300 font-medium transition-all hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-200 ${
          compact ? 'px-2 py-1 text-sm' : 'px-3 py-2'
        } ${language === 'hi' ? 'bg-saffron-50 text-saffron-700 border-saffron-300' : 'bg-white text-slate-700'}`}
        aria-label={`Switch to ${language === 'en' ? 'Hindi' : 'English'}`}
        title={`Switch to ${language === 'en' ? 'हिंदी' : 'English'}`}
      >
        {language === 'en' ? 'हिंदी' : 'EN'}
      </button>
    );
  }

  // Pills variant - radio-style buttons
  if (variant === 'pills') {
    return (
      <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
        <button
          onClick={() => handleChange('en')}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
            language === 'en'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-selected={language === 'en'}
          aria-label="Switch to English"
        >
          {t('english')}
        </button>
        <button
          onClick={() => handleChange('hi')}
          className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
            language === 'hi'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
          aria-selected={language === 'hi'}
          aria-label="Switch to हिंदी"
        >
          {t('hindi')}
        </button>
      </div>
    );
  }

  return null;
};

/**
 * LanguageBadge - Shows current language as a small badge
 * Useful for displaying language preference in profiles, certificates, etc.
 */
export const LanguageBadge: React.FC<{ language?: Language; interactive?: boolean }> = ({
  language: customLanguage,
  interactive = false,
}) => {
  const { language: contextLanguage, setLanguage } = useLanguage();
  const lang = customLanguage || contextLanguage;
  const label = lang === 'en' ? 'English' : 'हिंदी';

  if (!interactive) {
    return (
      <span className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-200">
        {label}
      </span>
    );
  }

  return (
    <button
      onClick={() => setLanguage(lang === 'en' ? 'hi' : 'en')}
      className="chip cursor-pointer bg-brand-50 text-brand-700 ring-1 ring-brand-200 transition-colors hover:bg-brand-100 hover:ring-brand-300"
      aria-label={`Switch from ${label}`}
    >
      {label}
    </button>
  );
};

/**
 * LanguageIndicator - Inline indicator for current language
 * Useful for assessment results, certificates, etc.
 */
export const LanguageIndicator: React.FC<{ language?: Language }> = ({
  language: customLanguage,
}) => {
  const { language: contextLanguage } = useLanguage();
  const lang = customLanguage || contextLanguage;

  return (
    <div className="text-xs font-medium text-slate-500">
      {lang === 'en' ? '🇬🇧 English' : '🇮🇳 हिंदी'}
    </div>
  );
};
