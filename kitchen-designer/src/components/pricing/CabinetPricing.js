import React, { useState } from 'react';
import { DollarSign, Home, Bath } from 'lucide-react';

const CabinetPricing = ({ 
  basePrices, 
  setBasePrices, 
  markSectionChanged, 
  SectionSaveButton 
}) => {
  const [activeTab, setActiveTab] = useState('kitchen');

  // Helper function to get kitchen cabinet types
  const getKitchenCabinets = () => {
    const kitchenTypes = [
      'base', 'sink-base', 'wall', 'tall', 'corner', 'drawer-base', 
      'double-drawer-base', 'glass-wall', 'open-shelf', 'island-base', 
      'peninsula-base', 'pantry', 'corner-wall', 'lazy-susan', 
      'blind-corner', 'appliance-garage', 'wine-rack', 'spice-rack', 
      'tray-divider', 'pull-out-drawer', 'soft-close-drawer', 'under-cabinet-lighting'
    ];
     
    return Object.entries(basePrices).filter(([type]) => kitchenTypes.includes(type));
  };

  // Helper function to get bathroom cabinet types  
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

  const handlePriceChange = (type, newValue) => {
    if (newValue < 0) {
      alert('Price cannot be negative. Please enter a positive value.');
      return;
    }
    setBasePrices({ ...basePrices, [type]: newValue || 0 });
    markSectionChanged('cabinets');
  };

  const handlePriceBlur = (type, value) => {
    if (value < 0) {
      alert('Price cannot be negative. Resetting to 0.');
      setBasePrices({ ...basePrices, [type]: 0 });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <DollarSign className="text-blue-600" size={20} />
        Cabinet & Fixture Pricing
      </h3>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab('kitchen')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition ${
            activeTab === 'kitchen'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Home size={16} />
            Kitchen
          </div>
        </button>
        <button
          onClick={() => setActiveTab('bathroom')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition ${
            activeTab === 'bathroom'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-700 hover:text-gray-900'
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            <Bath size={16} />
            Bathroom
          </div>
        </button>
      </div>

      {/* Kitchen Tab */}
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
                    onChange={(e) => handlePriceChange(type, parseFloat(e.target.value))}
                    onBlur={(e) => handlePriceBlur(type, parseFloat(e.target.value))}
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

      {/* Bathroom Tab */}
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
                    onChange={(e) => handlePriceChange(type, parseFloat(e.target.value))}
                    onBlur={(e) => handlePriceBlur(type, parseFloat(e.target.value))}
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
      
      {/* Section Save Button for Cabinets */}
      <SectionSaveButton sectionKey="cabinets" />
    </div>
  );
};

export default CabinetPricing;