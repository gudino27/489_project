import React, { useState, useEffect } from 'react';
import { Maximize2, X, Home, Bath, Box } from 'lucide-react';
import DesignPreview3D from './DesignPreview3D';

const DesignPreview = ({ designData, hasKitchen, hasBathroom, interactive, onUpdateElement }) => {
    const [viewMode, setViewMode] = useState('floor');
    const [selectedWall, setSelectedWall] = useState(1);
    const [showFullscreen, setShowFullscreen] = useState(false);
    const [activeRoom, setActiveRoom] = useState('kitchen');

    // Set initial active room based on what's available
    useEffect(() => {
        if (hasKitchen) {
            setActiveRoom('kitchen');
        } else if (hasBathroom) {
            setActiveRoom('bathroom');
        }
    }, [hasKitchen, hasBathroom]);

    // Get current room images and data based on active room
    const getCurrentRoomImages = () => {
        if (activeRoom === 'kitchen') {
            return {
                floor_plan: designData.floor_plan_image,
                wall_views: designData.wall_view_images
            };
        } else if (activeRoom === 'bathroom') {
            return {
                floor_plan: designData.bathroom_floor_plan_image,
                wall_views: designData.bathroom_wall_view_images
            };
        }
        return { floor_plan: null, wall_views: null };
    };

    const getCurrentRoomData = () => {
        if (activeRoom === 'kitchen' && hasKitchen) {
            return designData.kitchen_data;
        } else if (activeRoom === 'bathroom' && hasBathroom) {
            return designData.bathroom_data;
        }
        return null;
    };

    const currentImages = getCurrentRoomImages();
    const roomData = getCurrentRoomData();

    // SVG Generation code - use same scaling logic as main designer
    const calculateScale = () => {
        if (!roomData || !roomData.dimensions) return 2;

        const roomWidthFeet = parseFloat(roomData.dimensions.width) || 10;
        const roomHeightFeet = parseFloat(roomData.dimensions.height) || 10;

        // Use the same scale calculation as the main designer
        const roomWidthInches = roomWidthFeet * 12;
        const roomHeightInches = roomHeightFeet * 12;
        const maxCanvasSize = 600;
        
        const scaleX = maxCanvasSize / roomWidthInches;
        const scaleY = maxCanvasSize / roomHeightInches;
        
        return Math.min(scaleX, scaleY);
    };

    const scale = calculateScale();
    const roomWidth = parseFloat(roomData?.dimensions?.width || 0) * 12 * scale;
    const roomHeight = parseFloat(roomData?.dimensions?.height || 0) * 12 * scale;
    const wallHeight = parseFloat(roomData?.dimensions?.wallHeight || 96);

    // Element types for rendering - Enhanced for better bathroom display
    const elementTypes = {
        'base': { name: 'Base Cabinet', defaultHeight: 34.5, color: '#8B4513' },
        'wall': { name: 'Wall Cabinet', defaultHeight: 30, color: '#A0522D' },
        'tall': { name: 'Tall Cabinet', defaultHeight: 84, color: '#8B4513' },
        'corner': { name: 'Corner Cabinet', defaultHeight: 34.5, color: '#8B4513' },
        'sink-base': { name: 'Sink Base', defaultHeight: 34.5, color: '#8B4513' },
        'vanity': { name: 'Vanity Cabinet', defaultHeight: 32, color: '#8B4513' },
        'vanity-sink': { name: 'Vanity with Sink', defaultHeight: 32, color: '#654321' },
        'medicine': { name: 'Medicine Cabinet', defaultHeight: 30, color: '#A0522D', mountHeight: 48 },
        'medicine-mirror': { name: 'Medicine Cabinet w/ Mirror', defaultHeight: 36, color: '#A0522D', mountHeight: 48 },
        'linen': { name: 'Linen Cabinet', defaultHeight: 84, color: '#8B4513' },
        'linen-tower': { name: 'Linen Tower', defaultHeight: 84, color: '#8B4513' },
        'double-vanity': { name: 'Double Vanity', defaultHeight: 32, color: '#8B4513' },
        'floating-vanity': { name: 'Floating Vanity', defaultHeight: 32, color: '#8B4513' },
        'corner-vanity': { name: 'Corner Vanity', defaultHeight: 32, color: '#8B4513' },
        'vanity-tower': { name: 'Vanity Tower', defaultHeight: 84, color: '#8B4513' },
        'refrigerator': { name: 'Refrigerator', defaultHeight: 70, color: '#C0C0C0' },
        'stove': { name: 'Stove/Range', defaultHeight: 36, color: '#666' },
        'dishwasher': { name: 'Dishwasher', defaultHeight: 34, color: '#C0C0C0' },
        'microwave': { name: 'Microwave', defaultHeight: 18, color: '#666' },
        'toilet': { name: 'Toilet', defaultHeight: 30, color: '#FFFFFF', stroke: '#999' },
        'tub': { name: 'Bathtub', defaultHeight: 20, color: '#E8F4FD', stroke: '#4A90E2' },
        'shower': { name: 'Shower', defaultHeight: 80, color: '#F0F8FF', stroke: '#4A90E2' }
    };

    const getElementsOnWall = (wallNumber) => {
        if (!roomData) return [];
        const threshold = 20;
        return roomData.elements.filter(element => {
            const elementWidth = element.rotation % 180 === 0 ? element.width * scale : element.depth * scale;
            const elementDepth = element.rotation % 180 === 0 ? element.depth * scale : element.width * scale;

            switch (wallNumber) {
                case 1:
                    return element.y < threshold;
                case 2:
                    return element.x + elementWidth > roomWidth - threshold;
                case 3:
                    return element.y + elementDepth > roomHeight - threshold;
                case 4:
                    return element.x < threshold;
                default:
                    return false;
            }
        });
    };

    // If no images, show message or fallback to SVG generation
    if (!roomData || !roomData.elements) {
        return (
            <div className="design-preview">
                {/* Room Switcher */}
                {hasKitchen && hasBathroom && (
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-white rounded-lg p-1 shadow-sm border">
                            <button
                                onClick={() => setActiveRoom('kitchen')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeRoom === 'kitchen'
                                    ? 'bg-blue-100 text-blue-700 font-medium'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                            >
                                <Home className="w-4 h-4" />
                                Kitchen
                            </button>
                            <button
                                onClick={() => setActiveRoom('bathroom')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeRoom === 'bathroom'
                                    ? 'bg-purple-100 text-purple-700 font-medium'
                                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                    }`}
                            >
                                <Bath className="w-4 h-4" />
                                Bathroom
                            </button>
                        </div>
                    </div>
                )}

                <div className="text-center p-8 text-gray-500">
                    <div className="mb-2">
                        {activeRoom === 'kitchen' ? <Home className="w-12 h-12 mx-auto mb-2" /> : <Bath className="w-12 h-12 mx-auto mb-2" />}
                    </div>
                    <div>No design data available for {activeRoom}</div>
                    {activeRoom === 'bathroom' && !hasBathroom && (
                        <div className="text-sm mt-2">This design doesn't include a bathroom.</div>
                    )}
                    {activeRoom === 'kitchen' && !hasKitchen && (
                        <div className="text-sm mt-2">This design doesn't include a kitchen.</div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="design-preview">
            {/* Room Switcher */}
            {hasKitchen && hasBathroom && (
                <div className="flex items-center justify-center mb-4">
                    <div className="bg-white rounded-lg p-1 shadow-sm border">
                        <button
                            onClick={() => setActiveRoom('kitchen')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeRoom === 'kitchen'
                                ? 'bg-blue-100 text-blue-700 font-medium'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                        >
                            <Home className="w-4 h-4" />
                            Kitchen
                        </button>
                        <button
                            onClick={() => setActiveRoom('bathroom')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeRoom === 'bathroom'
                                ? 'bg-purple-100 text-purple-700 font-medium'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                        >
                            <Bath className="w-4 h-4" />
                            Bathroom
                        </button>
                    </div>
                </div>
            )}

            {/* Room Information */}
            {roomData && (
                <div className="mb-4 p-3 bg-white rounded-lg">
                    <div className="text-center mb-2">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-medium">
                            {activeRoom === 'kitchen' ? <Home className="w-4 h-4" /> : <Bath className="w-4 h-4" />}
                            {activeRoom === 'kitchen' ? 'Kitchen' : 'Bathroom'} Design
                        </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                            <span className="text-gray-600">Width:</span>
                            <span className="ml-1 font-medium">{roomData.dimensions.width}'</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Height:</span>
                            <span className="ml-1 font-medium">{roomData.dimensions.height}'</span>
                        </div>
                    </div>
                </div>
            )}

            {/* View Mode Controls */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button
                        onClick={() => setViewMode('floor')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'floor'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Floor Plan
                    </button>
                    <button
                        onClick={() => setViewMode('walls')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'walls'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        Wall Views
                    </button>
                    <button
                        onClick={() => setViewMode('3d')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === '3d'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <Box className="w-4 h-4" />
                        3D View
                    </button>
                </div>
                
                <button
                    onClick={() => setShowFullscreen(true)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Fullscreen View"
                >
                    <Maximize2 className="w-5 h-5" />
                </button>
            </div>

            {/* 3D View */}
            {viewMode === '3d' && (
                <div className="border-2 rounded-lg overflow-hidden bg-gray-50 h-[1200px] relative">
                    <DesignPreview3D 
                        roomData={roomData} 
                        elementTypes={elementTypes} 
                        scale={scale}
                        interactive={interactive}
                        onUpdateElement={onUpdateElement}
                    />
                    <div className="absolute bottom-7 right-4 bg-white/80 p-2 rounded text-xs text-gray-600 pointer-events-none">
                        <p>Left Click + Drag to Move</p>
                        <p>Right Click + Drag to Rotate</p>
                        <p>Scroll to Zoom</p>
                    </div>
                </div>
            )}
            {/* Floor Plan View */}
            {viewMode === 'floor' && (
                <div className="border-2 rounded-lg p-4 bg-white shadow-sm overflow-auto">
                    <svg
                        width={roomWidth + 60}
                        height={roomHeight + 60}
                        className="mx-auto"
                        viewBox={`0 0 ${roomWidth + 60} ${roomHeight + 60}`}
                    >
                        {/* Grid background */}
                        <defs>
                            <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#f0f0f0" strokeWidth="1" />
                            </pattern>
                            <pattern id="tile" width="20" height="20" patternUnits="userSpaceOnUse">
                                <rect width="20" height="20" fill="#f8f9fa" stroke="#e9ecef" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width={roomWidth + 60} height={roomHeight + 60} fill="white" />
                        <rect x="30" y="30" width={roomWidth} height={roomHeight} fill="url(#grid)" stroke="#eee" strokeWidth="1" />
                        
                        {/* Room outline */}
                        <rect
                            x="30"
                            y="30"
                            width={roomWidth}
                            height={roomHeight}
                            fill="none"
                            stroke="#333"
                            strokeWidth="4"
                        />

                        {/* Elements */}
                        {roomData.elements.map((element, index) => {
                            // Use element coordinates directly (they should already be scaled)
                            // For wall-mounted elements, check if they need special positioning
                            const elementSpec = elementTypes[element.type] || {};
                            let elementX = element.x;
                            let elementY = element.y;
                            
                            // Wall-mounted elements like medicine cabinets may need position adjustment
                            if (elementSpec.mountHeight && element.category === 'cabinet') {
                                // This is a wall-mounted element - position should be correct as stored
                                // The mountHeight is just metadata for rendering
                            }

                            const width = (element.rotation % 180 === 0 ? element.width : element.depth) * scale;
                            const depth = (element.rotation % 180 === 0 ? element.depth : element.width) * scale;

                            // Special rendering for bathroom fixtures
                            if (element.type === 'toilet') {
                                return (
                                    <g key={element.id || index} transform={`translate(${30 + elementX}, ${30 + elementY})`}>
                                        {/* Toilet bowl */}
                                        <ellipse
                                            cx={width / 2}
                                            cy={depth * 0.7}
                                            rx={width * 0.3}
                                            ry={depth * 0.25}
                                            fill="#ffffff"
                                            stroke="#999"
                                            strokeWidth="2"
                                        />
                                        {/* Toilet tank */}
                                        <rect
                                            x={width * 0.2}
                                            y={depth * 0.1}
                                            width={width * 0.6}
                                            height={depth * 0.4}
                                            fill="#ffffff"
                                            stroke="#999"
                                            strokeWidth="2"
                                            rx="4"
                                        />
                                        <text
                                            x={width / 2}
                                            y={depth / 2}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fontSize="8"
                                            fill="#666"
                                            fontWeight="bold"
                                        >
                                            WC
                                        </text>
                                    </g>
                                );
                            }

                            if (element.type === 'tub') {
                                return (
                                    <g key={element.id || index} transform={`translate(${30 + elementX}, ${30 + elementY})`}>
                                        <rect
                                            width={width}
                                            height={depth}
                                            fill="#E8F4FD"
                                            stroke="#4A90E2"
                                            strokeWidth="3"
                                            rx="8"
                                        />
                                        {/* Tub interior */}
                                        <rect
                                            x="6"
                                            y="6"
                                            width={width - 12}
                                            height={depth - 12}
                                            fill="#F0F8FF"
                                            stroke="#4A90E2"
                                            strokeWidth="1"
                                            rx="4"
                                        />
                                        <text
                                            x={width / 2}
                                            y={depth / 2}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fontSize="9"
                                            fill="#4A90E2"
                                            fontWeight="bold"
                                        >
                                            TUB
                                        </text>
                                    </g>
                                );
                            }

                            if (element.type === 'shower') {
                                return (
                                    <g key={element.id || index} transform={`translate(${30 + elementX}, ${30 + elementY})`}>
                                        <rect
                                            width={width}
                                            height={depth}
                                            fill="url(#tile)"
                                            stroke="#4A90E2"
                                            strokeWidth="3"
                                            rx="4"
                                        />
                                        {/* Shower drain */}
                                        <circle
                                            cx={width / 2}
                                            cy={depth / 2}
                                            r={width * 0.1}
                                            fill="#ccc"
                                        />
                                        <line
                                            x1="0"
                                            y1="0"
                                            x2={width}
                                            y2={depth}
                                            stroke="#4A90E2"
                                            strokeWidth="1"
                                        />
                                        <line
                                            x1={width}
                                            y1="0"
                                            x2="0"
                                            y2={depth}
                                            stroke="#4A90E2"
                                            strokeWidth="1"
                                        />
                                    </g>
                                );
                            }

                            if (element.type === 'vanity' || element.type === 'vanity-sink' || element.type === 'double-vanity' || element.type === 'floating-vanity' || element.type === 'corner-vanity') {
                                return (
                                    <g key={element.id || index} transform={`translate(${30 + elementX}, ${30 + elementY})`}>
                                        <defs>
                                            <linearGradient id={`vanityGrad${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#A0522D" />
                                                <stop offset="50%" stopColor="#8B4513" />
                                                <stop offset="100%" stopColor="#654321" />
                                            </linearGradient>
                                        </defs>
                                        {/* Drop shadow */}
                                        <rect
                                            x="2" y="2"
                                            width={width} height={depth}
                                            fill="#00000020" rx="3"
                                        />
                                        {/* Main cabinet body */}
                                        <rect
                                            width={width} height={depth}
                                            fill={`url(#vanityGrad${index})`}
                                            stroke="#2F1B14"
                                            strokeWidth="2"
                                            rx="3"
                                        />
                                        {/* Countertop */}
                                        <rect
                                            x="-2" y="-4"
                                            width={width + 4} height="6"
                                            fill="#F5F5DC"
                                            stroke="#D3D3D3"
                                            strokeWidth="1"
                                            rx="2"
                                        />
                                        {/* Cabinet door panels */}
                                        <rect
                                            x={width * 0.1} y={depth * 0.15}
                                            width={width * 0.35} height={depth * 0.7}
                                            fill="none"
                                            stroke="#2F1B14"
                                            strokeWidth="1"
                                            rx="2"
                                        />
                                        {width > 40 && (
                                            <rect
                                                x={width * 0.55} y={depth * 0.15}
                                                width={width * 0.35} height={depth * 0.7}
                                                fill="none"
                                                stroke="#2F1B14"
                                                strokeWidth="1"
                                                rx="2"
                                            />
                                        )}
                                        {/* Door handles */}
                                        <circle cx={width * 0.25} cy={depth * 0.5} r="2" fill="#C0C0C0" stroke="#999" />
                                        {width > 40 && <circle cx={width * 0.75} cy={depth * 0.5} r="2" fill="#C0C0C0" stroke="#999" />}
                                        {/* Sink if vanity-sink */}
                                        {element.type === 'vanity-sink' && (
                                            <>
                                                <ellipse
                                                    cx={width / 2} cy={depth / 2}
                                                    rx={width * 0.2} ry={depth * 0.25}
                                                    fill="#ffffff"
                                                    stroke="#999"
                                                    strokeWidth="1"
                                                />
                                                <circle cx={width / 2} cy={depth / 2} r="2" fill="#999" />
                                            </>
                                        )}
                                        {/* Double sinks for double vanity */}
                                        {element.type === 'double-vanity' && (
                                            <>
                                                <ellipse
                                                    cx={width * 0.3} cy={depth / 2}
                                                    rx={width * 0.15} ry={depth * 0.25}
                                                    fill="#ffffff"
                                                    stroke="#999"
                                                    strokeWidth="1"
                                                />
                                                <circle cx={width * 0.3} cy={depth / 2} r="2" fill="#999" />
                                                <ellipse
                                                    cx={width * 0.7} cy={depth / 2}
                                                    rx={width * 0.15} ry={depth * 0.25}
                                                    fill="#ffffff"
                                                    stroke="#999"
                                                    strokeWidth="1"
                                                />
                                                <circle cx={width * 0.7} cy={depth / 2} r="2" fill="#999" />
                                            </>
                                        )}
                                        <text
                                            x={width / 2}
                                            y={depth / 2 + 15}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fontSize={Math.min(width, depth) / 5}
                                            fill="white"
                                            fontWeight="bold"
                                            style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}
                                        >
                                            {element.type.includes('vanity') ? 'VANITY' : ''}
                                        </text>
                                    </g>
                                );
                            }

                            // Enhanced rendering for other cabinet elements
                            if (element.category === 'cabinet') {
                                return (
                                    <g key={element.id || index} transform={`translate(${30 + elementX}, ${30 + elementY})`}>
                                        <rect
                                            width={width}
                                            height={depth}
                                            fill={elementSpec.color || '#8B4513'}
                                            stroke="#333"
                                            strokeWidth="2"
                                            opacity="0.9"
                                            rx="2"
                                        />
                                        <line x1="0" y1="0" x2={width} y2={depth} stroke="#5c3a21" strokeWidth="1" />
                                        <line x1={width} y1="0" x2="0" y2={depth} stroke="#5c3a21" strokeWidth="1" />
                                        <text
                                            x={width / 2}
                                            y={depth / 2}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fontSize={Math.min(width, depth) / 4}
                                            fill="white"
                                            fontWeight="bold"
                                        >
                                            {element.type.toUpperCase().replace('-', ' ')}
                                        </text>
                                    </g>
                                );
                            }
                            
                            // Default rendering for non-cabinet elements
                            return (
                                <g key={element.id || index} transform={`translate(${30 + elementX}, ${30 + elementY})`}>
                                    <rect
                                        width={width}
                                        height={depth}
                                        fill={elementSpec.color || '#999'}
                                        stroke={elementSpec.stroke || '#333'}
                                        strokeWidth="2"
                                        opacity="0.9"
                                        rx="2"
                                    />
                                    <text
                                        x={width / 2}
                                        y={depth / 2}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize={Math.min(width, depth) / 6}
                                        fill="white"
                                        fontWeight="bold"
                                    >
                                        {element.type.toUpperCase()}
                                    </text>
                                </g>
                            );
                        })}

                        {/* Room dimensions */}
                        <text x={roomWidth / 2 + 30} y="20" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333">
                            {roomData.dimensions.width}'
                        </text>
                        <text x="15" y={roomHeight / 2 + 30} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#333" transform={`rotate(-90, 15, ${roomHeight / 2 + 30})`}>
                            {roomData.dimensions.height}'
                        </text>
                    </svg>
                </div>
            )}

            {/* SVG Wall Views */}
            {viewMode === 'walls' && (
                /* Wall View - Enhanced */
                <div className="space-y-4">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map(wall => (
                            <button
                                key={wall}
                                onClick={() => setSelectedWall(wall)}
                                className={`px-3 py-2 rounded-lg transition-colors ${selectedWall === wall
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Wall {wall}
                            </button>
                        ))}
                    </div>

                    <div className="border-2 rounded-lg p-4 bg-white shadow-sm">
                        <svg
                            width={Math.min(roomWidth + 60, 800)}
                            height={Math.min(roomHeight + 60, 600)}
                            className="border mx-auto"
                            viewBox={`0 0 ${roomWidth + 60} ${roomHeight + 60}`}
                            style={{ maxWidth: '100%', height: 'auto' }}
                        >
                            {/* Wall background with better styling */}
                            <rect
                                x="30"
                                y="30"
                                width={roomWidth}
                                height={240}
                                fill="#f8f9fa"
                                stroke="#333"
                                strokeWidth="3"
                            />

                            {/* Floor line */}
                            <line
                                x1="30"
                                y1="270"
                                x2={roomWidth + 30}
                                y2="270"
                                stroke="#333"
                                strokeWidth="3"
                            />

                            {/* Elements on this wall */}
                            {getElementsOnWall(selectedWall).map((element, index) => {
                                const spec = elementTypes[element.type] || { defaultHeight: 30, color: '#999' };
                                const elementWidth = element.width * scale;
                                const height = (element.actualHeight || spec.defaultHeight) * scale * 0.6;
                                const yPos = element.category === 'wall' ? 30 : 270 - height;

                                let xPos = 30;
                                if (selectedWall === 1 || selectedWall === 3) {
                                    xPos = 30 + element.x;
                                } else {
                                    xPos = 30 + element.y;
                                }

                                // Enhanced elevation view rendering for cabinets
                                if (element.category === 'cabinet') {
                                    return (
                                        <g key={element.id || index}>
                                            <defs>
                                                <linearGradient id={`elevGrad${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" stopColor="#A0522D" />
                                                    <stop offset="50%" stopColor="#8B4513" />
                                                    <stop offset="100%" stopColor="#654321" />
                                                </linearGradient>
                                            </defs>
                                            {/* Cabinet Body */}
                                            <rect
                                                x={xPos} y={yPos}
                                                width={elementWidth} height={height}
                                                fill={`url(#elevGrad${index})`}
                                                stroke="#2F1B14"
                                                strokeWidth="2"
                                                rx="3"
                                            />
                                            {/* Cabinet doors - elevation view */}
                                            <rect
                                                x={xPos + 4} y={yPos + 4}
                                                width={elementWidth/2 - 6} height={height - 8}
                                                fill="none" stroke="#2F1B14"
                                                strokeWidth="1.5" rx="2"
                                            />
                                            <rect
                                                x={xPos + elementWidth/2 + 2} y={yPos + 4}
                                                width={elementWidth/2 - 6} height={height - 8}
                                                fill="none" stroke="#2F1B14"
                                                strokeWidth="1.5" rx="2"
                                            />
                                            {/* Door handles */}
                                            <circle cx={xPos + elementWidth/2 - 8} cy={yPos + height/2} r="2" fill="#C0C0C0" stroke="#999" />
                                            <circle cx={xPos + elementWidth/2 + 8} cy={yPos + height/2} r="2" fill="#C0C0C0" stroke="#999" />
                                            
                                            <text
                                                x={xPos + elementWidth / 2}
                                                y={yPos + height + 15}
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                                fontSize="8"
                                                fill="#333"
                                                fontWeight="bold"
                                            >
                                                {element.type.toUpperCase().replace('-', ' ')}
                                            </text>
                                        </g>
                                    );
                                }

                                return (
                                    <g key={element.id || index}>
                                        <rect
                                            x={xPos}
                                            y={yPos}
                                            width={elementWidth}
                                            height={height}
                                            fill={spec.color}
                                            stroke="#333"
                                            strokeWidth="2"
                                            opacity="0.9"
                                            rx="2"
                                        />
                                        <text
                                            x={xPos + elementWidth / 2}
                                            y={yPos + height / 2}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fontSize="10"
                                            fill="white"
                                            fontWeight="bold"
                                        >
                                            {element.type.toUpperCase()}
                                        </text>
                                    </g>
                                );
                            })}

                            {/* Height indicator */}
                            <text
                                x="10"
                                y="150"
                                textAnchor="middle"
                                fontSize="12"
                                fill="#666"
                                fontWeight="bold"
                                transform="rotate(-90, 10, 150)"
                            >
                                {wallHeight}" height
                            </text>
                        </svg>
                    </div>
                </div>
            )}

            {/* Room Statistics */}
            {roomData && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-blue-600">
                            {roomData.elements.filter(el => el.category === 'cabinet').length}
                        </div>
                        <div className="text-xs text-gray-600">Cabinets</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-green-600">
                            {roomData.elements.filter(el => el.category === 'appliance').length}
                        </div>
                        <div className="text-xs text-gray-600">Appliances</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-purple-600">
                            {Object.keys(roomData.materials || {}).length}
                        </div>
                        <div className="text-xs text-gray-600">Materials</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-orange-600">
                            {(roomData.dimensions.width * roomData.dimensions.height).toFixed(0)}
                        </div>
                        <div className="text-xs text-gray-600">Sq Ft</div>
                    </div>
                </div>
            )}

            {/* Fullscreen Modal */}
            {showFullscreen && (
                <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-800">
                                {activeRoom === 'kitchen' ? 'Kitchen' : 'Bathroom'} Design Preview
                            </h3>
                            <button
                                onClick={() => setShowFullscreen(false)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X className="w-6 h-6 text-gray-500" />
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-auto p-8 bg-gray-100 flex items-center justify-center">
                            {viewMode === '3d' ? (
                                <div className="w-full h-full bg-white rounded-lg shadow-lg overflow-hidden relative">
                                    <DesignPreview3D 
                                        roomData={roomData} 
                                        elementTypes={elementTypes} 
                                        scale={scale}
                                        interactive={interactive}
                                        onUpdateElement={onUpdateElement}
                                    />
                                    <div className="absolute bottom-4 right-4 bg-white/80 p-2 rounded text-xs text-gray-600 pointer-events-none">
                                        <p>Left Click + Drag to Move</p>
                                        <p>Right Click + Drag to Rotate</p>
                                        <p>Scroll to Zoom</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white p-8 rounded-lg shadow-lg max-w-full max-h-full overflow-auto">
                                    {viewMode === 'floor' ? (
                                        <img
                                            src={currentImages.floor_plan || `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#eee"/><text x="50" y="50" text-anchor="middle">Preview</text></svg>')}`}
                                            alt="Full Floor Plan"
                                            className="max-w-full max-h-[70vh] object-contain"
                                        />
                                    ) : (
                                        <div className="space-y-8">
                                            {currentImages.wall_views?.map((view, i) => (
                                                <div key={i} className="space-y-2">
                                                    <h4 className="font-medium text-gray-500">Wall {view.wall}</h4>
                                                    <img
                                                        src={view.image}
                                                        alt={`Wall ${view.wall}`}
                                                        className="max-w-full max-h-[60vh] object-contain border rounded"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DesignPreview;
