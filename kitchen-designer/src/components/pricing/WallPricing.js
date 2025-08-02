import React from 'react';

const WallPricing = ({ 
  wallPricing, 
  setWallPricing, 
  markSectionChanged, 
  SectionSaveButton 
}) => {
  const handleWallPriceChange = (type, newValue) => {
    if (newValue < 0) {
      alert('Wall pricing cannot be negative. Please enter a positive value.');
      return;
    }
    setWallPricing({ ...wallPricing, [type]: newValue || 0 });
    markSectionChanged('walls');
  };

  return (
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
              onChange={(e) => handleWallPriceChange('addWall', parseFloat(e.target.value))}
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
              onChange={(e) => handleWallPriceChange('removeWall', parseFloat(e.target.value))}
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
      
      {/* Section Save Button for Wall Pricing */}
      <SectionSaveButton sectionKey="walls" />
    </div>
  );
};

export default WallPricing;