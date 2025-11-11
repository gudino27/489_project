import React from 'react';
import './css/sms-compliance.css';
const WebsitePrivacy = () => (
  <>
    <h1 className="sms-header">Privacy Policy - Website & Tracking</h1>
    <p><em>Effective for Washington State and all US users</em></p>
    <div className="sms-section-header">Our Commitment to Your Privacy</div>
    <p>
      Gudino Custom Woodworking LLC respects your privacy. This policy explains how we collect, use, and protect
      your information when you use our website and services. We are committed to transparency and
      compliance with all applicable privacy laws.
    </p>
    <div className="sms-section-header">Information We Collect</div>
    <div><strong>Invoice & Testimonial Link Tracking:</strong></div>
    <p>When you open an invoice or testimonial link we send you, we collect:</p>
    <ul className="sms-list">
      <li><strong>City-level location:</strong> Approximate city, region, and country (for fraud prevention)</li>
      <li><strong>IP address:</strong> To verify delivery and detect suspicious access</li>
      <li><strong>Device information:</strong> Browser and device type</li>
      <li><strong>Timestamp:</strong> When you opened the link</li>
    </ul>
    <div className="sms-highlight-box">
      <strong>Privacy Note:</strong> We do NOT collect precise location.
      We only collect city-level location data for legitimate business purposes such as
      fraud prevention and delivery confirmation.
    </div>
    <div className="sms-section-header">How We Collect This Information</div>
    <ul className="sms-list">
      <li><strong>Self-hosted location:</strong> We use a local database - your IP address is NOT sent to third parties</li>
      <li><strong>Browser storage:</strong> We use your browser's storage to remember your session and preferences</li>
    </ul>
    <div className="sms-section-header">Why We Collect This Information</div>
    <p>We collect and use this information for the following legitimate business purposes:</p>
    <ul className="sms-list">
      <li><strong>Fraud prevention:</strong> Detecting suspicious access patterns and preventing unauthorized invoice/testimonial access</li>
      <li><strong>Delivery confirmation:</strong> Verifying that invoices and testimonials were successfully delivered to the intended recipient</li>
      <li><strong>Security:</strong> Protecting our business and customers from malicious activity</li>
    </ul>
    <div className="sms-section-header">Third-Party Data Sharing</div>
    <div className="sms-highlight-box">
      <strong>We do NOT sell, rent, or share your personal information with third parties.</strong>
    </div>
    <p>All tracking is done on our own servers. Your data stays with us. We do not use third-party analytics tools. We use industry-standard protection measures to safeguard your information.</p>
    <p><strong>Exception:</strong> We may disclose information if required by law, court order, or to protect our legal rights.</p>
    <div className="sms-section-header">Data Retention</div>
    <p>We retain different types of data for different periods:</p>
    <ul className="sms-list">
      <li><strong>Testimonial tracking:</strong> Retained while the testimonial is active, then deleted after 24 months</li>
      <li><strong>Invoice tracking:</strong> Retained for the duration of the business relationship plus 3 years for accounting/tax purposes</li>
      <li><strong>Session data:</strong> Deleted when you close your browser</li>
    </ul>
    <div className="sms-section-header">How to Exercise Your Rights</div>
    <p>To opt-out, access, or delete your data:</p>
    <ul className="sms-list">
      <li>Email us at: <strong>Admin@gudinocustom.com</strong></li>
      <li>Call us at: <strong>(509) 515-4090</strong></li>
      <li>We will respond to your request within 30 days</li>
    </ul>
    <div className="sms-section-header">Browser "Do Not Track"</div>
    <p>
      We respect the "Do Not Track" browser setting. If your browser is set to "Do Not Track",
      we will not collect analytics data from your visit.
    </p>
    <div className="sms-section-header">Data Security</div>
    <p>We protect your information through:</p>
    <ul className="sms-list">
      <li>HTTPS encryption for all data transmission</li>
      <li>Secure servers with regular security updates</li>
      <li>Limited access to data - only authorized staff</li>
      <li>Regular security monitoring and backups</li>
      <li>Industry-standard database security practices</li>
    </ul>
    <div className="sms-section-header">Children's Privacy</div>
    <p>
      Our services are not directed to children under 13. We do not knowingly collect information
      from children. If we discover we have collected information from a child under 13, we will
      delete it immediately.
    </p>
    <div className="sms-section-header">Changes to This Privacy Policy</div>
    <p>
      We may update this privacy policy from time to time. We will notify you of any material changes
      by posting the new policy on this page with a new "Last updated" date. We encourage you to review
      this policy periodically.
    </p>
    <div className="sms-section-header">Contact Us</div>
    <p>
      For questions about this privacy policy or to exercise your privacy rights:<br/><br/>
      <strong>Gudino Custom Cabinets</strong><br/>
      Privacy Contact: Admin@gudinocustom.com<br/>
      Phone: (509) 515-4090<br/>
      Address: 70 Ray Rd, Sunnyside WA 98944<br/>
    </p>
    <div className="sms-section-header">State-Specific Rights</div>
    <p><strong>Washington State Residents:</strong></p>
    <p>
      While Washington does not currently have a comprehensive consumer privacy law ,
      we extend privacy protections to all our Washington customers. You have the rights listed
      above to access and delete your data.
    </p>
    <p><strong>California Residents:</strong></p>
    <p>
      If you are a California resident, you have additional rights under the California Consumer
      Privacy Act (CCPA):
    </p>
    <ul className="sms-list">
      <li>Right to know what personal information we collect and how we use it</li>
      <li>Right to delete personal information</li>
      <li>Right to opt-out of "sale" of personal information (we do not sell your information)</li>
      <li>Right to non-discrimination for exercising your privacy rights</li>
    </ul>

  </>
);
export default WebsitePrivacy;
