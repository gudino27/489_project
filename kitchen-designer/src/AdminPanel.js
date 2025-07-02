// React core & icon imports
import React, { useState, useEffect} from 'react';
import {
  Settings,
  DollarSign,
  Image,
  Save,
  Check,
  LogOut,
  Lock,
  IdCardLanyard,
  FileText,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react';
// Photo manager component for handling uploads to databse
// This component will handle the photo upload, display, and management functionality
import CategoryPhotoManager from './catergoryPhotoManager'; 

// Employee management component for handling employee data
import EmployeeManager from './EmployeeManager';
// view designs from the admin panel

import DesignViewer from './DesignViewer';

// Top-level AdminPanel component
const AdminPanel = () => {
  // -----------------------------
  // Authentication state and login credentials
  // This state will track if the user is authenticated and hold login credentials
  // -----------------------------
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({ username: '', password: '' });
  // UI tab state (either 'prices' or 'photos')
  // This state will track which tab is currently active in the admin panel
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
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', multiplier: 1.0 });
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [materialMultipliers, setMaterialMultipliers] = useState({
    'laminate': 1.0,
    'wood': 1.5,
    'plywood': 1.3,
  });

  const [colorPricing, setColorPricing] = useState({
    1: 0,
    2: 100,
    3: 200,
    'custom': 500
  });

  // -----------------------------
  // UI state for unsaved changes, save status, and loading state
  // This state will track if there are unsaved changes, the status of the last save operation, and if prices are currently loading
  // -----------------------------
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [loadingPrices, setLoadingPrices] = useState(true);


  // -----------------------------
  // API base URL - this will be used to connect to the backend server
  // This URL will be used to fetch and save prices from/to the backend
  // -----------------------------
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // -----------------------------
  // Authentication handlers
  // These functions will handle user login and logout
  // -----------------------------
  // Handle login with hardcoded credentials for demo purposes
  // In production, this will be replaced with a secure authentication method
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
  const addMaterial = () => {
    if (!newMaterial.name || newMaterial.name.trim() === '') {
      alert('Please enter a material name');
      return;
    }

    const key = newMaterial.name.toLowerCase().replace(/\s+/g, '-');

    if (materialMultipliers[key]) {
      alert('This material already exists');
      return;
    }

    setMaterialMultipliers({
      ...materialMultipliers,
      [key]: parseFloat(newMaterial.multiplier)
    });

    setNewMaterial({ name: '', multiplier: 1.0 });
    setShowMaterialForm(false);
    setHasUnsavedChanges(true);
  };

  const deleteMaterial = (key) => {
    const defaultMaterials = ['laminate', 'wood', 'plywood'];
    if (defaultMaterials.includes(key)) {
      alert('Cannot delete default materials');
      return;
    }

    if (window.confirm(`Delete material "${key}"?`)) {
      const newMaterials = { ...materialMultipliers };
      delete newMaterials[key];
      setMaterialMultipliers(newMaterials);
      setHasUnsavedChanges(true);
    }
  };
  // -----------------------------
  // Load prices from the database on component mount
  // This function will fetch the prices from the backend API and update the state
  // -----------------------------
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
  // -----------------------------
  // Load prices and check authentication on component mount
  // This effect will run once when the component mounts to load initial data
  // -----------------------------
  useEffect(() => {
    // Check authentication
    const auth = localStorage.getItem('adminAuth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }

    loadPrices();
  }, []);

  // -----------------------------
  // Save price changes to the database
  // This function will send the updated prices to the backend API
  // -----------------------------
  const savePriceChanges = async () => {
  setSaveStatus('saving');
  
  try {
    console.log('Saving prices to database...');
    
    // Save base prices
    const cabinetResponse = await fetch(`${API_BASE}/api/prices/cabinets`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(basePrices)
    });

    if (!cabinetResponse.ok) {
      throw new Error('Failed to save cabinet prices');
    }
    
    // Save material multipliers - MAKE SURE THIS IS HERE
    console.log('Saving materials:', materialMultipliers);
    const materialResponse = await fetch(`${API_BASE}/api/prices/materials`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(materialMultipliers)
    });

    if (!materialResponse.ok) {
      const error = await materialResponse.text();
      console.error('Material save error:', error);
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
    console.log('All prices saved successfully!');
    
    // Show success message
    setTimeout(() => setSaveStatus(''), 2000);
    
  } catch (error) {
    console.error('Error saving prices:', error);
    alert('Failed to save prices: ' + error.message);
    setSaveStatus('error');
  }
};
  // -----------------------------
  // check for authentication status
  // This will determine if the user is logged in or not
  //will show the login form if not authenticated
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
            {/* password input field*/}
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
  // -----------------------------
  // Render the admin panel UI
  // This will display the header, navigation tabs, and content area based on the active tab
  // -----------------------------
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

      {/* Seconday Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('prices')}
              className={`py-4 px-6 border-b-2 transition ${activeTab === 'prices'
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
              className={`py-4 px-6 border-b-2 transition ${activeTab === 'photos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              <div className="flex items-center gap-2">
                <Image size={20} />
                Portfolio Photos
              </div>
            </button>
            <button
              onClick={() => setActiveTab('designs')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'designs'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <FileText className="inline w-4 h-4 mr-2" />
              Customer Designs
            </button>
            <button
              onClick={() => setActiveTab('employees')}
              className={`py-4 px-6 border-b-2 transition ${activeTab === 'employees'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-800'
                }`}
            >
              <div className="flex items-center gap-2">
                <IdCardLanyard size={20} />
                Employee Management
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
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Material Multipliers</h3>
                    <button
                      onClick={() => setShowMaterialForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Material
                    </button>
                  </div>

                  {/* Add Material Form */}
                  {showMaterialForm && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                      <h4 className="font-medium mb-3">Add New Material</h4>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="Material Name (e.g., Marble)"
                          value={newMaterial.name}
                          onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                          className="flex-1 px-3 py-2 border rounded"
                        />
                        <input
                          type="number"
                          placeholder="Multiplier"
                          value={newMaterial.multiplier}
                          onChange={(e) => setNewMaterial({ ...newMaterial, multiplier: e.target.value })}
                          step="0.1"
                          min="0.1"
                          className="w-32 px-3 py-2 border rounded"
                        />
                        <button
                          onClick={addMaterial}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setShowMaterialForm(false);
                            setNewMaterial({ name: '', multiplier: 1.0 });
                          }}
                          className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">
                        Example: 1.0 = base price, 1.5 = 50% more, 2.0 = double price
                      </p>
                    </div>
                  )}

                  {/* Material List */}
                  <div className="bg-white rounded-lg border">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Multiplier</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Example ($100 base)</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {Object.entries(materialMultipliers).map(([material, multiplier]) => (
                          <tr key={material}>
                            <td className="px-4 py-3">
                              <span className="font-medium">
                                {material.charAt(0).toUpperCase() + material.slice(1).replace(/-/g, ' ')}
                              </span>
                              <span className="text-xs text-gray-500 block">({material})</span>
                            </td>
                            <td className="px-4 py-3">
                              {editingMaterial === material ? (
                                <input
                                  type="number"
                                  value={multiplier}
                                  onChange={(e) => {
                                    setMaterialMultipliers({
                                      ...materialMultipliers,
                                      [material]: parseFloat(e.target.value)
                                    });
                                    setHasUnsavedChanges(true);
                                  }}
                                  onBlur={() => setEditingMaterial(null)}
                                  onKeyPress={(e) => e.key === 'Enter' && setEditingMaterial(null)}
                                  step="0.1"
                                  min="0.1"
                                  className="w-20 px-2 py-1 border rounded"
                                  autoFocus
                                />
                              ) : (
                                <span>{multiplier}x</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-600">
                              ${(100 * multiplier).toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setEditingMaterial(material)}
                                className="text-blue-600 hover:text-blue-800 mr-3"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {!['laminate', 'wood', 'plywood'].includes(material) && (
                                <button
                                  onClick={() => deleteMaterial(material)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                    <p className="text-blue-800">
                      <strong>How it works:</strong> Base price × Material multiplier × Size multiplier = Final price
                    </p>
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

{hasUnsavedChanges && (
  <div className="sticky bottom-4 flex justify-end">
    <button
      onClick={savePriceChanges}
      disabled={saveStatus === 'saving'}
      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-lg"
    >
      {saveStatus === 'saving' ? 'Saving...' : 'Save All Changes'}
    </button>
  </div>
)}

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

        {/*
         Photo Management Tab 
         loaded in from a different component
         */}
        {activeTab === 'photos' && (<CategoryPhotoManager />)}
        {/* Employee Management Tab
         This component will handle employee data management, including adding, editing, and deleting employees
        */}
        {activeTab === 'employees' && (<EmployeeManager />)}
        {/* Design Viewer Tab
        */}
        {activeTab === 'designs' && (<DesignViewer />)}

      </div>
    </div>
  );
};

export default AdminPanel;