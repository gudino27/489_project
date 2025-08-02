import React from 'react';

const WallAvailability = ({ 
  wallAvailability, 
  setWallAvailability, 
  markSectionChanged, 
  userRole,
  SectionSaveButton 
}) => {
  const handleAvailabilityChange = (type, newStatus) => {
    setWallAvailability({ ...wallAvailability, [type]: newStatus });
    markSectionChanged('wallAvailability');
  };

  // Only show this component for super admins
  if (userRole !== 'super_admin') {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border-l-4 border-blue-500">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-blue-700">
        <div className="w-5 h-5 bg-blue-500 rounded" />
        Wall Service Availability
      </h3>
      
      <p className="text-sm text-gray-600 mb-4">
        Control which wall modification services are available to customers.
      </p>
      
      <div className="space-y-4">
        {/* Add Wall Service */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-medium text-blue-900">Add Wall Opening Service</h4>
              <p className="text-xs text-blue-700 mt-1">
                Allow customers to request adding openings/pass-throughs between rooms
              </p>
            </div>
            <button
              onClick={() => handleAvailabilityChange('addWallEnabled', !wallAvailability.addWallEnabled)}
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
              <h4 className="text-sm font-medium text-blue-900">Remove Wall Service</h4>
              <p className="text-xs text-blue-700 mt-1">
                Allow customers to request full wall removal for open concept designs
              </p>
            </div>
            <button
              onClick={() => handleAvailabilityChange('removeWallEnabled', !wallAvailability.removeWallEnabled)}
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
      
      {/* Section Save Button for Wall Availability */}
      <SectionSaveButton sectionKey="wallAvailability" />
    </div>
  );
};

export default WallAvailability;