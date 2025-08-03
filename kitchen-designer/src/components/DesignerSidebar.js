import React from 'react';
import {
  RotateCw,
  Trash2,
  Calculator,
  Send,
  Home,
  Bath,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import WallManagement from './WallManagement';
import { useLanguage } from '../contexts/LanguageContext';

const DesignerSidebar = ({
  // UI State
  sidebarCollapsed,
  setSidebarCollapsed,
  activeRoom,
  switchRoom,
  viewMode,
  setViewMode,
  
  // Design Data
  currentRoomData,
  setCurrentRoomData,
  selectedElement,
  elementTypes,
  
  // Pricing
  showPricing,
  setShowPricing,
  calculateTotalPrice,
  basePrices,
  materialMultipliers,
  colorPricing,
  wallPricing,
  wallAvailability,
  
  // Actions
  addElement,
  updateElement,
  deleteElement,
  setShowQuoteForm,
  
  // Wall/Elements
  allAvailableWalls,
  selectedWall,
  setSelectedWall,
  getWallName,
  getCustomWallByNumber,
  
  // Wall Management
  isDrawingWall,
  setIsDrawingWall,
  wallDrawStart,
  setWallDrawStart,
  setWallDrawPreview,
  toggleWallDrawingMode,
  isDoorMode,
  toggleDoorMode,
  doorModeType,
  setDoorModeType,
  customWalls,
  wallRemovalDisabled,
  addWall,
  removeWall,
  markWallAsExistedPrior,
  getCurrentWallAngle,
  addDoor,
  removeDoor,
  updateDoor,
  getDoorsOnWall,
  getDoorTypes,
  
  // Additional state needed
  collapsedSections,
  toggleSection,
  rotateElement,
  rotateCornerCabinet,
  resetDesign,
  originalWalls
}) => {
  const { t } = useLanguage();

  return (
    <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} bg-white shadow-lg ${sidebarCollapsed ? 'p-2 pt-20' : 'p-6'} overflow-y-auto transition-all duration-300 ease-in-out relative`}>
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={`absolute ${sidebarCollapsed ? 'top-2 left-2' : 'top-4 right-4'} z-10 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-all duration-300 ease-in-out`}
        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      {/* Collapsed Sidebar Indicators */}
      {sidebarCollapsed && (
        <div className="flex flex-col items-center mt-12 space-y-4">
          {/* Language selector for collapsed sidebar */}
          <div className="w-full px-2">
            <LanguageSelector className="w-full" />
          </div>
          <button
            onClick={() => setShowPricing(!showPricing)}
            className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
            title={t('pricing.title')}
          >
            <Calculator size={20} />
          </button>
          <button
            onClick={() => setShowQuoteForm(true)}
            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
            title="Send Quote"
          >
            <Send size={20} />
          </button>
          <button
            onClick={() => setViewMode(viewMode === 'floor' ? 'wall' : 'floor')}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title={`Switch to ${viewMode === 'floor' ? 'Wall' : 'Floor'} View`}
          >
            {viewMode === 'floor' ? '🏠' : '🧱'}
          </button>
        </div>
      )}

      {/* Sidebar Content - Hidden when collapsed */}
      <div className={`${sidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300 ease-in-out`}>
        {/* Header with title and language selector */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {activeRoom === 'kitchen' ? t('designer.title') : t('designer.bathroomTitle')}
          </h2>
          <LanguageSelector />
        </div>

        {/* Room Switcher */}
        <div className="mb-6 bg-gray-50 p-3 rounded-lg">
          <div className="flex gap-2">
            <button
              onClick={() => switchRoom('kitchen')}
              className={`flex-1 p-2 rounded flex items-center justify-center gap-1 text-sm ${activeRoom === 'kitchen' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            >
              <Home size={16} />
              {t('designer.kitchen', 'Kitchen')}
            </button>
            <button
              onClick={() => switchRoom('bathroom')}
              className={`flex-1 p-2 rounded flex items-center justify-center gap-1 text-sm ${activeRoom === 'bathroom' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            >
              <Bath size={16} />
              {t('designer.bathroom', 'Bathroom')}
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">
            {activeRoom === 'kitchen' ? t('designer.kitchen') : t('designer.bathroom')}: {currentRoomData.dimensions.width}' × {currentRoomData.dimensions.height}'
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 space-y-2">
          <button
            onClick={() => setShowPricing(!showPricing)}
            className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center gap-2"
          >
            <Calculator size={16} />
            {showPricing ? t('designer.hidePricing') : t('designer.showPricing')}
          </button>
          <button
            onClick={() => setShowQuoteForm(true)}
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-2"
          >
            <Send size={16} />
            {t('designer.sendQuote')}
          </button>
        </div>

        {/* View Toggle */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">{t('designer.viewMode')}</label>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('floor')}
              className={`flex-1 p-2 rounded ${viewMode === 'floor' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {t('designer.floorPlan')}
            </button>
            <button
              onClick={() => setViewMode('wall')}
              className={`flex-1 p-2 rounded ${viewMode === 'wall' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {t('designer.wallView')}
            </button>
          </div>
        </div>

        {/* Wall Selection (only visible in wall view mode) */}
        {viewMode === 'wall' && (
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">Select Wall</label>
            <div className="grid grid-cols-2 gap-2">
              {allAvailableWalls.filter(wallNum => {
                if (wallNum <= 4) return true;
                const customWall = getCustomWallByNumber(wallNum);
                if (customWall) return true;
                return false;
              }).map(wall => (
                <button
                  key={wall}
                  onClick={() => setSelectedWall(wall)}
                  className={`p-2 text-sm rounded ${selectedWall === wall 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'}`}
                >
                  {getWallName(wall)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Floor Plan Presets Section */}
        <div className="mb-6 border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold">Floor Plan Layouts</label>
            <button
              onClick={() => toggleSection('floorPlanPresets')}
              className="text-xs px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 flex items-center gap-1"
              title="Choose a floor plan preset"
            >
              🏠 Presets
            </button>
          </div>
        </div>

        {/* Wall Management Section */}
        <WallManagement
          wallAvailability={wallAvailability}
          collapsedSections={collapsedSections}
          toggleSection={toggleSection}
          isDrawingWall={isDrawingWall}
          toggleWallDrawingMode={toggleWallDrawingMode}
          isDoorMode={isDoorMode}
          toggleDoorMode={toggleDoorMode}
          doorModeType={doorModeType}
          setDoorModeType={setDoorModeType}
          allAvailableWalls={allAvailableWalls}
          currentRoomData={currentRoomData}
          getWallName={getWallName}
          wallPricing={wallPricing}
          addWall={addWall}
          removeWall={removeWall}
          customWalls={customWalls}
          originalWalls={originalWalls}
          setCurrentRoomData={setCurrentRoomData}
          wallRemovalDisabled={wallRemovalDisabled}
          getCustomWallByNumber={getCustomWallByNumber}
          markWallAsExistedPrior={markWallAsExistedPrior}
          getCurrentWallAngle={getCurrentWallAngle}
          wallDrawStart={wallDrawStart}
          setIsDrawingWall={setIsDrawingWall}
          setWallDrawStart={setWallDrawStart}
          setWallDrawPreview={setWallDrawPreview}
          addDoor={addDoor}
          removeDoor={removeDoor}
          updateDoor={updateDoor}
          getDoorsOnWall={getDoorsOnWall}
          getDoorTypes={getDoorTypes}
          onDeleteElement={deleteElement}
        />

        {/* Change All Cabinet Materials */}
        {currentRoomData.elements.filter(el => el.category === 'cabinet').length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3">Change All Cabinet Materials</h3>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value && window.confirm('Change material for all cabinets in this room?')) {
                  const newMaterial = e.target.value;
                  const newMaterials = { ...currentRoomData.materials };

                  currentRoomData.elements
                    .filter(el => el.category === 'cabinet')
                    .forEach(el => {
                      newMaterials[el.id] = newMaterial;
                    });

                  setCurrentRoomData({
                    ...currentRoomData,
                    materials: newMaterials
                  });
                  e.target.value = '';
                }
              }}
              className="w-full p-2 border rounded"
            >
              <option value="">Select material for all cabinets</option>
              {Object.entries(materialMultipliers).map(([material, multiplier]) => (
                <option key={material} value={material}>
                  {material.charAt(0).toUpperCase() + material.slice(1)} ({multiplier === 1 ? 'Included' : `+${Math.round((multiplier - 1) * 100)}%`})
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-600 mt-2">
              This will change the material for all {currentRoomData.elements.filter(el => el.category === 'cabinet').length} cabinet(s) in this room.
            </p>
          </div>
        )}

        {/* Cabinet Elements */}
        <div className="mb-8">
          <button
            onClick={() => toggleSection('cabinetOptions')}
            className="flex items-center gap-2 text-lg font-semibold mb-4 hover:text-blue-600"
          >
            <span className={`transform transition-transform ${collapsedSections.cabinetOptions ? '' : 'rotate-90'}`}>▶</span>
            {activeRoom === 'kitchen' ? 'Kitchen Cabinets' : 'Bathroom Cabinets'}
          </button>
          
          {!collapsedSections.cabinetOptions && (
            <div className="space-y-2">
              {Object.entries(elementTypes)
                .filter(([key, element]) => 
                  element.category === 'cabinet' && element.room === activeRoom
                )
                .map(([key, element]) => (
                  <button
                    key={key}
                    onClick={() => addElement(key)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    title={`$${basePrices[key] || 0}`}
                  >
                    <div className="font-medium">{element.name}</div>
                    <div className="text-xs text-gray-500">
                      {element.defaultWidth}"W × {element.defaultDepth}"D × {element.fixedHeight || element.defaultHeight}"H
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Appliance Elements */}
        <div className="mb-8">
          <button
            onClick={() => toggleSection('appliances')}
            className="flex items-center gap-2 text-lg font-semibold mb-4 hover:text-blue-600"
          >
            <span className={`transform transition-transform ${collapsedSections.appliances ? '' : 'rotate-90'}`}>▶</span>
            Appliances
          </button>
          
          {!collapsedSections.appliances && (
            <div className="space-y-2">
              {Object.entries(elementTypes)
                .filter(([key, element]) => 
                  element.category === 'appliance' && element.room === activeRoom
                )
                .map(([key, element]) => (
                  <button
                    key={key}
                    onClick={() => addElement(key)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="font-medium">{element.name}</div>
                    <div className="text-xs text-gray-500">
                      {element.defaultWidth}"W × {element.defaultDepth}"D × {element.fixedHeight}"H
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Selected Element Properties */}
        {selectedElement && (
          <div className="border-t pt-6">
            <button
              onClick={() => toggleSection('properties')}
              className="flex items-center gap-2 text-lg font-semibold mb-4 hover:text-blue-600"
            >
              <span className={`transform transition-transform ${collapsedSections.properties ? '' : 'rotate-90'}`}>▶</span>
              Properties
            </button>
            
            {!collapsedSections.properties && (
              <div className="space-y-4">
                {(() => {
                  // Find the actual element object from the elements array using the selectedElement ID
                  const element = currentRoomData.elements.find(el => el.id === selectedElement);
                  
                  if (!element) {
                    console.warn('Selected element not found in currentRoomData.elements:', selectedElement);
                    return null;
                  }
                  
                  // Debug logging to see the element structure
                  console.log('Properties panel - element object:', element);
                  console.log('Properties panel - element.type:', element.type);
                  console.log('Properties panel - available elementTypes keys:', Object.keys(elementTypes));
                  
                  const elementSpec = elementTypes[element.type];

                  if (!elementSpec) {
                    console.warn('Missing elementSpec for type:', element.type, 'Element:', element);
                    return null;
                  }

                  return (
                    <>
                      {/* Element identification */}
                      <div>
                        <p className="text-sm font-medium mb-1">{elementSpec.name}</p>
                      </div>

                      {/* Material selection for cabinets */}
                      {element.category === 'cabinet' && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Material</label>
                          <select
                            value={currentRoomData.materials?.[element.id] || 'laminate'}
                            onChange={(e) => {
                              setCurrentRoomData({
                                ...currentRoomData,
                                materials: {
                                  ...currentRoomData.materials,
                                  [element.id]: e.target.value
                                }
                              });
                            }}
                            className="w-full p-2 border rounded"
                          >
                            {Object.entries(materialMultipliers).map(([material, multiplier]) => (
                              <option key={material} value={material}>
                                {material.charAt(0).toUpperCase() + material.slice(1)} ({multiplier === 1 ? 'Included' : `+${Math.round((multiplier - 1) * 100)}%`})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Width - customizable for cabinets */}
                      {elementSpec.category === 'cabinet' && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Width (inches)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={element.width}
                            onChange={(e) => updateElement(element.id, { width: parseFloat(e.target.value) })}
                            className="w-full p-2 border rounded"
                            min="12"
                            max="60"
                          />
                        </div>
                      )}

                      {/* Depth - for specific cabinet types */}
                      {elementSpec.category === 'cabinet' && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Depth (inches)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={element.depth}
                            onChange={(e) => updateElement(element.id, { depth: parseFloat(e.target.value) })}
                            className="w-full p-2 border rounded"
                            min="12"
                            max="36"
                          />
                        </div>
                      )}

                      {/* Height - for variable height elements */}
                      {elementSpec.category === 'cabinet' && !elementSpec.fixedHeight && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Height (inches)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={element.actualHeight || elementSpec.defaultHeight}
                            onChange={(e) => updateElement(element.id, { actualHeight: parseFloat(e.target.value) })}
                            className="w-full p-2 border rounded"
                            min={elementSpec.minHeight || (elementSpec.mountType === 'wall' ? 12 : 40)}
                            max={elementSpec.mountType === 'wall' ? currentRoomData.dimensions.wallHeight - element.mountHeight : currentRoomData.dimensions.wallHeight}
                          />
                        </div>
                      )}

                      {/* Mount height for wall cabinets */}
                      {elementSpec.category === 'cabinet' && elementSpec.mountType === 'wall' && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Mount Height (inches)</label>
                          <input
                            type="number"
                            step="0.5"
                            value={element.mountHeight}
                            onChange={(e) => updateElement(element.id, { mountHeight: parseFloat(e.target.value) })}
                            className="w-full p-2 border rounded"
                            min="0"
                            max={parseFloat(currentRoomData.dimensions.wallHeight) - element.actualHeight}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Distance from floor to bottom of cabinet
                          </p>
                        </div>
                      )}

                      {/* Rotation Controls */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">Rotation</label>
                        <div className="grid grid-cols-2 gap-1 mb-2">
                          <button
                            onClick={() => rotateElement(element.id, -90)}
                            className="p-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center gap-1 text-xs"
                          >
                            <RotateCw size={14} className="transform scale-x-[-1]" />
                            -90°
                          </button>
                          <button
                            onClick={() => rotateElement(element.id, 90)}
                            className="p-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center gap-1 text-xs"
                          >
                            <RotateCw size={14} />
                            +90°
                          </button>
                          <button
                            onClick={() => rotateElement(element.id, -15)}
                            className="p-1 bg-blue-100 rounded hover:bg-blue-200 text-xs"
                            title="Fine rotate counter-clockwise"
                          >
                            ↺ -15°
                          </button>
                          <button
                            onClick={() => rotateElement(element.id, 15)}
                            className="p-1 bg-blue-100 rounded hover:bg-blue-200 text-xs"
                            title="Fine rotate clockwise"
                          >
                            ↻ +15°
                          </button>
                        </div>
                        <p className="text-xs text-gray-500">Current: {element.rotation}°</p>
                      </div>

                      {/* Corner cabinet hinge direction */}
                      {element.type && element.type.includes('corner') && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">Hinge Direction</label>
                          <div className="flex gap-1">
                            <button
                              onClick={() => rotateCornerCabinet(element.id, 'left')}
                              className={`flex-1 px-2 py-1 text-xs rounded ${element.rotation === 0 ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'}`}
                            >
                              Left
                            </button>
                            <button
                              onClick={() => rotateCornerCabinet(element.id, 'right')}
                              className={`flex-1 px-2 py-1 text-xs rounded ${element.rotation === 270 ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'}`}
                            >
                              Right
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Delete Element Button */}
                      <button
                        onClick={() => deleteElement(element.id)}
                        className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Pricing Display */}
        {showPricing && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-semibold mb-3 text-yellow-800">{t('pricing.title')}</h4>
            
            <div className="space-y-2 text-sm">
              {/* Base cabinet pricing */}
              <div className="flex justify-between">
                <span>Cabinets:</span>
                <span>${calculateTotalPrice().toFixed(2)}</span>
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
        )}

        {/* Reset Design Button */}
        <div className="mt-8 pt-6 border-t">
          <button
            onClick={() => {
              if (window.confirm('Reset all design elements? This action cannot be undone.')) {
                resetDesign();
              }
            }}
            className="w-full p-3 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center gap-2 font-medium"
          >
            <Trash2 size={16} />
            Reset Design
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignerSidebar;