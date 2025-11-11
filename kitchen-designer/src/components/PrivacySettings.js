import React, { useState, useEffect } from 'react';
import Footer from './ui/Footer';
import './css/sms-compliance.css';

const PrivacySettings = () => {
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
          <h1 className="sms-header">Privacy Settings & Opt-Out</h1>

          <div className="sms-section-header">Current Status</div>
          <div className={`sms-highlight-box ${isOptedOut ? 'opt-out-active' : 'opt-in-active'}`}>
            <strong>Analytics Tracking:</strong> {isOptedOut ? 'DISABLED ✓' : 'ENABLED'}
          </div>

          {showSuccess && (
            <div className="sms-highlight-box" style={{ backgroundColor: '#d4edda', borderColor: '#c3e6cb', color: '#155724', marginTop: '20px' }}>
              ✓ Your preference has been saved successfully!
            </div>
          )}

          <div className="sms-section-header">What We Track</div>
          <p>When analytics tracking is enabled, we collect:</p>
          <ul className="sms-list">
            <li>Pages you visit on our website</li>
            <li>Time spent on each page</li>
            <li>Approximate location (city-level)</li>
            <li>Device and browser information</li>
          </ul>

          <div className="sms-section-header">Your Privacy Options</div>

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
              {isOptedOut ? '✓ Already Opted Out' : 'Opt-Out of Analytics'}
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
              {!isOptedOut ? '✓ Already Opted In' : 'Opt-In to Analytics'}
            </button>
          </div>

          <div className="sms-section-header" style={{ marginTop: '40px' }}>How Opt-Out Works</div>
          <p>
            When you opt-out, we store a preference in your browser's local storage. This prevents our
            analytics system from tracking your visits. The opt-out preference is specific to this browser
            and device.
          </p>
          <p>
            <strong>Important:</strong> If you clear your browser's cache/cookies or use a different browser/device,
            you'll need to opt-out again.
          </p>

          <div className="sms-section-header">Browser "Do Not Track"</div>
          <p>
            We also respect the "Do Not Track" (DNT) browser setting. If your browser is set to "Do Not Track",
            we will not collect analytics data even if you haven't manually opted out on this page.
          </p>
          <p>
            Current DNT Status: <strong>{navigator.doNotTrack === '1' ? 'ENABLED ✓' : 'Not Enabled'}</strong>
          </p>

          <div className="sms-section-header">Data Deletion Requests</div>
          <p>
            If you'd like us to delete analytics data we've already collected about you, please contact us:
          </p>
          <ul className="sms-list">
            <li><strong>Email:</strong> admin@gudinocustom.com</li>
            <li><strong>Phone:</strong> (509) 515-4090</li>
            <li><strong>Response Time:</strong> We'll respond within 30 days</li>
          </ul>

          <div className="sms-section-header">What Data Gets Deleted</div>
          <p>We automatically delete analytics data after 24 months as part of our data retention policy.</p>

          <div className="sms-section-header">Other Privacy Options</div>
          <p>
            <a href="/privacy" style={{ color: '#007bff', textDecoration: 'underline' }}>
              View our complete Privacy Policy
            </a>
          </p>
          <p>
            <a href="/contact" style={{ color: '#007bff', textDecoration: 'underline' }}>
              Contact us with privacy questions
            </a>
          </p>

          <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#868788ff', borderRadius: '5px' }}>
            <strong>Note:</strong> Essential website functions (form submissions, and invoice access)
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PrivacySettings;
