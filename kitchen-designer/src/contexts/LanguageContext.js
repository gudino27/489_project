import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from '../utils/translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  // Try to get saved language from localStorage, default to browser language or English
  const getInitialLanguage = () => {
    const saved = localStorage.getItem('kitchen-designer-language');
    if (saved && (saved === 'en' || saved === 'es')) {
      return saved;
    }

    // Detect browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('es')) {
      return 'es';
    }
    return 'en';
  };

  const [currentLanguage, setCurrentLanguage] = useState(getInitialLanguage);

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem('kitchen-designer-language', currentLanguage);
  }, [currentLanguage]);

  // Translation function
  const t = (key, fallback = key) => {
    const translation = translations[currentLanguage]?.[key];
    return translation || fallback;
  };

  // Change language function
  const changeLanguage = (lang) => {
    if (lang === 'en' || lang === 'es') {
      setCurrentLanguage(lang);
    }
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    availableLanguages: [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'es', name: 'Spanish', nativeName: 'Español' }
    ]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;