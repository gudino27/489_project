// React core & icon imports
import React, { useState, useEffect } from 'react';
import { 
  Settings,        // Admin panel icon
  DollarSign,      // Price management tab icon
  Image,           // Portfolio tab icon
  Save,            // Save button icon
  Check,           // Success feedback icon
  LogOut,          // Logout icon
  Lock             // Login screen icon
} from 'lucide-react';

// Photo manager component for handling uploads to databse
// This component will handle the photo upload, display, and management functionality
import CategoryPhotoManager from './catergoryPhotoManager';

// Top-level AdminPanel component
const AdminPanel = () => {
  // -----------------------------
  // Authentication state and login credentials
  // This state will track if the user is authenticated and hold login credentials
  // -----------------------------
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });

  // UI tab state (either 'prices' or 'photos')
  const [activeTab, setActiveTab] = useState('prices');

  // -----------------------------
  // Pricing configuration state updated dynamically
  // This state will hold the base prices, material multipliers, and color pricing
  // -----------------------------
  const [basePrices, setBasePrices] = useState({
    'base': 250,
    'sink-base': 320,
    'wall': 180,
    'tall': 450,
    'corner': 380,
    'vanity': 280,
    'vanity-sink': 350,
    'medicine': 120,
    'linen': 350
  });

  const [materialMultipliers, setMaterialMultipliers] = useState({
    'laminate': 1.0,
    'wood': 1.5,
    'plywood': 1.3
  });

  const [colorPricing, setColorPricing] = useState({
    1: 0,
    2: 100,
    3: 200,
    'custom': 500
  });

  // Save state indicators
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [loadingPrices, setLoadingPrices] = useState(true);

  // -----------------------------
  // API endpoint for Database
  // -----------------------------
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // -----------------------------
  // Mock login handler need to be replaced with real auth eventually...
  // -----------------------------
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginCredentials.username === 'admin' && loginCredentials.password === 'testing') {
      setIsAuthenticated(true);
      localStorage.setItem('adminAuth', 'true');
    } else {
      alert('Invalid credentials. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('adminAuth');
  };

  // -----------------------------
  // Load prices from backend
  // -----------------------------
  const loadPrices = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/prices`);
      if (response.ok) {
        const data = await response.json();
        if (data.basePrices) setBasePrices(data.basePrices);
        if (data.materialMultipliers) setMaterialMultipliers(data.materialMultipliers);
        if (data.colorPricing) setColorPricing(data.colorPricing);
      } else {
        alert('Failed to load prices from database. Using default values.');
      }
    } catch (error) {
      alert('Error connecting to server. Make sure the server is running on port 3001.');
    } finally {
      setLoadingPrices(false);
    }
  };

  // -----------------------------
  // On first load: auth + fetch prices
  // -----------------------------
  useEffect(() => {
    const auth = localStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
    loadPrices();
  }, []);

  // -----------------------------
  // Save pricing data to backend
  // -----------------------------
  const savePriceChanges = async () => {
    setSaveStatus('saving');
    try {
      // Save cabinet base prices
      const cabinetResponse = await fetch(`${API_BASE}/api/prices/cabinets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(basePrices)
      });
      if (!cabinetResponse.ok) throw new Error('Failed to save cabinet prices');

      // Save material multipliers
      const materialResponse = await fetch(`${API_BASE}/api/prices/materials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialMultipliers)
      });
      if (!materialResponse.ok) throw new Error('Failed to save material multipliers');

      // Save color pricing
      const colorResponse = await fetch(`${API_BASE}/api/prices/colors`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(colorPricing)
      });
      if (!colorResponse.ok) throw new Error('Failed to save color pricing');

      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      alert(`Failed to save prices: ${error.message}`);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 5000);
    }
  };

  // -----------------------------
  // If not authenticated, show login screen
  // -----------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-96">
          <div className="flex items-center justify-center mb-6">
            <Lock className="text-blue-600" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>
          <form onSubmit={handleLogin}>
            {/* Username Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={loginCredentials.username}
                onChange={(e) => setLoginCredentials({ ...loginCredentials, username: e.target.value })}
                className="w-full p-3 border rounded-lg"
                placeholder="Enter username"
                required
              />
            </div>
            {/* Password Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={loginCredentials.password}
                onChange={(e) => setLoginCredentials({ ...loginCredentials, password: e.target.value })}
                className="w-full p-3 border rounded-lg"
                placeholder="Enter password"
                required
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg">
              Login
            </button>
          </form>
          <p className="text-xs text-gray-500 text-center mt-4">
          </p>
        </div>
      </div>
    );
  }

  // -----------------------------
  // Main Admin Panel UI
  // -----------------------------
  return (
    <div className="min-h-screen bg-gray-100">
      
      {/* -------- Header / Toolbar -------- */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Settings className="text-blue-600" size={32} />
            <h1 className="text-2xl font-bold">Admin</h1>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* --------Secondary Navigation Tabs -------- */}
      <div className="bg-white border-b px-4 flex gap-8">
        <button onClick={() => setActiveTab('prices')} className={`py-4 px-6 border-b-2 ${activeTab === 'prices' ? 'border-blue-600 text-blue-600' : 'text-gray-600'}`}>
          <div className="flex items-center gap-2">
            <DollarSign size={20} />
            Price Management
          </div>
        </button>
        <button onClick={() => setActiveTab('photos')} className={`py-4 px-6 border-b-2 ${activeTab === 'photos' ? 'border-blue-600 text-blue-600' : 'text-gray-600'}`}>
          <div className="flex items-center gap-2">
            <Image size={20} />
            Portfolio Photos
          </div>
        </button>
      </div>

      {/* -------- Tab Content -------- */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ---- PRICE TAB ---- */}
        {activeTab === 'prices' && (
          loadingPrices ? (
            <div className="text-center py-20 text-gray-600">
              <div className="animate-spin h-12 w-12 border-b-2 border-blue-600 mx-auto rounded-full" />
              Loading prices from database...
            </div>
          ) : (
            <>
              {/* Unsaved Changes Prompt */}
              {hasUnsavedChanges && (
                <div className="bg-yellow-50 border p-4 rounded-lg mb-4 flex justify-between items-center">
                  <span>You have unsaved changes</span>
                  <button onClick={savePriceChanges} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                    <Save size={18} />
                    Save Changes
                  </button>
                </div>
              )}

              {/* Save Result Messages */}
              {saveStatus === 'saved' && (
                <div className="bg-green-50 text-green-800 p-4 rounded flex items-center gap-2">
                  <Check size={18} /> Changes saved successfully!
                </div>
              )}
              {saveStatus === 'error' && (
                <div className="bg-red-50 text-red-800 p-4 rounded">
                  Failed to save changes. Check your connection or backend logs.
                </div>
              )}



              {/* Refresh Button */}
              <div className="text-center pt-4">
                <button onClick={loadPrices} className="text-sm text-blue-600 underline">
                  Refresh prices from database
                </button>
              </div>
            </>
          )
        )}

        {/* ---- PHOTO TAB ---- */}
        {activeTab === 'photos' && <CategoryPhotoManager />}
      </div>
    </div>
  );
};

export default AdminPanel;
