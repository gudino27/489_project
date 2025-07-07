import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import KitchenDesigner from './desinger';

import './App.css';

// Component imports for different app sections
import AdminPanel from './AdminPanel';         // Admin pricing and photo management
import DesignPreview from './DesignPreview'; // Preview of design before submission


// -----------------------------
// Top-Level App Component
// Main application component that handles routing between different sections
// Uses React Router to navigate between design tool, admin panel, and photo gallery
// -----------------------------
function App() {
  return (
    <Router>
      <Routes>
        {/* Main cabinet design application */}
        <Route path="/" element={<KitchenDesigner />} />
        {/* Admin panel for price management, photo uploads as well as employee bio */}
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/designpreview" element={<DesignPreview />} />
      </Routes>
    </Router>
  );
}

// Export the main App component as default
export default App;
