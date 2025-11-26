import React from 'react';
import {
  RotateCw,
  Trash2,
  Calculator,
  Send,
  Home,
  Bath,
  ChevronLeft,
  ChevronRight,
  Camera
} from 'lucide-react';
import WallManagement from './WallManagement';
import { useLanguage } from '../../contexts/LanguageContext';

const DesignerSidebar = ({
  // Responsive state
  isMobile,
  isTablet,

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
  scale,

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
  setShowARViewer,

  // Wall/Elements
  allAvailableWalls,
  selectedWall,
  setSelectedWall,
  getWallName,

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

  // Additional state needed
  collapsedSections,
  toggleSection,
  rotateElement,
  rotateCornerCabinet,
  resetDesign,
  originalWalls,

  // Missing props added
  addWall,
  removeWall,
  customWalls,
  wallRemovalDisabled,
  getCustomWallByNumber,
  markWallAsExistedPrior,
  getCurrentWallAngle,
  rotateCustomWall,
  resizeCustomWall,
  addDoor,
  removeDoor,
  updateDoor,
  getDoorsOnWall,
  getDoorTypes
}) => {
  const { t } = useLanguage();

  const isOverlayMode = isMobile;
  const showSidebar = !sidebarCollapsed || !isOverlayMode;

  return (
    <>
      {isOverlayMode && !sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarCollapsed(true)}
          aria-label="Close sidebar"
        />
      )}
      <div
        className={`
          bg-white shadow-lg overflow-y-auto transition-all duration-300 ease-in-out
          ${isOverlayMode && !sidebarCollapsed
            ? 'fixed inset-y-0 left-0 z-40 w-80 max-w-[85vw]'
            : sidebarCollapsed
              ? 'w-16 p-2 pt-20'
              : 'w-80 p-6'
          }
          ${isOverlayMode && sidebarCollapsed ? 'hidden' : ''}
          ${!isOverlayMode && !sidebarCollapsed ? 'p-6' : ''}
          ${isOverlayMode && !sidebarCollapsed ? 'p-6 pt-20 pb-32' : ''}
          relative
        `}
        style={{ paddingBottom: isMobile ? 'calc(2rem + env(safe-area-inset-bottom, 0px))' : undefined }}
      >
        {!isOverlayMode && (
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`absolute ${sidebarCollapsed ? 'top-2 left-2' : 'top-4 right-4'} z-10 p-3 min-h-10 min-w-10 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-full flex items-center justify-center`}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
        {sidebarCollapsed && (
          <div className="flex flex-col items-center mt-12 space-y-4">
            <button onClick={() => setShowPricing(!showPricing)} className="p-3 min-h-11 min-w-11 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 active:bg-green-300 flex items-center justify-center" title={t('pricing.title')}>
              <Calculator size={20} />
            </button>
            <button onClick={() => setShowQuoteForm(true)} className="p-3 min-h-11 min-w-11 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 active:bg-blue-300 flex items-center justify-center" title="Send Quote">
              <Send size={20} />
            </button>
            <button onClick={() => setShowARViewer(true)} className="p-3 min-h-11 min-w-11 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 active:bg-purple-300 flex items-center justify-center" title="View in AR">
              <Camera size={20} />
            </button>
            <button onClick={() => setViewMode(viewMode === 'floor' ? 'wall' : 'floor')} className="p-3 min-h-11 min-w-11 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 active:bg-gray-300 flex items-center justify-center" title={`Switch to ${viewMode === 'floor' ? 'Wall' : 'Floor'} View`}>
              {viewMode === 'floor' ? '🏠' : '🧱'}
            </button>
          </div>
        )}
        <div className={`${sidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{activeRoom === 'kitchen' ? t('designer.title') : t('designer.bathroomTitle')}</h2>
          </div>
          <div className="mb-6 bg-gray-50 p-3 rounded-lg">
            <div className="flex gap-2">
              <button onClick={() => switchRoom('kitchen')} className={`flex-1 p-3 min-h-11 rounded flex items-center justify-center gap-1 text-sm ${activeRoom === 'kitchen' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}>
                <Home size={16} />{t('designer.kitchen', 'Kitchen')}
              </button>
              <button onClick={() => switchRoom('bathroom')} className={`flex-1 p-3 min-h-11 rounded flex items-center justify-center gap-1 text-sm ${activeRoom === 'bathroom' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}>
                <Bath size={16} />{t('designer.bathroom', 'Bathroom')}
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">{activeRoom === 'kitchen' ? t('designer.kitchen') : t('designer.bathroom')}: {currentRoomData.dimensions.width}' × {currentRoomData.dimensions.height}'</p>
          </div>
          <div className="mb-6 space-y-2">
            <button onClick={() => setShowPricing(!showPricing)} className="w-full p-3 min-h-11 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center gap-2">
              <Calculator size={16} />{showPricing ? t('designer.hidePricing') : t('designer.showPricing')}
            </button>
            <button onClick={() => setShowQuoteForm(true)} className="w-full p-3 min-h-11 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-2">
              <Send size={16} />{t('designer.sendQuote')}
            </button>
            <button onClick={() => setShowARViewer(true)} className="w-full p-3 min-h-11 bg-purple-500 text-white rounded hover:bg-purple-600 flex items-center justify-center gap-2">
              <Camera size={16} />View in AR
            </button>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">{t('designer.viewMode')}</label>
            <div className="flex gap-2">
              <button onClick={() => setViewMode('floor')} className={`flex-1 p-3 min-h-11 rounded transition-colors ${viewMode === 'floor' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>{t('designer.floorPlan')}</button>
              <button onClick={() => setViewMode('wall')} className={`flex-1 p-3 min-h-11 rounded transition-colors ${viewMode === 'wall' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>{t('designer.wallView')}</button>
              <button onClick={() => setViewMode('3d')} className={`flex-1 p-3 min-h-11 rounded transition-colors ${viewMode === '3d' ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>3D View</button>
            </div>
          </div>
          {viewMode === 'wall' && (
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Select Wall</label>
              <div className="grid grid-cols-2 gap-2">
                {allAvailableWalls.filter(wallNum => {
                  if (wallNum <= 4) return true;
                  const customWall = getCustomWallByNumber(wallNum);
                  return !!customWall;
                }).map(wall => (
                  <button key={wall} onClick={() => setSelectedWall(wall)} className={`p-2 text-sm rounded ${selectedWall === wall ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>{getWallName(wall)}</button>
                ))}
              </div>
            </div>
          )}
          <div className="mb-6 border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold">Floor Plan Layouts</label>
              <button onClick={() => toggleSection('floorPlanPresets')} className="text-xs px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 flex items-center gap-1" title="Choose a floor plan preset">🏠 Presets</button>
            </div>
          </div>
          <WallManagement
            wallAvailability={wallAvailability}
            collapsedSections={collapsedSections}
            toggleSection={toggleSection}
            scale={scale}
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
            rotateCustomWall={rotateCustomWall}
            resizeCustomWall={resizeCustomWall}
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
          {currentRoomData.elements.filter(el => el.category === 'cabinet').length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Change All Cabinet Materials</h3>
              <select value="" onChange={e => {
                if (e.target.value && window.confirm('Change material for all cabinets in this room?')) {
                  const newMaterial = e.target.value;
                  const newMaterials = { ...currentRoomData.materials };
                  currentRoomData.elements.filter(el => el.category === 'cabinet').forEach(el => { newMaterials[el.id] = newMaterial; });
                  setCurrentRoomData({ ...currentRoomData, materials: newMaterials });
                  e.target.value = '';
                }
              }} className="w-full p-2 border rounded">
                <option value="">Select material for all cabinets</option>
                {Object.entries(materialMultipliers).map(([material, multiplier]) => (
                  <option key={material} value={material}>{material.charAt(0).toUpperCase() + material.slice(1)} ({multiplier === 1 ? 'Included' : `+${Math.round((multiplier - 1) * 100)}%`})</option>
                ))}
              </select>
              <p className="text-sm text-gray-600 mt-2">This will change the material for all {currentRoomData.elements.filter(el => el.category === 'cabinet').length} cabinet(s) in this room.</p>
            </div>
          )}
          <div className="mb-8">
            <button onClick={() => toggleSection('cabinetOptions')} className="flex items-center gap-2 text-lg font-semibold mb-4 hover:text-blue-600">
              <span className={`transform transition-transform ${collapsedSections.cabinetOptions ? '' : 'rotate-90'}`}>▶</span>{activeRoom === 'kitchen' ? 'Kitchen Cabinets' : 'Bathroom Cabinets'}
            </button>
            {!collapsedSections.cabinetOptions && (
              <div className="space-y-2">
                {Object.entries(elementTypes).filter(([key, el]) => el.category === 'cabinet' && el.room === activeRoom).map(([key, el]) => (
                  <button key={key} onClick={() => addElement(key)} className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg" title={`$${basePrices[key] || 0}`}>
                    <div className="font-medium">{el.name}</div>
                    <div className="text-xs text-gray-500">{el.defaultWidth}"W × {el.defaultDepth}"D × {el.fixedHeight || el.defaultHeight}"H</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="mb-8">
            <button onClick={() => toggleSection('appliances')} className="flex items-center gap-2 text-lg font-semibold mb-4 hover:text-blue-600">
              <span className={`transform transition-transform ${collapsedSections.appliances ? '' : 'rotate-90'}`}>▶</span>Appliances
            </button>
            {!collapsedSections.appliances && (
              <div className="space-y-2">
                {Object.entries(elementTypes).filter(([key, el]) => el.category === 'appliance' && el.room === activeRoom).map(([key, el]) => (
                  <button key={key} onClick={() => addElement(key)} className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg">
                    <div className="font-medium">{el.name}</div>
                    <div className="text-xs text-gray-500">{el.defaultWidth}"W × {el.defaultDepth}"D × {el.fixedHeight}"H</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {showPricing && (
            <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold mb-3 text-yellow-800">{t('pricing.title')}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Cabinets:</span><span>${calculateTotalPrice().toFixed(2)}</span></div>
                {(() => {
                  const removedWalls = currentRoomData.removedWalls || [];
                  const chargeableRemoved = removedWalls.filter(w => originalWalls.includes(w));
                  const customAdded = (currentRoomData.walls || []).filter(w => !originalWalls.includes(w));
                  const totalWallCost = (chargeableRemoved.length * wallPricing.removeWall) + (customAdded.length * wallPricing.addWall);
                  return totalWallCost > 0 ? (
                    <div className="flex justify-between"><span>Wall Modifications:</span><span>${totalWallCost.toFixed(2)}</span></div>
                  ) : null;
                })()}
                <div className="border-t pt-2 font-semibold flex justify-between"><span>Total Estimate:</span><span>${calculateTotalPrice().toFixed(2)}</span></div>
                <p className="text-xs text-gray-600 mt-2">* This is an estimate. Final pricing may vary based on specific requirements.</p>
              </div>
            </div>
          )}
          <div className="mt-8 pt-6 border-t">
            <button onClick={() => { if (window.confirm('Reset all design elements? This action cannot be undone.')) resetDesign(); }} className="w-full p-3 bg-red-500 text-white rounded hover:bg-red-600 flex items-center justify-center gap-2 font-medium">
              <Trash2 size={16} />Reset Design
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DesignerSidebar;