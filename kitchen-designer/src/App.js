import React, { useState, useRef, useEffect } from 'react';
import { 
  RotateCw,        // Cabinet rotation icon
  Trash2,          // Delete element icon
  Calculator,      // Pricing calculator icon
  Send,            // Send quote icon
  Home,            // Kitchen room icon
  Bath             // Bathroom room icon
} from 'lucide-react';
import jsPDF from 'jspdf';               // PDF generation library
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';

// Component imports for different app sections
import AdminPanel from './AdminPanel';         // Admin pricing and photo management
import DesignPreview from './DesignPreview'; // Preview of design before submission

// -----------------------------
// Main Kitchen Designer Component
// This is the core cabinet design application
// -----------------------------
const KitchenDesigner = () => {
  // -----------------------------
  // Business Configuration
  // In production, these would come from environment variables or database
  // -----------------------------
  const COMPANY_NAME = 'Master Build Cabinets';
  // -----------------------------
  // Application State Management
  // Controls the current step and active room being designed
  // -----------------------------
  const [step, setStep] = useState('dimensions');        // 'dimensions' or 'design'
  const [activeRoom, setActiveRoom] = useState('kitchen'); // Currently designing room
  // -----------------------------
  // Room Data State
  // Separate state objects for kitchen and bathroom designs
  // Each room maintains its own dimensions, elements, materials, and color choices
  // -----------------------------
  const [kitchenData, setKitchenData] = useState({
    dimensions: { width: '', height: '', wallHeight: '96' },
    elements: [],      // Array of placed cabinets/appliances
    materials: {},     // Material choices per cabinet (by element ID)
    colorCount: 1      // Number of cabinet colors (affects pricing)
  });
  
  const [bathroomData, setBathroomData] = useState({
    dimensions: { width: '', height: '', wallHeight: '96' },
    elements: [],
    materials: {},
    colorCount: 1
  });

  // -----------------------------
  // Current Room Helper Variables
  // These provide easy access to the currently active room's data
  // -----------------------------
  const currentRoomData = activeRoom === 'kitchen' ? kitchenData : bathroomData;
  const setCurrentRoomData = activeRoom === 'kitchen' ? setKitchenData : setBathroomData;

  // -----------------------------
  // UI and Interaction State
  // Controls user interface elements and interactions
  // -----------------------------
  const [selectedElement, setSelectedElement] = useState(null);           // Currently selected cabinet/appliance
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });          // Mouse offset for dragging
  const [isDragging, setIsDragging] = useState(false);                   // Floor plan dragging state
  const [isDraggingWallView, setIsDraggingWallView] = useState(false);   // Wall view dragging state
  const [scale, setScale] = useState(1);                                 // Canvas scaling factor
  const [viewMode, setViewMode] = useState('floor');                     // 'floor' or 'wall' view
  const [selectedWall, setSelectedWall] = useState(1);                   // Wall number for wall view (1-4)
  const [showPricing, setShowPricing] = useState(false);                 // Show/hide pricing panel
  const [showQuoteForm, setShowQuoteForm] = useState(false);             // Show/hide quote form modal

  // -----------------------------
  // Client Information for Quote Generation
  // Stores customer contact details and preferences
  // -----------------------------
  const [clientInfo, setClientInfo] = useState({
    name: '',
    contactPreference: 'email',    // 'email', 'phone', or 'text'
    email: '',
    phone: '',
    comments: '',                  // Special requests/notes
    includeKitchen: true,         // Include kitchen in quote
    includeBathroom: false        // Include bathroom in quote
  });

  // -----------------------------
  // Canvas References
  // DOM references for the different view canvases
  // -----------------------------
  const canvasRef = useRef(null);      // Main floor plan canvas
  const floorPlanRef = useRef(null);   // Floor plan container for PDF export
  const wallViewRef = useRef(null);    // Wall elevation view canvas

  // -----------------------------
  // Dynamic Pricing State
  // Pricing data loaded from backend database
  // Falls back to default values if API is unavailable
  // -----------------------------
  const [basePrices, setBasePrices] = useState({
    'base': 250,
    'sink-base': 320,
    'wall': 180,
    'tall': 450,
    'corner': 380,
    'vanity': 280,
    'vanity-sink': 350,
    'medicine': 120,
    'linen': 350
  });

  const [materialMultipliers, setMaterialMultipliers] = useState({
    'laminate': 1.0,    // Standard pricing (no multiplier)
    'wood': 1.5,        // 50% upcharge for solid wood
    'plywood': 1.3      // 30% upcharge for plywood
  });

  const [colorPricing, setColorPricing] = useState({
    1: 0,           // Single color included
    2: 100,         // Two colors add $100
    3: 200,         // Three colors add $200
    'custom': 500   // Custom colors add $500
  });

  const [pricesLoading, setPricesLoading] = useState(true);

  // -----------------------------
  // API Configuration
  // Backend API endpoint for price loading
  // -----------------------------
  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // -----------------------------
  // Load prices from backend on component mount
  // Fetches current pricing from database, falls back to defaults if unavailable
  // -----------------------------
  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/prices`);
      if (response.ok) {
        const data = await response.json();
        setBasePrices(data.basePrices);
        setMaterialMultipliers(data.materialMultipliers);
        setColorPricing(data.colorPricing);
        console.log('Loaded prices from database:', data);
      } else {
        console.error('Failed to load prices, using defaults');
      }
    } catch (error) {
      console.error('Error loading prices:', error);
      // Keep default prices if API fails
    } finally {
      setPricesLoading(false);
    }
  };

  // -----------------------------
  // Cabinet and Appliance Specifications
  // Defines all available elements with their properties, dimensions, and behavior
  // Organized by room type (kitchen/bathroom) and category (cabinet/appliance)
  // -----------------------------
  const elementTypes = {
    // ========== KITCHEN CABINETS ==========
    'base': {
      name: 'Base Cabinet',
      defaultWidth: 24,
      defaultDepth: 24,
      fixedHeight: 34.5,        // Standard counter height
      color: '#d3d3d3',
      category: 'cabinet',
      zIndex: 1,                // Render order (lower = behind)
      room: 'kitchen'
    },
    'sink-base': {
      name: 'Sink Base Cabinet',
      defaultWidth: 33,         // Wider to accommodate sink
      defaultDepth: 24,
      fixedHeight: 34.5,
      color: '#d3d3d3',
      category: 'cabinet',
      zIndex: 1,
      room: 'kitchen',
      hasSink: true             // Special rendering flag
    },
    'wall': {
      name: 'Wall Cabinet',
      defaultWidth: 24,
      defaultDepth: 12,         // Shallower depth for wall mounting
      minHeight: 12,            // Minimum height constraint
      defaultHeight: 30,
      color: '#d3d3d3',
      category: 'cabinet',
      zIndex: 2,                // Render above base cabinets
      room: 'kitchen',
      mountHeight: 54           // Default distance from floor to bottom of cabinet
    },
    'tall': {
      name: 'Tall Cabinet',
      defaultWidth: 24,
      defaultDepth: 24,
      minHeight: 40,            // Minimum height for tall cabinets
      defaultHeight: 84,        // Floor to ceiling typical
      color: '#d3d3d3',
      category: 'cabinet',
      zIndex: 1,
      room: 'kitchen'
    },
    'corner': {
      name: 'Corner Cabinet (Lazy Susan)',
      defaultWidth: 36,         // Square corner cabinet
      defaultDepth: 36,
      fixedHeight: 34.5,
      color: '#d3d3d3',
      category: 'cabinet',
      shape: 'corner',          // Special shape rendering
      zIndex: 1,
      room: 'kitchen'
    },

    // ========== BATHROOM CABINETS ==========
    'vanity': {
      name: 'Vanity Cabinet',
      defaultWidth: 30,
      defaultDepth: 21,         // Standard vanity depth
      fixedHeight: 32,          // Lower than kitchen counters
      color: '#d3d3d3',
      category: 'cabinet',
      zIndex: 1,
      room: 'bathroom'
    },
    'vanity-sink': {
      name: 'Vanity with Sink',
      defaultWidth: 36,         // Wider for sink accommodation
      defaultDepth: 21,
      fixedHeight: 32,
      color: '#d3d3d3',
      category: 'cabinet',
      zIndex: 1,
      room: 'bathroom',
      hasSink: true
    },
    'medicine': {
      name: 'Medicine Cabinet',
      defaultWidth: 24,
      defaultDepth: 6,          // Very shallow wall mount
      fixedHeight: 30,
      color: '#d3d3d3',
      category: 'cabinet',
      zIndex: 2,
      room: 'bathroom',
      mountHeight: 48           // Higher mounting for mirror access
    },
    'linen': {
      name: 'Linen Cabinet',
      defaultWidth: 18,         // Narrow width
      defaultDepth: 21,
      defaultHeight: 84,        // Tall storage
      minHeight: 60,
      color: '#d3d3d3',
      category: 'cabinet',
      zIndex: 1,
      room: 'bathroom'
    },

    // ========== KITCHEN APPLIANCES ==========
    'refrigerator': {
      name: 'Refrigerator',
      defaultWidth: 36,         // Standard fridge width
      defaultDepth: 30,
      fixedHeight: 70,          // Tall appliance
      color: '#e0e0e0',         // Different color for appliances
      category: 'appliance',
      zIndex: 1,
      room: 'kitchen'
    },
    'stove': {
      name: 'Stove/Range',
      defaultWidth: 30,
      defaultDepth: 26,
      fixedHeight: 36,          // Counter height appliance
      color: '#e0e0e0',
      category: 'appliance',
      zIndex: 1,
      room: 'kitchen'
    },
    'dishwasher': {
      name: 'Dishwasher',
      defaultWidth: 24,         // Standard DW width
      defaultDepth: 24,
      fixedHeight: 34,          // Fits under counter
      color: '#e0e0e0',
      category: 'appliance',
      zIndex: 1,
      room: 'kitchen'
    },

    // ========== BATHROOM FIXTURES ==========
    'toilet': {
      name: 'Toilet',
      defaultWidth: 20,
      defaultDepth: 28,         // Includes tank depth
      fixedHeight: 30,
      color: '#e0e0e0',
      category: 'appliance',    // Grouped with appliances for simplicity
      zIndex: 1,
      room: 'bathroom'
    },
    'bathtub': {
      name: 'Bathtub',
      defaultWidth: 60,         // Standard tub length
      defaultDepth: 30,
      fixedHeight: 20,          // Tub height
      color: '#e0e0e0',
      category: 'appliance',
      zIndex: 1,
      room: 'bathroom'
    },
    'shower': {
      name: 'Shower',
      defaultWidth: 36,         // Square shower
      defaultDepth: 36,
      fixedHeight: 80,          // Shower enclosure height
      color: '#e0e0e0',
      category: 'appliance',
      zIndex: 1,
      room: 'bathroom'
    }
  };

  // -----------------------------
  // Local Storage Integration
  // Automatically save and restore design state
  // -----------------------------

  // Load saved state on component mount
  useEffect(() => {
    const savedKitchen = localStorage.getItem('kitchenDesignState');
    const savedBathroom = localStorage.getItem('bathroomDesignState');

    if (savedKitchen) {
      const state = JSON.parse(savedKitchen);
      setKitchenData(state);
    }

    if (savedBathroom) {
      const state = JSON.parse(savedBathroom);
      setBathroomData(state);
    }
  }, []);

  // Save state whenever data changes (auto-save functionality)
  useEffect(() => {
    if (step === 'design') {
      localStorage.setItem('kitchenDesignState', JSON.stringify(kitchenData));
      localStorage.setItem('bathroomDesignState', JSON.stringify(bathroomData));
    }
  }, [kitchenData, bathroomData, step]);

  // -----------------------------
  // Room Setup and Navigation Functions
  // Handle initial room configuration and switching between rooms
  // -----------------------------

  const handleDimensionsSubmit = () => {
    const dims = currentRoomData.dimensions;
    if (dims.width && dims.height && dims.wallHeight) {
      // Calculate optimal canvas scale based on room size
      const widthInches = parseFloat(dims.width) * 12;
      const heightInches = parseFloat(dims.height) * 12;
      const maxCanvasSize = 600;
      const newScale = Math.min(maxCanvasSize / widthInches, maxCanvasSize / heightInches);
      setScale(newScale);
      setStep('design'); // Move to design interface
    }
  };

  // Show loading screen while prices are being fetched
  if (pricesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading cabinet designer...</p>
        </div>
      </div>
    );
  }

  // -----------------------------
  // Pricing Calculation Functions
  // Calculate total cost based on cabinets, materials, and options
  // -----------------------------
  const calculateTotalPrice = (roomData = null) => {
    const data = roomData || currentRoomData;
    let total = 0;
    const cabinets = data.elements.filter(el => el.category === 'cabinet');

    cabinets.forEach(cabinet => {
      const basePrice = basePrices[cabinet.type] || 250;                    // Get base price for cabinet type
      const material = data.materials[cabinet.id] || 'laminate';            // Get material choice
      const materialMultiplier = materialMultipliers[material];             // Get material cost multiplier

      // Calculate size multiplier based on width (24" is standard)
      const sizeMultiplier = cabinet.width / 24;

      total += basePrice * materialMultiplier * sizeMultiplier;
    });

    // Add color upcharge based on number of colors selected
    total += colorPricing[data.colorCount] || 0;

    return total;
  };

  // -----------------------------
  // Cabinet Snapping Functions
  // Automatically align cabinets to each other and walls for clean layouts
  // -----------------------------

  // Snap cabinet to adjacent cabinets
  const snapToCabinet = (x, y, width, depth, excludeId, rotation) => {
    const snapDistance = 5; // Pixels within which to snap
    let snappedX = x;
    let snappedY = y;
    let snapped = false;

    currentRoomData.elements.forEach(element => {
      if (element.id !== excludeId && element.category === 'cabinet') {
        const elX = element.x;
        const elY = element.y;
        // Calculate element dimensions based on rotation
        const elWidth = element.rotation % 180 === 0 ? element.width * scale : element.depth * scale;
        const elDepth = element.rotation % 180 === 0 ? element.depth * scale : element.width * scale;

        // Snap to right side of existing element
        if (Math.abs((elX + elWidth) - x) < snapDistance &&
          Math.abs(elY - y) < elDepth && Math.abs((elY + elDepth) - (y + depth)) < elDepth) {
          snappedX = elX + elWidth;
          snapped = true;
        }
        // Snap to left side of existing element
        else if (Math.abs(elX - (x + width)) < snapDistance &&
          Math.abs(elY - y) < elDepth && Math.abs((elY + elDepth) - (y + depth)) < elDepth) {
          snappedX = elX - width;
          snapped = true;
        }
        // Snap to bottom of existing element
        else if (Math.abs((elY + elDepth) - y) < snapDistance &&
          Math.abs(elX - x) < elWidth && Math.abs((elX + elWidth) - (x + width)) < elWidth) {
          snappedY = elY + elDepth;
          snapped = true;
        }
        // Snap to top of existing element
        else if (Math.abs(elY - (y + depth)) < snapDistance &&
          Math.abs(elX - x) < elWidth && Math.abs((elX + elWidth) - (x + width)) < elWidth) {
          snappedY = elY - depth;
          snapped = true;
        }
      }
    });

    return { x: snappedX, y: snappedY, snapped };
  };

  // Snap cabinet to room walls
  const snapToWall = (x, y, width, depth) => {
    const roomWidth = parseFloat(currentRoomData.dimensions.width) * 12 * scale;
    const roomHeight = parseFloat(currentRoomData.dimensions.height) * 12 * scale;
    const snapDistance = 10;

    let snappedX = x;
    let snappedY = y;

    // Snap to each wall if within snap distance
    if (x < snapDistance) snappedX = 0;                                    // Left wall
    if (x + width > roomWidth - snapDistance) snappedX = roomWidth - width; // Right wall
    if (y < snapDistance) snappedY = 0;                                    // Top wall
    if (y + depth > roomHeight - snapDistance) snappedY = roomHeight - depth; // Bottom wall

    // Ensure element stays within room bounds
    snappedX = Math.max(0, Math.min(snappedX, roomWidth - width));
    snappedY = Math.max(0, Math.min(snappedY, roomHeight - depth));

    return { x: snappedX, y: snappedY };
  };

  // -----------------------------
  // Element Management Functions
  // Add, update, delete, and manipulate cabinet/appliance elements
  // -----------------------------

  // Add new element to the room
  const addElement = (type) => {
    const elementSpec = elementTypes[type];
    // Place new element in center of room
    const roomCenter = {
      x: (parseFloat(currentRoomData.dimensions.width) * 12 * scale) / 2,
      y: (parseFloat(currentRoomData.dimensions.height) * 12 * scale) / 2
    };

    const newElement = {
      id: Date.now(),                                                        // Unique ID based on timestamp
      type: type,
      x: roomCenter.x - (elementSpec.defaultWidth * scale) / 2,            // Center horizontally
      y: roomCenter.y - (elementSpec.defaultDepth * scale) / 2,            // Center vertically
      width: elementSpec.defaultWidth,
      depth: elementSpec.defaultDepth,
      actualHeight: elementSpec.fixedHeight || elementSpec.defaultHeight,   // Use fixed height if available
      mountHeight: elementSpec.mountHeight || 0,                            // Wall mount height (0 for floor cabinets)
      color: elementSpec.color,
      rotation: 0,                                                          // No rotation initially
      hingeDirection: 'left',                                               // For corner cabinets
      category: elementSpec.category,
      zIndex: elementSpec.zIndex
    };

    const updatedData = {
      ...currentRoomData,
      elements: [...currentRoomData.elements, newElement]
    };

    // Set default material for cabinets
    if (newElement.category === 'cabinet') {
      updatedData.materials = { ...updatedData.materials, [newElement.id]: 'laminate' };
    }

    setCurrentRoomData(updatedData);
    setSelectedElement(newElement.id); // Auto-select newly added element
  };

  // -----------------------------
  // Mouse Event Handlers
  // Handle dragging and interaction with elements on the canvas
  // -----------------------------

  // Start dragging an element in floor plan view
  const handleMouseDown = (e, elementId) => {
    e.preventDefault();
    const element = currentRoomData.elements.find(el => el.id === elementId);
    if (element) {
      // Convert mouse coordinates to SVG coordinates
      const rect = canvasRef.current.getBoundingClientRect();
      const svgPt = canvasRef.current.createSVGPoint();
      svgPt.x = e.clientX;
      svgPt.y = e.clientY;
      const cursorPt = svgPt.matrixTransform(canvasRef.current.getScreenCTM().inverse());

      // Calculate offset from element position to mouse click
      setDragOffset({
        x: cursorPt.x - element.x - 30, // Account for canvas offset
        y: cursorPt.y - element.y - 30
      });
      setIsDragging(true);
      setSelectedElement(elementId);
    }
  };

  // Start dragging wall-mounted element in wall view
  const handleWallViewMouseDown = (e, elementId) => {
    e.preventDefault();
    const element = currentRoomData.elements.find(el => el.id === elementId);
    if (element && (element.type === 'wall' || element.type === 'medicine')) {
      setIsDraggingWallView(false);
      setSelectedElement(elementId);

      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: e.clientX,
        y: e.clientY - rect.top,
        startMount: element.mountHeight // Remember starting mount height
      });
    }
  };

  // Handle mouse movement during dragging
  const handleMouseMove = (e) => {
    if (isDragging && selectedElement) {
      const element = currentRoomData.elements.find(el => el.id === selectedElement);
      if (element && canvasRef.current) {
        // Convert mouse coordinates to SVG coordinates
        const svgPt = canvasRef.current.createSVGPoint();
        svgPt.x = e.clientX;
        svgPt.y = e.clientY;
        const cursorPt = svgPt.matrixTransform(canvasRef.current.getScreenCTM().inverse());

        const newX = cursorPt.x - dragOffset.x - 30;
        const newY = cursorPt.y - dragOffset.y - 30;

        // Calculate element dimensions based on rotation
        const elementWidth = element.rotation % 180 === 0 ? element.width * scale : element.depth * scale;
        const elementDepth = element.rotation % 180 === 0 ? element.depth * scale : element.width * scale;

        // Keep element within room bounds
        const roomWidth = parseFloat(currentRoomData.dimensions.width) * 12 * scale;
        const roomHeight = parseFloat(currentRoomData.dimensions.height) * 12 * scale;

        let boundedX = Math.max(0, Math.min(newX, roomWidth - elementWidth));
        let boundedY = Math.max(0, Math.min(newY, roomHeight - elementDepth));

        // Try snapping to other cabinets first
        let position = snapToCabinet(boundedX, boundedY, elementWidth, elementDepth, element.id, element.rotation);

        // If not snapped to cabinet, try snapping to walls
        if (!position.snapped) {
          position = snapToWall(boundedX, boundedY, elementWidth, elementDepth);
        }

        updateElement(element.id, { x: position.x, y: position.y });
      }
    } else if (isDraggingWallView && selectedElement) {
      // Handle wall view cabinet mount height adjustment
      const element = currentRoomData.elements.find(el => el.id === selectedElement);
      if (element) {
        const rect = e.currentTarget.getBoundingClientRect();
        const deltaY = e.clientY - dragOffset.x;
        const wallHeight = parseFloat(currentRoomData.dimensions.wallHeight);
        const viewScale = Math.min(800 / (wallHeight * 12), 400 / wallHeight);

        // Convert pixel movement to inches
        const mountDelta = deltaY / viewScale;
        let newMount = dragOffset.startMount - mountDelta;

        // Constrain mount height to valid range
        const maxMount = wallHeight - element.actualHeight;
        newMount = Math.max(0, Math.min(newMount, maxMount));

        updateElement(element.id, { mountHeight: newMount });
      }
    }
  };

  // Stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
    setIsDraggingWallView(false);
  };

  // -----------------------------
  // Element Property Update Functions
  // Modify element properties like dimensions, position, rotation
  // -----------------------------

  // Update any property of an element
  const updateElement = (elementId, updates) => {
    setCurrentRoomData({
      ...currentRoomData,
      elements: currentRoomData.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      )
    });
  };

  // Update element dimensions with validation
  const updateElementDimensions = (elementId, property, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;

    const element = currentRoomData.elements.find(el => el.id === elementId);
    if (!element) return;

    const elementSpec = elementTypes[element.type];
    let updates = {};

    if (property === 'width') {
      updates.width = numValue;
    } else if (property === 'depth') {
      updates.depth = numValue;
    } else if (property === 'actualHeight') {
      // Height constraints vary by element type
      if (element.type === 'wall' || element.type === 'medicine') {
        const maxHeight = parseFloat(currentRoomData.dimensions.wallHeight) - element.mountHeight;
        const minHeight = elementSpec.minHeight || 12;
        updates.actualHeight = Math.max(minHeight, Math.min(numValue, maxHeight));
      } else if (element.type === 'tall' || element.type === 'linen') {
        const maxHeight = parseFloat(currentRoomData.dimensions.wallHeight);
        const minHeight = elementSpec.minHeight || 40;
        updates.actualHeight = Math.max(minHeight, Math.min(numValue, maxHeight));
      }
    } else if (property === 'mountHeight') {
      // Mount height constraints for wall cabinets
      const maxMount = parseFloat(currentRoomData.dimensions.wallHeight) - element.actualHeight;
      updates.mountHeight = Math.max(0, Math.min(numValue, maxMount));
    }

    updateElement(elementId, updates);
  };

  // Rotate element by specified angle
  const rotateElement = (elementId, angle) => {
    const element = currentRoomData.elements.find(el => el.id === elementId);
    if (element) {
      updateElement(elementId, { rotation: (element.rotation + angle) % 360 });
    }
  };

  // Set corner cabinet hinge direction
  const rotateCornerCabinet = (elementId, direction) => {
    updateElement(elementId, { hingeDirection: direction });
  };

  // Delete element and its associated data
  const deleteElement = (elementId) => {
    const updatedData = {
      ...currentRoomData,
      elements: currentRoomData.elements.filter(el => el.id !== elementId)
    };

    // Remove material selection for deleted cabinet
    if (currentRoomData.materials[elementId]) {
      const newMaterials = { ...currentRoomData.materials };
      delete newMaterials[elementId];
      updatedData.materials = newMaterials;
    }

    setCurrentRoomData(updatedData);
    setSelectedElement(null);
  };

  // -----------------------------
  // Design Management Functions
  // Handle room switching, design reset, and data persistence
  // -----------------------------

  // Reset current room design
  const resetDesign = () => {
    if (activeRoom === 'kitchen') {
      setKitchenData({
        dimensions: { width: '', height: '', wallHeight: '96' },
        elements: [],
        materials: {},
        colorCount: 1
      });
    } else {
      setBathroomData({
        dimensions: { width: '', height: '', wallHeight: '96' },
        elements: [],
        materials: {},
        colorCount: 1
      });
    }
    setSelectedElement(null);
    setStep('dimensions');
    localStorage.removeItem(`${activeRoom}DesignState`);
  };

  // Switch between kitchen and bathroom design
  const switchRoom = (room) => {
    setActiveRoom(room);
    setSelectedElement(null);
    setViewMode('floor');

    // Update canvas scale for the new room
    const roomData = room === 'kitchen' ? kitchenData : bathroomData;
    if (roomData.dimensions.width && roomData.dimensions.height) {
      const widthInches = parseFloat(roomData.dimensions.width) * 12;
      const heightInches = parseFloat(roomData.dimensions.height) * 12;
      const maxCanvasSize = 600;
      const newScale = Math.min(maxCanvasSize / widthInches, maxCanvasSize / heightInches);
      setScale(newScale);
    }
  };

  // -----------------------------
  // Wall View Helper Functions
  // Calculate which elements are positioned against specific walls
  // -----------------------------

  // Get elements positioned against a specific wall
  const getElementsOnWall = (wallNumber) => {
    const roomWidth = parseFloat(currentRoomData.dimensions.width) * 12 * scale;
    const roomHeight = parseFloat(currentRoomData.dimensions.height) * 12 * scale;
    const threshold = 20; // Distance from wall to be considered "on wall"

    return currentRoomData.elements.filter(element => {
      const elementWidth = element.rotation % 180 === 0 ? element.width * scale : element.depth * scale;
      const elementDepth = element.rotation % 180 === 0 ? element.depth * scale : element.width * scale;

      switch (wallNumber) {
        case 1: // Bottom wall
          return element.y + elementDepth > roomHeight - threshold;
        case 2: // Left wall
          return element.x < threshold;
        case 3: // Top wall
          return element.y < threshold;
        case 4: // Right wall
          return element.x + elementWidth > roomWidth - threshold;
        default:
          return false;
      }
    });
  };

  // -----------------------------
  // Special Rendering Functions
  // Custom rendering for special cabinet types and visual effects
  // -----------------------------

  // Render corner cabinet with special L-shape
  const renderCornerCabinet = (element) => {
    const x = element.x;
    const y = element.y;
    const size = element.width * scale;

    // Create L-shaped path based on hinge direction
    const path = element.hingeDirection === 'left'
      ? `M ${x} ${y} 
         L ${x + size} ${y} 
         L ${x + size} ${y + size * 0.6} 
         L ${x + size * 0.6} ${y + size * 0.6}
         L ${x + size * 0.6} ${y + size}
         L ${x} ${y + size} 
         Z`
      : `M ${x} ${y} 
         L ${x + size} ${y} 
         L ${x + size} ${y + size}
         L ${x + size * 0.4} ${y + size}
         L ${x + size * 0.4} ${y + size * 0.6}
         L ${x} ${y + size * 0.6}
         Z`;

    return (
      <g>
        <path
          d={path}
          fill="#d3d3d3"
          stroke="#333"
          strokeWidth="1"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={(e) => handleMouseDown(e, element.id)}
        />
        {/* Door division lines */}
        {element.hingeDirection === 'left' ? (
          <>
            <line x1={x + size * 0.6} y1={y} x2={x + size * 0.6} y2={y + size * 0.6} stroke="#333" strokeWidth="1" />
            <line x1={x} y1={y + size * 0.6} x2={x + size * 0.6} y2={y + size * 0.6} stroke="#333" strokeWidth="1" />
          </>
        ) : (
          <>
            <line x1={x + size * 0.4} y1={y} x2={x + size * 0.4} y2={y + size * 0.6} stroke="#333" strokeWidth="1" />
            <line x1={x + size * 0.4} y1={y + size * 0.6} x2={x + size} y2={y + size * 0.6} stroke="#333" strokeWidth="1" />
          </>
        )}
      </g>
    );
  };

  // Render door swing arc for cabinets
  const renderDoorGraphic = (x, y, width, depth, rotation) => {
    const cx = rotation === 0 ? x : rotation === 90 ? x + depth : rotation === 180 ? x + width : x;
    const cy = rotation === 0 ? y + depth : rotation === 90 ? y : rotation === 180 ? y : y + width;
    const radius = Math.min(width, depth) * 0.3;
    const startAngle = rotation;
    const endAngle = rotation + 90;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);

    return (
      <path
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`}
        fill="none"
        stroke="#666"
        strokeWidth="0.5"
        strokeDasharray="2,2"
      />
    );
  };

  // -----------------------------
  // PDF Generation and Quote Functions
  // Create professional quotes and send to contractor
  // -----------------------------

  // Generate PDF quote document
  const generatePDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let currentY = 20;

    // PDF Header
    pdf.setFontSize(20);
    pdf.text('Cabinet Design Quote', pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    pdf.setFontSize(12);
    pdf.text(COMPANY_NAME, pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // Client Information Section
    pdf.setFontSize(12);
    pdf.text(`Client: ${clientInfo.name}`, 20, currentY);
    currentY += 8;
    pdf.text(`Contact: ${clientInfo.contactPreference === 'email' ? clientInfo.email : clientInfo.phone}`, 20, currentY);
    currentY += 8;
    pdf.text(`Contact Method: ${clientInfo.contactPreference}`, 20, currentY);
    currentY += 8;
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, currentY);
    currentY += 15;

    // Process each room included in quote
    const roomsToInclude = [];
    if (clientInfo.includeKitchen && kitchenData.elements.length > 0) roomsToInclude.push({ name: 'Kitchen', data: kitchenData });
    if (clientInfo.includeBathroom && bathroomData.elements.length > 0) roomsToInclude.push({ name: 'Bathroom', data: bathroomData });

    for (const room of roomsToInclude) {
      // Start new page if needed
      if (currentY > pageHeight - 50) {
        pdf.addPage();
        currentY = 20;
      }

      // Room header
      pdf.setFontSize(16);
      pdf.text(room.name + ' Design', 20, currentY);
      currentY += 10;

      // Room dimensions
      pdf.setFontSize(10);
      pdf.text(`Room Dimensions: ${room.data.dimensions.width}' × ${room.data.dimensions.height}' × ${room.data.dimensions.wallHeight}" height`, 20, currentY);
      currentY += 10;

      // Cabinet specifications for this room
      const cabinets = room.data.elements.filter(el => el.category === 'cabinet');
      if (cabinets.length > 0) {
        pdf.setFontSize(12);
        pdf.text('Cabinet Specifications:', 20, currentY);
        currentY += 8;

        pdf.setFontSize(10);
        cabinets.forEach((cabinet, index) => {
          const spec = elementTypes[cabinet.type];
          const material = room.data.materials[cabinet.id] || 'laminate';
          const basePrice = basePrices[cabinet.type] || 250;
          const materialMultiplier = materialMultipliers[material];
          const sizeMultiplier = cabinet.width / 24;
          const price = basePrice * materialMultiplier * sizeMultiplier;

          pdf.text(`${index + 1}. ${spec.name}: ${cabinet.width}" × ${cabinet.depth}" × ${cabinet.actualHeight || spec.fixedHeight}"`, 25, currentY);
          pdf.text(`Material: ${material} - $${price.toFixed(2)}`, 140, currentY);
          currentY += 6;

          // Check if new page needed
          if (currentY > pageHeight - 20) {
            pdf.addPage();
            currentY = 20;
          }
        });

        // Room subtotal
        currentY += 5;
        const roomTotal = calculateTotalPrice(room.data);
        pdf.setFontSize(11);
        pdf.text(`${room.name} Total: $${roomTotal.toFixed(2)}`, 20, currentY);
        currentY += 10;
      }
    }

    // Grand total calculation
    if (currentY > pageHeight - 40) {
      pdf.addPage();
      currentY = 20;
    }

    currentY += 10;
    pdf.setFontSize(14);
    let grandTotal = 0;
    if (clientInfo.includeKitchen) grandTotal += calculateTotalPrice(kitchenData);
    if (clientInfo.includeBathroom) grandTotal += calculateTotalPrice(bathroomData);

    pdf.text(`Total Estimate: $${grandTotal.toFixed(2)}`, 20, currentY);
    currentY += 10;

    // Disclaimer
    pdf.setFontSize(10);
    pdf.text('* This is an estimate. Final pricing may vary based on specific requirements.', 20, currentY);
    currentY += 10;

    // Customer comments section
    if (clientInfo.comments) {
      pdf.text('Customer Notes:', 20, currentY);
      currentY += 6;
      const lines = pdf.splitTextToSize(clientInfo.comments, 170);
      pdf.text(lines, 20, currentY);
    }

    // Save PDF with client name and date
    pdf.save(`cabinet-design-${clientInfo.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);

    // Return PDF blob for potential email attachment
    return pdf.output('blob');
  };

  // Send quote to contractor
  // Send quote to contractor (modified to save to database)


const sendQuote = async () => {
  // Validate required client information
  if (!clientInfo.name || (clientInfo.contactPreference === 'email' && !clientInfo.email) ||
    (clientInfo.contactPreference !== 'email' && !clientInfo.phone)) {
    alert('Please fill in all required contact information.');
    return;
  }

  try {
    // Show loading state
    const loadingMessage = document.createElement('div');
    loadingMessage.innerHTML = 'Capturing your design...';
    loadingMessage.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 1000;';
    document.body.appendChild(loadingMessage);

    // Helper function to capture SVG as base64
    const captureSVG = (svgElement) => {
      if (!svgElement) return null;
      
      try {
        // Clone the SVG to avoid modifying the original
        const clonedSvg = svgElement.cloneNode(true);
        
        // Add white background
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', '100%');
        background.setAttribute('height', '100%');
        background.setAttribute('fill', 'white');
        clonedSvg.insertBefore(background, clonedSvg.firstChild);
        
        // Serialize to string
        const svgData = new XMLSerializer().serializeToString(clonedSvg);
        
        // Convert to base64
        const base64 = btoa(unescape(encodeURIComponent(svgData)));
        return `data:image/svg+xml;base64,${base64}`;
      } catch (error) {
        console.error('Error capturing SVG:', error);
        return null;
      }
    };

    // Capture floor plan
    let floorPlanImage = null;
    if (viewMode !== 'floor') {
      setViewMode('floor');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const floorCanvas = canvasRef.current;
    if (floorCanvas) {
      floorPlanImage = captureSVG(floorCanvas);
    }

    // Capture wall views
    const wallViewImages = [];
    setViewMode('wall');
    await new Promise(resolve => setTimeout(resolve, 100));

    for (let wall = 1; wall <= 4; wall++) {
      setSelectedWall(wall);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const wallCanvas = wallViewRef.current;
      if (wallCanvas) {
        const wallImage = captureSVG(wallCanvas);
        if (wallImage) {
          wallViewImages.push({
            wall: wall,
            image: wallImage
          });
        }
      }
    }

    // Return to floor view
    setViewMode('floor');

    loadingMessage.innerHTML = 'Generating PDF...';

    // Generate PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let currentY = 20;

    // PDF Header
    pdf.setFontSize(20);
    pdf.text('Cabinet Design Quote', pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    pdf.setFontSize(12);
    pdf.text(COMPANY_NAME, pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // Client Information
    pdf.setFontSize(12);
    pdf.text(`Client: ${clientInfo.name}`, 20, currentY);
    currentY += 8;
    pdf.text(`Contact: ${clientInfo.contactPreference === 'email' ? clientInfo.email : clientInfo.phone}`, 20, currentY);
    currentY += 8;
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, currentY);
    currentY += 15;

    // Add floor plan to PDF
    if (floorPlanImage) {
      pdf.setFontSize(14);
      pdf.text('Floor Plan Design', 20, currentY);
      currentY += 10;
      
      try {
        pdf.addImage(floorPlanImage, 'PNG', 20, currentY, 170, 100);
        currentY += 110;
      } catch (e) {
        console.error('Error adding floor plan to PDF:', e);
        pdf.text('(Floor plan preview available in admin panel)', 20, currentY);
        currentY += 10;
      }
    }

    // Calculate totals
    let grandTotal = 0;
    if (clientInfo.includeKitchen) grandTotal += calculateTotalPrice(kitchenData);
    if (clientInfo.includeBathroom) grandTotal += calculateTotalPrice(bathroomData);

    // Add wall views on new page
    if (wallViewImages.length > 0) {
      pdf.addPage();
      currentY = 20;
      
      pdf.setFontSize(16);
      pdf.text('Wall Elevation Views', pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;

      for (let i = 0; i < wallViewImages.length; i++) {
        if (i % 2 === 0 && i > 0) {
          pdf.addPage();
          currentY = 20;
        }

        pdf.setFontSize(12);
        pdf.text(`Wall ${wallViewImages[i].wall}`, 20, currentY);
        currentY += 5;

        try {
          pdf.addImage(wallViewImages[i].image, 'PNG', 20, currentY, 170, 80);
          currentY += 90;
        } catch (e) {
          console.error('Error adding wall view to PDF:', e);
          pdf.text('(Wall view available in admin panel)', 20, currentY);
          currentY += 10;
        }
      }
    }

    // Add specifications
    pdf.addPage();
    currentY = 20;

    pdf.setFontSize(16);
    pdf.text('Cabinet Specifications', 20, currentY);
    currentY += 15;

    // Process each room
    const roomsToInclude = [];
    if (clientInfo.includeKitchen && kitchenData.elements.length > 0) {
      roomsToInclude.push({ name: 'Kitchen', data: kitchenData });
    }
    if (clientInfo.includeBathroom && bathroomData.elements.length > 0) {
      roomsToInclude.push({ name: 'Bathroom', data: bathroomData });
    }

    for (const room of roomsToInclude) {
      pdf.setFontSize(14);
      pdf.text(`${room.name} (${room.data.dimensions.width}' × ${room.data.dimensions.height}')`, 20, currentY);
      currentY += 8;

      const cabinets = room.data.elements.filter(el => el.category === 'cabinet');
      
      pdf.setFontSize(10);
      cabinets.forEach((cabinet, index) => {
        const material = room.data.materials[cabinet.id] || 'laminate';
        pdf.text(`${index + 1}. ${cabinet.type}: ${cabinet.width}" × ${cabinet.depth}" - ${material}`, 25, currentY);
        currentY += 6;

        if (currentY > pageHeight - 30) {
          pdf.addPage();
          currentY = 20;
        }
      });

      const roomTotal = calculateTotalPrice(room.data);
      pdf.setFontSize(11);
      pdf.text(`${room.name} Total: $${roomTotal.toFixed(2)}`, 20, currentY);
      currentY += 10;
    }

    // Grand total
    pdf.setFontSize(14);
    pdf.text(`Total Estimate: $${grandTotal.toFixed(2)}`, 20, currentY);

    // Get PDF blob
    const pdfBlob = pdf.output('blob');

    loadingMessage.innerHTML = 'Sending design...';

    // Create form data
    const formData = new FormData();
    formData.append('pdf', pdfBlob, 'design.pdf');
    
    // Design data with images
    const designData = {
      client_name: clientInfo.name,
      client_email: clientInfo.email || '',
      client_phone: clientInfo.phone || '',
      contact_preference: clientInfo.contactPreference,
      kitchen_data: clientInfo.includeKitchen ? kitchenData : null,
      bathroom_data: clientInfo.includeBathroom ? bathroomData : null,
      include_kitchen: clientInfo.includeKitchen,
      include_bathroom: clientInfo.includeBathroom,
      total_price: grandTotal,
      comments: clientInfo.comments || '',
      floor_plan_image: floorPlanImage,
      wall_view_images: wallViewImages
    };
    
    console.log('Sending design:', {
      hasFloorPlan: !!floorPlanImage,
      wallViews: wallViewImages.length,
      dataSize: JSON.stringify(designData).length
    });
    
    formData.append('designData', JSON.stringify(designData));

    // Send to backend
    const response = await fetch(`${API_BASE}/api/designs`, {
      method: 'POST',
      body: formData
    });

    document.body.removeChild(loadingMessage);

    if (response.ok) {
      const result = await response.json();
      
      alert(`Thank you! Your design has been sent to ${COMPANY_NAME}.`);
      
      // Reset form
      setClientInfo({
        name: '',
        email: '',
        phone: '',
        contactPreference: 'email',
        includeKitchen: true,
        includeBathroom: false,
        comments: ''
      });
      
      // Offer download
      if (window.confirm('Would you like to download a copy?')) {
        pdf.save(`cabinet-design-${clientInfo.name.replace(/\s+/g, '-')}.pdf`);
      }
    } else {
      throw new Error('Failed to send design');
    }

  } catch (error) {
    console.error('Error:', error);
    alert('Error sending your design. Please try again.');
  }
};

  // -----------------------------
  // Wall View Rendering Function
  // Create elevation view showing cabinets mounted on specific wall
  // -----------------------------
  const renderWallView = (wallNum = null) => {
    const wall = wallNum || selectedWall;
    const wallElements = getElementsOnWall(wall).sort((a, b) => {
      // Sort elements left-to-right or top-to-bottom based on wall orientation
      if (wall === 1 || wall === 3) {
        return a.x - b.x; // Horizontal walls: sort by x position
      } else {
        return a.y - b.y; // Vertical walls: sort by y position
      }
    });

    // Calculate wall dimensions and scale
    const wallWidth = wall === 1 || wall === 3
      ? parseFloat(currentRoomData.dimensions.width) * 12
      : parseFloat(currentRoomData.dimensions.height) * 12;
    const wallHeight = parseFloat(currentRoomData.dimensions.wallHeight);
    const viewScale = Math.min(800 / wallWidth, 400 / wallHeight);

    return (
      <svg
        width={wallWidth * viewScale + 100}
        height={wallHeight * viewScale + 60}
        ref={wallNum ? null : wallViewRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDraggingWallView ? 'ns-resize' : 'default' }}
      >
        {/* Wall background */}
        <rect x="50" y="30" width={wallWidth * viewScale} height={wallHeight * viewScale} fill="#f5f5f5" stroke="#333" strokeWidth="2" />

        {/* Wall title */}
        <text x={50 + (wallWidth * viewScale) / 2} y="20" textAnchor="middle" fontSize="12" fontWeight="bold">
          Wall {wall} - {(wallWidth / 12).toFixed(1)}'
        </text>

        {/* Height reference line */}
        <line x1="40" y1="30" x2="40" y2={30 + wallHeight * viewScale} stroke="#333" strokeWidth="1" />
        <text x="35" y={30 + (wallHeight * viewScale) / 2} textAnchor="middle" fontSize="10" transform={`rotate(-90, 35, ${30 + (wallHeight * viewScale) / 2})`}>
          {wallHeight}"
        </text>

        {/* Render each element on this wall */}
        {wallElements.map((element, index) => {
          const elementSpec = elementTypes[element.type];
          const x = wall === 1 || wall === 3 ? element.x / scale : element.y / scale;
          const width = element.width;
          const height = element.actualHeight || elementSpec.fixedHeight;
          
          // Calculate Y position based on mount height or floor placement
          const yPos = element.mountHeight
            ? wallHeight - height - element.mountHeight
            : wallHeight - height;

          const isWallCabinet = element.type === 'wall' || element.type === 'medicine';
          const isSelected = element.id === selectedElement;

          return (
            <g key={element.id}>
              {/* Main element rectangle */}
              <rect
                x={50 + x * viewScale}
                y={30 + yPos * viewScale}
                width={width * viewScale}
                height={height * viewScale}
                fill={element.category === 'appliance' ? element.color : '#fff'}
                stroke={isSelected ? '#3b82f6' : '#333'}
                strokeWidth={isSelected ? '2' : '1'}
                style={{ cursor: isWallCabinet ? 'ns-resize' : 'default' }}
                onMouseDown={(e) => isWallCabinet ? handleWallViewMouseDown(e, element.id) : null}
              />

              {/* Special rendering for sink cabinets */}
              {(element.type === 'sink-base' || element.type === 'vanity-sink') && (
                <>
                  <rect
                    x={50 + x * viewScale + width * viewScale * 0.1}
                    y={30 + yPos * viewScale + 3}
                    width={width * viewScale * 0.8}
                    height="10"
                    fill="#4682B4"
                    stroke="#333"
                    strokeWidth="0.5"
                  />
                  <circle
                    cx={50 + x * viewScale + width * viewScale * 0.5}
                    cy={30 + yPos * viewScale + 8}
                    r="2"
                    fill="#333"
                  />
                </>
              )}

              {/* Cabinet door details */}
              {(element.type === 'base' || element.type === 'wall' || element.type === 'tall' ||
                element.type === 'vanity' || element.type === 'medicine' || element.type === 'linen') && (
                  <>
                    <line
                      x1={50 + x * viewScale + (width * viewScale) / 2}
                      y1={30 + yPos * viewScale}
                      x2={50 + x * viewScale + (width * viewScale) / 2}
                      y2={30 + (yPos + height) * viewScale}
                      stroke="#333"
                      strokeWidth="1"
                    />
                    <circle cx={50 + x * viewScale + (width * viewScale) * 0.4} cy={30 + (yPos + height / 2) * viewScale} r="2" fill="#333" />
                    <circle cx={50 + x * viewScale + (width * viewScale) * 0.6} cy={30 + (yPos + height / 2) * viewScale} r="2" fill="#333" />
                  </>
                )}

              {/* Appliance-specific rendering */}
              {element.type === 'stove' && (
                <>
                  <rect x={50 + x * viewScale + 5} y={30 + yPos * viewScale + 5} width={width * viewScale - 10} height="20" fill="#333" />
                  <circle cx={50 + x * viewScale + width * viewScale * 0.3} cy={30 + yPos * viewScale + 15} r="5" fill="#666" />
                  <circle cx={50 + x * viewScale + width * viewScale * 0.7} cy={30 + yPos * viewScale + 15} r="5" fill="#666" />
                  <text x={50 + x * viewScale + (width * viewScale) / 2} y={30 + (yPos + height) * viewScale - 10} textAnchor="middle" fontSize="8" fill="#333" fontWeight="bold">
                    RANGE
                  </text>
                </>
              )}

              {element.type === 'refrigerator' && (
                <>
                  <line x1={50 + x * viewScale} y1={30 + (yPos + height * 0.6) * viewScale} x2={50 + (x + width) * viewScale} y2={30 + (yPos + height * 0.6) * viewScale} stroke="#666" strokeWidth="2" />
                  <rect x={50 + x * viewScale + 5} y={30 + yPos * viewScale + 5} width="15" height="8" fill="#666" rx="1" />
                  <text x={50 + x * viewScale + (width * viewScale) / 2} y={30 + (yPos + height / 2) * viewScale} textAnchor="middle" fontSize="10" fill="#333" fontWeight="bold">
                    FRIDGE
                  </text>
                </>
              )}

              {element.type === 'dishwasher' && (
                <>
                  <rect x={50 + x * viewScale + 4} y={30 + yPos * viewScale + 4} width={width * viewScale - 8} height={height * viewScale - 8} fill="none" stroke="#666" strokeWidth="1" />
                  <text x={50 + x * viewScale + (width * viewScale) / 2} y={30 + (yPos + height / 2) * viewScale} textAnchor="middle" fontSize="8" fill="#333" fontWeight="bold">
                    DW
                  </text>
                </>
              )}

              {/* Dimension labels */}
              {/* Display width measurement below each element for reference */}
              <text x={50 + x * viewScale + (width * viewScale) / 2} y={30 + (yPos + height) * viewScale + 15} textAnchor="middle" fontSize="8" fill="#666">
                {width}"
              </text>

              {/* Height labels for tall elements */}
              {/* Show height measurements for wall-mounted and tall cabinets on the right side */}
              {(element.type === 'wall' || element.type === 'tall' || element.type === 'medicine' || element.type === 'linen') && (
                <text x={50 + (x + width) * viewScale + 5} y={30 + (yPos + height / 2) * viewScale} textAnchor="start" fontSize="8" fill="#666">
                  {height}"
                </text>
              )}

              {/* Mount height indicators for wall cabinets */}
              {/* Visual indicators showing distance from floor to cabinet bottom for wall-mounted units */}
              {element.mountHeight > 0 && (
                <>
                  {/* Dashed vertical line from floor to cabinet bottom */}
                  <line
                    x1={50 + x * viewScale - 10}
                    y1={30 + wallHeight * viewScale}
                    x2={50 + x * viewScale - 10}
                    y2={30 + (wallHeight - element.mountHeight) * viewScale}
                    stroke="#999"
                    strokeWidth="0.5"
                    strokeDasharray="2,2"
                  />
                  {/* Mount height measurement label */}
                  <text
                    x={50 + x * viewScale - 15}
                    y={30 + (wallHeight - element.mountHeight / 2) * viewScale}
                    textAnchor="end"
                    fontSize="7"
                    fill="#999"
                  >
                    {element.mountHeight.toFixed(1)}"
                  </text>
                </>
              )}

              {/* Element number badge */}
              {/* Circular badge showing element number for reference in element list */}
              <circle cx={50 + x * viewScale + (width * viewScale) / 2} cy={30 + yPos * viewScale - 10} r="8" fill="white" stroke="#333" strokeWidth="1" />
              <text x={50 + x * viewScale + (width * viewScale) / 2} y={30 + yPos * viewScale - 7} textAnchor="middle" fontSize="8" fontWeight="bold">
                {currentRoomData.elements.indexOf(element) + 1}
              </text>
            </g>
          );
        })}

        {/* Floor line */}
        <line x1="50" y1={30 + wallHeight * viewScale} x2={50 + wallWidth * viewScale} y2={30 + wallHeight * viewScale} stroke="#333" strokeWidth="2" />

        {/* Standard counter height reference for kitchen */}
        {/* Dashed reference line showing standard 34.5" counter height in kitchen designs */}
        {activeRoom === 'kitchen' && (
          <>
            <line x1="50" y1={30 + (wallHeight - 34.5) * viewScale} x2={50 + wallWidth * viewScale} y2={30 + (wallHeight - 34.5) * viewScale} stroke="#999" strokeWidth="0.5" strokeDasharray="2,2" />
            <text x="45" y={30 + (wallHeight - 34.5) * viewScale} textAnchor="end" fontSize="8" fill="#666">34.5"</text>
          </>
        )}
      </svg>
    );
  };

  // -----------------------------
  // MAIN RENDER LOGIC
  // Conditional rendering based on current application step and state
  // Controls the overall application flow and interface display
  // -----------------------------

  // STEP 1: Room Dimensions Setup
  // Initial configuration screen where users input room measurements and select room type
  if (step === 'dimensions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Application header and branding */}
            <h1 className="text-4xl font-bold text-gray-800 mb-2 text-center">
              Cabinet Designer demo
            </h1>
            <p className="text-gray-600 mb-8 text-center">
              Design your {activeRoom}
            </p>
            
            <div className="space-y-6">
              {/* Room Type Selection */}
              {/* Toggle between kitchen and bathroom design modes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Room Type
                </label>
                <div className="flex gap-4">
                  {/* Kitchen selection button */}
                  <button
                    onClick={() => switchRoom('kitchen')}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${activeRoom === 'kitchen'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}>
                    <Home size={20} />Kitchen
                  </button>
                  {/* Bathroom selection button */}
                  <button
                    onClick={() => switchRoom('bathroom')}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${activeRoom === 'bathroom'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <Bath size={20} />
                    Bathroom
                  </button>
                </div>
              </div>

              {/* Room Dimensions Input */}
              {/* Grid layout for width and depth input fields */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Room width input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Room Width (feet)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentRoomData.dimensions.width}
                    onChange={(e) => setCurrentRoomData({
                      ...currentRoomData,
                      dimensions: { ...currentRoomData.dimensions, width: e.target.value }
                    })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="e.g. 12"
                    min="5"
                    max="50"
                  />
                </div>
                {/* Room depth input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Room Depth (feet)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentRoomData.dimensions.height}
                    onChange={(e) => setCurrentRoomData({
                      ...currentRoomData,
                      dimensions: { ...currentRoomData.dimensions, height: e.target.value }
                    })}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="e.g. 10"
                    min="5"
                    max="40"
                  />
                </div>
              </div>

              {/* Wall height input */}
              {/* Single input for ceiling/wall height measurement */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Wall Height (inches)
                </label>
                <input
                  type="number"
                  value={currentRoomData.dimensions.wallHeight}
                  onChange={(e) => setCurrentRoomData({
                    ...currentRoomData,
                    dimensions: { ...currentRoomData.dimensions, wallHeight: e.target.value }
                  })}
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  placeholder="96"
                  min="84"
                  max="144"
                />
              </div>

              {/* Submit button to proceed to design interface */}
              <button
                onClick={handleDimensionsSubmit}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 px-8 rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
              >
                Start Designing
              </button>

              {/* Show existing design status */}
              {/* Display current progress if user has existing designs */}
              <div className="text-center text-sm text-gray-600">
                {kitchenData.elements.length > 0 && (
                  <p>Kitchen design in progress ({kitchenData.elements.length} items)</p>
                )}
                {bathroomData.elements.length > 0 && (
                  <p>Bathroom design in progress ({bathroomData.elements.length} items)</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: Main Design Interface
  // Full-featured design environment with sidebar controls and main canvas
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex h-screen">
        
        {/* ========== LEFT SIDEBAR ========== */}
        {/* Control panel containing all design tools and element properties */}
        <div className="w-80 bg-white shadow-lg p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6">Cabinet Designer</h2>

          {/* Room Switcher */}
          {/* Toggle between kitchen and bathroom designs without losing progress */}
          <div className="mb-6 bg-gray-50 p-3 rounded-lg">
            <div className="flex gap-2">
              {/* Kitchen switcher button */}
              <button
                onClick={() => switchRoom('kitchen')}
                className={`flex-1 p-2 rounded flex items-center justify-center gap-1 text-sm ${activeRoom === 'kitchen' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                  }`}
              >
                <Home size={16} />
                Kitchen
              </button>
              {/* Bathroom switcher button */}
              <button
                onClick={() => switchRoom('bathroom')}
                className={`flex-1 p-2 rounded flex items-center justify-center gap-1 text-sm ${activeRoom === 'bathroom' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'
                  }`}
              >
                <Bath size={16} />
                Bathroom
              </button>
            </div>
            {/* Current room dimensions display */}
            <p className="text-xs text-gray-600 mt-2 text-center">
              {activeRoom === 'kitchen' ? 'Kitchen' : 'Bathroom'}: {currentRoomData.dimensions.width}' × {currentRoomData.dimensions.height}'
            </p>
          </div>

          {/* Action Buttons */}
          {/* Main action buttons for pricing and quote generation */}
          <div className="mb-6 space-y-2">
            {/* Toggle pricing display */}
            <button
              onClick={() => setShowPricing(!showPricing)}
              className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center justify-center gap-2"
            >
              <Calculator size={16} />
              {showPricing ? 'Hide Pricing' : 'Show Pricing'}
            </button>
            {/* Open quote request form */}
            <button
              onClick={() => setShowQuoteForm(true)}
              className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              <Send size={16} />
              Send Quote
            </button>
          </div>

          {/* View Toggle */}
          {/* Switch between floor plan and wall elevation views */}
          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2">View Mode</label>
            <div className="flex gap-2">
              {/* Floor plan view button */}
              <button
                onClick={() => setViewMode('floor')}
                className={`flex-1 p-2 rounded ${viewMode === 'floor' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Floor Plan
              </button>
              {/* Wall elevation view button */}
              <button
                onClick={() => setViewMode('wall')}
                className={`flex-1 p-2 rounded ${viewMode === 'wall' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                Wall View
              </button>
            </div>
          </div>

          {/* Wall Selection (only visible in wall view mode) */}
          {/* Grid of buttons to select which wall to view in elevation */}
          {viewMode === 'wall' && (
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">Select Wall</label>
              <div className="grid grid-cols-2 gap-2">
                {/* Generate wall selection buttons 1-4 */}
                {[1, 2, 3, 4].map(wall => (
                  <button
                    key={wall}
                    onClick={() => setSelectedWall(wall)}
                    className={`p-2 rounded ${selectedWall === wall ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  >
                    Wall {wall}
                  </button>
                ))}
              </div>

              {/* Wall-mounted element properties */}
              {/* Show mount height controls for selected wall cabinets */}
              {(() => {
                const element = currentRoomData.elements.find(el => el.id === selectedElement);
                const elementSpec = elementTypes[element?.type];

                // Only show controls if an element is selected
                if (!element) return null;

                return (
                  <div className="space-y-4">
                    {/* Element name display */}
                    <div>
                      <p className="text-sm font-medium mb-1">{elementSpec.name}</p>
                    </div>
                    
                    {/* Mount height controls for wall cabinets */}
                    {/* Only show for wall-mounted cabinet types */}
                    {(element.type === 'wall' || element.type === 'medicine') && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Mount Height from Floor (inches)</label>
                        <input
                          type="number"
                          value={element.mountHeight}
                          onChange={(e) => updateElementDimensions(element.id, 'mountHeight', e.target.value)}
                          className="w-full p-2 border rounded"
                          min="0"
                          max={parseFloat(currentRoomData.dimensions.wallHeight) - element.actualHeight}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Distance from floor to bottom of cabinet
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Cabinet Options */}
          {/* List of available cabinet types for the current room */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">
              {activeRoom === 'kitchen' ? 'Kitchen Cabinets' : 'Bathroom Cabinets'}
            </h3>
            <div className="space-y-2">
              {/* Filter and display cabinet options by room and category */}
              {Object.entries(elementTypes)
                .filter(([_, spec]) => spec.room === activeRoom && spec.category === 'cabinet')
                .map(([key, spec]) => (
                  <button
                    key={key}
                    onClick={() => addElement(key)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {/* Cabinet name */}
                    <div className="font-medium">{spec.name}</div>
                    {/* Default dimensions display */}
                    <div className="text-xs text-gray-500">
                      {spec.defaultWidth}"W × {spec.defaultDepth}"D × {spec.fixedHeight || spec.defaultHeight}"H
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Appliances/Fixtures */}
          {/* List of available appliances and fixtures for the current room */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">
              {activeRoom === 'kitchen' ? 'Appliances' : 'Fixtures'}
            </h3>
            <div className="space-y-2">
              {/* Filter and display appliance options by room and category */}
              {Object.entries(elementTypes)
                .filter(([_, spec]) => spec.room === activeRoom && spec.category === 'appliance')
                .map(([key, spec]) => (
                  <button
                    key={key}
                    onClick={() => addElement(key)}
                    className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {/* Appliance name */}
                    <div className="font-medium">{spec.name}</div>
                    {/* Fixed dimensions display */}
                    <div className="text-xs text-gray-500">
                      {spec.defaultWidth}"W × {spec.defaultDepth}"D × {spec.fixedHeight}"H
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Selected Element Properties */}
          {/* Property panel for the currently selected element (floor plan view only) */}
          {selectedElement && viewMode === 'floor' && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4">Properties</h3>
              {(() => {
                // Get selected element data and specifications
                const element = currentRoomData.elements.find(el => el.id === selectedElement);
                const elementSpec = elementTypes[element?.type];

                // Return null if no element selected
                if (!element) return null;
                
                return (
                  <div className="space-y-4">
                    {/* Element identification */}
                    <div>
                      <p className="text-sm font-medium mb-1">{elementSpec.name}</p>
                    </div>
                    
                    {/* Material selection for cabinets */}
                    {/* Only show material options for cabinet elements */}
                    {element.category === 'cabinet' && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Material</label>
                        <select
                          value={currentRoomData.materials[element.id] || 'laminate'}
                          onChange={(e) => setCurrentRoomData({
                            ...currentRoomData,
                            materials: { ...currentRoomData.materials, [element.id]: e.target.value }
                          })}
                          className="w-full p-2 border rounded"
                        >
                          <option value="laminate">Laminate (Standard)</option>
                          <option value="wood">Solid Wood (+50%)</option>
                          <option value="plywood">Plywood (+30%)</option>
                        </select>
                      </div>
                    )}
                    
                    {/* Width - customizable for cabinets */}
                    {/* Allow width adjustment for cabinet elements only */}
                    {element.category === 'cabinet' && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Width (inches)</label>
                        <input
                          type="number"
                          value={element.width}
                          onChange={(e) => updateElementDimensions(element.id, 'width', e.target.value)}
                          className="w-full p-2 border rounded"
                          min="12"
                          max="60"
                        />
                      </div>
                    )}
                    
                    {/* Depth - for specific cabinet types */}
                    {/* Show depth controls for base cabinets, tall cabinets, and vanities */}
                    {(element.type === 'base' || element.type === 'tall' || element.type === 'sink-base' ||
                      element.type === 'vanity' || element.type === 'linen' || element.type === 'vanity-sink') && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Depth (inches)</label>
                          <input
                            type="number"
                            value={element.depth}
                            onChange={(e) => updateElementDimensions(element.id, 'depth', e.target.value)}
                            className="w-full p-2 border rounded"
                            min="12"
                            max="36"
                          />
                        </div>
                      )}
                    
                    {/* Height - for variable height elements */}
                    {/* Show height controls for wall cabinets, tall cabinets, medicine cabinets, and linen cabinets */}
                    {(element.type === 'wall' || element.type === 'tall' || element.type === 'medicine' || element.type === 'linen') && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Height (inches)</label>
                        <input
                          type="number"
                          value={element.actualHeight}
                          onChange={(e) => updateElementDimensions(element.id, 'actualHeight', e.target.value)}
                          className="w-full p-2 border rounded"
                          min={elementSpec.minHeight || 12}
                          max={element.type === 'wall' || element.type === 'medicine' ? parseFloat(currentRoomData.dimensions.wallHeight) - element.mountHeight : currentRoomData.dimensions.wallHeight}
                        />
                        {/* Height constraint information */}
                        <p className="text-xs text-gray-500 mt-1">
                          {element.type === 'wall' || element.type === 'medicine'
                            ? `Min: ${elementSpec.minHeight || 12}", Max: ${parseFloat(currentRoomData.dimensions.wallHeight) - element.mountHeight}"`
                            : `Min: ${elementSpec.minHeight || 40}", Max: ${currentRoomData.dimensions.wallHeight}"`}
                        </p>
                      </div>
                    )}
                    
                    {/* Mount height for wall cabinets */}
                    {/* Controls for adjusting wall-mounted cabinet height from floor */}
                    {(element.type === 'wall' || element.type === 'medicine') && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">Mount Height from Floor (inches)</label>
                        <input
                          type="number"
                          value={element.mountHeight}
                          onChange={(e) => updateElementDimensions(element.id, 'mountHeight', e.target.value)}
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
                    {/* Left and right rotation buttons for element orientation */}
                    <div>
                      <label className="block text-sm text-gray-600 mb-2">Rotation</label>
                      <div className="flex gap-2">
                        {/* Rotate left (counter-clockwise) */}
                        <button
                          onClick={() => rotateElement(element.id, -90)}
                          className="flex-1 p-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center gap-1"
                        >
                          <RotateCw size={16} className="transform scale-x-[-1]" />
                          Left
                        </button>
                        {/* Rotate right (clockwise) */}
                        <button
                          onClick={() => rotateElement(element.id, 90)}
                          className="flex-1 p-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center justify-center gap-1"
                        >
                          <RotateCw size={16} />
                          Right
                        </button>
                      </div>
                      {/* Current rotation display */}
                      <p className="text-xs text-gray-500 mt-1">Current: {element.rotation}°</p>
                    </div>
                    
                                       
                    {/* Corner cabinet hinge direction */}
                    {/* Special controls for corner cabinet door orientation */}
                    {element.type === 'corner' && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">Hinge Direction</label>
                        <div className="flex gap-2">
                          {/* Left hinge option */}
                          <button
                            onClick={() => rotateCornerCabinet(element.id, 'left')}
                            className={`flex-1 p-2 rounded ${element.hingeDirection === 'left' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                          >
                            Left
                          </button>
                          {/* Right hinge option */}
                          <button
                            onClick={() => rotateCornerCabinet(element.id, 'right')}
                            className={`flex-1 p-2 rounded ${element.hingeDirection === 'right' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                          >
                            Right
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Delete Element Button */}
                    {/* Remove selected element from design */}
                    <button
                      onClick={() => deleteElement(element.id)}
                      className="w-full p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
          
          {/* Reset Design Button */}
          {/* Clear all elements and start over */}
          <button
            onClick={resetDesign}
            className="w-full mt-6 p-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Reset {activeRoom === 'kitchen' ? 'Kitchen' : 'Bathroom'} Design
          </button>
        </div>
        
        {/* ========== MAIN CANVAS AREA ========== */}
        {/* Primary design workspace containing the visual interface */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            
            {/* Header */}
            {/* Title bar with room name and date */}
            <div className="flex justify-between items-start mb-6 border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold">{activeRoom === 'kitchen' ? 'Kitchen' : 'Bathroom'} Layout</h2>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">{new Date().toLocaleDateString()}</p>
                <p className="text-xs text-gray-600">Not To Scale</p>
              </div>
            </div>
            
            {/* Pricing Summary */}
            {/* Expandable pricing panel showing cost breakdown */}
            {showPricing && currentRoomData.elements.some(el => el.category === 'cabinet') && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-3">Pricing Summary - {activeRoom === 'kitchen' ? 'Kitchen' : 'Bathroom'}</h3>
                <div className="space-y-2 text-sm">
                  {/* Base cabinet pricing */}
                  <div className="flex justify-between">
                    <span>Base Cabinet Price:</span>
                                       <span>${(calculateTotalPrice() - (colorPricing[currentRoomData.colorCount] || 0)).toFixed(2)}</span>
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
                      className="px-2 py-1 border rounded text-xs"
                    >
                      <option value={1}>Single Color (Included)</option>
                      <option value={2}>Two Colors (+$100)</option>
                      <option value={3}>Three Colors (+$200)</option>
                      <option value="custom">Custom Colors (+$500)</option>
                    </select>
                  </div>
                  
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
            {viewMode === 'floor' ? (
              <>
                {/* Floor Plan Instructions */}
                <p className="text-sm text-gray-600 mb-4">
                  Click and drag cabinets to position them. They will snap to walls and other cabinets.
                </p>
                
                {/* Floor Plan SVG Container */}
                {/* Main interactive canvas for cabinet placement and arrangement */}
                <div className="inline-block bg-white" ref={floorPlanRef}>
                  <svg
                    ref={canvasRef}
                    width={(parseFloat(currentRoomData.dimensions.width) * 12) * scale + 60}
                    height={(parseFloat(currentRoomData.dimensions.height) * 12) * scale + 60}
                    className="cursor-crosshair"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onClick={(e) => {
                      // Deselect elements when clicking empty canvas
                      if (e.target === e.currentTarget) {
                        setSelectedElement(null);
                      }
                    }}
                  >
                    {/* Grid Pattern Definition */}
                    {/* Creates visual grid overlay for measurement reference */}
                    <defs>
                      <pattern id="grid" width={12 * scale} height={12 * scale} patternUnits="userSpaceOnUse">
                        <path d={`M ${12 * scale} 0 L 0 0 0 ${12 * scale}`} fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    
                    {/* Canvas Background */}
                    <rect x="0" y="0" width="100%" height="100%" fill="white" />
                    
                    {/* Room Floor with Grid Overlay */}
                    {/* Visual representation of room floor space with measurement grid */}
                    <rect
                      x="30"
                      y="30"
                      width={(parseFloat(currentRoomData.dimensions.width) * 12) * scale}
                      height={(parseFloat(currentRoomData.dimensions.height) * 12) * scale}
                      fill="url(#grid)"
                    />
                    
                    {/* Wall Structures with Thickness */}
                    {/* Gray rectangles representing physical walls with realistic thickness */}
                    <g>
                      {/* Top wall */}
                      <rect x="20" y="20" width={(parseFloat(currentRoomData.dimensions.width) * 12) * scale + 20} height="10" fill="#666" />
                      {/* Bottom wall */}
                      <rect x="20" y={30 + (parseFloat(currentRoomData.dimensions.height) * 12) * scale} width={(parseFloat(currentRoomData.dimensions.width) * 12) * scale + 20} height="10" fill="#666" />
                      {/* Left wall */}
                      <rect x="20" y="20" width="10" height={(parseFloat(currentRoomData.dimensions.height) * 12) * scale + 20} fill="#666" />
                      {/* Right wall */}
                      <rect x={30 + (parseFloat(currentRoomData.dimensions.width) * 12) * scale} y="20" width="10" height={(parseFloat(currentRoomData.dimensions.height) * 12) * scale + 20} fill="#666" />
                    </g>
                    
                    {/* Room Dimension Labels */}
                    {/* Text labels showing room measurements */}
                    <g>
                      {/* Width dimension label at top */}
                      <line x1="30" y1="10" x2={30 + (parseFloat(currentRoomData.dimensions.width) * 12) * scale} y2="10" stroke="#333" strokeWidth="1" />
                      <text x={30 + ((parseFloat(currentRoomData.dimensions.width) * 12) * scale) / 2} y="7" textAnchor="middle" fontSize="10" fill="#333">
                        {currentRoomData.dimensions.width}'
                      </text>
                      
                      {/* Height dimension label at left */}
                      <line x1="10" y1="30" x2="10" y2={30 + (parseFloat(currentRoomData.dimensions.height) * 12) * scale} stroke="#333" strokeWidth="1" />
                      <text x="5" y={30 + ((parseFloat(currentRoomData.dimensions.height) * 12) * scale) / 2} textAnchor="middle" fontSize="10" fill="#333" transform={`rotate(-90, 5, ${30 + ((parseFloat(currentRoomData.dimensions.height) * 12) * scale) / 2})`}>
                        {currentRoomData.dimensions.height}'
                      </text>
                    </g>
                    
                    {/* Render Design Elements */}
                    {/* Container for all cabinets and appliances, sorted by z-index for proper layering */}
                    <g transform="translate(30, 30)">
                      {currentRoomData.elements.sort((a, b) => a.zIndex - b.zIndex).map((element, index) => {
                        const isSelected = element.id === selectedElement;
                        const elementSpec = elementTypes[element.type];
                        
                        {/* Special Rendering for Corner Cabinets */}
                        {/* Corner cabinets have unique L-shaped rendering */}
                        if (element.type === 'corner') {
                          return (
                            <g key={element.id}>
                              {renderCornerCabinet(element)}
                              
                              {/* Corner cabinet number badge */}
                              <circle
                                cx={element.x + (element.width * scale) / 2}
                                cy={element.y + (element.depth * scale) / 2}
                                r="12"
                                fill="white"
                                stroke="#333"
                                strokeWidth="1"
                              />
                              <text
                                x={element.x + (element.width * scale) / 2}
                                y={element.y + (element.depth * scale) / 2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="10"
                                fill="#333"
                                fontWeight="bold"
                              >
                                {currentRoomData.elements.indexOf(element) + 1}
                              </text>
                              
                              {/* Selection indicator for corner cabinets */}
                              {isSelected && (
                                <rect
                                  x={element.x - 2}
                                  y={element.y - 2}
                                  width={element.width * scale + 4}
                                  height={element.depth * scale + 4}
                                  fill="none"
                                  stroke="#3b82f6"
                                  strokeWidth="2"
                                  strokeDasharray="4"
                                />
                              )}
                            </g>
                          );
                        }
                        
                        {/* Standard Element Rendering */}
                        {/* Calculate display dimensions based on rotation */}
                        const displayWidth = element.rotation % 180 === 0 ? element.width * scale : element.depth * scale;
                        const displayDepth = element.rotation % 180 === 0 ? element.depth * scale : element.width * scale;
                        
                        // Visual styling based on element category
                        const fillColor = element.category === 'appliance' ? '#e0e0e0' : '#d3d3d3';
                        const strokeColor = isSelected ? '#3b82f6' : '#333';
                        
                        return (
                          <g key={element.id} transform={`translate(${element.x + displayWidth / 2}, ${element.y + displayDepth / 2}) rotate(${element.rotation}) translate(${-displayWidth / 2}, ${-displayDepth / 2})`}>
                            
                            {/* Main Element Body */}
                            {/* Rectangle representing the cabinet or appliance footprint */}
                            <rect
                              x={0}
                              y={0}
                              width={element.width * scale}
                              height={element.depth * scale}
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth={isSelected ? '2' : '1'}
                              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                              onMouseDown={(e) => handleMouseDown(e, element.id)}
                            />
                            
                            {/* Door Indication for Cabinets */}
                            {/* Arc showing door swing direction for standard cabinets */}
                            {element.category === 'cabinet' && element.type !== 'sink-base' && element.type !== 'vanity-sink' && renderDoorGraphic(0, 0, element.width * scale, element.depth * scale, 0)}
                            
                            {/* Special Sink Cabinet Graphics */}
                            {/* Detailed sink representation for sink-base and vanity-sink cabinets */}
                            {(element.type === 'sink-base' || element.type === 'vanity-sink') && (
                              <>
                                {/* Outer sink rim */}
                                <rect
                                  x={(element.width * scale) * 0.15}
                                  y={(element.depth * scale) * 0.15}
                                  width={(element.width * scale) * 0.7}
                                  height={(element.depth * scale) * 0.7}
                                  fill="none"
                                  stroke="#333"
                                  strokeWidth="1"
                                  rx="4"
                                />
                                {/* Inner sink bowl */}
                                <rect
                                  x={(element.width * scale) * 0.2}
                                  y={(element.depth * scale) * 0.2}
                                  width={(element.width * scale) * 0.6}
                                  height={(element.depth * scale) * 0.6}
                                  fill="none"
                                  stroke="#333"
                                  strokeWidth="0.5"
                                  rx="2"
                                />
                                {/* Faucet indicator */}
                                <circle
                                  cx={(element.width * scale) * 0.5}
                                  cy={(element.depth * scale) * 0.3}
                                  r="3"
                                  fill="#333"
                                />
                              </>
                            )}
                            
                            {/* Stove/Range Graphics */}
                            {/* Detailed representation of cooktop with burners */}
                            {element.type === 'stove' && (
                              <>
                                {/* Four burner circles */}
                                <circle cx={(element.width * scale) * 0.25} cy={(element.depth * scale) * 0.25} r="8" fill="none" stroke="#666" strokeWidth="1" />
                                <circle cx={(element.width * scale) * 0.75} cy={(element.depth * scale) * 0.25} r="8" fill="none" stroke="#666" strokeWidth="1" />
                                <circle cx={(element.width * scale) * 0.25} cy={(element.depth * scale) * 0.75} r="8" fill="none" stroke="#666" strokeWidth="1" />
                                <circle cx={(element.width * scale) * 0.75} cy={(element.depth * scale) * 0.75} r="8" fill="none" stroke="#666" strokeWidth="1" />
                                {/* Stove label */}
                                <text x={(element.width * scale) / 2} y={(element.depth * scale) / 2} textAnchor="middle" fontSize="8" fill="#666">ST{element.width}</text>
                              </>
                            )}
                            
                            {/* Dishwasher Graphics */}
                            {/* Simple rectangular border with label */}
                            {element.type === 'dishwasher' && (
                              <>
                                <rect x="4" y="4" width={(element.width * scale) - 8} height={(element.depth * scale) - 8} fill="none" stroke="#666" strokeWidth="1" />
                                <text x={(element.width * scale) / 2} y={(element.depth * scale) / 2} textAnchor="middle" fontSize="8" fill="#666">DW{element.width}</text>
                              </>
                            )}
                            
                            {/* Refrigerator Graphics */}
                            {/* Detailed fridge representation with doors and handles */}
                            {element.type === 'refrigerator' && (
                              <>
                                {/* Main refrigerator body */}
                                <rect
                                  x={2}
                                  y={2}
                                  width={(element.width * scale) - 4}
                                  height={(element.depth * scale) - 4}
                                  fill="none"
                                  stroke="#666"
                                  strokeWidth="2"
                                />
                                {/* Center door division line */}
                                <line
                                  x1={(element.width * scale) / 2}
                                  y1={2}
                                  x2={(element.width * scale) / 2}
                                  y2={(element.depth * scale) - 2}
                                  stroke="#666"
                                  strokeWidth="1"
                                />
                                {/* Door handles */}
                                <rect x={(element.width * scale) * 0.4 - 2} y="6" width="4" height="10" fill="#666" rx="2" />
                                <rect x={(element.width * scale) * 0.6 - 2} y="6" width="4" height="10" fill="#666" rx="2" />
                                {/* Label */}
                                <text x={(element.width * scale) / 2} y={(element.depth * scale) - 8} textAnchor="middle" fontSize="6" fill="#666" fontWeight="bold">
                                  FRIDGE
                                </text>
                              </>
                            )}
                            
                            {/* Toilet Graphics */}
                            {/* Detailed toilet representation with tank and bowl */}
                            {element.type === 'toilet' && (
                              <>
                                {/* Toilet tank */}
                                <rect
                                  x={(element.width * scale) * 0.25}
                                  y={2}
                                  width={(element.width * scale) * 0.5}
                                  height={(element.depth * scale) * 0.35}
                                  fill="#fff"
                                  stroke="#666"
                                  strokeWidth="1"
                                  rx="2"
                                />
                                {/* Toilet bowl */}
                                <ellipse
                                  cx={(element.width * scale) / 2}
                                  cy={(element.depth * scale) * 0.65}
                                  rx={(element.width * scale) * 0.4}
                                  ry={(element.depth * scale) * 0.32}
                                  fill="#fff"
                                  stroke="#666"
                                  strokeWidth="1"
                                />
                                {/* Toilet seat */}
                                <ellipse
                                  cx={(element.width * scale) / 2}
                                  cy={(element.depth * scale) * 0.65}
                                  rx={(element.width * scale) * 0.35}
                                  ry={(element.depth * scale) * 0.28}
                                  fill="none"
                                  stroke="#666"
                                  strokeWidth="1"
                                />
                                {/* Toilet bowl opening */}
                                <ellipse
                                  cx={(element.width * scale) / 2}
                                  cy={(element.depth * scale) * 0.65}
                                  rx={(element.width * scale) * 0.15}
                                  ry={(element.depth * scale) * 0.12}
                                  fill="#e0e0e0"
                                />
                              </>
                            )}
                            
                            {/* Bathtub Graphics */}
                            {/* Detailed bathtub with rim, interior, faucet, and drain */}
                            {element.type === 'bathtub' && (
                              <>
                                {/* Outer tub rim */}
                                <rect
                                  x={4}
                                  y={4}
                                  width={(element.width * scale) - 8}
                                  height={(element.depth * scale) - 8}
                                  fill="#fff"
                                  stroke="#666"
                                  strokeWidth="2"
                                  rx="6"
                                />
                                {/* Inner tub basin */}
                                <rect
                                  x={8}
                                  y={8}
                                  width={(element.width * scale) - 16}
                                  height={(element.depth * scale) - 16}
                                  fill="#f0f8ff"
                                  stroke="#4682B4"
                                  strokeWidth="1"
                                  rx="4"
                                />
                                {/* Faucet */}
                                <circle
                                  cx={(element.width * scale) * 0.15}
                                  cy={(element.depth * scale) / 2}
                                  r="4"
                                  fill="#666"
                                />
                                {/* Drain */}
                                <circle
                                  cx={(element.width * scale) * 0.85}
                                  cy={(element.depth * scale) / 2}
                                  r="3"
                                  fill="#333"
                                />
                              </>
                            )}
                            
                            {/* Shower Graphics */}
                            {/* Shower stall with base, pan, door, and fixtures */}
                            {element.type === 'shower' && (
                              <>
                                {/* Shower enclosure */}
                                <rect
                                  x={2}
                                  y={2}
                                  width={(element.width * scale) - 4}
                                  height={(element.depth * scale) - 4}
                                  fill="#fff"
                                  stroke="#666"
                                  strokeWidth="2"
                                />
                                {/* Shower pan */}
                                <rect
                                  x={6}
                                  y={6}
                                  width={(element.width * scale) - 12}
                                  height={(element.depth * scale) - 12}
                                  fill="#f0f8ff"
                                  stroke="#4682B4"
                                  strokeWidth="1"
                                />
                                {/* Door indication line */}
                                <line
                                  x1={2}
                                  y1={(element.depth * scale) / 2}
                                  x2={(element.width * scale) * 0.3}
                                  y2={(element.depth * scale) / 2}
                                  stroke="#666"
                                  strokeWidth="2"
                                />
                                {/* Shower head */}
                                <circle
                                  cx={(element.width * scale) - 10}
                                  cy={10}
                                  r="4"
                                  fill="#666"
                                />
                                {/* Drain */}
                                <circle
                                  cx={(element.width * scale) / 2}
                                  cy={(element.depth * scale) / 2}
                                  r="3"
                                  fill="#333"
                                />
                              </>
                            )}

                            {/* Standard Cabinet Door Graphics */}
                            {/* Door lines and handles for regular cabinets */}
                            {(element.type === 'base' || element.type === 'wall' || element.type === 'tall' ||
                              element.type === 'vanity' || element.type === 'medicine' || element.type === 'linen') && (
                                <>
                                  {/* Center door division line */}
                                  <line
                                    x1={(element.width * scale) / 2}
                                    y1={0}
                                    x2={(element.width * scale) / 2}
                                    y2={element.depth * scale}
                                    stroke="#333"
                                    strokeWidth="1"
                                  />
                                  {/* Door handles */}
                                  <circle cx={(element.width * scale) * 0.4} cy={(element.depth * scale) * 0.5} r="2" fill="#333" />
                                  <circle cx={(element.width * scale) * 0.6} cy={(element.depth * scale) * 0.5} r="2" fill="#333" />
                                </>
                              )}

                            {/* Element Number Badge */}
                            {/* Circular badge with element number, rotated to stay upright */}
                            <g transform={`rotate(${-element.rotation}, ${element.width * scale / 2}, ${element.depth * scale / 2})`}>
                              <circle
                                cx={(element.width * scale) / 2}
                                cy={(element.depth * scale) / 2}
                                r="12"
                                fill="white"
                                stroke="#333"
                                strokeWidth="1"
                              />
                              <text
                                x={(element.width * scale) / 2}
                                y={(element.depth * scale) / 2}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="10"
                                fill="#333"
                                fontWeight="bold"
                              >
                                {currentRoomData.elements.indexOf(element) + 1}
                              </text>
                            </g>

                            {/* Dimension Indicators for Selected Element */}
                            {/* Show width and depth measurements when element is selected */}
                            {isSelected && (
                              <g transform={`rotate(${-element.rotation}, ${element.width * scale / 2}, ${element.depth * scale / 2})`}>
                                {/* Width dimension line and label */}
                                <line x1={0} y1={-5} x2={element.width * scale} y2={-5} stroke="#666" strokeWidth="0.5" />
                                <text x={(element.width * scale) / 2} y={-8} textAnchor="middle" fontSize="8" fill="#666">
                                  {element.width}"
                                </text>

                                {/* Depth dimension line and label */}
                                <line x1={element.width * scale + 5} y1={0} x2={element.width * scale + 5} y2={element.depth * scale} stroke="#666" strokeWidth="0.5" />
                                <text x={element.width * scale + 15} y={(element.depth * scale) / 2} textAnchor="middle" fontSize="8" fill="#666" transform={`rotate(90, ${element.width * scale + 15}, ${(element.depth * scale) / 2})`}>
                                  d={element.depth}"
                                </text>
                              </g>
                            )}
                          </g>
                        );
                      })}
                    </g>
                    
                    {/* Wall Number Labels */}
                    {/* Numbered labels on each wall for reference in wall view */}
                    <g>
                      {/* Wall 1 (bottom) */}
                      <text x={30 + ((parseFloat(currentRoomData.dimensions.width) * 12) * scale) / 2} y={50 + (parseFloat(currentRoomData.dimensions.height) * 12) * scale} textAnchor="middle" fontSize="10" fill="#666" fontWeight="bold">
                        # 1
                      </text>
                      {/* Wall 2 (left) */}
                      <text x="15" y={30 + ((parseFloat(currentRoomData.dimensions.height) * 12) * scale) / 2} textAnchor="middle" fontSize="10" fill="#666" fontWeight="bold" transform={`rotate(-90, 15, ${30 + ((parseFloat(currentRoomData.dimensions.height) * 12) * scale) / 2})`}>
                        # 2
                      </text>
                      {/* Wall 3 (top) */}
                      <text x={30 + ((parseFloat(currentRoomData.dimensions.width) * 12) * scale) / 2} y="15" textAnchor="middle" fontSize="10" fill="#666" fontWeight="bold">
                        # 3
                      </text>
                      {/* Wall 4 (right) */}
                      <text x={45 + (parseFloat(currentRoomData.dimensions.width) * 12) * scale} y={30 + ((parseFloat(currentRoomData.dimensions.height) * 12) * scale) / 2} textAnchor="middle" fontSize="10" fill="#666" fontWeight="bold" transform={`rotate(90, ${45 + (parseFloat(currentRoomData.dimensions.width) * 12) * scale}, ${30 + ((parseFloat(currentRoomData.dimensions.height) * 12) * scale) / 2})`}>
                        # 4
                      </text>
                    </g>
                  </svg>
                </div>
              </>
            ) : (
              /* Wall Elevation View */
              /* Alternative view showing cabinet placement on selected wall */
              <div>
                <h3 className="text-lg font-semibold mb-4">Wall {selectedWall} Elevation View</h3>
                {renderWallView()}
              </div>
            )}
            
            {/* Element List Summary */}
            {/* Table showing all placed elements with their specifications */}
            {currentRoomData.elements.length > 0 && viewMode === 'floor' && (
              <div className="mt-6 border-t pt-4">
                <h4 className="font-semibold mb-2">Element List:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {currentRoomData.elements.map((element, index) => (
                    <div key={element.id} className="flex items-center gap-2">
                      {/* Element number */}
                      <span className="font-bold">#{index + 1}:</span>
                      {/* Element name */}
                      <span>{elementTypes[element.type].name}</span>
                      {/* Element dimensions */}
                      <span className="text-gray-500">
                        {element.width}" × {element.depth}"d
                        {element.actualHeight && ` × ${element.actualHeight}"h`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Quote Form Modal */}
      {/* Overlay modal for collecting customer information and generating quotes */}
      {showQuoteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <h3 className="text-xl font-bold mb-4">Request Quote</h3>
            <p className="text-sm text-gray-600 mb-4">
              Fill out your information below and we'll send you a detailed quote.
            </p>
            
            <div className="space-y-4">
              {/* Customer name input */}
              <div>
                <label className="block text-sm font-medium mb-1">Your Name *</label>
                <input
                  type="text"
                  value={clientInfo.name}
                  onChange={(e) => setClientInfo({ ...clientInfo, name: e.target.value })}
                  className="w-full p-2 border rounded"
                  placeholder="Your full name"
                />
              </div>
              
              {/* Contact preference selector */}
              <div>
                <label className="block text-sm font-medium mb-1">Preferred Contact Method *</label>
                <select
                  value={clientInfo.contactPreference}
                  onChange={(e) => setClientInfo({ ...clientInfo, contactPreference: e.target.value })}
                  className="w-full p-2 border rounded"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone Call</option>
                  <option value="text">Text Message</option>
                </select>
              </div>
              
              {/* Conditional contact information based on preference */}
              {clientInfo.contactPreference === 'email' ? (
                <div>
                  <label className="block text-sm font-medium mb-1">Your Email *</label>
                  <input
                    type="email"
                    value={clientInfo.email}
                    onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="your.email@example.com"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1">Your Phone Number *</label>
                  <input
                    type="tel"
                    value={clientInfo.phone}
                    onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                    className="w-full p-2 border rounded"
                    placeholder="(555) 123-4567"
                  />
                </div>
              )}
              
              {/* Room inclusion options */}
              <div>
                <label className="block text-sm font-medium mb-2">Include in Quote:</label>
                <div className="space-y-2">
                  {/* Kitchen inclusion checkbox */}
                  {kitchenData.elements.length > 0 && (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={clientInfo.includeKitchen}
                        onChange={(e) => setClientInfo({ ...clientInfo, includeKitchen: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Kitchen ({kitchenData.elements.length} items - ${calculateTotalPrice(kitchenData).toFixed(2)})</span>
                    </label>
                  )}
                  {/* Bathroom inclusion checkbox */}
                  {bathroomData.elements.length > 0 && (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={clientInfo.includeBathroom}
                        onChange={(e) => setClientInfo({ ...clientInfo, includeBathroom: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm">Bathroom ({bathroomData.elements.length} items - ${calculateTotalPrice(bathroomData).toFixed(2)})</span>
                    </label>
                  )}
                </div>
              </div>
              
              {/* Additional comments field */}
              <div>
                <label className="block text-sm font-medium mb-1">Comments/Special Requests</label>
                <textarea
                  value={clientInfo.comments}
                  onChange={(e) => setClientInfo({ ...clientInfo, comments: e.target.value })}
                  className="w-full p-2 border rounded h-24"
                  placeholder="Any specific requirements, questions, or notes about wall modifications..."
                />
              </div>
              
              {/* Process information panel */}
              <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="list-disc list-inside text-xs space-y-1">
                  <li>Your design and quote will be sent to our team</li>
                  <li>We'll review your requirements and contact you to get proper measurements</li>
                  <li>You'll receive a PDF copy of your design after we plan with you</li>
                  <li>We'll contact you within 1-4 business days via your preferred method</li>
                </ul>
              </div>
              
              {/* Modal action buttons */}
              <div className="flex gap-2 pt-4">
                {/* Cancel button */}
                <button
                  onClick={() => setShowQuoteForm(false)}
                  className="flex-1 p-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                {/* Submit quote request button */}
                <button
                  onClick={sendQuote}
                  className="flex-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  Send Quote Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// -----------------------------
// Top-Level App Component
// Main application component that handles routing between different sections
// Uses React Router to navigate between design tool, admin panel, and photo gallery
// -----------------------------
function App() {
  return (
    <Router>
      <Routes>
        {/* Main cabinet design application */}
        <Route path="/" element={<KitchenDesigner />} />
        {/* Admin panel for price management, photo uploads as well as employee bio */}
        <Route path="/admin" element={<AdminPanel />} />
        <Route path ="/designpreview" element={<DesignPreview />} />
      </Routes>
    </Router>
  );
}

// Export the main App component as default
export default App;
