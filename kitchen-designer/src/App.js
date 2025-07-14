import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';
import AdminPanel from './AdminPanel';
import KitchenDesigner from './desinger';
import DesignPreview from './DesignPreview';
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
        <Route path="/designer" element={<KitchenDesigner />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/designpreview" element={<DesignPreview />} />
      </Routes>
    </Router>
  );
}

// Export the main App component as default
export default App;
