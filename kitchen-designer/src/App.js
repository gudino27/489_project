import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './components/pages/Home';
import Portfolio from './components/pages/portfolio';
import KitchenDesigner from './components/pages/desinger';
import About from './components/pages/About';
import Contact from './components/pages/Contact';
import AdminPanel from './components/admin/AdminPanel';
import PasswordReset from './components/admin/PasswordReset';
import Registration from './components/auth/Registration';
import TestimonialForm from './components/forms/TestimonialForm';
import InvoiceViewer from './components/invoice/InvoiceViewer';
import ReceiptViewer from './components/invoice/ReceiptViewer';
import SmsCompliance from './components/SmsCompliance';
import PrivacySettings from './components/PrivacySettings';
import { LanguageProvider } from './contexts/LanguageContext';
import { PricingProvider } from './contexts/PricingContext';
// -----------------------------
// Top-Level App Component
// Main application component that handles routing between different sections
// Uses React Router to navigate between design tool, admin panel, and photo gallery
// -----------------------------
function App() {
  return (
    <LanguageProvider>
      <PricingProvider>
        <Router>
          <Routes>

            {/* React components */}
            <Route path="/" element={<Home />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/design" element={<KitchenDesigner />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/reset-password" element={<PasswordReset />} />
            <Route path="/register/:token" element={<Registration />} />
            <Route path="/testimonial/:token" element={<TestimonialForm />} />
            <Route path="/invoice/:token/payment/:paymentId" element={<ReceiptViewer />} />
            <Route path="/invoice/:token" element={<InvoiceViewer />} />
            <Route path="/sms-consent-verification" element={<SmsCompliance defaultTab="consent" />} />
            <Route path="/sms-terms" element={<SmsCompliance defaultTab="terms" />} />
            <Route path="/sms-privacy" element={<SmsCompliance defaultTab="privacy" />} />
            <Route path="/privacy" element={<SmsCompliance defaultTab="website" />} />
            <Route path="/opt-out" element={<PrivacySettings />} />
            <Route path="/privacy-settings" element={<PrivacySettings />} />
            <Route path="/cabinet-Care" element={<SmsCompliance defaultTab="cabinetCare" />} />
          </Routes>
        </Router>
      </PricingProvider>
    </LanguageProvider>
  );
}

// Export the main App component as default
export default App;
