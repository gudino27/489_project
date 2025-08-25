import React from 'react';

const PricingDisplay = ({
  isVisible,
  activeRoom,
  currentRoomData,
  setCurrentRoomData,
  calculateTotalPrice,
  colorPricing,
  wallPricing,
  originalWalls
}) => {
  if (!isVisible || !currentRoomData.elements.some(el => el.category === 'cabinet')) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
      <h3 className="font-semibold mb-3">Pricing Summary - {activeRoom === 'kitchen' ? 'Kitchen' : 'Bathroom'}</h3>
      <div className="space-y-2 text-sm">
        {/* Base cabinet pricing */}
        <div className="flex justify-between">
          <span>Base Cabinet Price:</span>
          <span>${(calculateTotalPrice() - (colorPricing[currentRoomData.colorCount] || 0) -
            ((currentRoomData.removedWalls || []).length * wallPricing.removeWall)).toFixed(2)}</span>
        </div>

        {/* Color options selector */}
        <div className="flex justify-between">
          <span>Color Options:</span>
          <select
            value={currentRoomData.colorCount}
            onChange={(e) => setCurrentRoomData({
              ...currentRoomData,
              colorCount: e.target.value
            })}
            className="px-2 py-1 border rounded text-xs bg-white"
          >
            <option value={1}>Single Color (Included)</option>
            <option value={2}>Two Colors (+$100)</option>
            <option value={3}>Three Colors (+$200)</option>
            <option value="custom">Custom Colors (+$500)</option>
          </select>
        </div>

        {/* Wall modification pricing */}
        {(() => {
          const removedWalls = currentRoomData.removedWalls || [];
          const chargeableRemoved = removedWalls.filter(wall => originalWalls.includes(wall));
          const customAdded = (currentRoomData.walls || []).filter(wall => !originalWalls.includes(wall));
          const totalWallCost = (chargeableRemoved.length * wallPricing.removeWall) + (customAdded.length * wallPricing.addWall);

          return totalWallCost > 0 ? (
            <div className="flex justify-between">
              <span>Wall Modifications:</span>
              <span>${totalWallCost.toFixed(2)}</span>
            </div>
          ) : null;
        })()}

        {/* Total price display */}
        <div className="border-t pt-2 font-semibold flex justify-between">
          <span>Total Estimate:</span>
          <span>${calculateTotalPrice().toFixed(2)}</span>
        </div>

        {/* Pricing disclaimer */}
        <p className="text-xs text-gray-600 mt-2">
          * This is an estimate. Final pricing may vary based on specific requirements.
        </p>
      </div>
    </div>
  );
};

export default PricingDisplay;