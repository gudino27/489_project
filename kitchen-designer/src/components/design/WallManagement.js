import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const WallManagement = ({
  wallAvailability,
  collapsedSections,
  toggleSection,
  isDrawingWall,
  toggleWallDrawingMode,
  isDoorMode,
  toggleDoorMode,
  doorModeType,
  setDoorModeType,
  allAvailableWalls,
  currentRoomData,
  getWallName,
  wallPricing,
  addWall,
  removeWall,
  customWalls,
  originalWalls,
  setCurrentRoomData,
  wallRemovalDisabled,
  getCustomWallByNumber,
  markWallAsExistedPrior,
  getCurrentWallAngle,
  rotateCustomWall,
  wallDrawStart,
  setIsDrawingWall,
  setWallDrawStart,
  setWallDrawPreview,
  addDoor,
  removeDoor,
  updateDoor,
  getDoorsOnWall,
  getDoorTypes
}) => {
  const { t } = useLanguage();

  if (!wallAvailability.addWallEnabled && !wallAvailability.removeWallEnabled) {
    return null;
  }

  return (
    <div className="mb-6 border-t pt-4">
      <div className="mb-3">
        <button
          onClick={() => toggleSection('wallManagement')}
          className="flex items-center gap-2 text-sm font-semibold hover:text-blue-600 mb-2"
        >
          <span className={`transform transition-transform ${collapsedSections.wallManagement ? 'rotate-0' : 'rotate-90'}`}>
            ▶
          </span>
          {t('walls.title')}
        </button>

        {/* Wall Management Buttons */}
        {wallAvailability.addWallEnabled && (
          <div className="flex justify-center">
            <button
              onClick={toggleWallDrawingMode}
              className={`text-sm px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${isDrawingWall
                  ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'
                  : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg'
                }`}
              title={isDrawingWall ? "Exit wall drawing mode" : "Draw custom wall"}
            >
              {isDrawingWall ? '✏️ Exit Drawing Mode' : '✏️ Draw Wall'}
            </button>
          </div>
        )}
      </div>

      {!collapsedSections.wallManagement && (
        <>
          {isDrawingWall && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-sm font-medium text-orange-800 mb-2">✏️ Wall Drawing Mode Active</div>
              <div className="text-xs text-orange-700">
                {wallDrawStart ?
                  <><strong>Step 2:</strong> Click to place the end point of your wall. Red dashed line shows preview.</> :
                  <><strong>Step 1:</strong> Click on the floor plan to place the start point of your wall.</>
                }
                <br /> Custom walls are charged at <strong>${wallPricing.addWall}</strong> each.
              </div>
              <button
                onClick={() => {
                  setIsDrawingWall(false);
                  setWallDrawStart(null);
                  setWallDrawPreview(null);
                }}
                className="mt-2 text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Cancel Drawing
              </button>
            </div>
          )}

          {/* Wall Status Grid */}
          <div className="space-y-2 mb-4">
            {allAvailableWalls.filter(wallNum => {
              // Show original walls (1-4) always
              if (wallNum <= 4) return true;
              // For custom walls, only show if they exist in customWalls array AND are either present or removed but were originally added
              const customWall = getCustomWallByNumber(wallNum);
              if (customWall) return true;
              // Don't show custom wall numbers that no longer have corresponding wall objects
              return false;
            }).map(wallNum => {
              const isPresent = (currentRoomData.walls || [1, 2, 3, 4]).includes(wallNum);
              const isRemoved = (currentRoomData.removedWalls || []).includes(wallNum);
              const customWall = getCustomWallByNumber(wallNum);
              const isCustom = !!customWall;
              const existedPrior = customWall?.existedPrior || false;

              return (
                <div key={wallNum} className="p-2 bg-gray-50 rounded border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">
                      {getWallName(wallNum)}
                      {isCustom && <span className="text-purple-600"> (Custom)</span>}
                    </span>
                    <span className={`text-xs px-1 rounded ${isPresent ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {isPresent ? 'Present' : 'Removed'}
                    </span>
                  </div>

                  <div className="flex gap-1">
                    {!isPresent && (
                      <div className="flex gap-1 w-full">
                        {wallAvailability.addWallEnabled && (
                          <button
                            onClick={() => addWall(wallNum)}
                            className="flex-1 text-xs py-1 px-2 bg-green-500 text-white rounded hover:bg-green-600"
                            title={`Add ${getWallName(wallNum)} (+$${wallPricing.addWall})`}
                          >
                            Add
                          </button>
                        )}
                        {!wallAvailability.addWallEnabled && (
                          <div className="flex-1 text-xs py-1 px-2 bg-gray-300 text-gray-500 rounded text-center">
                            Service Disabled
                          </div>
                        )}
                        {/* For custom walls that are removed, also show delete option */}
                        {isCustom && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Permanently delete ${getWallName(wallNum)}? This cannot be undone.`)) {
                                const updatedCustomWalls = customWalls.filter(w => w.wallNumber !== wallNum);
                                const updatedCurrentWalls = currentRoomData.walls.filter(w => w !== wallNum);
                                const updatedAvailableWalls = allAvailableWalls.filter(w => w !== wallNum);
                                const updatedOriginalWalls = originalWalls.filter(w => w !== wallNum);
                                const updatedRemovedWalls = (currentRoomData.removedWalls || []).filter(w => w !== wallNum);

                                //console.log('Deleting removed custom wall from status grid:', wallNum);

                                setCurrentRoomData({
                                  ...currentRoomData,
                                  customWalls: updatedCustomWalls,
                                  walls: updatedCurrentWalls,
                                  allAvailableWalls: updatedAvailableWalls,
                                  originalWalls: updatedOriginalWalls,
                                  removedWalls: updatedRemovedWalls
                                });
                              }
                            }}
                            className="text-xs py-1 px-2 rounded bg-red-600 text-white hover:bg-red-700"
                            title={`Permanently delete ${getWallName(wallNum)}`}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    )}
                    {isPresent && (
                      <>
                        {/* For custom walls, show Delete button instead of Remove */}
                        {isCustom ? (
                          <button
                            onClick={() => {
                              if (window.confirm(`Permanently delete ${getWallName(wallNum)}? This cannot be undone.`)) {
                                const updatedCustomWalls = customWalls.filter(w => w.wallNumber !== wallNum);
                                const updatedCurrentWalls = currentRoomData.walls.filter(w => w !== wallNum);
                                const updatedAvailableWalls = allAvailableWalls.filter(w => w !== wallNum);
                                const updatedOriginalWalls = originalWalls.filter(w => w !== wallNum);
                                const updatedRemovedWalls = (currentRoomData.removedWalls || []).filter(w => w !== wallNum);

                                //console.log('Deleting custom wall from status grid:', wallNum);

                                setCurrentRoomData({
                                  ...currentRoomData,
                                  customWalls: updatedCustomWalls,
                                  walls: updatedCurrentWalls,
                                  allAvailableWalls: updatedAvailableWalls,
                                  originalWalls: updatedOriginalWalls,
                                  removedWalls: updatedRemovedWalls
                                });
                              }
                            }}
                            className="flex-1 text-xs py-1 px-2 rounded bg-red-600 text-white hover:bg-red-700"
                            title={`Permanently delete ${getWallName(wallNum)}`}
                          >
                            Delete
                          </button>
                        ) : (
                          <button
                            onClick={() => removeWall(wallNum)}
                            disabled={wallRemovalDisabled || !wallAvailability.removeWallEnabled}
                            className={`flex-1 text-xs py-1 px-2 rounded ${wallRemovalDisabled || !wallAvailability.removeWallEnabled
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-red-500 text-white hover:bg-red-600'
                              }`}
                            title={wallRemovalDisabled ? "Wall removal temporarily disabled" :
                              !wallAvailability.removeWallEnabled ? "Wall removal service disabled" :
                                `Remove ${getWallName(wallNum)} (+$${wallPricing.removeWall})`}
                          >
                            Remove
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Door Controls for Present Walls */}
                  {isPresent && (
                    <div className="mt-2 space-y-2">
                      {/* Existing doors on this wall */}
                      {getDoorsOnWall(wallNum).map(door => (
                        <div key={door.id} className="p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-blue-800">
                              {door.type.charAt(0).toUpperCase() + door.type.slice(1)} Door ({door.width}")
                            </span>
                            <button
                              onClick={() => {
                                if (window.confirm('Remove this door?')) {
                                  removeDoor(door.id);
                                }
                              }}
                              className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                              title="Remove door"
                            >
                              ✕
                            </button>
                          </div>

                          {/* Position slider */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-blue-700 w-12">Pos:</span>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={door.position}
                                onChange={(e) => updateDoor(door.id, { position: parseFloat(e.target.value) })}
                                className="flex-1 h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                                style={{
                                  background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${door.position}%, #E5E7EB ${door.position}%, #E5E7EB 100%)`
                                }}
                              />
                              <span className="text-xs text-blue-700 w-8">{Math.round(door.position)}%</span>
                            </div>

                            {/* Width input */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-blue-700 w-12">Width:</span>
                              <input
                                type="number"
                                min="18"
                                max="48"
                                value={door.width}
                                onChange={(e) => {
                                  const newWidth = parseFloat(e.target.value);
                                  if (newWidth >= 18 && newWidth <= 48) {
                                    updateDoor(door.id, { width: newWidth });
                                  }
                                }}
                                className="flex-1 px-2 py-1 text-xs border border-blue-300 rounded focus:border-blue-500 focus:outline-none"
                                placeholder="Width"
                              />
                              <span className="text-xs text-blue-700">inches</span>
                            </div>

                            {/* Door type dropdown */}
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-blue-700 w-12">Type:</span>
                              <select
                                value={door.type}
                                onChange={(e) => updateDoor(door.id, { type: e.target.value })}
                                className="flex-1 px-2 py-1 text-xs border border-blue-300 rounded focus:border-blue-500 focus:outline-none"
                              >
                                <option value="room">Room Door</option>
                                <option value="standard">Standard Door</option>
                                <option value="pantry">Pantry Door</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add door controls */}
                      <div className="p-2 bg-green-50 rounded border border-green-200">
                        <div className="text-xs font-medium text-green-800 mb-2">Add New Door</div>

                        <div className="space-y-2">
                          {/* Door type dropdown */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-green-700 w-12">Type:</span>
                            <select
                              id={`door-type-${wallNum}`}
                              defaultValue="room"
                              className="flex-1 px-2 py-1 text-xs border border-green-300 rounded focus:border-green-500 focus:outline-none"
                            >
                              <option value="room">Room Door</option>
                              <option value="standard">Standard Door</option>
                              <option value="pantry">Pantry Door</option>
                            </select>
                          </div>

                          {/* Door width input */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-green-700 w-12">Width:</span>
                            <input
                              type="number"
                              id={`door-width-${wallNum}`}
                              min="18"
                              max="48"
                              defaultValue="36"
                              className="flex-1 px-2 py-1 text-xs border border-green-300 rounded focus:border-green-500 focus:outline-none"
                              placeholder="Width"
                            />
                            <span className="text-xs text-green-700">inches</span>
                          </div>

                          {/* Add button */}
                          <button
                            onClick={() => {
                              const typeSelect = document.getElementById(`door-type-${wallNum}`);
                              const widthInput = document.getElementById(`door-width-${wallNum}`);
                              const doorType = typeSelect.value;
                              const width = parseFloat(widthInput.value) || 36;
                              const position = 50; // Default center position

                              if (width >= 18 && width <= 48) {
                                addDoor(wallNum, position, width, doorType);
                                // Reset form
                                typeSelect.value = 'room';
                                widthInput.value = '36';
                              } else {
                                alert('Door width must be between 18 and 48 inches');
                              }
                            }}
                            className="w-full text-xs py-1 px-2 bg-green-500 text-white rounded hover:bg-green-600"
                            title={`Add door to ${getWallName(wallNum)}`}
                          >
                            🚪 Add Door
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Custom wall options */}
                  {isCustom && isPresent && (
                    <div className="mt-2 space-y-1">
                      <button
                        onClick={() => {
                          if (existedPrior) {
                            // Remove from existed prior
                            const updatedCustomWalls = customWalls.map(wall =>
                              wall.wallNumber === wallNum
                                ? { ...wall, existedPrior: false }
                                : wall
                            );
                            const updatedOriginalWalls = originalWalls.filter(w => w !== wallNum);
                            setCurrentRoomData({
                              ...currentRoomData,
                              customWalls: updatedCustomWalls,
                              originalWalls: updatedOriginalWalls
                            });
                          } else {
                            markWallAsExistedPrior(wallNum);
                          }
                        }}
                        className={`text-xs py-1 px-2 rounded w-full ${existedPrior
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-yellow-500 text-white hover:bg-yellow-600'
                          }`}
                        title={existedPrior ? "Click to unmark as existed prior" : "Mark this wall as existed before modifications"}
                      >
                        {existedPrior ? '✓ Existed Prior (click to unmark)' : 'Mark as Existed Prior'}
                      </button>

                      <div className="space-y-1">
                        <div className="text-xs text-gray-600">Rotation: {getCurrentWallAngle(wallNum).toFixed(1)}°</div>
                        <div className="flex gap-1">
                          <input
                            type="number"
                            min="-180"
                            max="180"
                            step="1"
                            value={Math.round(getCurrentWallAngle(wallNum))}
                            onChange={(e) => {
                              const newAngle = parseFloat(e.target.value) || 0;
                              rotateCustomWall(wallNum, newAngle);
                            }}
                            className="flex-1 text-xs px-1 py-1 border rounded"
                            placeholder="Angle"
                          />
                          <button
                            onClick={() => rotateCustomWall(wallNum, getCurrentWallAngle(wallNum) + 15)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                          >
                            +15°
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>


          {/* Wall modification cost summary */}
          {(currentRoomData.removedWalls?.length > 0 ||
            (currentRoomData.walls || []).some(wall => !originalWalls.includes(wall))) && (
              <div className="text-xs bg-yellow-50 border border-yellow-200 rounded p-2">
                <div className="font-medium text-yellow-800">Wall Modifications:</div>
                <div className="text-yellow-700">
                  {(() => {
                    const removedWalls = currentRoomData.removedWalls || [];
                    const chargeableRemoved = removedWalls.filter(wall => originalWalls.includes(wall));
                    const customAdded = (currentRoomData.walls || []).filter(wall => !originalWalls.includes(wall));

                    return (
                      <>
                        {chargeableRemoved.length > 0 && (
                          <div>{chargeableRemoved.length} original wall(s) removed: +${(chargeableRemoved.length * wallPricing.removeWall).toFixed(2)}</div>
                        )}
                        {customAdded.length > 0 && (
                          <div>{customAdded.length} custom wall(s) added: +${(customAdded.length * wallPricing.addWall).toFixed(2)}</div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
        </>
      )}
    </div>
  );
};

export default WallManagement;