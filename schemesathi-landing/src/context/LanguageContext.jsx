import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SUPPORTED_LANGUAGES, translations } from '../locales/translations';
// Clean up any legacy Google Translate cookies or DOM artifacts
const cleanupGoogleTranslate = () => {
  if (typeof window === 'undefined') return;
  try {
    const domain = window.location.hostname;
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=${domain}; path=/;`;
    const el = document.getElementById('google_translate_element');
    if (el) el.remove();
    const banner = document.querySelector('.goog-te-banner-frame');
    if (banner) banner.remove();
  } catch (e) {}
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    try {
      // If no authenticated user exists, always default to English
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        return 'en';
      }
      const saved = localStorage.getItem('schemesathi-language');
      if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
        return saved;
      }
    } catch (e) {
      console.warn('Could not read language from localStorage:', e);
    }
    return 'en';
  });

  // Ensure clean DOM without legacy Google Translate interference on mount
  useEffect(() => {
    cleanupGoogleTranslate();
    // Synchronize default platform language if user hasn't explicitly set one
    fetch('/api/auth/system-settings')
      .then(res => res.json())
      .then(data => {
        if (data?.success && data?.settings?.default_language) {
          const def = data.settings.default_language;
          const saved = localStorage.getItem('schemesathi-language');
          if (!saved && SUPPORTED_LANGUAGES.some(l => l.code === def)) {
            setCurrentLanguage(def);
          }
        }
      })
      .catch(() => {});
  }, []);

  const resetToEnglish = useCallback(() => {
    setCurrentLanguage('en');
    try {
      localStorage.setItem('schemesathi-language', 'en');
    } catch (e) {
      console.warn('Could not reset language in localStorage:', e);
    }
    cleanupGoogleTranslate();
    window.dispatchEvent(new CustomEvent('schemesathi-language-changed', { detail: { language: 'en' } }));
  }, []);

  // Listen to global reset events (login, register, logout)
  useEffect(() => {
    const handleReset = () => {
      resetToEnglish();
    };
    window.addEventListener('schemesathi-language-reset', handleReset);
    return () => window.removeEventListener('schemesathi-language-reset', handleReset);
  }, [resetToEnglish]);

  const changeLanguage = useCallback((langCode) => {
    if (!SUPPORTED_LANGUAGES.some(l => l.code === langCode)) {
      console.warn(`Unsupported language code: ${langCode}`);
      return;
    }

    setCurrentLanguage(langCode);
    try {
      localStorage.setItem('schemesathi-language', langCode);
    } catch (e) {
      console.warn('Could not save language to localStorage:', e);
    }

    cleanupGoogleTranslate();

    // Dispatch global event for instant reactive component updates
    window.dispatchEvent(new CustomEvent('schemesathi-language-changed', { detail: { language: langCode } }));
  }, []);

  // Primary translation getter: t('key', 'Fallback Text')
  const t = useCallback((key, fallback = '') => {
    const langDict = translations[currentLanguage] || translations['en'];
    if (langDict && langDict[key] !== undefined) {
      return langDict[key];
    }
    // Fallback to English dict
    if (translations['en'] && translations['en'][key] !== undefined) {
      return translations['en'][key];
    }
    return fallback || key;
  }, [currentLanguage]);

  // Translate Category names dynamically
  const translateCategory = useCallback((categoryName) => {
    if (!categoryName) return '';
    const norm = String(categoryName).toLowerCase().trim();

    if (norm.includes('agri') || norm.includes('farm')) return t('catAgriculture', categoryName);
    if (norm.includes('edu') || norm.includes('learn') || norm.includes('scholar')) return t('catEducation', categoryName);
    if (norm.includes('health') || norm.includes('medic') || norm.includes('well')) return t('catHealthcare', categoryName);
    if (norm.includes('bank') || norm.includes('financ')) return t('catBanking', categoryName);
    if (norm.includes('busi') || norm.includes('entrep')) return t('catBusiness', categoryName);
    if (norm.includes('soci') || norm.includes('welf') || norm.includes('empow')) return t('catSocial', categoryName);
    if (norm.includes('hous') || norm.includes('shelter')) return t('catHousing', categoryName);
    if (norm.includes('skill') || norm.includes('employ') || norm.includes('job')) return t('catSkills', categoryName);
    if (norm.includes('women') || norm.includes('child')) return t('catWomen', categoryName);
    if (norm.includes('senior') || norm.includes('elder') || norm.includes('pension')) return t('catSenior', categoryName);

    return categoryName;
  }, [t]);

  // Translate Application Mode
  const translateMode = useCallback((mode) => {
    if (!mode) return '';
    const norm = String(mode).toLowerCase().trim();
    if (norm.includes('online') && norm.includes('offline')) return t('modeBoth', 'Online & Offline');
    if (norm.includes('online')) return t('modeOnline', 'Online');
    if (norm.includes('offline')) return t('modeOffline', 'Offline');
    return mode;
  }, [t]);

  // Translate Government Level
  const translateGovtLevel = useCallback((level) => {
    if (!level) return '';
    const norm = String(level).toLowerCase().trim();
    if (norm.includes('central') || norm === 'center') return t('levelCentral', 'Central Government');
    if (norm.includes('state')) return t('levelState', 'State Government');
    return level;
  }, [t]);

  // Translate Application Status
  const translateStatus = useCallback((status) => {
    if (!status) return '';
    const norm = String(status).toLowerCase().trim();
    if (norm.includes('applied')) return t('statusApplied', 'Applied');
    if (norm.includes('review') || norm.includes('progress') || norm.includes('pending')) return t('statusUnderReview', 'Under Review');
    if (norm.includes('approved') || norm.includes('sanction')) return t('statusApproved', 'Approved');
    if (norm.includes('reject')) return t('statusRejected', 'Rejected');
    if (norm.includes('saved')) return t('statusSavedForLater', 'Saved for Later');
    return status;
  }, [t]);

  const currentLanguageData = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  const value = {
    currentLanguage,
    currentLanguageData,
    languages: SUPPORTED_LANGUAGES,
    changeLanguage,
    resetToEnglish,
    t,
    translateCategory,
    translateMode,
    translateGovtLevel,
    translateStatus
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
