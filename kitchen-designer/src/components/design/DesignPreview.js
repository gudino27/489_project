import React, { useState, useEffect } from 'react';
import { Maximize2, X, Home, Bath } from 'lucide-react';

const DesignPreview = ({ designData, hasKitchen, hasBathroom }) => {
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

    // If we have saved images, use those with room switching
    if (currentImages.floor_plan || currentImages.wall_views) {
        return (
            <div className="design-preview">
                {/* Room Switcher - Only show if both rooms exist */}
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

                {/* Single Room Label - Show if only one room exists */}
                {(hasKitchen && !hasBathroom) && (
                    <div className="text-center mb-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                            <Home className="w-4 h-4" />
                            Kitchen Design
                        </span>
                    </div>
                )}

                {(hasBathroom && !hasKitchen) && (
                    <div className="text-center mb-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                            <Bath className="w-4 h-4" />
                            Bathroom Design
                        </span>
                    </div>
                )}

                {/* View Mode Controls */}
                <div className="mb-4 flex gap-2">
                    <button
                        onClick={() => setViewMode('floor')}
                        className={`px-4 py-2 rounded ${viewMode === 'floor' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        Floor Plan
                    </button>
                    <button
                        onClick={() => setViewMode('walls')}
                        className={`px-4 py-2 rounded ${viewMode === 'walls' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                    >
                        Wall Views
                    </button>
                    <button
                        onClick={() => setShowFullscreen(true)}
                        className="ml-auto px-4 py-2 bg-gray-200 rounded flex items-center gap-2"
                    >
                        <Maximize2 className="w-4 h-4" />
                        Fullscreen
                    </button>
                </div>

                {/* Floor Plan View */}
                {viewMode === 'floor' && currentImages.floor_plan && (
                    <div className="border rounded-lg p-4 bg-white">
                        <div className="text-center mb-2">
                            <span className="text-sm text-gray-600">
                                {activeRoom === 'kitchen' ? 'Kitchen' : 'Bathroom'} Floor Plan
                            </span>
                        </div>
                        <img
                            src={currentImages.floor_plan}
                            alt={`${activeRoom} Floor Plan`}
                            className="w-full h-auto"
                        />
                    </div>
                )}

                {/* Wall Views */}
                {viewMode === 'walls' && currentImages.wall_views && (
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            {[1, 2, 3, 4].map(wall => (
                                <button
                                    key={wall}
                                    onClick={() => setSelectedWall(wall)}
                                    className={`px-3 py-1 rounded ${selectedWall === wall ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                                >
                                    Wall {wall}
                                </button>
                            ))}
                        </div>
                        <div className="border rounded-lg p-4 bg-white">
                            <div className="text-center mb-2">
                                <span className="text-sm text-gray-600">
                                    {activeRoom === 'kitchen' ? 'Kitchen' : 'Bathroom'} Wall {selectedWall}
                                </span>
                            </div>
                            {currentImages.wall_views.find(w => w.wall === selectedWall) && (
                                <img
                                    src={currentImages.wall_views.find(w => w.wall === selectedWall).image}
                                    alt={`${activeRoom} Wall ${selectedWall}`}
                                    className="w-full h-auto"
                                />
                            )}
                        </div>
                    </div>
                )}

                {/* Fullscreen Modal */}
                {showFullscreen && (
                    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
                        <button
                            onClick={() => setShowFullscreen(false)}
                            className="absolute top-4 right-4 text-white"
                        >
                            <X className="w-8 h-8" />
                        </button>
                        <img
                            src={viewMode === 'floor' ? currentImages.floor_plan :
                                currentImages.wall_views?.find(w => w.wall === selectedWall)?.image}
                            alt="Design Preview"
                            className="max-w-full max-h-full"
                        />
                    </div>
                )}
            </div>
        );
    }

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

    // SVG Generation code (rest remains the same but uses roomData)
    const calculateScale = () => {
        if (!roomData || !roomData.dimensions) return 2;

        const roomWidthFeet = parseFloat(roomData.dimensions.width) || 10;
        const roomHeightFeet = parseFloat(roomData.dimensions.height) || 10;

        // Determine desired canvas size based on room type
        const isSmallRoom = roomWidthFeet <= 10 && roomHeightFeet <= 10;
        const maxCanvasSize = 600; // Maximum canvas dimension

        // Calculate scale to fit room nicely in canvas
        const roomWidthInches = roomWidthFeet * 12;
        const roomHeightInches = roomHeightFeet * 12;

        const scaleX = (maxCanvasSize - 60) / roomWidthInches;
        const scaleY = (maxCanvasSize - 60) / roomHeightInches;

        let scale = Math.min(scaleX, scaleY);

        // Ensure minimum and maximum scale
        scale = Math.max(1.5, Math.min(scale, 4));

        // For very small rooms (like bathrooms), use a larger scale
        if (isSmallRoom) {
            scale = Math.min(scale * 1.5, 4);
        }

        return scale;
    };

    const scale = calculateScale();
    const roomWidth = parseFloat(roomData.dimensions.width) * 12 * scale;
    const roomHeight = parseFloat(roomData.dimensions.height) * 12 * scale;
    const wallHeight = parseFloat(roomData.dimensions.wallHeight);


    // Element types for rendering - Enhanced for better bathroom display
    const elementTypes = {
        'base': { name: 'Base Cabinet', defaultHeight: 34.5, color: '#8B4513' },
        'wall': { name: 'Wall Cabinet', defaultHeight: 30, color: '#A0522D' },
        'tall': { name: 'Tall Cabinet', defaultHeight: 84, color: '#8B4513' },
        'corner': { name: 'Corner Cabinet', defaultHeight: 34.5, color: '#8B4513' },
        'sink-base': { name: 'Sink Base', defaultHeight: 34.5, color: '#8B4513' },
        'vanity': { name: 'Vanity Cabinet', defaultHeight: 32, color: '#8B4513' },
        'vanity-sink': { name: 'Vanity with Sink', defaultHeight: 32, color: '#654321' },
        'medicine': { name: 'Medicine Cabinet', defaultHeight: 30, color: '#A0522D' },
        'linen': { name: 'Linen Cabinet', defaultHeight: 84, color: '#8B4513' },
        'refrigerator': { name: 'Refrigerator', defaultHeight: 70, color: '#C0C0C0' },
        'stove': { name: 'Stove/Range', defaultHeight: 36, color: '#666' },
        'dishwasher': { name: 'Dishwasher', defaultHeight: 34, color: '#C0C0C0' },
        'microwave': { name: 'Microwave', defaultHeight: 18, color: '#666' },
        'toilet': { name: 'Toilet', defaultHeight: 30, color: '#FFFFFF', stroke: '#999' },
        'tub': { name: 'Bathtub', defaultHeight: 20, color: '#E8F4FD', stroke: '#4A90E2' },
        'shower': { name: 'Shower', defaultHeight: 80, color: '#F0F8FF', stroke: '#4A90E2' }
    };

    const getElementsOnWall = (wallNumber) => {
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
                        <div>
                            <span className="text-gray-600">Wall Height:</span>
                            <span className="ml-1 font-medium">{roomData.dimensions.wallHeight}"</span>
                        </div>
                        <div>
                            <span className="text-gray-600">Elements:</span>
                            <span className="ml-1 font-medium">{roomData.elements.length}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* View Mode Controls */}
            <div className="mb-4 flex gap-2">
                <button
                    onClick={() => setViewMode('floor')}
                    className={`px-4 py-2 rounded ${viewMode === 'floor' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                    Floor Plan
                </button>
                <button
                    onClick={() => setViewMode('wall')}
                    className={`px-4 py-2 rounded ${viewMode === 'wall' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                >
                    Wall Views
                </button>
            </div>

            {/* SVG Floor Plan */}
            {viewMode === 'floor' ? (
                <div className="border rounded-lg p-4 bg-white">
                    <svg
                        width={roomWidth + 60}
                        height={roomHeight + 60}
                        className="border"
                        viewBox={`0 0 ${roomWidth + 60} ${roomHeight + 60}`}
                    >
                        {/* Room outline */}
                        <rect
                            x="30"
                            y="30"
                            width={roomWidth}
                            height={roomHeight}
                            fill="#f9f9f9"
                            stroke="#333"
                            strokeWidth="3"
                        />

                        {/* Grid */}
                        <defs>
                            <pattern id={`grid-${activeRoom}`} width={12 * scale} height={12 * scale} patternUnits="userSpaceOnUse">
                                <path d={`M ${12 * scale} 0 L 0 0 0 ${12 * scale}`} fill="none" stroke="#e0e0e0" strokeWidth="0.5" />
                            </pattern>

                            {/* Patterns for bathroom fixtures */}
                            <pattern id="tile" width="4" height="4" patternUnits="userSpaceOnUse">
                                <rect width="4" height="4" fill="#f0f0f0" />
                                <rect width="2" height="2" fill="#e0e0e0" />
                                <rect x="2" y="2" width="2" height="2" fill="#e0e0e0" />
                            </pattern>
                        </defs>
                        <rect x="30" y="30" width={roomWidth} height={roomHeight} fill={`url(#grid-${activeRoom})`} />

                        {/* Elements */}
                        {roomData.elements.map((element, index) => {
                            const spec = elementTypes[element.type] || { color: '#999', stroke: '#666' };
                            const width = element.width * scale;
                            const depth = element.depth * scale;

                            // Special rendering for bathroom fixtures
                            if (element.type === 'toilet') {
                                return (
                                    <g key={element.id || index} transform={`translate(${30 + element.x}, ${30 + element.y})`}>
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
                                    <g key={element.id || index} transform={`translate(${30 + element.x}, ${30 + element.y})`}>
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
                                    <g key={element.id || index} transform={`translate(${30 + element.x}, ${30 + element.y})`}>
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
                                            r="4"
                                            fill="#999"
                                            stroke="#666"
                                            strokeWidth="1"
                                        />
                                        <text
                                            x={width / 2}
                                            y={depth / 2 - 15}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fontSize="9"
                                            fill="#4A90E2"
                                            fontWeight="bold"
                                        >
                                            SHOWER
                                        </text>
                                    </g>
                                );
                            }

                            if (element.type === 'vanity' || element.type === 'vanity-sink') {
                                return (
                                    <g key={element.id || index} transform={`translate(${30 + element.x}, ${30 + element.y})`}>
                                        {/* Vanity cabinet */}
                                        <rect
                                            width={width}
                                            height={depth}
                                            fill={spec.color}
                                            stroke="#333"
                                            strokeWidth="2"
                                            rx="2"
                                        />
                                        {/* Sink if vanity-sink */}
                                        {element.type === 'vanity-sink' && (
                                            <>
                                                <ellipse
                                                    cx={width / 2}
                                                    cy={depth / 2}
                                                    rx={width * 0.25}
                                                    ry={depth * 0.25}
                                                    fill="#ffffff"
                                                    stroke="#999"
                                                    strokeWidth="1"
                                                />
                                                <circle
                                                    cx={width / 2}
                                                    cy={depth / 2}
                                                    r="2"
                                                    fill="#999"
                                                />
                                            </>
                                        )}
                                        <text
                                            x={width / 2}
                                            y={element.type === 'vanity-sink' ? depth * 0.8 : depth / 2}
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                            fontSize="8"
                                            fill="white"
                                            fontWeight="bold"
                                        >
                                            {element.type === 'vanity-sink' ? 'SINK' : 'VANITY'}
                                        </text>
                                    </g>
                                );
                            }

                            // Default rendering for other elements
                            return (
                                <g key={element.id || index} transform={`translate(${30 + element.x}, ${30 + element.y})`}>
                                    <rect
                                        width={width}
                                        height={depth}
                                        fill={spec.color}
                                        stroke={spec.stroke || "#333"}
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
            ) : (
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
                                            rx="3"
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
        </div>
    );
};

export default DesignPreview;