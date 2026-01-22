import React, { useState, useEffect } from 'react';
import Footer from './ui/Footer';
import './css/sms-compliance.css';
import { useLanguage } from '../contexts/LanguageContext';

const PrivacySettings = () => {
  const { t } = useLanguage();
  const [isOptedOut, setIsOptedOut] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check current opt-out status on mount
  useEffect(() => {
    const optOut = localStorage.getItem('analytics_opt_out');
    setIsOptedOut(optOut === 'true');
  }, []);

  const handleOptOut = () => {
    localStorage.setItem('analytics_opt_out', 'true');
    setIsOptedOut(true);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleOptIn = () => {
    localStorage.removeItem('analytics_opt_out');
    setIsOptedOut(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <>
      <div className="sms-compliance-container" style={{ minHeight: '100vh', paddingTop: '80px' }}>
        <div className="sms-content">
          <h1 className="sms-header">{t('privacySettings.title')}</h1>

          <div className="sms-section-header">{t('privacySettings.currentStatus')}</div>
          <div className={`sms-highlight-box ${isOptedOut ? 'opt-out-active' : 'opt-in-active'}`}>
            <strong>{t('privacySettings.analyticsTracking')}:</strong> {isOptedOut ? t('privacySettings.disabled') : t('privacySettings.enabled')}
          </div>

          {showSuccess && (
            <div className="sms-highlight-box" style={{ backgroundColor: '#d4edda', borderColor: '#c3e6cb', color: '#155724', marginTop: '20px' }}>
              {t('privacySettings.preferenceSaved')}
            </div>
          )}

          <div className="sms-section-header">{t('privacySettings.whatWeTrack')}</div>
          <p>{t('privacySettings.trackingIntro')}</p>
          <ul className="sms-list">
            <li>{t('privacySettings.trackingPages')}</li>
            <li>{t('privacySettings.trackingTime')}</li>
            <li>{t('privacySettings.trackingLocation')}</li>
            <li>{t('privacySettings.trackingDevice')}</li>
          </ul>

          <div className="sms-section-header">{t('privacySettings.yourOptions')}</div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button
              onClick={handleOptOut}
              disabled={isOptedOut}
              style={{
                padding: '15px 30px',
                backgroundColor: isOptedOut ? '#6c757d' : '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: isOptedOut ? 'not-allowed' : 'pointer',
                opacity: isOptedOut ? 0.6 : 1,
              }}
            >
              {isOptedOut ? t('privacySettings.alreadyOptedOut') : t('privacySettings.optOutButton')}
            </button>

            <button
              onClick={handleOptIn}
              disabled={!isOptedOut}
              style={{
                padding: '15px 30px',
                backgroundColor: !isOptedOut ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                cursor: !isOptedOut ? 'not-allowed' : 'pointer',
                opacity: !isOptedOut ? 0.6 : 1,
              }}
            >
              {!isOptedOut ? t('privacySettings.alreadyOptedIn') : t('privacySettings.optInButton')}
            </button>
          </div>

          <div className="sms-section-header" style={{ marginTop: '40px' }}>{t('privacySettings.howOptOut')}</div>
          <p>
            {t('privacySettings.optOutDescription')}
          </p>
          <p>
            <strong>{t('privacySettings.optOutImportant')}</strong>
          </p>

          <div className="sms-section-header">{t('privacySettings.dntTitle')}</div>
          <p>
            {t('privacySettings.dntDescription')}
          </p>
          <p>
            {t('privacySettings.dntStatus')} <strong>{navigator.doNotTrack === '1' ? t('privacySettings.dntEnabled') : t('privacySettings.dntNotEnabled')}</strong>
          </p>

          <div className="sms-section-header">{t('privacySettings.deletionTitle')}</div>
          <p>
            {t('privacySettings.deletionDescription')}
          </p>
          <ul className="sms-list">
            <li><strong>{t('privacySettings.deletionEmail')}</strong></li>
            <li><strong>{t('privacySettings.deletionPhone')}</strong></li>
            <li><strong>{t('privacySettings.deletionResponseTime')}</strong></li>
          </ul>

          <div className="sms-section-header">{t('privacySettings.dataRetentionTitle')}</div>
          <p>{t('privacySettings.dataRetentionDescription')}</p>

          <div className="sms-section-header">{t('privacySettings.otherOptionsTitle')}</div>
          <p>
            <a href="/privacy" style={{ color: '#007bff', textDecoration: 'underline' }}>
              {t('privacySettings.viewPrivacyPolicy')}
            </a>
          </p>
          <p>
            <a href="/contact" style={{ color: '#007bff', textDecoration: 'underline' }}>
              {t('privacySettings.contactPrivacy')}
            </a>
          </p>

          <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#868788ff', borderRadius: '5px' }}>
            <strong>{t('privacySettings.note')}</strong>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PrivacySettings;
