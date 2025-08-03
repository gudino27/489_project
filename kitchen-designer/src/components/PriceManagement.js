import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Save,
  Check
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { usePricing } from '../contexts/PricingContext';

// Import modular pricing components
import CabinetPricing from './pricing/CabinetPricing';
import MaterialMultipliers from './pricing/MaterialMultipliers';
import ColorPricing from './pricing/ColorPricing';
import WallPricing from './pricing/WallPricing';
import WallAvailability from './pricing/WallAvailability';
import { SectionSaveButton, createSectionHelpers } from './pricing/PricingUtils';

const PriceManagement = ({ token, API_BASE, userRole }) => {
  // Language context
  const { t } = useLanguage();

  // Shared pricing context
  const { refreshPricing, setMaterialMultipliers: setSharedMaterialMultipliers } = usePricing();

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

  const [materialMultipliers, setMaterialMultipliers] = useState([]);

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


  // Section-specific unsaved changes tracking
  const [sectionChanges, setSectionChanges] = useState({
    cabinets: false,
    materials: false,
    colors: false,
    walls: false,
    wallAvailability: false
  });

  // Global state for save functionality
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // Create section helper functions using the utility
  const { markSectionChanged, markSectionSaved, clearAllSectionChanges } = createSectionHelpers(
    setSectionChanges,
    setHasUnsavedChanges
  );

  // Helper function to update shared context with converted material format
  const updateSharedMaterials = (materialsArray) => {
    const materialObject = {};
    materialsArray.forEach(material => {
      materialObject[material.nameEn.toLowerCase()] = material.multiplier;
    });
    setSharedMaterialMultipliers(materialObject);
  };

  // Materials will be saved to database when "Save Changes" is clicked
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

        if (materialData) {
          // Handle both old object format and new array format
          if (Array.isArray(materialData)) {
            setMaterialMultipliers(materialData);
          } else if (typeof materialData === 'object' && Object.keys(materialData).length > 0) {
            // Convert old format to new format
            const converted = Object.entries(materialData).map(([key, multiplier], index) => ({
              id: index + 1,
              nameEn: key.charAt(0).toUpperCase() + key.slice(1),
              nameEs: key === 'laminate' ? 'Laminado' : key === 'wood' ? 'Madera' : key === 'plywood' ? 'Madera Contrachapada' : key === 'maple' ? 'Arce' : key,
              multiplier: parseFloat(multiplier)
            }));
            setMaterialMultipliers(converted);
          }
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

        // Clear all section changes
        clearAllSectionChanges();

        // Remove "Unsaved" status from all materials after successful save
        setMaterialMultipliers(prev => prev.map(material => ({
          ...material,
          isTemporary: false
        })));

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

  // Create SectionSaveButton with the necessary props
  const SectionSaveButtonWithProps = ({ sectionKey, className = "" }) => (
    <SectionSaveButton
      sectionKey={sectionKey}
      sectionChanges={sectionChanges}
      saveStatus={saveStatus}
      onSave={savePriceChanges}
      className={className}
    />
  );



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

      {/* Cabinet & Fixture Pricing */}
      <CabinetPricing
        basePrices={basePrices}
        setBasePrices={setBasePrices}
        markSectionChanged={markSectionChanged}
        SectionSaveButton={SectionSaveButtonWithProps}
      />

      {/* Material Multipliers */}
      <MaterialMultipliers
        materialMultipliers={materialMultipliers}
        setMaterialMultipliers={setMaterialMultipliers}
        markSectionChanged={markSectionChanged}
        updateSharedMaterials={updateSharedMaterials}
        refreshPricing={refreshPricing}
        SectionSaveButton={SectionSaveButtonWithProps}
      />

      {/* Color Pricing */}
      <ColorPricing
        colorPricing={colorPricing}
        setColorPricing={setColorPricing}
        markSectionChanged={markSectionChanged}
        SectionSaveButton={SectionSaveButtonWithProps}
      />

      {/* Wall Pricing */}
      <WallPricing
        wallPricing={wallPricing}
        setWallPricing={setWallPricing}
        markSectionChanged={markSectionChanged}
        SectionSaveButton={SectionSaveButtonWithProps}
      />

      {/* Wall Service Availability Controls - Super Admin Only */}
      <WallAvailability
        wallAvailability={wallAvailability}
        setWallAvailability={setWallAvailability}
        markSectionChanged={markSectionChanged}
        userRole={userRole}
        SectionSaveButton={SectionSaveButtonWithProps}
      />

      {/* Global Save Button - appears when any section has changes */}
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