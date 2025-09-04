import React from 'react';
import { Link } from 'react-router-dom';
import '../css/footer.css';

const Footer = () => {

  return (
    <footer className="footer-glass">
      <div className="footer-container">
        <div className="footer-section">
          <div className="footer-text">
            Messages sent when invoices are complete or modified
          </div>
          <div className="footer-text">
            Text STOP to opt out • Message & data rates apply
          </div>
        </div>
        
        <div className="footer-section">
          <Link to="/sms-consent-verification" className="footer-link">
            SMS Consent Info
          </Link>
          <span className="footer-separator">|</span>
          <Link to="/sms-terms" className="footer-link">
            Terms
          </Link>
          <span className="footer-separator">|</span>
          <Link to="/privacy" className="footer-link">
            Privacy
          </Link>
        </div>
        
        <div className="footer-copyright">
          © {new Date().getFullYear()} Gudino Custom Cabinets. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;