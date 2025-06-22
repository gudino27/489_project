import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  DollarSign, 
  Image, 
  Save, 
  Check,
  LogOut,
  Lock
} from 'lucide-react';
import CategoryPhotoManager from './catergoryPhotoManager';

const AdminPanel = () => {
  // Admin authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });
  const [activeTab, setActiveTab] = useState('prices');
  
  // Price management state
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
  
  // Temporary state for unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [loadingPrices, setLoadingPrices] = useState(true);

  // API Configuration - UPDATE THIS TO MATCH The SERVER
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Mock authentication - In production time we will use proper authentication
  const handleLogin = (e) => {
    e.preventDefault();
    // In production, validate against backend for security
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

  // Load prices from database
  const loadPrices = async () => {
    try {
      console.log('Loading prices from:', `${API_BASE}/api/prices`);
      const response = await fetch(`${API_BASE}/api/prices`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded prices:', data);
        
        // Update state with prices from database
        if (data.basePrices) setBasePrices(data.basePrices);
        if (data.materialMultipliers) setMaterialMultipliers(data.materialMultipliers);
        if (data.colorPricing) setColorPricing(data.colorPricing);
      } else {
        console.error('Failed to load prices from database');
        alert('Failed to load prices from database. Using default values.');
      }
    } catch (error) {
      console.error('Error loading prices:', error);
      alert('Error connecting to server. Make sure the server is running on port 3001.');
    } finally {
      setLoadingPrices(false);
    }
  };

  // Load saved data on mount
  useEffect(() => {
    // Check authentication
    const auth = localStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }

    loadPrices();
  }, []);

  // Save price changes to database
  const savePriceChanges = async () => {
    setSaveStatus('saving');
    
    try {
      console.log('Saving prices to database...');
      
      // Save cabinet prices
      const cabinetResponse = await fetch(`${API_BASE}/api/prices/cabinets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(basePrices)
      });

      if (!cabinetResponse.ok) {
        throw new Error('Failed to save cabinet prices');
      }

      // Save material multipliers
      const materialResponse = await fetch(`${API_BASE}/api/prices/materials`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(materialMultipliers)
      });

      if (!materialResponse.ok) {
        throw new Error('Failed to save material multipliers');
      }

      // Save color pricing
      const colorResponse = await fetch(`${API_BASE}/api/prices/colors`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(colorPricing)
      });

      if (!colorResponse.ok) {
        throw new Error('Failed to save color pricing');
      }

      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      console.log('Prices saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveStatus(''), 3000);
      
    } catch (error) {
      console.error('Error saving prices:', error);
      setSaveStatus('error');
      alert(`Failed to save prices: ${error.message}\n\nMake sure the server is running and the database is set up.`);
      
      // Clear error message after 5 seconds
      setTimeout(() => setSaveStatus(''), 5000);
    }
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-96">
          <div className="flex items-center justify-center mb-6">
            <Lock className="text-blue-600" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Username</label>
              <input
                type="text"
                value={loginCredentials.username}
                onChange={(e) => setLoginCredentials({ ...loginCredentials, username: e.target.value })}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Enter username"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                value={loginCredentials.password}
                onChange={(e) => setLoginCredentials({ ...loginCredentials, password: e.target.value })}
                className="w-full p-3 border rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Enter password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>
          <p className="text-xs text-gray-500 text-center mt-4">
            Demo: username: admin, password: testing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <Settings className="text-blue-600" size={32} />
              <h1 className="text-2xl font-bold">Cabinet Designer Admin</h1>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('prices')}
              className={`py-4 px-6 border-b-2 transition ${
                activeTab === 'prices'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <DollarSign size={20} />
                Price Management
              </div>
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`py-4 px-6 border-b-2 transition ${
                activeTab === 'photos'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <Image size={20} />
                Portfolio Photos
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'prices' && (
          <div className="space-y-8">
            {/* Loading state */}
            {loadingPrices ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading prices from database...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Save Button */}
                {hasUnsavedChanges && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center justify-between">
                    <span className="text-yellow-800">You have unsaved changes</span>
                    <button
                      onClick={savePriceChanges}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      disabled={saveStatus === 'saving'}
                    >
                      <Save size={18} />
                      {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}

                {/* Save Status Messages */}
                {saveStatus === 'saved' && (
                  <div className="p-4 rounded-lg flex items-center gap-2 bg-green-50 text-green-800">
                    <Check size={18} />
                    Changes saved successfully!
                  </div>
                )}

                {saveStatus === 'error' && (
                  <div className="p-4 rounded-lg bg-red-50 text-red-800">
                    Failed to save changes. check server connection and try again.
                  </div>
                )}

                

                {/* Cabinet Base Prices */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-semibold mb-4">Cabinet Base Prices</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(basePrices).map(([type, price]) => (
                      <div key={type} className="border rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">$</span>
                          <input
                            type="number"
                            value={price}
                            onChange={(e) => {
                              setBasePrices({ ...basePrices, [type]: parseFloat(e.target.value) || 0 });
                              setHasUnsavedChanges(true);
                            }}
                            className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                            min="0"
                            step="10"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Material Multipliers */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-semibold mb-4">Material Multipliers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(materialMultipliers).map(([material, multiplier]) => (
                      <div key={material} className="border rounded-lg p-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {material.charAt(0).toUpperCase() + material.slice(1)}
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">×</span>
                          <input
                            type="number"
                            value={multiplier}
                            onChange={(e) => {
                              setMaterialMultipliers({ ...materialMultipliers, [material]: parseFloat(e.target.value) || 1 });
                              setHasUnsavedChanges(true);
                            }}
                            className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                            min="0.1"
                            max="5"
                            step="0.1"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {((multiplier - 1) * 100).toFixed(0)}% {multiplier > 1 ? 'increase' : 'decrease'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Color Options Pricing */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-semibold mb-4">Color Options Pricing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="border rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Single Color
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">$</span>
                        <input
                          type="number"
                          value={colorPricing[1]}
                          onChange={(e) => {
                            setColorPricing({ ...colorPricing, 1: parseInt(e.target.value) || 0 });
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                          min="0"
                          step="10"
                        />
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Two Colors
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">$</span>
                        <input
                          type="number"
                          value={colorPricing[2]}
                          onChange={(e) => {
                            setColorPricing({ ...colorPricing, 2: parseInt(e.target.value) || 0 });
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                          min="0"
                          step="10"
                        />
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Three Colors
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">$</span>
                        <input
                          type="number"
                          value={colorPricing[3]}
                          onChange={(e) => {
                            setColorPricing({ ...colorPricing, 3: parseInt(e.target.value) || 0 });
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                          min="0"
                          step="10"
                        />
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Colors
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">$</span>
                        <input
                          type="number"
                          value={colorPricing.custom}
                          onChange={(e) => {
                            setColorPricing({ ...colorPricing, custom: parseInt(e.target.value) || 0 });
                            setHasUnsavedChanges(true);
                          }}
                          className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                          min="0"
                          step="10"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Refresh Button */}
                <div className="text-center pt-4">
                  <button
                    onClick={loadPrices}
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    Refresh prices from database
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'photos' && (<CategoryPhotoManager />)}
      </div>
    </div>
  );
};

export default AdminPanel;