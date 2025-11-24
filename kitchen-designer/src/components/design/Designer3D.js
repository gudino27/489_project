import React, { useState, useEffect } from 'react';
import { Box, ArrowLeft, RotateCw, Move, Palette, X } from 'lucide-react';
import DesignEditor3D from './DesignEditor3D';
import { PAINTS, STAINS, FINISHES, APPLIANCE_MATERIALS, GRAIN_TYPES } from '../../constants/materials';

const Designer3D = ({ 
    roomData, 
    setRoomData, 
    elementTypes, 
    activeRoom,
    scale: parentScale,
    selectedElement: parentSelectedElement,
    setSelectedElement: parentSetSelectedElement,
    updateElement: parentUpdateElement,
    onClose 
}) => {
    const [localScale, setLocalScale] = useState(1);
    const [interactive, setInteractive] = useState(true);
    const [internalSelectedElement, setInternalSelectedElement] = useState(null);
    const [tempElementState, setTempElementState] = useState(null);

    // Use parent's selection if provided, otherwise use internal state
    const selectedElement = parentSelectedElement !== undefined ? parentSelectedElement : internalSelectedElement;
    const setSelectedElement = parentSetSelectedElement || setInternalSelectedElement;

    // Reset temp state when selection changes
    useEffect(() => {
        setTempElementState(null); 
    }, [selectedElement]);

    // Use parent scale if provided, otherwise calculate locally
    const scale = parentScale || localScale;

    // Calculate scale based on room dimensions (only if parent doesn't provide it)
    useEffect(() => {
        if (!parentScale && roomData && roomData.dimensions) {
            const roomWidthFeet = parseFloat(roomData.dimensions.width) || 10;
            const roomHeightFeet = parseFloat(roomData.dimensions.height) || 10;
            const roomWidthInches = roomWidthFeet * 12;
            const roomHeightInches = roomHeightFeet * 12;
            const maxCanvasSize = 600;
            
            const scaleX = maxCanvasSize / roomWidthInches;
            const scaleY = maxCanvasSize / roomHeightInches;
            
            setLocalScale(Math.min(scaleX, scaleY));
        }
    }, [roomData, parentScale]);

    const handleUpdateElement = (elementId, updates) => {
        console.log('handleUpdateElement called:', elementId, updates);
        // Use parent's updateElement if provided, otherwise update locally
        if (parentUpdateElement) {
            parentUpdateElement(elementId, updates);
        } else {
            if (!roomData || !roomData.elements) return;

            const elementIndex = roomData.elements.findIndex(el => el.id === elementId);
            if (elementIndex === -1) return;

            const newElements = [...roomData.elements];
            newElements[elementIndex] = { ...newElements[elementIndex], ...updates };
            
            setRoomData({ ...roomData, elements: newElements });
        }
    };

    if (!roomData) return null;

    console.log('Designer3D rendering. Mode:', interactive ? 'Interactive' : 'View Only');
    if (selectedElement) {
        const el = roomData.elements.find(e => e.id === selectedElement);
        console.log('Selected Element Data:', el);
    }

    return (
        <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
            {/* Toolbar */}
            <div className="flex-none flex items-center justify-between p-4 bg-white border-b shadow-sm ">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onClose}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back to 2D Designer</span>
                    </button>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Box className="text-blue-600" size={24} />
                        3D Editor (Interactive) - {activeRoom === 'kitchen' ? 'Kitchen' : 'Bathroom'}
                    </h2>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-500 mr-2">
                        <span className="font-medium text-gray-700">{roomData.elements.length}</span> items
                    </div>
                    <button
                        onClick={() => setInteractive(!interactive)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            interactive 
                                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        {interactive ? 'Interactive Mode On' : 'View Only'}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Main 3D View */}
                <div className="flex-1 relative bg-gray-100">
                    <DesignEditor3D 
                        roomData={roomData}
                        elementTypes={elementTypes}
                        scale={scale}
                        interactive={interactive}
                        selectedElement={selectedElement}
                        setSelectedElement={setSelectedElement}
                        onUpdateElement={handleUpdateElement}
                        onTransformChange={(id, updates) => {
                            if (id === selectedElement) {
                                setTempElementState(prev => ({ ...prev, ...updates }));
                            }
                        }}
                    />
                    
                    {/* Overlay Instructions */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur p-3 rounded-lg shadow-sm border border-gray-100 max-w-xs pointer-events-none">
                        <h3 className="font-semibold text-gray-800 mb-2 text-sm">Controls</h3>
                        <ul className="text-xs text-gray-600 space-y-1">
                            <li className="flex items-center gap-2">
                                <Move size={14} /> Left Click + Drag to Move Camera
                            </li>
                            <li className="flex items-center gap-2">
                                <RotateCw size={14} /> Right Click + Drag to Rotate Camera
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="font-bold">Scroll</span> to Zoom In/Out
                            </li>
                            {interactive && (
                                <li className="mt-2 pt-2 border-t border-gray-200 font-medium text-blue-600">
                                    Click objects to select and edit
                                </li>
                            )}
                        </ul>
                    </div>
                </div>

                {/* Right Sidebar - Properties */}
                {interactive && (
                    <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto shadow-xl z-10 flex flex-col">
                        {selectedElement ? (() => {
                            const baseElement = roomData.elements.find(el => el.id == selectedElement);
                            // Merge base element with temp state for real-time updates
                            const element = { ...baseElement, ...tempElementState };
                            const spec = elementTypes[element.type] || {};
                            const showElevation = spec.mountHeight !== undefined || spec.isFloating;
                            
                            const isAppliance = element?.category === 'appliance';
                            const isStain = element?.materialId && STAINS.find(s => s.id === element.materialId);
                            
                            return (
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                                        <Palette size={18} className="text-blue-600" />
                                        Properties
                                    </h3>
                                    <button 
                                        onClick={() => setSelectedElement(null)} 
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Deselect"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                {/* Position & Rotation Info */}
                                <div className="mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Transform</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500">Rotation:</span>
                                            <div className="flex items-center">
                                                <input
                                                    type="number"
                                                    value={Math.round(element.rotation || 0)}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value);
                                                        if (!isNaN(val)) {
                                                            handleUpdateElement(selectedElement, { rotation: val });
                                                        } else {
                                                            handleUpdateElement(selectedElement, { rotation: 0 });
                                                        }
                                                    }}
                                                    className="w-20 p-1 text-right font-mono font-medium border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                                <span className="ml-1 text-gray-500 w-4">°</span>
                                            </div>
                                        </div>
                                        {showElevation && (
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-500">Elevation:</span>
                                                <div className="flex items-center">
                                                    <input
                                                        type="number"
                                                        value={Math.round(element.mountHeight || 0)}
                                                        onChange={(e) => {
                                                            const val = parseInt(e.target.value);
                                                            if (!isNaN(val)) {
                                                                handleUpdateElement(selectedElement, { mountHeight: val });
                                                            } else {
                                                                handleUpdateElement(selectedElement, { mountHeight: 0 });
                                                            }
                                                        }}
                                                        className="w-20 p-1 text-right font-mono font-medium border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                    />
                                                    <span className="ml-1 text-gray-500 w-4">"</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {isAppliance ? (
                                    /* Appliance Finishes */
                                    <div className="mb-8">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Appliance Finish</h4>
                                        <div className="grid grid-cols-4 gap-3">
                                            {APPLIANCE_MATERIALS.map(mat => (
                                                <button
                                                    key={mat.id}
                                                    onClick={() => handleUpdateElement(selectedElement, { materialId: mat.id })}
                                                    className={`w-full aspect-square rounded-full border shadow-sm hover:scale-110 transition-all relative group ${element.materialId === mat.id ? 'ring-2 ring-blue-500 ring-offset-2' : 'border-gray-200'}`}
                                                    style={{ backgroundColor: mat.hex }}
                                                    title={mat.name}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    /* Cabinet Finishes */
                                    <>
                                        {/* Paints */}
                                        <div className="mb-8">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex justify-between items-center">
                                                Real World Paints
                                                <span className="text-[10px] font-normal text-gray-400">SW & BM</span>
                                            </h4>
                                            <div className="grid grid-cols-5 gap-3">
                                                {PAINTS.map(paint => (
                                                    <button
                                                        key={paint.id}
                                                        onClick={() => handleUpdateElement(selectedElement, { materialId: paint.id })}
                                                        className={`w-full aspect-square rounded-full border shadow-sm hover:scale-110 transition-all relative group ${element.materialId === paint.id ? 'ring-2 ring-blue-500 ring-offset-2' : 'border-gray-200'}`}
                                                        style={{ backgroundColor: paint.hex }}
                                                        title={`${paint.brand} - ${paint.name}`}
                                                    >
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Stains */}
                                        <div className="mb-8">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Wood Stains</h4>
                                            <div className="grid grid-cols-5 gap-3">
                                                {STAINS.map(stain => (
                                                    <button
                                                        key={stain.id}
                                                        onClick={() => handleUpdateElement(selectedElement, { materialId: stain.id })}
                                                        className={`w-full aspect-square rounded-full border shadow-sm hover:scale-110 transition-all relative group ${element.materialId === stain.id ? 'ring-2 ring-blue-500 ring-offset-2' : 'border-gray-200'}`}
                                                        style={{ backgroundColor: stain.hex }}
                                                        title={stain.name}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Wood Grain Selector (Only if stain is selected) */}
                                        {isStain && (
                                            <div className="mb-8">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Wood Grain Pattern</h4>
                                                <select 
                                                    className="w-full p-2 border border-gray-300 rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                    onChange={(e) => handleUpdateElement(selectedElement, { grain: e.target.value })}
                                                    value={element.grain || isStain.defaultGrain || 'oak'}
                                                >
                                                    {Object.values(GRAIN_TYPES).map((grain) => (
                                                        <option key={grain.id} value={grain.id}>{grain.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        
                                        {/* Finishes */}
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Finish / Sheen</h4>
                                            <select 
                                                className="w-full p-2 border border-gray-300 rounded text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                onChange={(e) => handleUpdateElement(selectedElement, { finish: e.target.value })}
                                                defaultValue="satin"
                                                value={element.finish || 'satin'}
                                            >
                                                {Object.entries(FINISHES).map(([key, finish]) => (
                                                    <option key={key} value={key}>{finish.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}
                            </div>
                            );
                        })() : (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400">
                                <Box size={48} className="mb-4 opacity-20" />
                                <p className="text-sm font-medium text-gray-500">No Item Selected</p>
                                <p className="text-xs mt-1">Click on a cabinet in the 3D view to edit its materials and properties.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
export default Designer3D;