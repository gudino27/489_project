import React from 'react';

const ColorPricing = ({ 
  colorPricing, 
  setColorPricing, 
  markSectionChanged, 
  SectionSaveButton 
}) => {
  const handleColorPriceChange = (count, newValue) => {
    if (newValue < 0) {
      alert('Color pricing cannot be negative. Please enter a positive value.');
      return;
    }
    setColorPricing({ ...colorPricing, [count]: newValue || 0 });
    markSectionChanged('colors');
  };

  const getColorLabel = (count) => {
    switch (count) {
      case '1': return 'Standard (1 Color)';
      case '2': return 'Two-Tone (2 Colors)';
      case '3': return 'Multi-Color (3+ Colors)';
      case 'custom': return 'Custom Colors';
      default: return `${count} Colors`;
    }
  };

  const getColorDescription = (count) => {
    switch (count) {
      case '1': return 'Single color finish - no additional charge';
      case '2': return 'Two different colors/finishes';
      case '3': return 'Three or more colors/finishes';
      case 'custom': return 'Special custom color matching';
      default: return '';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded" />
        Color Pricing
      </h3>
      
      <p className="text-sm text-gray-600 mb-4">
        Set additional charges for color upgrades. Standard single-color finish is usually included in base price.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(colorPricing).map(([count, price]) => (
          <div key={count} className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <label className="flex-1 text-sm font-medium">
                {getColorLabel(count)}:
              </label>
            </div>
            {getColorDescription(count) && (
              <p className="text-xs text-gray-500 mb-3">
                {getColorDescription(count)}
              </p>
            )}
            <div className="flex items-center">
              <span className="text-gray-500 mr-1">$</span>
              <input
                type="number"
                value={price}
                onChange={(e) => handleColorPriceChange(count, parseFloat(e.target.value))}
                className="w-24 p-2 border rounded focus:border-blue-500 focus:outline-none"
                min="0"
                step="10"
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Color Pricing Examples:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Standard:</strong> Natural wood finish - included in base price</li>
          <li>• <strong>Two-Tone:</strong> Different color for island vs. perimeter cabinets</li>
          <li>• <strong>Multi-Color:</strong> Multiple accent colors or special finishes</li>
          <li>• <strong>Custom:</strong> Color matching to specific paint samples or unique finishes</li>
        </ul>
      </div>
      
      {/* Section Save Button for Colors */}
      <SectionSaveButton sectionKey="colors" />
    </div>
  );
};

export default ColorPricing;