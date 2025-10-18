import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isLoading, setIsLoading] = useState(true);

  // Load saved language preference on mount
  useEffect(() => {
    loadLanguagePreference();
  }, []);

  const loadLanguagePreference = async () => {
    try {
      const saved = await AsyncStorage.getItem('app_language');
      if (saved && (saved === 'en' || saved === 'es')) {
        setCurrentLanguage(saved);
      }
    } catch (error) {
      console.error('Failed to load language preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save language preference when it changes
  const changeLanguage = async (lang) => {
    if (lang === 'en' || lang === 'es') {
      try {
        await AsyncStorage.setItem('app_language', lang);
        setCurrentLanguage(lang);
      } catch (error) {
        console.error('Failed to save language preference:', error);
      }
    }
  };

  // Translation function
  const t = (key, fallback = key) => {
    const translation = translations[currentLanguage]?.[key];
    return translation || fallback;
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    isLoading,
    availableLanguages: [
      { code: 'en', name: 'English', nativeName: 'EN' },
      { code: 'es', name: 'Spanish', nativeName: 'ES' }
    ]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
