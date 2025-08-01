import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSelector = ({ className = '' }) => {
  const { currentLanguage, changeLanguage, availableLanguages, t } = useLanguage();

  return (
    <div className={`relative ${className}`}>
      <select
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value)}
        className="language-selector-glass"
        title={t('language.select')}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '12px',
          padding: '10px 15px',
          color: 'black',
          fontSize: '0.9rem',
          fontWeight: '600',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          outline: 'none',
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
          backgroundSize: '16px',
          paddingRight: '35px'
        }}
        onMouseOver={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
        }}
        onMouseOut={(e) => {
          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = 'none';
        }}
      >
        {availableLanguages.map((lang) => (
          <option 
            key={lang.code} 
            value={lang.code}
            style={{
              background: '#333',
              color: 'black',
              padding: '10px'
            }}
          >
            🌐 {lang.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;