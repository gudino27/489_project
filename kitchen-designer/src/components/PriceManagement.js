import React,{ useState, useEffect } from 'react';
import {
  DollarSign,
  Settings,
  Save,
  Check,
  Plus,
  Edit2,
  Trash2,
  X,
  Home,
  Bath
} from 'lucide-react';

const PriceManagement = ({ token, API_BASE, userRole }) => {
  // Tab state for kitchen/bathroom pricing
  const [activeTab, setActiveTab] = useState('kitchen');
  // State for all pricing data
  const [basePrices, setBasePrices] = useState({
    // Kitchen Cabinets
    'base': 250,
    'sink-base': 320,
    'wall': 180,
    'tall': 450,
    'corner': 380,
    'drawer-base': 280,
    'double-drawer-base': 350,
    'glass-wall': 220,
    'open-shelf': 160,
    'island-base': 580,
    'peninsula-base': 420,
    'pantry': 520,
    'corner-wall': 210,
    'lazy-susan': 450,
    'blind-corner': 320,
    'appliance-garage': 280,
    'wine-rack': 350,
    'spice-rack': 180,
    'tray-divider': 200,
    'pull-out-drawer': 250,
    'soft-close-drawer': 300,
    'under-cabinet-lighting': 150,
    
    // Bathroom Cabinets
    'vanity': 280,
    'vanity-sink': 350,
    'double-vanity': 650,
    'floating-vanity': 420,
    'corner-vanity': 380,
    'vanity-tower': 320,
    'medicine': 120,
    'medicine-mirror': 180,
    'linen': 350,
    'linen-tower': 420,
    'wall-hung-vanity': 380,
    'vessel-sink-vanity': 400,
    'undermount-sink-vanity': 380,
    'powder-room-vanity': 250,
    'master-bath-vanity': 750,
    'kids-bathroom-vanity': 220,
    
    // Kitchen Appliances
    'refrigerator': 0,        // Pricing handled separately for appliances
    'stove': 0,
    'dishwasher': 0,
    'microwave': 0,
    'wine-cooler': 0,
    'ice-maker': 0,
    'range-hood': 0,
    'double-oven': 0,
    'cooktop': 0,
    'garbage-disposal': 0,
    
    // Bathroom Fixtures
    'toilet': 0,
    'bathtub': 0,
    'shower': 0
  });

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

  const [wallPricing, setWallPricing] = useState({
    addWall: 1500,
    removeWall: 2000
  });

  const [wallAvailability, setWallAvailability] = useState({
    addWallEnabled: true,
    removeWallEnabled: true
  });

  // UI state
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', multiplier: 1.0 });
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [loadingPrices, setLoadingPrices] = useState(true);

  // Load prices on component mount
  useEffect(() => {
    loadPrices();
  }, []);

  // Load prices from API
  const loadPrices = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const [cabinetRes, materialRes, colorRes, wallRes, wallAvailRes] = await Promise.all([
        fetch(`${API_BASE}/api/prices/cabinets`, { headers }),
        fetch(`${API_BASE}/api/prices/materials`, { headers }),
        fetch(`${API_BASE}/api/prices/colors`, { headers }),
        fetch(`${API_BASE}/api/prices/walls`, { headers }),
        fetch(`${API_BASE}/api/prices/wall-availability`, { headers })
      ]);

      if (cabinetRes.ok) {
        const cabinetData = await cabinetRes.json();
        if (cabinetData && Object.keys(cabinetData).length > 0) {
          setBasePrices(cabinetData);
        }
      }

      if (materialRes.ok) {
        const materialData = await materialRes.json();
        if (materialData && Object.keys(materialData).length > 0) {
          setMaterialMultipliers(materialData);
        }
      }

      if (colorRes.ok) {
        const colorData = await colorRes.json();
        if (colorData && Object.keys(colorData).length > 0) {
          setColorPricing(colorData);
        }
      }

      if (wallRes.ok) {
        const wallData = await wallRes.json();
        if (wallData && Object.keys(wallData).length > 0) {
          setWallPricing(wallData);
        }
      }

      if (wallAvailRes.ok) {
        const wallAvailData = await wallAvailRes.json();
        if (wallAvailData) {
          setWallAvailability(wallAvailData);
        }
      }
    } catch (error) {
      console.error('Error loading prices:', error);
    } finally {
      setLoadingPrices(false);
    }
  };

  // Save all price changes
  const savePriceChanges = async () => {
    setSaveStatus('saving');

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const responses = await Promise.all([
        fetch(`${API_BASE}/api/prices/cabinets`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(basePrices)
        }),
        fetch(`${API_BASE}/api/prices/materials`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(materialMultipliers)
        }),
        fetch(`${API_BASE}/api/prices/colors`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(colorPricing)
        }),
        fetch(`${API_BASE}/api/prices/walls`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(wallPricing)
        }),
        fetch(`${API_BASE}/api/prices/wall-availability`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(wallAvailability)
        })
      ]);

      if (responses.every(res => res.ok)) {
        setSaveStatus('saved');
        setHasUnsavedChanges(false);
        setTimeout(() => setSaveStatus(''), 2000);
      } else {
        throw new Error('Failed to save some prices');
      }
    } catch (error) {
      console.error('Error saving prices:', error);
      alert('Failed to save prices: ' + error.message);
      setSaveStatus('error');
    }
  };

  // Material management functions
  const handleAddMaterial = () => {
    if (!newMaterial.name || newMaterial.multiplier <= 0) {
      alert('Please enter a valid material name and multiplier');
      return;
    }
    setMaterialMultipliers({
      ...materialMultipliers,
      [newMaterial.name.toLowerCase()]: parseFloat(newMaterial.multiplier)
    });
    setNewMaterial({ name: '', multiplier: 1.0 });
    setShowMaterialForm(false);
    setHasUnsavedChanges(true);
  };

  const handleUpdateMaterial = () => {
    if (!editingMaterial.newName || editingMaterial.multiplier <= 0) {
      alert('Please enter valid values');
      return;
    }
    const updated = { ...materialMultipliers };
    delete updated[editingMaterial.original];
    updated[editingMaterial.newName.toLowerCase()] = parseFloat(editingMaterial.multiplier);
    setMaterialMultipliers(updated);
    setEditingMaterial(null);
    setHasUnsavedChanges(true);
  };

  const handleDeleteMaterial = (material) => {
    if (window.confirm(`Delete ${material} material?`)) {
      const updated = { ...materialMultipliers };
      delete updated[material];
      setMaterialMultipliers(updated);
      setHasUnsavedChanges(true);
    }
  };

  // Helper functions to categorize cabinets
  const getKitchenCabinets = () => {
    const kitchenTypes = [
      'base', 'sink-base', 'wall', 'tall', 'corner', 'drawer-base', 'double-drawer-base',
      'glass-wall', 'open-shelf', 'island-base', 'peninsula-base', 'pantry', 'corner-wall',
      'lazy-susan', 'blind-corner', 'appliance-garage', 'wine-rack', 'spice-rack',
      'tray-divider', 'pull-out-drawer', 'soft-close-drawer', 'under-cabinet-lighting',
      'refrigerator', 'stove', 'dishwasher', 'microwave', 'wine-cooler',
      'range-hood', 'double-oven'
    ];
    
    return Object.entries(basePrices).filter(([type]) => kitchenTypes.includes(type));
  };

  const getBathroomCabinets = () => {
    const bathroomTypes = [
      'vanity', 'vanity-sink', 'double-vanity', 'floating-vanity', 'corner-vanity',
      'vanity-tower', 'medicine', 'medicine-mirror', 'linen', 'linen-tower',
      'wall-hung-vanity', 'vessel-sink-vanity', 'undermount-sink-vanity',
      'powder-room-vanity', 'master-bath-vanity', 'kids-bathroom-vanity',
      'toilet', 'bathtub', 'shower'
    ];
    
    return Object.entries(basePrices).filter(([type]) => bathroomTypes.includes(type));
  };

  if (loadingPrices) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading prices...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <DollarSign className="text-blue-600" size={28} />
          Price Management
        </h2>
        <p className="text-gray-600 mt-1">
          Manage cabinet base prices, material multipliers, color pricing, and wall modification costs
        </p>
      </div>

      {/* Save Status Banner */}
      {saveStatus && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${saveStatus === 'saved' ? 'bg-green-50 text-green-700' :
          saveStatus === 'saving' ? 'bg-blue-50 text-blue-700' :
            'bg-red-50 text-red-700'
          }`}>
          {saveStatus === 'saved' && <Check size={18} />}
          {saveStatus === 'saved' ? 'Prices saved successfully!' :
            saveStatus === 'saving' ? 'Saving...' : 'Error saving prices'}
        </div>
      )}

      {/* Cabinet & Appliance/Fixture Prices with Tabs */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="text-blue-600" size={20} />
          Cabinet & Fixture Pricing
        </h3>
        
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('kitchen')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'kitchen'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Home size={18} />
            Kitchen
          </button>
          <button
            onClick={() => setActiveTab('bathroom')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'bathroom'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bath size={18} />
            Bathroom
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'kitchen' && (
          <div>
            <h4 className="text-md font-medium mb-4 text-blue-700 flex items-center gap-2">
              <Home className="text-blue-600" size={16} />
              Kitchen Cabinets & Appliances
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getKitchenCabinets().map(([type, price]) => (
                <div key={type} className="flex items-center gap-3">
                  <label className="flex-1 text-sm font-medium capitalize">
                    {type.replace('-', ' ')}:
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-1">$</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value);

                        if (newValue < 0) {
                          alert('Price cannot be negative. Please enter a positive value.');
                          return;
                        }

                        setBasePrices({ ...basePrices, [type]: newValue || 0 });
                        setHasUnsavedChanges(true);
                      }}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value);
                        if (value < 0) {
                          alert('Price cannot be negative. Resetting to 0.');
                          setBasePrices({ ...basePrices, [type]: 0 });
                        }
                      }}
                      className="w-24 p-2 border rounded focus:border-blue-500 focus:outline-none"
                      min="0"
                      step="10"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bathroom' && (
          <div>
            <h4 className="text-md font-medium mb-4 text-purple-700 flex items-center gap-2">
              <Bath className="text-purple-600" size={16} />
              Bathroom Cabinets & Fixtures
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getBathroomCabinets().map(([type, price]) => (
                <div key={type} className="flex items-center gap-3">
                  <label className="flex-1 text-sm font-medium capitalize">
                    {type.replace('-', ' ')}:
                  </label>
                  <div className="flex items-center">
                    <span className="text-gray-500 mr-1">$</span>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => {
                        const newValue = parseFloat(e.target.value);

                        if (newValue < 0) {
                          alert('Price cannot be negative. Please enter a positive value.');
                          return;
                        }

                        setBasePrices({ ...basePrices, [type]: newValue || 0 });
                        setHasUnsavedChanges(true);
                      }}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value);
                        if (value < 0) {
                          alert('Price cannot be negative. Resetting to 0.');
                          setBasePrices({ ...basePrices, [type]: 0 });
                        }
                      }}
                      className="w-24 p-2 border rounded focus:border-blue-500 focus:outline-none"
                      min="0"
                      step="10"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Material Multipliers */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Settings className="text-green-600" size={20} />
            Material Multipliers
          </h3>
          <button
            onClick={() => setShowMaterialForm(true)}
            className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 flex items-center gap-1"
          >
            <Plus size={16} />
            Add Material
          </button>
        </div>

        {/* Material Form */}
        {showMaterialForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Material name"
                value={newMaterial.name}
                onChange={(e) => setNewMaterial({ ...newMaterial, name: e.target.value })}
                className="flex-1 p-2 border rounded focus:border-blue-500 focus:outline-none"
              />
              <input
                type="number"
                placeholder="Multiplier"
                value={newMaterial.multiplier}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);
                  if (newValue < 0) {
                    alert('Multiplier cannot be negative. Please enter a positive value.');
                    return;
                  }
                  setNewMaterial({ ...newMaterial, multiplier: e.target.value });
                }}
                className="w-24 p-2 border rounded focus:border-blue-500 focus:outline-none"
                min="0.1"
                step="0.1"
              />
              <button
                onClick={handleAddMaterial}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowMaterialForm(false);
                  setNewMaterial({ name: '', multiplier: 1.0 });
                }}
                className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {Object.entries(materialMultipliers).map(([material, multiplier]) => (
            <div key={material} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
              {editingMaterial?.original === material ? (
                <>
                  <input
                    type="text"
                    value={editingMaterial.newName}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, newName: e.target.value })}
                    className="flex-1 p-2 border rounded focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Multiplier"
                    value={editingMaterial.multiplier}  // ← Fixed
                    onChange={(e) => {
                      const newValue = parseFloat(e.target.value);
                      if (newValue < 0) {
                        alert('Multiplier cannot be negative. Please enter a positive value.');
                        return;
                      }
                      setEditingMaterial({ ...editingMaterial, multiplier: e.target.value }); // ← Fixed
                    }}
                    className="w-24 p-2 border rounded focus:border-blue-500 focus:outline-none"
                    min="0.1"
                    step="0.1"
                  />
                  <button
                    onClick={handleUpdateMaterial}
                    className="p-2 text-green-600 hover:bg-green-100 rounded"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setEditingMaterial(null)}
                    className="p-2 text-gray-600 hover:bg-gray-200 rounded"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium capitalize">{material}</span>
                  <span className="text-gray-600">×{multiplier}</span>
                  <button
                    onClick={() => setEditingMaterial({
                      original: material,
                      newName: material,
                      multiplier: multiplier
                    })}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteMaterial(material)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Color Pricing */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded" />
          Color Pricing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(colorPricing).map(([count, price]) => (
            <div key={count} className="flex items-center gap-3">
              <label className="flex-1 text-sm font-medium">
                {count === 'custom' ? 'Custom Colors' : `${count} Color${count !== '1' ? 's' : ''}`}:
              </label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-1">+$</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => {
                    const newValue = parseFloat(e.target.value);
                    if (newValue < 0) {
                      alert('Color pricing cannot be negative. Please enter a positive value.');
                      return;
                    }
                    setColorPricing({ ...colorPricing, [count]: newValue || 0 });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-24 p-2 border rounded focus:border-blue-500 focus:outline-none"
                  min="0"
                  step="10"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wall Pricing */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <div className="w-5 h-5 bg-gray-500 rounded-sm border-2 border-gray-300" />
          Wall Modification Pricing
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Set pricing for custom wall configurations. These costs apply when customers add or remove walls for open floor plans.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <label className="flex-1 text-sm font-medium">
              Add Wall Opening:
            </label>
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">$</span>
              <input
                type="number"
                value={wallPricing.addWall}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);
                  if (newValue < 0) {
                    alert('Wall pricing cannot be negative. Please enter a positive value.');
                    return;
                  }
                  setWallPricing({ ...wallPricing, addWall: newValue || 0 });
                  setHasUnsavedChanges(true);
                }}
                className="w-24 p-2 border rounded focus:border-blue-500 focus:outline-none"
                min="0"
                step="50"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex-1 text-sm font-medium">
              Remove Wall:
            </label>
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">$</span>
              <input
                type="number"
                value={wallPricing.removeWall}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value);
                  if (newValue < 0) {
                    alert('Wall pricing cannot be negative. Please enter a positive value.');
                    return;
                  }
                  setWallPricing({ ...wallPricing, removeWall: newValue || 0 });
                  setHasUnsavedChanges(true);
                }}
                className="w-24 p-2 border rounded focus:border-blue-500 focus:outline-none"
                min="0"
                step="50"
              />
            </div>
          </div>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Wall Modification Examples:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• <strong>Add Wall Opening:</strong> Creating a pass-through between kitchen and other room's</li>
            <li>• <strong>Remove Wall:</strong> Full wall removal for open concept design</li>
          </ul>
        </div>
      </div>

      {/* Wall Service Availability Controls - Super Admin Only */}
      {userRole === 'super_admin' && (
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-blue-500">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700">
          <div className="w-5 h-5 bg-blue-500 rounded" />
          Wall Service Availability (Admin Only)
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Control which wall modification services are available to customers.
        </p>
        
        <div className="space-y-4">
          {/* Add Wall Service */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-blue-800">Wall Addition Service</div>
                <div className="text-xs text-blue-600">Allow customers to add walls and openings</div>
              </div>
              <button
                onClick={() => {
                  const newStatus = !wallAvailability.addWallEnabled;
                  setWallAvailability({ ...wallAvailability, addWallEnabled: newStatus });
                  setHasUnsavedChanges(true);
                }}
                className={`text-sm px-4 py-2 rounded font-medium transition ${
                  wallAvailability.addWallEnabled
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {wallAvailability.addWallEnabled ? '✅ Currently Enabled' : '🚫 Currently Disabled'}
              </button>
            </div>
            
            {!wallAvailability.addWallEnabled && (
              <div className="text-xs text-red-700 p-2 bg-red-100 rounded">
                ⚠️ Wall addition service is disabled. Customers cannot add new walls or openings.
              </div>
            )}
          </div>

          {/* Remove Wall Service */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-blue-800">Wall Removal Service</div>
                <div className="text-xs text-blue-600">Allow customers to remove walls for open floor plans</div>
              </div>
              <button
                onClick={() => {
                  const newStatus = !wallAvailability.removeWallEnabled;
                  setWallAvailability({ ...wallAvailability, removeWallEnabled: newStatus });
                  setHasUnsavedChanges(true);
                }}
                className={`text-sm px-4 py-2 rounded font-medium transition ${
                  wallAvailability.removeWallEnabled
                    ? 'bg-green-500 text-white hover:bg-green-600' 
                    : 'bg-red-500 text-white hover:bg-red-600'
                }`}
              >
                {wallAvailability.removeWallEnabled ? '✅ Currently Enabled' : '🚫 Currently Disabled'}
              </button>
            </div>
            
            {!wallAvailability.removeWallEnabled && (
              <div className="text-xs text-red-700 p-2 bg-red-100 rounded">
                ⚠️ Wall removal service is disabled. Customers cannot remove existing walls.
              </div>
            )}
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mt-4">
          These settings affect all customers immediately. Use when maintenance or high demand requires limiting services.
        </div>
      </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={savePriceChanges}
          disabled={!hasUnsavedChanges || saveStatus === 'saving'}
          className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition ${hasUnsavedChanges && saveStatus !== 'saving'
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
        >
          <Save size={18} />
          {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default PriceManagement;