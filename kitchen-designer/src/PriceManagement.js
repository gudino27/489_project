import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Settings,
  Save,
  Check,
  Plus,
  Edit2,
  Trash2,
  X
} from 'lucide-react';

const PriceManagement = ({ token, API_BASE }) => {
  // State for all pricing data
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
    'plywood': 1.3,
  });
  
  const [colorPricing, setColorPricing] = useState({
    1: 0,
    2: 100,
    3: 200,
    'custom': 500
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

      const [cabinetRes, materialRes, colorRes] = await Promise.all([
        fetch(`${API_BASE}/api/prices/cabinets`, { headers }),
        fetch(`${API_BASE}/api/prices/materials`, { headers }),
        fetch(`${API_BASE}/api/prices/colors`, { headers })
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
          Manage cabinet base prices, material multipliers, and color pricing
        </p>
      </div>

      {/* Save Status Banner */}
      {saveStatus && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          saveStatus === 'saved' ? 'bg-green-50 text-green-700' :
          saveStatus === 'saving' ? 'bg-blue-50 text-blue-700' :
          'bg-red-50 text-red-700'
        }`}>
          {saveStatus === 'saved' && <Check size={18} />}
          {saveStatus === 'saved' ? 'Prices saved successfully!' :
           saveStatus === 'saving' ? 'Saving...' : 'Error saving prices'}
        </div>
      )}

      {/* Cabinet Base Prices */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="text-blue-600" size={20} />
          Cabinet Base Prices
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(basePrices).map(([type, price]) => (
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
                    setBasePrices({ ...basePrices, [type]: parseFloat(e.target.value) || 0 });
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
                onChange={(e) => setNewMaterial({ ...newMaterial, multiplier: e.target.value })}
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
                    value={editingMaterial.multiplier}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, multiplier: e.target.value })}
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
                    setColorPricing({ ...colorPricing, [count]: parseFloat(e.target.value) || 0 });
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

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={savePriceChanges}
          disabled={!hasUnsavedChanges || saveStatus === 'saving'}
          className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition ${
            hasUnsavedChanges && saveStatus !== 'saving'
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