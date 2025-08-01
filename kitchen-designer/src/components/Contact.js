import React, { useState, useEffect } from 'react';
import Navigation from './Navigation';
import LanguageSelector from './LanguageSelector';
import { useLanguage } from '../contexts/LanguageContext';
import './css/contact.css';
import { useAnalytics } from '../hooks/useAnalytics';

const Contact = () => {
  // Analytics tracking
  useAnalytics('/contact');
  
  // Language context
  const { t } = useLanguage();
  
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => setIsMapLoaded(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const contactInfo = {
    phone: {
      english: "(509) 515-4090",
      spanish: "(509) 831-9816"
    },
    email: "Info@gudinocustom.com",
    address: "70 Ray Rd, Sunnyside, WA 98944",
    hours: {
      weekdays: "Monday - Friday: 7:00 AM - 5:00 PM",
      saturday: "Saturday: 8:00 AM - 5:00 PM",
      sunday: "Sunday: Closed"
    }
  };

  const handleEnglishPhoneClick = () => {
    window.location.href = `tel:${contactInfo.phone.english}`;
  };

  const handleSpanishPhoneClick = () => {
    window.location.href = `tel:${contactInfo.phone.spanish}`;
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${contactInfo.email}`;
  };

  return (
    <>
      <Navigation />
      
      <div className="contact-container">
        {/* Language Selector */}
        <div className="contact-hero">
          <div className="hero-content">
            <h1 className="hero-title">{t('contact.heroTitle')}</h1>
            <p className="hero-subtitle">
              {t('contact.heroSubtitle')}
            </p>
          </div>
        </div>
        <div className="absolute top-15 right-4 z-50">
          <LanguageSelector />
        </div>
        <div className="contact-content">
          <div className="contact-grid">
            
            {/* Contact Information Cards */}
            <div className="contact-cards">
              
              {/* Phone Card */}
              <div 
                className={`contact-card phone-card ${hoveredCard === 'phone' ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredCard('phone')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="card-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>{t('contact.callUs')}</h3>
                  <div className="phone-options">
                    <div className="phone-option" onClick={handleEnglishPhoneClick}>
                      <span className="language-label">English</span>
                      <p className="contact-detail">{contactInfo.phone.english}</p>
                      <span className="card-action">{t('contact.clickToCall')}</span>
                    </div>
                    <div className="phone-option" onClick={handleSpanishPhoneClick}>
                      <span className="language-label">Español</span>
                      <p className="contact-detail">{contactInfo.phone.spanish}</p>
                      <span className="card-action">{t('contact.clickToCall')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email Card */}
              <div 
                className={`contact-card email-card ${hoveredCard === 'email' ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredCard('email')}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={handleEmailClick}
              >
                <div className="card-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>{t('contact.emailUs')}</h3>
                  <p className="contact-detail">{contactInfo.email}</p>
                  <span className="card-action">{t('contact.clickToEmail')}</span>
                </div>
              </div>

              {/* Location Card */}
              <div 
                className={`contact-card location-card ${hoveredCard === 'location' ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredCard('location')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="card-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>{t('contact.visitUs')}</h3>
                  <p className="contact-detail">{contactInfo.address}</p>
                  <span className="card-action">{t('contact.getDirections')}</span>
                </div>
              </div>

              {/* Hours Card */}
              <div 
                className={`contact-card hours-card ${hoveredCard === 'hours' ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredCard('hours')}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className="card-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                    <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
                  </svg>
                </div>
                <div className="card-content">
                  <h3>{t('contact.businessHours')}</h3>
                  <div className="hours-list">
                    <p>{contactInfo.hours.weekdays}</p>
                    <p>{contactInfo.hours.saturday}</p>
                    <p>{contactInfo.hours.sunday}</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Map Section */}
            <div className="map-section">
              <div className="map-header">
                <h2>{t('contact.mapTitle')}</h2>
                <p>{t('contact.mapSubtitle')}</p>
              </div>
              
              <div className="map-container">
                {!isMapLoaded ? (
                  <div className="map-loading">
                    <div className="loading-spinner"></div>
                    <p>{t('contact.loadingMap')}</p>
                  </div>
                ) : (
                  <div className="interactive-map">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2756.6001221157585!2d-119.9602535231462!3d46.297917871099834!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x549822f175b48609%3A0x30cb35096d65324b!2s70%20Ray%20Rd%2C%20Sunnyside%2C%20WA%2098944!5e0!3m2!1sen!2sus!4v1753657799291!5m2!1sen!2sus"
                      width="100%"
                      height="400"
                      style={{ border: 0, borderRadius: '15px' }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Gudino Custom Woodworking Location"
                    ></iframe>
                  </div>
                )}
              </div>
            </div>

          </div>

          

        </div>
      </div>
    </>
  );
};

export default Contact;