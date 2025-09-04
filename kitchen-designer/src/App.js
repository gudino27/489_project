import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './components/pages/Home';
import Portfolio from './components/pages/portfolio';
import KitchenDesigner from './components/pages/desinger';
import About from './components/pages/About';
import Contact from './components/pages/Contact';
import AdminPanel from './components/admin/AdminPanel';
import PasswordReset from './components/admin/PasswordReset';
import TestimonialForm from './components/forms/TestimonialForm';
import InvoiceViewer from './components/invoice/InvoiceViewer';
import SmsCompliance from './components/SmsCompliance';
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
            <Route path="/testimonial/:token" element={<TestimonialForm />} />
            <Route path="/invoice/:token" element={<InvoiceViewer />} />
            <Route path="/sms-consent-verification" element={<SmsCompliance />} />
            <Route path="/sms-terms" element={<SmsCompliance defaultTab="terms" />} />
            <Route path="/privacy" element={<SmsCompliance defaultTab="privacy" />} />
          </Routes>
        </Router>
      </PricingProvider>
    </LanguageProvider>
  );
}

// Export the main App component as default
export default App;
