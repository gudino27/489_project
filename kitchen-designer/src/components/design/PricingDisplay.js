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
  if (!isVisible) return null;

  const hasCabinets = currentRoomData.elements.some(
    (el) => el.category === "cabinet"
  );

  // Compute base cabinet-only price (ignore color and wall mods)
  const baseCabinetPrice = hasCabinets
    ? calculateTotalPrice({
        ...currentRoomData,
        removedWalls: [],
        walls: currentRoomData.originalWalls || [1, 2, 3, 4],
        colorCount: 1,
      })
    : 0;

  // Color upcharge only applies when cabinets exist
  const colorCharge = hasCabinets ? (colorPricing[currentRoomData.colorCount] || 0) : 0;

  // Compute wall modification costs (always shown if > 0)
  const removedWalls = currentRoomData.removedWalls || [];
  const chargeableRemoved = removedWalls.filter((wall) => originalWalls.includes(wall));
  const customAdded = (currentRoomData.walls || []).filter((wall) => !originalWalls.includes(wall));
  const totalWallCost = (chargeableRemoved.length * wallPricing.removeWall) + (customAdded.length * wallPricing.addWall);

  const totalEstimate = Math.max(0, baseCabinetPrice + colorCharge + totalWallCost);

  return (
    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
      <h3 className="font-semibold mb-3">Pricing Summary - {activeRoom === 'kitchen' ? 'Kitchen' : 'Bathroom'}</h3>
      <div className="space-y-2 text-sm">
        {!hasCabinets && (
          <p className="text-xs text-gray-600">No cabinets placed yet — add cabinets to see pricing.</p>
        )}
        {/* Base cabinet pricing */}
        <div className="flex justify-between">
          <span>Base Cabinet Price:</span>
          <span>${baseCabinetPrice.toFixed(2)}</span>
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
            disabled={!hasCabinets}
          >
            <option value={1}>Single Color (Included)</option>
            <option value={2}>Two Colors (+$100)</option>
            <option value={3}>Three Colors (+$200)</option>
            <option value="custom">Custom Colors (+$500)</option>
          </select>
        </div>

        {/* Wall modification pricing */}
        {totalWallCost > 0 && (
          <div className="flex justify-between">
            <span>Wall Modifications:</span>
            <span>${totalWallCost.toFixed(2)}</span>
          </div>
        )}

        {/* Total price display */}
        <div className="border-t pt-2 font-semibold flex justify-between">
          <span>Total Estimate:</span>
          <span>${totalEstimate.toFixed(2)}</span>
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