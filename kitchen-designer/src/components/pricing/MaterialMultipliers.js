import React, { useState } from 'react';
import { Settings, Plus, Edit2, Trash2, Check, X } from 'lucide-react';

const MaterialMultipliers = ({ 
  materialMultipliers, 
  setMaterialMultipliers, 
  markSectionChanged, 
  updateSharedMaterials,
  refreshPricing,
  SectionSaveButton 
}) => {
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ 
    nameEn: '', 
    nameEs: '', 
    multiplier: 1.0 
  });
  const [editingMaterial, setEditingMaterial] = useState(null);

  const handleAddMaterial = () => {
    if (!newMaterial.nameEn || !newMaterial.nameEs || newMaterial.multiplier <= 0) {
      alert('Please enter both English and Spanish names, plus a valid multiplier');
      return;
    }
    
    // Generate a temporary ID for new materials (will be replaced by database ID on save)
    const tempId = Date.now() + Math.random(); // Unique temporary ID
    
    const newMaterialObj = {
      id: tempId,
      nameEn: newMaterial.nameEn,
      nameEs: newMaterial.nameEs,
      multiplier: parseFloat(newMaterial.multiplier),
      isTemporary: true // Flag to indicate this hasn't been saved to database yet
    };
    
    const updatedMaterials = [...materialMultipliers, newMaterialObj];
    setMaterialMultipliers(updatedMaterials);
    setNewMaterial({ nameEn: '', nameEs: '', multiplier: 1.0 });
    setShowMaterialForm(false);
    markSectionChanged('materials');
    
    // Update shared context and notify other components
    updateSharedMaterials(updatedMaterials);
    refreshPricing();
  };

  const handleUpdateMaterial = () => {
    if (!editingMaterial || !editingMaterial.nameEn || !editingMaterial.nameEs || editingMaterial.multiplier <= 0) {
      alert('Please enter valid values');
      return;
    }
    
    const updated = materialMultipliers.map(material => 
      material.id === editingMaterial.id 
        ? {
            ...material,
            nameEn: editingMaterial.nameEn,
            nameEs: editingMaterial.nameEs,
            multiplier: parseFloat(editingMaterial.multiplier)
          }
        : material
    );
    
    setMaterialMultipliers(updated);
    setEditingMaterial(null);
    markSectionChanged('materials');
    
    // Update shared context and notify other components
    updateSharedMaterials(updated);
    refreshPricing();
  };

  const handleDeleteMaterial = (materialId, materialName) => {
    if (window.confirm(`Delete ${materialName} material?`)) {
      const updated = materialMultipliers.filter(material => material.id !== materialId);
      setMaterialMultipliers(updated);
      markSectionChanged('materials');
      
      // Update shared context and notify other components
      updateSharedMaterials(updated);
      refreshPricing();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="text-green-600" size={20} />
          Material Multipliers
        </h3>
        <button
          onClick={() => setShowMaterialForm(!showMaterialForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <Plus size={16} />
          Add Material
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Material multipliers affect the base cabinet prices. A multiplier of 1.5 means the material costs 50% more than the base price.
      </p>

      {/* Add Material Form */}
      {showMaterialForm && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h4 className="text-md font-medium mb-3 text-green-800">Add New Material (Bilingual)</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="English Name"
              value={newMaterial.nameEn}
              onChange={(e) => setNewMaterial({ ...newMaterial, nameEn: e.target.value })}
              className="p-2 border rounded focus:border-green-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Spanish Name (Nombre en Español)"
              value={newMaterial.nameEs}
              onChange={(e) => setNewMaterial({ ...newMaterial, nameEs: e.target.value })}
              className="p-2 border rounded focus:border-green-500 focus:outline-none"
            />
            <input
              type="number"
              placeholder="Price Multiplier"
              value={newMaterial.multiplier}
              onChange={(e) => setNewMaterial({ ...newMaterial, multiplier: parseFloat(e.target.value) || 1.0 })}
              className="p-2 border rounded focus:border-green-500 focus:outline-none"
              min="0.1"
              step="0.1"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleAddMaterial}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add Material
            </button>
            <button
              onClick={() => {
                setShowMaterialForm(false);
                setNewMaterial({ nameEn: '', nameEs: '', multiplier: 1.0 });
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Materials List */}
      <div className="space-y-2">
        {Array.isArray(materialMultipliers) ? materialMultipliers.map((material) => (
          <div key={material.id || `${material.nameEn}-${material.nameEs}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded">
            {editingMaterial?.id === material.id ? (
              <>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    placeholder="English name"
                    value={editingMaterial?.nameEn || ''}
                    onChange={(e) => {
                      editingMaterial && setEditingMaterial({ ...editingMaterial, nameEn: e.target.value });
                    }}
                    className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Spanish name"
                    value={editingMaterial?.nameEs || ''}
                    onChange={(e) => {
                      editingMaterial && setEditingMaterial({ ...editingMaterial, nameEs: e.target.value });
                    }}
                    className="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <input
                  type="number"
                  placeholder="Multiplier"
                  value={editingMaterial?.multiplier || ''}
                  onChange={(e) => {
                    editingMaterial && setEditingMaterial({ ...editingMaterial, multiplier: parseFloat(e.target.value) });
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
                <div className="flex-1">
                  <div className="flex items-center">
                    <span className="font-medium">{material.nameEn}</span>
                    {material.isTemporary && (
                      <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                        Unsaved
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{material.nameEs}</div>
                </div>
                <span className="text-gray-600">×{material.multiplier}</span>
                <button
                  onClick={() => {
                    const editData = {
                      id: material.id,
                      nameEn: material.nameEn,
                      nameEs: material.nameEs,
                      multiplier: material.multiplier,
                      isTemporary: material.isTemporary
                    };
                    setEditingMaterial(editData);
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDeleteMaterial(material.id, material.nameEn)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        )) : (
          <div className="text-gray-500 text-center py-4">
            No materials configured yet.
          </div>
        )}
      </div>
      
      {/* Section Save Button for Materials */}
      <SectionSaveButton sectionKey="materials" />
    </div>
  );
};

export default MaterialMultipliers;