import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import Home from './components/Home';
import Portfolio from './components/portfolio';
import KitchenDesigner from './components/desinger';
import About from './components/About';
import Contact from './components/Contact';
import AdminPanel from './components/AdminPanel';
// -----------------------------
// Top-Level App Component
// Main application component that handles routing between different sections
// Uses React Router to navigate between design tool, admin panel, and photo gallery
// -----------------------------
function App() {
  return (
    <Router>
      <Routes>
                
        {/* React components */}
        <Route path="/" element={<Home />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/design" element={<KitchenDesigner />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </Router>
  );
}

// Export the main App component as default
export default App;
