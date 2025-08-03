import React, { useState, useRef, useEffect } from 'react';
import {
  Calculator,      // Pricing calculator icon
  Send,            // Send quote icon
  Home,            // Kitchen room icon
  Bath             // Bathroom room icon
} from 'lucide-react';
import jsPDF from 'jspdf';               // PDF generation library
import MainNavBar from './Navigation';
import WallView from './WallView';
import DesignerSidebar from './DesignerSidebar';
import { useLanguage } from '../contexts/LanguageContext';
import { usePricing } from '../contexts/PricingContext';
import { useAnalytics } from '../hooks/useAnalytics';

const KitchenDesigner = () => {
  // Analytics tracking
  useAnalytics('/designer');

  // Language context
  const { t } = useLanguage();

  // Shared pricing context
  const {
    materialMultipliers: sharedMaterialMultipliers,
    setMaterialMultipliers: setSharedMaterialMultipliers,
    basePrices: sharedBasePrices,
    setBasePrices: setSharedBasePrices,
    pricingVersion
  } = usePricing();
  // -----------------------------
  // Device Detection and Compatibility
  // Check screen size and device capabilities
  // -----------------------------
  const [deviceWarning, setDeviceWarning] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const minWidth = 1024; // Minimum width for designer
      const minHeight = 600; // Minimum height for designer
      const isSmallScreen = window.innerWidth < minWidth || window.innerHeight < minHeight;
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setDeviceWarning(isSmallScreen);
      setIsTouch(isTouchDevice);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // -----------------------------
  // Business Configuration
  // In production, these would come from environment variables or database
  // -----------------------------
  const COMPANY_NAME = 'Gudino Custom';
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
    colorCount: 1,     // Number of cabinet colors (affects pricing)
    walls: [1, 2, 3, 4], // Available walls (1=North, 2=East, 3=South, 4=West)
    removedWalls: [],   // Track removed walls for pricing
    customWalls: [],   // Custom drawn walls with coordinates
    allAvailableWalls: [1, 2, 3, 4], // All walls that can be managed (including custom)
    originalWalls: [1, 2, 3, 4],     // Track original walls for pricing
    doors: []          // Array to store doors: {id, wallNumber, position, width, type}
  });

  const [bathroomData, setBathroomData] = useState({
    dimensions: { width: '', height: '', wallHeight: '96' },
    elements: [],
    materials: {},
    colorCount: 1,
    walls: [1, 2, 3, 4], // Available walls (1=North, 2=East, 3=South, 4=West)
    removedWalls: [],   // Track removed walls for pricing
    customWalls: [],   // Custom drawn walls with coordinates
    allAvailableWalls: [1, 2, 3, 4], // All walls that can be managed (including custom)
    originalWalls: [1, 2, 3, 4],     // Track original walls for pricing
    doors: []          // Array to store doors: {id, wallNumber, position, width, type}
  });

  // -----------------------------
  // Current Room Helper Variables
  // These provide easy access to the currently active room's data
  // -----------------------------
  const currentRoomData = activeRoom === 'kitchen' ? kitchenData : bathroomData;
  const setCurrentRoomData = activeRoom === 'kitchen' ? setKitchenData : setBathroomData;

  // Helper accessors for wall data from current room
  const customWalls = currentRoomData.customWalls || [];
  const allAvailableWalls = currentRoomData.allAvailableWalls || [1, 2, 3, 4];
  const originalWalls = currentRoomData.originalWalls || [1, 2, 3, 4];

  // -----------------------------
  // UI and Interaction State
  // Controls user interface elements and interactions
  // -----------------------------
  const [selectedElement, setSelectedElement] = useState(null);           // Currently selected cabinet/appliance
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });          // Mouse offset for dragging
  const [isDragging, setIsDragging] = useState(false);                   // Floor plan dragging state
  const [isDraggingWallView, setIsDraggingWallView] = useState(false);   // Wall view dragging state
  const [dragPreviewPosition, setDragPreviewPosition] = useState(null);  // Preview position during drag
  const [lastMoveTime, setLastMoveTime] = useState(0);                   // Throttle drag updates
  const [scale, setScale] = useState(1);                                 // Canvas scaling factor
  const [viewMode, setViewMode] = useState('floor');                     // 'floor' or 'wall' view
  const [selectedWall, setSelectedWall] = useState(1);                   // Wall number for wall view (1-4)
  const [showPricing, setShowPricing] = useState(false);                 // Show/hide pricing panel
  const [showQuoteForm, setShowQuoteForm] = useState(false);             // Show/hide quote form modal
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);       // Sidebar collapse state
  const [showFloorPlanPresets, setShowFloorPlanPresets] = useState(false);  // Show/hide floor plan preset options
  const [isDrawingWall, setIsDrawingWall] = useState(false);                // Wall drawing mode
  const [wallDrawStart, setWallDrawStart] = useState(null);                 // Start point for wall drawing
  const [wallDrawPreview, setWallDrawPreview] = useState(null);             // Preview line while drawing
  const [selectedWallForEdit, setSelectedWallForEdit] = useState(null);     // Wall selected for editing
  const [wallEditMode, setWallEditMode] = useState(null);                   // 'length' or 'angle' editing mode
  const [showWallPreview, setShowWallPreview] = useState(false);            // Toggle to show walls vs no walls
  const [wallRemovalDisabled, setWallRemovalDisabled] = useState(false);    // Admin toggle to disable wall removals
  const [isRotatingWall, setIsRotatingWall] = useState(null);               // Wall being rotated
  const [isDoorMode, setIsDoorMode] = useState(false);                      // Door placement mode
  const [doorModeType, setDoorModeType] = useState('standard');             // Type of door being placed

  // Collapsible section states
  const [collapsedSections, setCollapsedSections] = useState({
    wallManagement: false,
    cabinetOptions: false,
    appliances: false,
    properties: false
  });
  const [rotationStart, setRotationStart] = useState(null);                 // Start point for wall rotation

  // Toggle collapsible sections
  const toggleSection = (sectionName) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

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
    // Kitchen Cabinets
    'base': 250,
    'sink-base': 320,
    'wall': 180,
    'tall': 450,
    'corner': 380,
    'drawer-base': 280,
    'double-drawer-base': 350,
    'glass-wall': 220,
    'open-shelf': 160,
    'island-base': 580,
    'peninsula-base': 420,
    'pantry': 520,
    'corner-wall': 210,

    // Bathroom Cabinets
    'vanity': 280,
    'vanity-sink': 350,
    'double-vanity': 650,
    'floating-vanity': 420,
    'corner-vanity': 380,
    'vanity-tower': 320,
    'medicine': 120,
    'medicine-mirror': 180,
    'linen': 350,
    'linen-tower': 420,

    // Kitchen Appliances
    'refrigerator': 0,        // Pricing handled separately for appliances
    'stove': 0,
    'dishwasher': 0,
    'microwave': 0,
    'wine-cooler': 0,
    'range-hood': 0,
    'double-oven': 0,

    // Bathroom Fixtures
    'toilet': 0,
    'bathtub': 0,
    'shower': 0
  });

  // Use shared material multipliers state
  const [materialMultipliers, setMaterialMultipliers] = useState(sharedMaterialMultipliers || {
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

  // Wall modification pricing (set by admin)
  const [wallPricing, setWallPricing] = useState({
    addWall: 1500,    // Cost to add a wall opening
    removeWall: 2000  // Cost to remove/modify a wall
  });

  // Wall service availability (controlled by admin)
  const [wallAvailability, setWallAvailability] = useState({
    addWallEnabled: true,
    removeWallEnabled: true
  });

  const [pricesLoading, setPricesLoading] = useState(true);

  // -----------------------------
  // API Configuration
  // Backend API endpoint for price loading
  // -----------------------------
  const API_BASE = process.env.REACT_APP_API_URL || 'https://api.gudinocustom.com';

  // -----------------------------
  // Load prices from backend on component mount
  // Fetches current pricing from database, falls back to defaults if unavailable
  // -----------------------------
  useEffect(() => {
    loadPrices();
  }, []);

  // Sync with shared pricing context when pricing version changes
  useEffect(() => {
    if (sharedMaterialMultipliers && Object.keys(sharedMaterialMultipliers).length > 0) {
      // Convert new bilingual array format to old object format if needed
      let materialObject = {};
      if (Array.isArray(sharedMaterialMultipliers)) {
        sharedMaterialMultipliers.forEach(material => {
          materialObject[material.nameEn.toLowerCase()] = material.multiplier;
        });
      } else {
        materialObject = sharedMaterialMultipliers;
      }

      setMaterialMultipliers(materialObject);
      console.log('Updated Kitchen Designer with shared material multipliers:', materialObject);
    }
  }, [pricingVersion, sharedMaterialMultipliers]);

  const loadPrices = async () => {
    try {
      const [pricesResponse, wallAvailResponse] = await Promise.all([
        fetch(`${API_BASE}/api/prices`),
        fetch(`${API_BASE}/api/prices/wall-availability`)
      ]);

      if (pricesResponse.ok) {
        const data = await pricesResponse.json();
        setBasePrices(data.basePrices);

        // Convert new bilingual array format to old object format for backward compatibility
        const materialObject = {};
        if (Array.isArray(data.materialMultipliers)) {
          data.materialMultipliers.forEach(material => {
            materialObject[material.nameEn.toLowerCase()] = material.multiplier;
          });
        } else {
          // Fallback to old format if still object
          Object.assign(materialObject, data.materialMultipliers);
        }
        setMaterialMultipliers(materialObject);
        setSharedMaterialMultipliers(materialObject); // Update shared context

        setColorPricing(data.colorPricing);
        if (data.wallPricing) {
          setWallPricing(data.wallPricing);
        }
        console.log('Loaded prices from database:', data);
        console.log('Converted material multipliers for designer:', materialObject);
      } else {
        console.error('Failed to load prices, using defaults');
      }

      if (wallAvailResponse.ok) {
        const wallAvailData = await wallAvailResponse.json();
        setWallAvailability(wallAvailData);
        console.log('Loaded wall availability settings:', wallAvailData);
      } else {
        console.error('Failed to load wall availability, using defaults');
      }
    } catch (error) {
      console.error('Error loading prices/settings:', error);
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
    'drawer-base': {
      name: 'Drawer Base Cabinet',
      defaultWidth: 18,
      defaultDepth: 24,
      fixedHeight: 34.5,
      color: '#c8c8c8',         // Slightly different color
      category: 'cabinet',
      zIndex: 1,
      room: 'kitchen',
      hasDrawers: true          // Special rendering flag
    },
    'double-drawer-base': {
      name: 'Double Drawer Base',
      defaultWidth: 30,
      defaultDepth: 24,
      fixedHeight: 34.5,
      color: '#c8c8c8',
      category: 'cabinet',
      zIndex: 1,
      room: 'kitchen',
      hasDrawers: true
    },
    'glass-wall': {
      name: 'Glass Front Wall Cabinet',
      defaultWidth: 24,
      defaultDepth: 12,
      minHeight: 12,
      defaultHeight: 30,
      color: '#e8e8e8',         // Lighter color for glass
      category: 'cabinet',
      zIndex: 2,
      room: 'kitchen',
      mountHeight: 54,
      hasGlass: true            // Special rendering flag
    },
    'open-shelf': {
      name: 'Open Shelf Cabinet',
      defaultWidth: 30,
      defaultDepth: 12,
      minHeight: 12,
      defaultHeight: 30,
      color: '#b8b8b8',
      category: 'cabinet',
      zIndex: 2,
      room: 'kitchen',
      mountHeight: 54,
      isOpen: true              // Special rendering flag
    },
    'island-base': {
      name: 'Kitchen Island',
      defaultWidth: 48,         // Larger for island
      defaultDepth: 36,
      fixedHeight: 34.5,
      color: '#a8a8a8',         // Different color for islands
      category: 'cabinet',
      zIndex: 1,
      room: 'kitchen',
      isIsland: true            // Special positioning and rendering
    },
    'peninsula-base': {
      name: 'Peninsula Cabinet',
      defaultWidth: 36,
      defaultDepth: 24,
      fixedHeight: 34.5,
      color: '#a8a8a8',
      category: 'cabinet',
      zIndex: 1,
      room: 'kitchen',
      isPeninsula: true         // Special positioning flag
    },
    'pantry': {
      name: 'Pantry Cabinet',
      defaultWidth: 24,
      defaultDepth: 24,
      minHeight: 60,
      defaultHeight: 84,
      color: '#d3d3d3',
      category: 'cabinet',
      zIndex: 1,
      room: 'kitchen',
      isPantry: true            // Special rendering flag
    },
    'corner-wall': {
      name: 'Corner Wall Cabinet',
      defaultWidth: 24,
      defaultDepth: 24,
      minHeight: 12,
      defaultHeight: 30,
      color: '#d3d3d3',
      category: 'cabinet',
      shape: 'corner',
      zIndex: 2,
      room: 'kitchen',
      mountHeight: 54
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
    'double-vanity': {
      name: 'Double Vanity',
      defaultWidth: 60,         // Wide for two sinks
      defaultDepth: 21,
      fixedHeight: 32,
      color: '#c8c8c8',
      category: 'cabinet',
      zIndex: 1,
      room: 'bathroom',
      hasSink: true,
      isDouble: true
    },
    'floating-vanity': {
      name: 'Floating Vanity',
      defaultWidth: 48,
      defaultDepth: 18,         // Shallower for modern look
      fixedHeight: 32,
      color: '#b8b8b8',
      category: 'cabinet',
      zIndex: 1,
      room: 'bathroom',
      hasSink: true,
      isFloating: true          // Special rendering flag
    },
    'corner-vanity': {
      name: 'Corner Vanity',
      defaultWidth: 30,
      defaultDepth: 30,
      fixedHeight: 32,
      color: '#d3d3d3',
      category: 'cabinet',
      shape: 'corner',
      zIndex: 1,
      room: 'bathroom',
      hasSink: true
    },
    'vanity-tower': {
      name: 'Vanity Tower',
      defaultWidth: 12,         // Very narrow
      defaultDepth: 21,
      defaultHeight: 84,
      minHeight: 60,
      color: '#d3d3d3',
      category: 'cabinet',
      zIndex: 1,
      room: 'bathroom',
      isTower: true
    },
    'medicine-mirror': {
      name: 'Medicine Cabinet w/ Mirror',
      defaultWidth: 30,
      defaultDepth: 6,
      fixedHeight: 36,          // Larger than basic medicine cabinet
      color: '#e8e8e8',
      category: 'cabinet',
      zIndex: 2,
      room: 'bathroom',
      mountHeight: 48,
      hasMirror: true
    },
    'linen-tower': {
      name: 'Linen Tower',
      defaultWidth: 24,
      defaultDepth: 18,         // Deeper than regular linen
      defaultHeight: 84,
      minHeight: 72,
      color: '#d3d3d3',
      category: 'cabinet',
      zIndex: 1,
      room: 'bathroom',
      isTower: true
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
    'microwave': {
      name: 'Built-in Microwave',
      defaultWidth: 30,
      defaultDepth: 15,         // Shallower for built-in
      fixedHeight: 18,          // Standard microwave height
      color: '#e0e0e0',
      category: 'appliance',
      zIndex: 2,                // Wall mounted
      room: 'kitchen',
      mountHeight: 54           // Above counter height
    },
    'wine-cooler': {
      name: 'Wine Cooler',
      defaultWidth: 24,
      defaultDepth: 24,
      fixedHeight: 34,
      color: '#d0d0d0',         // Slightly different color
      category: 'appliance',
      zIndex: 1,
      room: 'kitchen'
    },
    'range-hood': {
      name: 'Range Hood',
      defaultWidth: 36,         // Wider than stove
      defaultDepth: 18,
      fixedHeight: 12,          // Low profile
      color: '#c0c0c0',
      category: 'appliance',
      zIndex: 2,                // Wall mounted
      room: 'kitchen',
      mountHeight: 66           // Above stove height
    },
    'double-oven': {
      name: 'Double Wall Oven',
      defaultWidth: 30,
      defaultDepth: 25,
      fixedHeight: 50,          // Tall for double unit
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
      // Clean up invalid elements that might exist from previous versions
      const validElements = state.elements ? state.elements.filter(element => {
        const isValid = elementTypes[element.type];
        if (!isValid) {
          console.warn('Removing invalid element type from saved data:', element.type);
        }
        return isValid;
      }) : [];
      // Migrate old data format - ensure wall data exists
      const migratedState = {
        ...state,
        elements: validElements,
        customWalls: state.customWalls || [],
        allAvailableWalls: state.allAvailableWalls || [1, 2, 3, 4],
        originalWalls: state.originalWalls || [1, 2, 3, 4],
        doors: state.doors || []
      };
      setKitchenData(migratedState);
    }

    if (savedBathroom) {
      const state = JSON.parse(savedBathroom);
      // Clean up invalid elements that might exist from previous versions
      const validElements = state.elements ? state.elements.filter(element => {
        const isValid = elementTypes[element.type];
        if (!isValid) {
          console.warn('Removing invalid element type from saved data:', element.type);
        }
        return isValid;
      }) : [];
      // Migrate old data format - ensure wall data exists
      const migratedState = {
        ...state,
        elements: validElements,
        customWalls: state.customWalls || [],
        allAvailableWalls: state.allAvailableWalls || [1, 2, 3, 4],
        originalWalls: state.originalWalls || [1, 2, 3, 4],
        doors: state.doors || []
      };
      setBathroomData(migratedState);
    }
  }, []);

  // Save state whenever data changes (auto-save functionality)
  useEffect(() => {
    if (step === 'design') {
      localStorage.setItem('kitchenDesignState', JSON.stringify(kitchenData));
      localStorage.setItem('bathroomDesignState', JSON.stringify(bathroomData));
    }
  }, [kitchenData, bathroomData, step]);

  // Clean up deleted walls from UI whenever room data changes
  useEffect(() => {
    if (step === 'design') {
      const currentWalls = currentRoomData.walls || [];
      const existingCustomWallNumbers = customWalls.map(wall => wall.wallNumber);
      const existingWallNumbers = [...new Set([...currentWalls, ...existingCustomWallNumbers])];

      // Keep original walls (1-4) plus any existing custom walls
      const cleanedAvailableWalls = allAvailableWalls.filter(wallNum =>
        wallNum <= 4 || existingWallNumbers.includes(wallNum)
      );

      if (cleanedAvailableWalls.length !== allAvailableWalls.length) {
        // Only update if there's actually a change to avoid infinite loops
        const updatedData = activeRoom === 'kitchen' ?
          { ...kitchenData, allAvailableWalls: cleanedAvailableWalls } :
          { ...bathroomData, allAvailableWalls: cleanedAvailableWalls };

        if (activeRoom === 'kitchen') {
          setKitchenData(updatedData);
        } else {
          setBathroomData(updatedData);
        }
      }
    }
  }, [kitchenData.customWalls, bathroomData.customWalls, kitchenData.walls, bathroomData.walls, activeRoom, step]);

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

  // Wall management functions
  const addWall = (wallNumber) => {
    const currentWalls = currentRoomData.walls || [1, 2, 3, 4];
    const currentRemovedWalls = currentRoomData.removedWalls || [];

    if (!currentWalls.includes(wallNumber)) {
      setCurrentRoomData({
        ...currentRoomData,
        walls: [...currentWalls, wallNumber].sort(),
        removedWalls: currentRemovedWalls.filter(w => w !== wallNumber)
      });
    }
  };

  const removeWall = (wallNumber) => {
    if (wallRemovalDisabled) {
      alert('Wall removal service is temporarily disabled.');
      return;
    }

    const currentWalls = currentRoomData.walls || [1, 2, 3, 4];
    const currentRemovedWalls = currentRoomData.removedWalls || [];
    const isOriginalWall = originalWalls.includes(wallNumber);
    const customWall = getCustomWallByNumber(wallNumber);
    const existedPrior = customWall?.existedPrior || false;

    if (currentWalls.includes(wallNumber)) {
      // Check if any elements are on this wall before removing
      const elementsOnWall = getElementsOnWall(wallNumber);

      // Determine if there will be a cost
      const willHaveCost = isOriginalWall || existedPrior;
      const costMessage = willHaveCost ? ` This will cost $${wallPricing.removeWall}.` : ' This is free (wall never existed or was custom-added).';

      let confirmMessage = `Remove ${getWallName(wallNumber)}?${costMessage}`;

      if (elementsOnWall.length > 0) {
        confirmMessage = `Wall ${wallNumber} has ${elementsOnWall.length} cabinet(s) on it. Removing the wall will also remove these cabinets.${costMessage} Continue?`;
      }

      if (window.confirm(confirmMessage)) {
        const newElements = elementsOnWall.length > 0
          ? currentRoomData.elements.filter(el => !elementsOnWall.includes(el))
          : currentRoomData.elements;

        setCurrentRoomData({
          ...currentRoomData,
          elements: newElements,
          walls: currentWalls.filter(w => w !== wallNumber),
          removedWalls: [...currentRemovedWalls, wallNumber]
        });
      }
    }
  };

  const getWallName = (wallNumber) => {
    const wallNames = { 1: 'North', 2: 'East', 3: 'South', 4: 'West' };
    return wallNames[wallNumber] || `Custom Wall ${wallNumber}`;
  };

  const toggleWallDrawingMode = () => {
    setIsDrawingWall(!isDrawingWall);
    if (isDrawingWall) {
      // Exit drawing mode - save any drawn walls
      setSelectedElement(null);
      setWallDrawStart(null);
      setWallDrawPreview(null);
    }
  };

  const toggleDoorMode = () => {
    setIsDoorMode(!isDoorMode);
    if (isDoorMode) {
      setSelectedElement(null);
    }
  };

  // Snap point to nearest wall endpoint for seamless connections (only if close enough)
  const snapToWallEndpoints = (x, y, excludeWallId = null) => {
    const snapDistance = 12; // Smaller snap distance - only snap if really close
    let bestSnap = { x, y, snapped: false };
    let minDistance = snapDistance + 1;

    // Check against existing custom walls
    for (const wall of customWalls) {
      if (wall.id === excludeWallId) continue;

      // Check both endpoints of each wall
      const endpoints = [
        { x: wall.x1, y: wall.y1 },
        { x: wall.x2, y: wall.y2 }
      ];

      for (const endpoint of endpoints) {
        const distance = Math.sqrt(Math.pow(x - endpoint.x, 2) + Math.pow(y - endpoint.y, 2));
        if (distance < minDistance) {
          minDistance = distance;
          bestSnap = { x: endpoint.x, y: endpoint.y, snapped: true, snapType: 'wall-endpoint' };
        }
      }
    }

    // Check against room corners for standard walls
    const roomWidth = (parseFloat(currentRoomData.dimensions.width) * 12) * scale;
    const roomHeight = (parseFloat(currentRoomData.dimensions.height) * 12) * scale;

    const roomCorners = [
      { x: 0, y: 0, name: 'top-left' },
      { x: roomWidth, y: 0, name: 'top-right' },
      { x: roomWidth, y: roomHeight, name: 'bottom-right' },
      { x: 0, y: roomHeight, name: 'bottom-left' }
    ];

    for (const corner of roomCorners) {
      const distance = Math.sqrt(Math.pow(x - corner.x, 2) + Math.pow(y - corner.y, 2));
      if (distance < minDistance) {
        minDistance = distance;
        bestSnap = { x: corner.x, y: corner.y, snapped: true, snapType: 'room-corner', corner: corner.name };
      }
    }

    // Also check against standard wall edges for perpendicular connections
    const standardWallEdges = [
      // Top wall (Wall 1) - check bottom edge
      { x1: 0, y1: 10, x2: roomWidth, y2: 10, wallNum: 1 },
      // Right wall (Wall 2) - check left edge  
      { x1: roomWidth, y1: 0, x2: roomWidth, y2: roomHeight, wallNum: 2 },
      // Bottom wall (Wall 3) - check top edge
      { x1: 0, y1: roomHeight, x2: roomWidth, y2: roomHeight, wallNum: 3 },
      // Left wall (Wall 4) - check right edge
      { x1: 0, y1: 0, x2: 0, y2: roomHeight, wallNum: 4 }
    ];

    for (const edge of standardWallEdges) {
      // Check if current walls includes this wall
      if (!(currentRoomData.walls || []).includes(edge.wallNum)) continue;

      // Find closest point on edge to our point
      const closestPoint = getClosestPointOnLine(x, y, edge.x1, edge.y1, edge.x2, edge.y2);
      const distance = Math.sqrt(Math.pow(x - closestPoint.x, 2) + Math.pow(y - closestPoint.y, 2));

      if (distance < minDistance) {
        minDistance = distance;
        bestSnap = { x: closestPoint.x, y: closestPoint.y, snapped: true, snapType: 'wall-edge', wallNum: edge.wallNum };
      }
    }

    return bestSnap;
  };

  // Helper function to find closest point on a line segment
  const getClosestPointOnLine = (px, py, x1, y1, x2, y2) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    if (lenSq === 0) return { x: x1, y: y1 }; // Point is on the line start

    let param = dot / lenSq;

    // Clamp to line segment
    if (param < 0) param = 0;
    if (param > 1) param = 1;

    return {
      x: x1 + param * C,
      y: y1 + param * D
    };
  };

  const addCustomWallAtPosition = (x1, y1, x2, y2) => {
    // Snap endpoints to existing walls for seamless connections
    const snappedStart = snapToWallEndpoints(x1, y1);
    const snappedEnd = snapToWallEndpoints(x2, y2);

    const newWallId = `custom-${Date.now()}`;
    const nextWallNumber = Math.max(...allAvailableWalls) + 1;

    const newCustomWall = {
      id: newWallId,
      x1: snappedStart.x,
      y1: snappedStart.y,
      x2: snappedEnd.x,
      y2: snappedEnd.y,
      thickness: 6, // Default wall thickness in pixels
      isCustom: true,
      existedPrior: false, // Track if this wall existed before modifications
      wallNumber: nextWallNumber,
      doors: [] // Array to store doors on this wall
    };

    console.log('Wall snapping:', {
      original: { x1, y1, x2, y2 },
      snapped: { x1: snappedStart.x, y1: snappedStart.y, x2: snappedEnd.x, y2: snappedEnd.y },
      startSnapped: snappedStart.snapped,
      endSnapped: snappedEnd.snapped
    });

    // Add to current room walls
    const currentWalls = currentRoomData.walls || [1, 2, 3, 4];
    setCurrentRoomData({
      ...currentRoomData,
      customWalls: [...customWalls, newCustomWall],
      allAvailableWalls: [...allAvailableWalls, nextWallNumber],
      walls: [...currentWalls, nextWallNumber].sort()
    });

    return nextWallNumber;
  };

  const markWallAsExistedPrior = (wallNumber) => {
    const updatedCustomWalls = customWalls.map(wall =>
      wall.wallNumber === wallNumber
        ? { ...wall, existedPrior: true }
        : wall
    );

    // Add to original walls for pricing calculation
    const updatedOriginalWalls = !originalWalls.includes(wallNumber)
      ? [...originalWalls, wallNumber]
      : originalWalls;

    setCurrentRoomData({
      ...currentRoomData,
      customWalls: updatedCustomWalls,
      originalWalls: updatedOriginalWalls
    });
  };

  const getCustomWallByNumber = (wallNumber) => {
    return customWalls.find(wall => wall.wallNumber === wallNumber);
  };

  // Door management functions
  const addDoor = (wallNumber, position, width = 32, type = 'standard') => {
    const doorId = `door-${Date.now()}`;
    const newDoor = {
      id: doorId,
      wallNumber: wallNumber,
      position: position, // Position along the wall (0-100%)
      width: width, // Door width in inches
      type: type // 'standard', 'pantry', 'room', 'double'
    };

    setCurrentRoomData({
      ...currentRoomData,
      doors: [...(currentRoomData.doors || []), newDoor]
    });

    return doorId;
  };

  const removeDoor = (doorId) => {
    setCurrentRoomData({
      ...currentRoomData,
      doors: (currentRoomData.doors || []).filter(door => door.id !== doorId)
    });
  };

  const updateDoor = (doorId, updates) => {
    setCurrentRoomData({
      ...currentRoomData,
      doors: (currentRoomData.doors || []).map(door =>
        door.id === doorId ? { ...door, ...updates } : door
      )
    });
  };

  const getDoorsOnWall = (wallNumber) => {
    return (currentRoomData.doors || []).filter(door => door.wallNumber === wallNumber);
  };

  const getDoorTypes = () => {
    return [
      { value: 'standard', label: 'Standard Door', width: 32 },
      { value: 'pantry', label: 'Pantry Door', width: 24 },
      { value: 'room', label: 'Room Connection', width: 36 },
      { value: 'double', label: 'Double Door', width: 64 },
      { value: 'sliding', label: 'Sliding Door', width: 48 }
    ];
  };

  // Render wall with doors as openings
  const renderWallWithDoors = (wallNumber, wallRect) => {
    const doors = getDoorsOnWall(wallNumber);
    const { x, y, width, height, isHorizontal } = wallRect;

    if (doors.length === 0) {
      // No doors, render solid wall
      return (
        <rect key={`wall-${wallNumber}`} x={x} y={y} width={width} height={height} fill="#666" />
      );
    }

    // Sort doors by position for proper rendering
    const sortedDoors = doors.sort((a, b) => a.position - b.position);
    const wallElements = [];

    let currentPos = 0; // Position along wall (0-100%)

    sortedDoors.forEach((door, index) => {
      // Calculate door width as percentage of wall length
      let wallLengthInches;

      if (wallNumber <= 4) {
        // Room walls: wall represents room dimension in feet, so convert to inches
        wallLengthInches = isHorizontal
          ? parseFloat(currentRoomData.dimensions.width) * 12
          : parseFloat(currentRoomData.dimensions.height) * 12;
      } else {
        // Custom walls: calculate actual wall length from coordinates
        const customWall = getCustomWallByNumber(wallNumber);
        if (customWall) {
          const wallLengthPixels = Math.sqrt(Math.pow(customWall.x2 - customWall.x1, 2) + Math.pow(customWall.y2 - customWall.y1, 2));
          // Convert pixels to inches: pixels / (scale factor) gives feet, then * 12 for inches
          wallLengthInches = (wallLengthPixels / scale) / 12 * 12;  // This simplifies to wallLengthPixels / scale
        } else {
          // Fallback: assume 8 feet if custom wall not found
          wallLengthInches = 96;
        }
      }

      // Door width as percentage of wall length
      const doorWidthPercentage = (door.width / wallLengthInches) * 100;
      const halfDoorWidth = doorWidthPercentage / 2;

      // Ensure door doesn't go beyond wall boundaries
      const doorStart = Math.max(0, door.position - halfDoorWidth);
      const doorEnd = Math.min(100, door.position + halfDoorWidth);

      // Add wall segment before door
      if (currentPos < doorStart) {
        if (isHorizontal) {
          wallElements.push(
            <rect
              key={`wall-${wallNumber}-segment-${index}`}
              x={x + (currentPos / 100) * width}
              y={y}
              width={((doorStart - currentPos) / 100) * width}
              height={height}
              fill="#666"
            />
          );
        } else {
          wallElements.push(
            <rect
              key={`wall-${wallNumber}-segment-${index}`}
              x={x}
              y={y + (currentPos / 100) * height}
              width={width}
              height={((doorStart - currentPos) / 100) * height}
              fill="#666"
            />
          );
        }
      }

      // Add door opening visualization with drag handles
      const doorColor = door.type === 'pantry' ? '#8B4513' : door.type === 'room' ? '#4CAF50' : '#2196F3';
      const doorCenterX = isHorizontal ? x + (door.position / 100) * width : x + width / 2;
      const doorCenterY = isHorizontal ? y + height / 2 : y + (door.position / 100) * height;

      if (isHorizontal) {
        wallElements.push(
          <g key={`door-${door.id}`}>
            {/* Door opening */}
            <rect
              x={x + (doorStart / 100) * width}
              y={y - 2}
              width={((doorEnd - doorStart) / 100) * width}
              height={height + 4}
              fill="white"
              stroke={doorColor}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            <text
              x={doorCenterX}
              y={y + height / 2 + 3}
              textAnchor="middle"
              fontSize="8"
              fill={doorColor}
              fontWeight="bold"
            >
              DOOR
            </text>
            {/* Drag handle */}
            <circle
              cx={doorCenterX}
              cy={doorCenterY}
              r="6"
              fill={doorColor}
              stroke="white"
              strokeWidth="2"
              style={{ cursor: 'grab' }}
            />
            <text
              x={doorCenterX}
              y={doorCenterY + 2}
              textAnchor="middle"
              fontSize="8"
              fill="white"
              fontWeight="bold"
              style={{ pointerEvents: 'none' }}
            >
              ⋮⋮
            </text>
          </g>
        );
      } else {
        wallElements.push(
          <g key={`door-${door.id}`}>
            {/* Door opening */}
            <rect
              x={x - 2}
              y={y + (doorStart / 100) * height}
              width={width + 4}
              height={((doorEnd - doorStart) / 100) * height}
              fill="white"
              stroke={doorColor}
              strokeWidth="2"
              strokeDasharray="3,3"
            />
            <text
              x={x + width / 2}
              y={y + (door.position / 100) * height + 3}
              textAnchor="middle"
              fontSize="8"
              fill={doorColor}
              fontWeight="bold"
              transform={`rotate(90, ${x + width / 2}, ${y + (door.position / 100) * height})`}
            >
              DOOR
            </text>
            {/* Drag handle */}
            <circle
              cx={doorCenterX}
              cy={doorCenterY}
              r="6"
              fill={doorColor}
              stroke="white"
              strokeWidth="2"
              style={{ cursor: 'grab' }}
            />
            <text
              x={doorCenterX}
              y={doorCenterY + 2}
              textAnchor="middle"
              fontSize="8"
              fill="white"
              fontWeight="bold"
              style={{ pointerEvents: 'none' }}
              transform={`rotate(90, ${doorCenterX}, ${doorCenterY})`}
            >
              ⋮⋮
            </text>
          </g>
        );
      }

      currentPos = doorEnd;
    });

    // Add final wall segment after last door
    if (currentPos < 100) {
      if (isHorizontal) {
        wallElements.push(
          <rect
            key={`wall-${wallNumber}-final`}
            x={x + (currentPos / 100) * width}
            y={y}
            width={((100 - currentPos) / 100) * width}
            height={height}
            fill="#666"
          />
        );
      } else {
        wallElements.push(
          <rect
            key={`wall-${wallNumber}-final`}
            x={x}
            y={y + (currentPos / 100) * height}
            width={width}
            height={((100 - currentPos) / 100) * height}
            fill="#666"
          />
        );
      }
    }

    return wallElements;
  };

  // Clean up allAvailableWalls to remove walls that no longer exist
  const cleanupDeletedWalls = () => {
    const currentWalls = currentRoomData.walls || [];
    const existingCustomWallNumbers = customWalls.map(wall => wall.wallNumber);
    const existingWallNumbers = [...new Set([...currentWalls, ...existingCustomWallNumbers])];

    // Keep original walls (1-4) plus any existing custom walls
    const cleanedAvailableWalls = allAvailableWalls.filter(wallNum =>
      wallNum <= 4 || existingWallNumbers.includes(wallNum)
    );

    if (cleanedAvailableWalls.length !== allAvailableWalls.length) {
      setCurrentRoomData({
        ...currentRoomData,
        allAvailableWalls: cleanedAvailableWalls
      });
    }
  };

  const rotateCustomWall = (wallNumber, newAngleDegrees) => {
    const updatedCustomWalls = customWalls.map(wall => {
      if (wall.wallNumber === wallNumber) {
        const centerX = (wall.x1 + wall.x2) / 2;
        const centerY = (wall.y1 + wall.y2) / 2;
        const length = Math.sqrt(Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2));

        const angleRad = (newAngleDegrees * Math.PI) / 180;
        const halfLength = length / 2;

        return {
          ...wall,
          x1: centerX - halfLength * Math.cos(angleRad),
          y1: centerY - halfLength * Math.sin(angleRad),
          x2: centerX + halfLength * Math.cos(angleRad),
          y2: centerY + halfLength * Math.sin(angleRad),
          angle: newAngleDegrees // Store the angle for display
        };
      }
      return wall;
    });

    setCurrentRoomData({
      ...currentRoomData,
      customWalls: updatedCustomWalls
    });
  };

  const getCurrentWallAngle = (wallNumber) => {
    const wall = getCustomWallByNumber(wallNumber);
    if (wall) {
      return wall.angle || Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1) * 180 / Math.PI;
    }
    return 0;
  };

  const snapCabinetToCustomWall = (x, y, width, depth, excludeId) => {
    const snapDistance = 8;
    let bestSnap = { x, y, snapped: false };
    let minDistance = snapDistance + 1;

    for (const wall of customWalls) {
      if (!(currentRoomData.walls || []).includes(wall.wallNumber)) continue;

      const wallAngle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);
      const cabinetCenterX = x + width / 2;
      const cabinetCenterY = y + depth / 2;

      // Find closest point on wall to cabinet center
      const wallLength = Math.sqrt(Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2));
      const t = Math.max(0, Math.min(1,
        ((cabinetCenterX - wall.x1) * (wall.x2 - wall.x1) + (cabinetCenterY - wall.y1) * (wall.y2 - wall.y1)) /
        (wallLength * wallLength)
      ));

      const closestX = wall.x1 + t * (wall.x2 - wall.x1);
      const closestY = wall.y1 + t * (wall.y2 - wall.y1);

      const distance = Math.sqrt(Math.pow(cabinetCenterX - closestX, 2) + Math.pow(cabinetCenterY - closestY, 2));

      if (distance < minDistance) {
        // Snap cabinet parallel to wall at appropriate distance
        const offsetDistance = wall.thickness / 2 + Math.min(width, depth) / 2 + 2;
        const normalX = -Math.sin(wallAngle);
        const normalY = Math.cos(wallAngle);

        const snappedCenterX = closestX + normalX * offsetDistance;
        const snappedCenterY = closestY + normalY * offsetDistance;

        bestSnap = {
          x: snappedCenterX - width / 2,
          y: snappedCenterY - depth / 2,
          snapped: true,
          wallAngle: wallAngle * 180 / Math.PI // Convert to degrees
        };
        minDistance = distance;
      }
    }

    return bestSnap;
  };

  // Floor Plan Preset Functions
  const applyFloorPlanPreset = (presetType) => {
    const presets = {
      'traditional': {
        walls: [1, 2, 3, 4],
        removedWalls: [],
        description: 'Traditional closed kitchen with all 4 walls'
      },
      'open-concept': {
        walls: [1, 2, 4], // Remove south wall (3) for open concept
        removedWalls: [3],
        description: 'Open concept - south wall removed'
      },
      'galley-open': {
        walls: [1, 3], // Keep north and south walls only
        removedWalls: [2, 4],
        description: 'Galley style - east and west walls removed'
      },
      'island-focused': {
        walls: [1], // Keep only north wall
        removedWalls: [2, 3, 4],
        description: 'Island-focused - only north wall remains'
      },
      'peninsula': {
        walls: [1, 2, 3], // Remove west wall for peninsula
        removedWalls: [4],
        description: 'Peninsula layout - west wall removed'
      }
    };

    const preset = presets[presetType];
    if (preset) {
      setCurrentRoomData({
        ...currentRoomData,
        walls: preset.walls,
        removedWalls: preset.removedWalls,
        elements: [] // Clear existing elements when changing floor plan
      });
      setShowFloorPlanPresets(false);
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

    // Add wall modification costs
    const removedWalls = data.removedWalls || [];
    const dataOriginalWalls = data.originalWalls || [1, 2, 3, 4];
    // Only charge for removing walls that were originally present or were custom-added and saved
    const chargeableRemovedWalls = removedWalls.filter(wall => dataOriginalWalls.includes(wall));
    if (chargeableRemovedWalls.length > 0) {
      total += chargeableRemovedWalls.length * wallPricing.removeWall;
    }

    // Add cost for custom walls that were added (walls beyond the original 4)
    const currentWalls = data.walls || [1, 2, 3, 4];
    const customAddedWalls = currentWalls.filter(wall => !dataOriginalWalls.includes(wall));
    if (customAddedWalls.length > 0) {
      total += customAddedWalls.length * wallPricing.addWall;
    }

    return total;
  };

  // -----------------------------
  // Cabinet Snapping Functions
  // Automatically align cabinets to each other and walls for clean layouts
  // -----------------------------

  // Snap cabinet to adjacent cabinets
  const snapToCabinet = (x, y, width, depth, excludeId, rotation) => {
    const snapDistance = 8; // Increased snap distance for easier snapping
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

  // Check if cabinet would collide with custom walls using proper line-rectangle intersection
  const checkWallCollision = (x, y, width, depth) => {
    for (const wall of customWalls) {
      // Only check walls that are present
      if (!(currentRoomData.walls || []).includes(wall.wallNumber)) continue;

      // Create cabinet rectangle corners
      const corners = [
        { x: x, y: y },
        { x: x + width, y: y },
        { x: x + width, y: y + depth },
        { x: x, y: y + depth }
      ];

      // Check if wall line intersects with any cabinet edge or if cabinet overlaps wall
      const wallThickness = wall.thickness;

      // Calculate wall as a thick line (rectangle)
      const wallLength = Math.sqrt(Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2));
      const wallAngle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);

      // Wall center point
      const wallCenterX = (wall.x1 + wall.x2) / 2;
      const wallCenterY = (wall.y1 + wall.y2) / 2;

      // Check if cabinet center is too close to wall
      const cabinetCenterX = x + width / 2;
      const cabinetCenterY = y + depth / 2;

      // Distance from cabinet center to wall line
      const A = wall.y2 - wall.y1;
      const B = wall.x1 - wall.x2;
      const C = wall.x2 * wall.y1 - wall.x1 * wall.y2;
      const distance = Math.abs(A * cabinetCenterX + B * cabinetCenterY + C) / Math.sqrt(A * A + B * B);

      // Check if cabinet is too close to wall (considering both wall thickness and cabinet size)
      const minDistance = (wallThickness + Math.min(width, depth)) / 2;

      if (distance < minDistance) {
        // Also check if the collision point is within the wall segment bounds
        const t = ((cabinetCenterX - wall.x1) * (wall.x2 - wall.x1) + (cabinetCenterY - wall.y1) * (wall.y2 - wall.y1)) /
          (Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2));

        if (t >= -0.1 && t <= 1.1) { // Small buffer for edge cases
          return true; // Collision detected
        }
      }
    }
    return false; // No collision
  };

  // Snap cabinet to room walls
  const snapToWall = (x, y, width, depth) => {
    const roomWidth = parseFloat(currentRoomData.dimensions.width) * 12 * scale;
    const roomHeight = parseFloat(currentRoomData.dimensions.height) * 12 * scale;
    const snapDistance = 12; // Increased snap distance for walls

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

    // Check for wall collision and adjust if needed
    if (checkWallCollision(snappedX, snappedY, width, depth)) {
      // Try to find a nearby position that doesn't collide
      const searchRadius = 20;
      for (let offsetX = -searchRadius; offsetX <= searchRadius; offsetX += 5) {
        for (let offsetY = -searchRadius; offsetY <= searchRadius; offsetY += 5) {
          const testX = Math.max(0, Math.min(snappedX + offsetX, roomWidth - width));
          const testY = Math.max(0, Math.min(snappedY + offsetY, roomHeight - depth));
          if (!checkWallCollision(testX, testY, width, depth)) {
            return { x: testX, y: testY };
          }
        }
      }
    }

    return { x: snappedX, y: snappedY };
  };

  // -----------------------------
  // Element Management Functions
  // Add, update, delete, and manipulate cabinet/appliance elements
  // -----------------------------

  // Add new element to the room
  const addElement = (type) => {
    const elementSpec = elementTypes[type];
    if (!elementSpec) {
      console.warn('Cannot add element: Missing elementSpec for type:', type);
      return;
    }

    // Calculate element dimensions in pixels
    const elementWidth = elementSpec.defaultWidth * scale;
    const elementDepth = elementSpec.defaultDepth * scale;

    // Try to place new element in center of room first
    let roomCenter = {
      x: (parseFloat(currentRoomData.dimensions.width) * 12 * scale) / 2 - elementWidth / 2,
      y: (parseFloat(currentRoomData.dimensions.height) * 12 * scale) / 2 - elementDepth / 2
    };

    // Check if center position conflicts with door clearance
    if (checkDoorClearanceCollision(roomCenter.x, roomCenter.y, elementWidth, elementDepth)) {
      // Find alternative position away from door clearances
      const roomWidth = parseFloat(currentRoomData.dimensions.width) * 12 * scale;
      const roomHeight = parseFloat(currentRoomData.dimensions.height) * 12 * scale;
      let foundPosition = false;

      // Try different positions in a grid pattern
      for (let offsetY = 0; offsetY < roomHeight - elementDepth && !foundPosition; offsetY += 50) {
        for (let offsetX = 0; offsetX < roomWidth - elementWidth && !foundPosition; offsetX += 50) {
          if (!checkDoorClearanceCollision(offsetX, offsetY, elementWidth, elementDepth)) {
            roomCenter = { x: offsetX, y: offsetY };
            foundPosition = true;
          }
        }
      }

      // If no position found, warn user and use center anyway
      if (!foundPosition) {
        alert('Warning: Element placed in door clearance area. Please move it to ensure proper door access.');
      }
    }

    const newElement = {
      id: Date.now(),                                                        // Unique ID based on timestamp
      type: type,
      x: roomCenter.x,                                                      // Calculated position
      y: roomCenter.y,                                                      // Calculated position
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
  // Touch and Mouse Event Handlers
  // Handle dragging and interaction with elements on the canvas for both touch and mouse
  // -----------------------------

  // Get coordinates from either touch or mouse event
  const getEventCoordinates = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY };
    }
    return { clientX: e.clientX, clientY: e.clientY };
  };

  // Start dragging an element in floor plan view (supports both touch and mouse)
  const handleMouseDown = (e, elementId) => {
    e.preventDefault();
    const element = currentRoomData.elements.find(el => el.id === elementId);
    if (element) {
      // Get coordinates from touch or mouse event
      const coords = getEventCoordinates(e);

      // Convert coordinates to SVG coordinates
      const rect = canvasRef.current.getBoundingClientRect();
      const svgPt = canvasRef.current.createSVGPoint();
      svgPt.x = coords.clientX;
      svgPt.y = coords.clientY;
      const cursorPt = svgPt.matrixTransform(canvasRef.current.getScreenCTM().inverse());

      // Calculate offset from element position to cursor
      setDragOffset({
        x: cursorPt.x - element.x - 30, // Account for canvas offset
        y: cursorPt.y - element.y - 30
      });
      setIsDragging(true);
      setSelectedElement(elementId);
    }
  };

  // Start dragging wall-mounted element in wall view (supports both touch and mouse)
  const handleWallViewMouseDown = (e, elementId) => {
    e.preventDefault();
    const element = currentRoomData.elements.find(el => el.id === elementId);
    if (element && (element.type === 'wall' || element.type === 'medicine')) {
      setIsDraggingWallView(false);
      setSelectedElement(elementId);

      // Get coordinates from touch or mouse event
      const coords = getEventCoordinates(e);
      const rect = e.currentTarget.getBoundingClientRect();
      setDragOffset({
        x: coords.clientX,
        y: coords.clientY - rect.top,
        startMount: element.mountHeight // Remember starting mount height
      });
    }
  };

  // Throttle function to improve performance during dragging
  const throttle = (func, limit) => {
    let inThrottle;
    return function () {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  };

  // Handle touch/mouse movement during dragging
  const handleMouseMove = throttle((e) => {
    // Handle wall drawing preview - show live preview as mouse moves
    if (isDrawingWall && wallDrawStart && canvasRef.current) {
      const coords = getEventCoordinates(e);
      const svgPt = canvasRef.current.createSVGPoint();
      svgPt.x = coords.clientX;
      svgPt.y = coords.clientY;
      const cursorPt = svgPt.matrixTransform(canvasRef.current.getScreenCTM().inverse());

      setWallDrawPreview({
        x1: wallDrawStart.x,
        y1: wallDrawStart.y,
        x2: cursorPt.x - 30, // Account for canvas offset
        y2: cursorPt.y - 30
      });
      return;
    }

    if (isDragging && selectedElement) {
      const element = currentRoomData.elements.find(el => el.id === selectedElement);
      if (element && canvasRef.current) {
        // Get coordinates from touch or mouse event
        const coords = getEventCoordinates(e);

        // Convert coordinates to SVG coordinates
        const svgPt = canvasRef.current.createSVGPoint();
        svgPt.x = coords.clientX;
        svgPt.y = coords.clientY;
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

        // If not snapped to regular walls, try snapping to custom walls
        if (!position.snapped) {
          const customWallSnap = snapCabinetToCustomWall(boundedX, boundedY, elementWidth, elementDepth, element.id);
          if (customWallSnap.snapped) {
            position = customWallSnap;
            // Optionally rotate cabinet to align with wall
            if (customWallSnap.wallAngle !== undefined) {
              updateElement(element.id, { rotation: Math.round(customWallSnap.wallAngle / 15) * 15 }); // Snap to 15-degree increments
            }
          }
        }

        // Check for wall collision before allowing the move
        if (checkWallCollision(position.x, position.y, elementWidth, elementDepth)) {
          // Don't allow the move if it would cause a collision
          return;
        }

        // Check for door clearance collision before allowing the move
        if (checkDoorClearanceCollision(position.x, position.y, elementWidth, elementDepth)) {
          // Don't allow the move if it would block door clearance
          return;
        }

        // Set preview position for visual feedback
        setDragPreviewPosition({ x: position.x, y: position.y, elementId: element.id });

        // Update element position with improved smoothness
        requestAnimationFrame(() => {
          updateElement(element.id, { x: position.x, y: position.y });
        });
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
  }, 16); // ~60fps throttling for smooth dragging

  // Stop dragging (wall completion now handled in onClick)
  const handleMouseUp = () => {

    setIsDragging(false);
    setIsDraggingWallView(false);
    setDragPreviewPosition(null); // Clear preview position
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
    if (!elementSpec) {
      console.warn('Missing elementSpec for type:', element.type);
      return;
    }
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

  // Calculate extended door clearance zones for ADA compliance - zones extend beyond room boundaries
  const getDoorClearanceZones = () => {
    // Configurable clearance offsets - adjust these values to test different clearance positioning
    const CLEARANCE_DEPTH_MULTIPLIER = 1.5;  // How deep the clearance extends (1.5x door width)
    const CLEARANCE_WIDTH_MULTIPLIER = 1.0;  // How wide the clearance is (1.0x = same as door width)
    const POSITION_OFFSET_X = -33;              // Manual X offset adjustment
    const POSITION_OFFSET_Y = 0;              // Manual Y offset adjustment

    const clearanceZones = [];
    const doors = currentRoomData.doors || [];
    const roomWidth = parseFloat(currentRoomData.dimensions.width) * 12 * scale;
    const roomHeight = parseFloat(currentRoomData.dimensions.height) * 12 * scale;

    doors.forEach(door => {
      const doorWidthPixels = door.width * scale;
      // Use configurable multipliers for clearance dimensions
      const clearanceDepth = doorWidthPixels * CLEARANCE_DEPTH_MULTIPLIER;
      const clearanceWidth = doorWidthPixels * CLEARANCE_WIDTH_MULTIPLIER;

      let clearanceZone = null;

      if (door.wallNumber <= 4) {
        // Standard walls (1-4) - match exact wall rendering coordinates
        // Define wall parameters exactly as they are in renderWallWithDoors calls
        let wallParams;
        switch (door.wallNumber) {
          case 1: // Top wall
            wallParams = { x: 20, y: 20, width: roomWidth + 20, height: 10, isHorizontal: true };
            break;
          case 2: // Right wall  
            wallParams = { x: 30 + roomWidth, y: 20, width: 10, height: roomHeight + 20, isHorizontal: false };
            break;
          case 3: // Bottom wall
            wallParams = { x: 20, y: 30 + roomHeight, width: roomWidth + 20, height: 10, isHorizontal: true };
            break;
          case 4: // Left wall
            wallParams = { x: 20, y: 20, width: 10, height: roomHeight + 20, isHorizontal: false };
            break;
        }

        // Calculate door center using EXACT same logic as renderWallWithDoors
        const doorCenterX = wallParams.isHorizontal ? wallParams.x + (door.position / 100) * wallParams.width : wallParams.x + wallParams.width / 2;
        const doorCenterY = wallParams.isHorizontal ? wallParams.y + wallParams.height / 2 : wallParams.y + (door.position / 100) * wallParams.height;

        // Create clearance zone centered exactly on the door with configurable offsets
        if (wallParams.isHorizontal) {
          // Horizontal walls (top/bottom) - clearance extends vertically into room
          clearanceZone = {
            x: doorCenterX - clearanceWidth / 2 + POSITION_OFFSET_X,
            y: door.wallNumber === 1 ? wallParams.y + wallParams.height + POSITION_OFFSET_Y : wallParams.y - clearanceDepth + POSITION_OFFSET_Y,
            width: clearanceWidth,
            height: clearanceDepth,
            doorId: door.id
          };
        } else {
          // Vertical walls (left/right) - clearance extends horizontally into room
          clearanceZone = {
            x: door.wallNumber === 4 ? wallParams.x + wallParams.width + POSITION_OFFSET_X : wallParams.x - clearanceDepth + POSITION_OFFSET_X,
            y: doorCenterY - clearanceWidth / 2 + POSITION_OFFSET_Y,
            width: clearanceDepth,
            height: clearanceWidth,
            doorId: door.id
          };
        }
      } else {
        // Custom walls (wallNumber > 4)
        const customWall = getCustomWallByNumber(door.wallNumber);
        if (customWall) {
          // Calculate wall properties
          const wallLength = Math.sqrt(Math.pow(customWall.x2 - customWall.x1, 2) + Math.pow(customWall.y2 - customWall.y1, 2));
          const wallAngle = Math.atan2(customWall.y2 - customWall.y1, customWall.x2 - customWall.x1);

          // Calculate door position along the wall
          const doorPosAlongWall = (door.position / 100) * wallLength;
          const doorCenterX = 30 + customWall.x1 + Math.cos(wallAngle) * doorPosAlongWall;
          const doorCenterY = 30 + customWall.y1 + Math.sin(wallAngle) * doorPosAlongWall;

          // Calculate perpendicular direction (into room) - rotate wall direction by 90 degrees
          const perpAngle = wallAngle + Math.PI / 2;
          const clearanceCenterX = doorCenterX + Math.cos(perpAngle) * (clearanceDepth / 2);
          const clearanceCenterY = doorCenterY + Math.sin(perpAngle) * (clearanceDepth / 2);

          // For custom walls, create clearance zone with configurable dimensions
          clearanceZone = {
            x: clearanceCenterX - clearanceWidth / 2 + POSITION_OFFSET_X,
            y: clearanceCenterY - clearanceDepth / 2 + POSITION_OFFSET_Y,
            width: clearanceWidth,
            height: clearanceDepth,
            doorId: door.id,
            // Store rotation info for more accurate collision detection
            rotation: wallAngle * 180 / Math.PI + 90, // Perpendicular to wall
            centerX: clearanceCenterX + POSITION_OFFSET_X,
            centerY: clearanceCenterY + POSITION_OFFSET_Y
          };
        }
      }

      if (clearanceZone) {
        clearanceZones.push(clearanceZone);
        // Debug logging for door clearance zones
      }
    });

    return clearanceZones;
  };

  // Check if an element position conflicts with door clearance zones
  const checkDoorClearanceCollision = (elementX, elementY, elementWidth, elementHeight) => {
    const clearanceZones = getDoorClearanceZones();

    return clearanceZones.some(zone => {
      if (zone.rotation !== undefined) {
        // Rotated clearance zone (custom wall) - use more complex collision detection
        return checkRotatedRectCollision(
          elementX, elementY, elementWidth, elementHeight, 0, // Element (assumed axis-aligned)
          zone.centerX, zone.centerY, zone.width, zone.height, zone.rotation // Clearance zone
        );
      } else {
        // Axis-aligned clearance zone (standard wall) - simple AABB collision
        const collision = !(elementX + elementWidth < zone.x ||
          elementX > zone.x + zone.width ||
          elementY + elementHeight < zone.y ||
          elementY > zone.y + zone.height);


        return collision;
      }
    });
  };

  // Check collision between an axis-aligned rectangle and a rotated rectangle
  const checkRotatedRectCollision = (ax, ay, aWidth, aHeight, aRotation, bx, by, bWidth, bHeight, bRotation) => {
    // For simplicity, we'll use a conservative approach:
    // Calculate the bounding box of the rotated clearance zone and check against that
    const angleRad = (bRotation || 0) * Math.PI / 180;

    // Calculate corners of rotated rectangle
    const halfWidth = bWidth / 2;
    const halfHeight = bHeight / 2;

    const corners = [
      { x: -halfWidth, y: -halfHeight },
      { x: halfWidth, y: -halfHeight },
      { x: halfWidth, y: halfHeight },
      { x: -halfWidth, y: halfHeight }
    ];

    // Rotate corners and find bounding box
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    corners.forEach(corner => {
      const rotatedX = corner.x * Math.cos(angleRad) - corner.y * Math.sin(angleRad) + bx;
      const rotatedY = corner.x * Math.sin(angleRad) + corner.y * Math.cos(angleRad) + by;

      minX = Math.min(minX, rotatedX);
      maxX = Math.max(maxX, rotatedX);
      minY = Math.min(minY, rotatedY);
      maxY = Math.max(maxY, rotatedY);
    });

    // Check collision with expanded bounding box
    return !(ax + aWidth < minX ||
      ax > maxX ||
      ay + aHeight < minY ||
      ay > maxY);
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
            {/* Door swing arcs for left hinge */}
            <path
              d={`M ${x} ${y + size * 0.6} L ${x} ${y + size * 0.45} A ${size * 0.15} ${size * 0.15} 0 0 1 ${x + size * 0.15} ${y + size * 0.6} Z`}
              fill="none"
              stroke="#666"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
            <path
              d={`M ${x + size * 0.6} ${y} L ${x + size * 0.45} ${y} A ${size * 0.15} ${size * 0.15} 0 0 1 ${x + size * 0.6} ${y + size * 0.15} Z`}
              fill="none"
              stroke="#666"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
          </>
        ) : (
          <>
            <line x1={x + size * 0.4} y1={y} x2={x + size * 0.4} y2={y + size * 0.6} stroke="#333" strokeWidth="1" />
            <line x1={x + size * 0.4} y1={y + size * 0.6} x2={x + size} y2={y + size * 0.6} stroke="#333" strokeWidth="1" />
            {/* Door swing arcs for right hinge */}
            <path
              d={`M ${x + size * 0.4} ${y} L ${x + size * 0.25} ${y} A ${size * 0.15} ${size * 0.15} 0 0 0 ${x + size * 0.4} ${y + size * 0.15} Z`}
              fill="none"
              stroke="#666"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
            <path
              d={`M ${x + size * 0.4} ${y + size * 0.6} L ${x + size * 0.4} ${y + size * 0.45} A ${size * 0.15} ${size * 0.15} 0 0 0 ${x + size * 0.55} ${y + size * 0.6} Z`}
              fill="none"
              stroke="#666"
              strokeWidth="0.5"
              strokeDasharray="2,2"
            />
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

        // Wall modifications for this room
        const removedWalls = room.data.removedWalls || [];
        const chargeableRemoved = removedWalls.filter(wall => originalWalls.includes(wall));
        const customAdded = (room.data.walls || []).filter(wall => !originalWalls.includes(wall));

        if (chargeableRemoved.length > 0 || customAdded.length > 0) {
          currentY += 5;
          pdf.setFontSize(10);
          pdf.text('Wall Modifications:', 20, currentY);
          currentY += 5;

          if (chargeableRemoved.length > 0) {
            pdf.text(`• ${chargeableRemoved.length} wall(s) removed: $${(chargeableRemoved.length * wallPricing.removeWall).toFixed(2)}`, 25, currentY);
            currentY += 5;
          }

          if (customAdded.length > 0) {
            pdf.text(`• ${customAdded.length} custom wall(s) added: $${(customAdded.length * wallPricing.addWall).toFixed(2)}`, 25, currentY);
            currentY += 5;
          }
        }

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
    if (!clientInfo.name || !clientInfo.email || !clientInfo.phone) {
      if (!clientInfo.name) {
        alert('please fill in your name');
        return;
      }
      else if (!clientInfo.email) {
        alert('please fill in your email');
        return;
      }
      else if (!clientInfo.phone) {
        alert('please fill in your phone number');
        return;
      }
    }


    try {
      // Show loading state
      const loadingMessage = document.createElement('div');
      loadingMessage.innerHTML = 'Capturing your design...';
      loadingMessage.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 1000;';
      document.body.appendChild(loadingMessage);

      // Helper function to capture SVG and convert to canvas for PDF
      const captureSVG = async (svgElement) => {
        if (!svgElement) return null;

        try {
          // Clone the SVG to avoid modifying the original
          const clonedSvg = svgElement.cloneNode(true);

          // Set explicit dimensions if missing
          const rect = svgElement.getBoundingClientRect();
          if (!clonedSvg.getAttribute('width')) {
            clonedSvg.setAttribute('width', rect.width);
          }
          if (!clonedSvg.getAttribute('height')) {
            clonedSvg.setAttribute('height', rect.height);
          }

          // Add white background
          const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          background.setAttribute('width', '100%');
          background.setAttribute('height', '100%');
          background.setAttribute('fill', 'white');
          clonedSvg.insertBefore(background, clonedSvg.firstChild);

          // Convert SVG to canvas for better PDF compatibility
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Set canvas size
          canvas.width = parseFloat(clonedSvg.getAttribute('width')) || rect.width;
          canvas.height = parseFloat(clonedSvg.getAttribute('height')) || rect.height;

          // Create image from SVG
          const img = new Image();
          const svgData = new XMLSerializer().serializeToString(clonedSvg);
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const url = URL.createObjectURL(svgBlob);

          return new Promise((resolve) => {
            img.onload = () => {
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
              URL.revokeObjectURL(url);
              const dataURL = canvas.toDataURL('image/png', 1.0);
              resolve(dataURL);
            };
            img.onerror = () => {
              console.error('Error loading SVG image');
              URL.revokeObjectURL(url);
              resolve(null);
            };
            img.src = url;
          });
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
        floorPlanImage = await captureSVG(floorCanvas);
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
          const wallImage = await captureSVG(wallCanvas);
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
          pdf.text('(Wall view available in admin panel)', 20, currentY);
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
      alert('Error sending your design. Please try again.', alert);
    }
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
      <>
        <MainNavBar />

        <div className="min-h-screen p-8" style={{ background: 'rgb(110,110,110)' }}>
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
                      {t('designer.roomWidth')}
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
                      {t('designer.roomDepth')}
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
                    {t('designer.wallHeight')}
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
      </>
    );
  }

  // STEP 2: Main Design Interface
  // Full-featured design environment with sidebar controls and main canvas
  return (
    <>
      <MainNavBar />
      {/* Device Warning Modal */}
      {deviceWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mb-4">
                <Calculator className="mx-auto h-12 w-12 text-yellow-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Screen Size Too Small</h3>
              <p className="text-gray-600 mb-4">
                The Kitchen Designer requires a minimum screen size of 1024x600 pixels for optimal functionality.
                Please use a tablet, laptop, or desktop computer for the best experience.
              </p>
              <div className="mb-4 text-sm text-gray-500">
                Current: {window.innerWidth}×{window.innerHeight}px<br />
                Required: 1024×600px minimum
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeviceWarning(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Continue Anyway
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Go Back
                </button>
              </div>
              {isTouch && (
                <p className="text-xs text-green-600 mt-2">
                  ✓ Touch support enabled for this device
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-100" >
        <div className="flex h-screen">

          {/* ========== LEFT SIDEBAR ========== */}
          <DesignerSidebar
            // UI State
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
            activeRoom={activeRoom}
            switchRoom={switchRoom}
            viewMode={viewMode}
            setViewMode={setViewMode}
            
            // Design Data
            currentRoomData={currentRoomData}
            setCurrentRoomData={setCurrentRoomData}
            selectedElement={selectedElement}
            elementTypes={elementTypes}
            
            // Pricing
            showPricing={showPricing}
            setShowPricing={setShowPricing}
            calculateTotalPrice={calculateTotalPrice}
            basePrices={basePrices}
            materialMultipliers={materialMultipliers}
            colorPricing={colorPricing}
            wallPricing={wallPricing}
            wallAvailability={wallAvailability}
            
            // Actions
            addElement={addElement}
            updateElement={updateElement}
            deleteElement={deleteElement}
            setShowQuoteForm={setShowQuoteForm}
            
            // Wall/Elements
            allAvailableWalls={allAvailableWalls}
            selectedWall={selectedWall}
            setSelectedWall={setSelectedWall}
            getWallName={getWallName}
            getCustomWallByNumber={getCustomWallByNumber}
            
            // Wall Management
            isDrawingWall={isDrawingWall}
            setIsDrawingWall={setIsDrawingWall}
            wallDrawStart={wallDrawStart}
            setWallDrawStart={setWallDrawStart}
            setWallDrawPreview={setWallDrawPreview}
            toggleWallDrawingMode={toggleWallDrawingMode}
            isDoorMode={isDoorMode}
            toggleDoorMode={toggleDoorMode}
            doorModeType={doorModeType}
            setDoorModeType={setDoorModeType}
            customWalls={customWalls}
            wallRemovalDisabled={wallRemovalDisabled}
            addWall={addWall}
            removeWall={removeWall}
            markWallAsExistedPrior={markWallAsExistedPrior}
            getCurrentWallAngle={getCurrentWallAngle}
            addDoor={addDoor}
            removeDoor={removeDoor}
            updateDoor={updateDoor}
            getDoorsOnWall={getDoorsOnWall}
            getDoorTypes={getDoorTypes}
            
            // Additional state needed
            collapsedSections={collapsedSections}
            toggleSection={toggleSection}
            rotateElement={rotateElement}
            rotateCornerCabinet={rotateCornerCabinet}
            resetDesign={resetDesign}
            originalWalls={originalWalls}
          />


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
                        className="px-2 py-1 border rounded text-xs"
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
                      className={isDrawingWall ? "cursor-crosshair" : "cursor-default"}
                      onMouseMove={handleMouseMove}
                      onMouseUp={(e) => {
                        // Handle wall drawing completion on mouse up if in drawing mode
                        if (isDrawingWall && wallDrawStart) {
                          const targetIsCanvas = e.target === e.currentTarget ||
                            e.target.tagName === 'rect' && e.target.id === 'room-floor' ||
                            e.target.tagName === 'rect' && e.target.getAttribute('fill') === 'url(#grid)' ||
                            e.target.tagName === 'rect' && e.target.getAttribute('fill') === 'white';

                          if (targetIsCanvas) {
                            const coords = getEventCoordinates(e);
                            const svgPt = canvasRef.current.createSVGPoint();
                            svgPt.x = coords.clientX;
                            svgPt.y = coords.clientY;
                            const cursorPt = svgPt.matrixTransform(canvasRef.current.getScreenCTM().inverse());

                            const clickX = cursorPt.x - 30;
                            const clickY = cursorPt.y - 30;

                            const minWallLength = 20;
                            const wallLength = Math.sqrt(
                              Math.pow(clickX - wallDrawStart.x, 2) +
                              Math.pow(clickY - wallDrawStart.y, 2)
                            );

                            console.log('Wall drawing mouseUp:', {
                              startX: wallDrawStart.x,
                              startY: wallDrawStart.y,
                              endX: clickX,
                              endY: clickY,
                              wallLength: wallLength.toFixed(1),
                              target: e.target.tagName
                            });

                            if (wallLength >= minWallLength) {
                              addCustomWallAtPosition(
                                wallDrawStart.x,
                                wallDrawStart.y,
                                clickX,
                                clickY
                              );
                              console.log('Wall completed via mouseUp');
                            } else if (wallLength > 5) { // Only show alert if they actually tried to draw something
                              alert(`Wall is too short (${wallLength.toFixed(1)}px). Minimum length is ${minWallLength}px.`);
                            }

                            // Reset drawing state
                            setWallDrawStart(null);
                            setWallDrawPreview(null);
                            return;
                          }
                        }

                        // Default mouse up handling
                        handleMouseUp(e);
                      }}
                      onMouseLeave={handleMouseUp}
                      onTouchMove={handleMouseMove}
                      onTouchEnd={handleMouseUp}
                      onClick={(e) => {
                        // Handle wall drawing mode with precise click-to-place
                        if (isDrawingWall) {
                          // More comprehensive check for clickable areas
                          const targetIsCanvas = e.target === e.currentTarget ||
                            e.target.tagName === 'rect' && e.target.id === 'room-floor' ||
                            e.target.tagName === 'rect' && e.target.getAttribute('fill') === 'url(#grid)' ||
                            e.target.tagName === 'rect' && e.target.getAttribute('fill') === 'white' ||
                            e.target.tagName === 'rect' && e.target.getAttribute('fill') === '#666' || // Allow clicking on wall rectangles
                            e.target.tagName === 'line' && e.target.getAttribute('stroke-dasharray') === '5,5' || // Allow clicking on preview line
                            e.target.tagName === 'line' && e.target.getAttribute('stroke') === '#666'; // Allow clicking on custom wall lines

                          if (targetIsCanvas) {
                            e.preventDefault();
                            e.stopPropagation();

                            const coords = getEventCoordinates(e);
                            const svgPt = canvasRef.current.createSVGPoint();
                            svgPt.x = coords.clientX;
                            svgPt.y = coords.clientY;
                            const cursorPt = svgPt.matrixTransform(canvasRef.current.getScreenCTM().inverse());

                            const clickX = cursorPt.x - 30; // Account for canvas offset
                            const clickY = cursorPt.y - 30;

                            if (!wallDrawStart) {
                              // First click: Set start point
                              setWallDrawStart({
                                x: clickX,
                                y: clickY
                              });
                              console.log('Wall drawing started at:', { x: clickX, y: clickY });
                            } else {
                              // Second click: Complete wall
                              const minWallLength = 20; // Minimum wall length in pixels
                              const wallLength = Math.sqrt(
                                Math.pow(clickX - wallDrawStart.x, 2) +
                                Math.pow(clickY - wallDrawStart.y, 2)
                              );

                              console.log('Attempting to complete wall:', {
                                startX: wallDrawStart.x,
                                startY: wallDrawStart.y,
                                endX: clickX,
                                endY: clickY,
                                wallLength: wallLength.toFixed(1),
                                target: e.target.tagName,
                                targetId: e.target.id
                              });

                              if (wallLength >= minWallLength) {
                                addCustomWallAtPosition(
                                  wallDrawStart.x,
                                  wallDrawStart.y,
                                  clickX,
                                  clickY
                                );
                                console.log('Wall completed successfully');
                              } else {
                                alert(`Wall is too short (${wallLength.toFixed(1)}px). Minimum length is ${minWallLength}px.`);
                              }

                              // Reset drawing state
                              setWallDrawStart(null);
                              setWallDrawPreview(null);
                            }
                            return;
                          } else {
                            // Log what was clicked if not a valid target
                            console.log('Invalid wall drawing target:', {
                              tagName: e.target.tagName,
                              id: e.target.id,
                              className: e.target.className,
                              fill: e.target.getAttribute('fill'),
                              wallDrawStart: !!wallDrawStart
                            });
                          }
                        }

                        // Deselect elements when clicking empty canvas
                        if (e.target === e.currentTarget || e.target.tagName === 'rect' && e.target.id === 'room-floor') {
                          setSelectedElement(null);
                        }
                      }}
                      style={{
                        touchAction: isTouch ? 'manipulation' : 'auto'
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
                        id="room-floor"
                        x="30"
                        y="30"
                        width={(parseFloat(currentRoomData.dimensions.width) * 12) * scale}
                        height={(parseFloat(currentRoomData.dimensions.height) * 12) * scale}
                        fill="url(#grid)"
                      />

                      {/* Wall Structures with Thickness */}
                      {/* Gray rectangles representing physical walls with realistic thickness */}
                      <g>
                        {/* Top wall (Wall 1) with doors */}
                        {(currentRoomData.walls || [1, 2, 3, 4]).includes(1) && (!showWallPreview || !currentRoomData.removedWalls?.includes(1)) && (
                          <>
                            {renderWallWithDoors(1, {
                              x: 20, y: 20,
                              width: (parseFloat(currentRoomData.dimensions.width) * 12) * scale + 20,
                              height: 10,
                              isHorizontal: true
                            })}
                          </>
                        )}
                        {/* Bottom wall (Wall 3) with doors */}
                        {(currentRoomData.walls || [1, 2, 3, 4]).includes(3) && (!showWallPreview || !currentRoomData.removedWalls?.includes(3)) && (
                          <>
                            {renderWallWithDoors(3, {
                              x: 20, y: 30 + (parseFloat(currentRoomData.dimensions.height) * 12) * scale,
                              width: (parseFloat(currentRoomData.dimensions.width) * 12) * scale + 20,
                              height: 10,
                              isHorizontal: true
                            })}
                          </>
                        )}
                        {/* Left wall (Wall 4) with doors */}
                        {(currentRoomData.walls || [1, 2, 3, 4]).includes(4) && (!showWallPreview || !currentRoomData.removedWalls?.includes(4)) && (
                          <>
                            {renderWallWithDoors(4, {
                              x: 20, y: 20,
                              width: 10,
                              height: (parseFloat(currentRoomData.dimensions.height) * 12) * scale + 20,
                              isHorizontal: false
                            })}
                          </>
                        )}
                        {/* Right wall (Wall 2) with doors */}
                        {(currentRoomData.walls || [1, 2, 3, 4]).includes(2) && (!showWallPreview || !currentRoomData.removedWalls?.includes(2)) && (
                          <>
                            {renderWallWithDoors(2, {
                              x: 30 + (parseFloat(currentRoomData.dimensions.width) * 12) * scale, y: 20,
                              width: 10,
                              height: (parseFloat(currentRoomData.dimensions.height) * 12) * scale + 20,
                              isHorizontal: false
                            })}
                          </>
                        )}

                        {/* Wall removal indicators - show openings where walls are removed */}
                        {(currentRoomData.removedWalls || []).map(wallNum => {
                          const roomWidth = (parseFloat(currentRoomData.dimensions.width) * 12) * scale;
                          const roomHeight = (parseFloat(currentRoomData.dimensions.height) * 12) * scale;

                          if (wallNum === 1) { // Top wall opening
                            return (
                              <g key={`opening-${wallNum}`}>
                                <rect x="20" y="20" width={roomWidth + 20} height="10" fill="#f0f0f0" stroke="#ccc" strokeWidth="1" strokeDasharray="3,3" />
                                <text x={30 + roomWidth / 2} y="27" textAnchor="middle" fontSize="8" fill="#666">OPENING</text>
                              </g>
                            );
                          } else if (wallNum === 3) { // Bottom wall opening  
                            return (
                              <g key={`opening-${wallNum}`}>
                                <rect x="20" y={30 + roomHeight} width={roomWidth + 20} height="10" fill="#f0f0f0" stroke="#ccc" strokeWidth="1" strokeDasharray="3,3" />
                                <text x={30 + roomWidth / 2} y={37 + roomHeight} textAnchor="middle" fontSize="8" fill="#666">OPENING</text>
                              </g>
                            );
                          } else if (wallNum === 4) { // Left wall opening
                            return (
                              <g key={`opening-${wallNum}`}>
                                <rect x="20" y="20" width="10" height={roomHeight + 20} fill="#f0f0f0" stroke="#ccc" strokeWidth="1" strokeDasharray="3,3" />
                                <text x="25" y={30 + roomHeight / 2} textAnchor="middle" fontSize="6" fill="#666" transform={`rotate(-90, 25, ${30 + roomHeight / 2})`}>OPENING</text>
                              </g>
                            );
                          } else if (wallNum === 2) { // Right wall opening
                            return (
                              <g key={`opening-${wallNum}`}>
                                <rect x={30 + roomWidth} y="20" width="10" height={roomHeight + 20} fill="#f0f0f0" stroke="#ccc" strokeWidth="1" strokeDasharray="3,3" />
                                <text x={35 + roomWidth} y={30 + roomHeight / 2} textAnchor="middle" fontSize="6" fill="#666" transform={`rotate(-90, ${35 + roomWidth}, ${30 + roomHeight / 2})`}>OPENING</text>
                              </g>
                            );
                          }
                          return null;
                        })}

                        {/* Custom Drawn Walls */}
                        {customWalls.map((wall, index) => {
                          const wallLength = Math.sqrt(Math.pow(wall.x2 - wall.x1, 2) + Math.pow(wall.y2 - wall.y1, 2));
                          const wallAngle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1) * 180 / Math.PI;
                          const wallIsPresent = (currentRoomData.walls || []).includes(wall.wallNumber);
                          const wallIsRemoved = (currentRoomData.removedWalls || []).includes(wall.wallNumber);
                          const isSelected = selectedWallForEdit === wall.id;

                          // Show wall if present and either preview is off or wall is not removed
                          if (wallIsPresent && (!showWallPreview || !wallIsRemoved)) {
                            const doorsOnWall = getDoorsOnWall(wall.wallNumber);
                            
                            return (
                              <g key={wall.id}>
                                {/* Render custom wall with door openings */}
                                {(() => {
                                  if (doorsOnWall.length === 0) {
                                    // No doors - render solid wall
                                    return (
                                      <rect
                                        x={30 + wall.x1}
                                        y={30 + wall.y1 - wall.thickness / 2}
                                        width={wallLength}
                                        height={wall.thickness}
                                        fill={isSelected ? "#8B5CF6" : "#666"}
                                        stroke={isSelected ? "#7C3AED" : "none"}
                                        strokeWidth={isSelected ? "2" : "0"}
                                        transform={`rotate(${wallAngle}, ${30 + wall.x1}, ${30 + wall.y1})`}
                                        style={{ cursor: 'pointer' }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedWallForEdit(isSelected ? null : wall.id);
                                        }}
                                      />
                                    );
                                  }

                                  // Has doors - render wall segments with openings
                                  const wallLengthInches = (wallLength / scale);
                                  const sortedDoors = doorsOnWall.sort((a, b) => a.position - b.position);
                                  const wallSegments = [];
                                  let currentPos = 0; // Position as percentage

                                  sortedDoors.forEach((door, index) => {
                                    const doorWidthPercentage = (door.width / wallLengthInches) * 100;
                                    const halfDoorWidth = doorWidthPercentage / 2;
                                    const doorStart = Math.max(0, door.position - halfDoorWidth);
                                    const doorEnd = Math.min(100, door.position + halfDoorWidth);

                                    // Add wall segment before door
                                    if (currentPos < doorStart) {
                                      wallSegments.push(
                                        <rect
                                          key={`wall-${wall.wallNumber}-segment-${index}`}
                                          x={30 + wall.x1 + (currentPos / 100) * wallLength}
                                          y={30 + wall.y1 - wall.thickness / 2}
                                          width={((doorStart - currentPos) / 100) * wallLength}
                                          height={wall.thickness}
                                          fill={isSelected ? "#8B5CF6" : "#666"}
                                          stroke={isSelected ? "#7C3AED" : "none"}
                                          strokeWidth={isSelected ? "2" : "0"}
                                          transform={`rotate(${wallAngle}, ${30 + wall.x1}, ${30 + wall.y1})`}
                                          style={{ cursor: 'pointer' }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedWallForEdit(isSelected ? null : wall.id);
                                          }}
                                        />
                                      );
                                    }

                                    // Add door opening marker
                                    const doorColor = door.type === 'pantry' ? '#8B4513' : door.type === 'room' ? '#4CAF50' : '#2196F3';
                                    const doorCenterX = 30 + wall.x1 + (door.position / 100) * wallLength;
                                    const doorCenterY = 30 + wall.y1;

                                    wallSegments.push(
                                      <g key={`door-${door.id}`}>
                                        <circle
                                          cx={doorCenterX}
                                          cy={doorCenterY}
                                          r="6"
                                          fill={doorColor}
                                          stroke="white"
                                          strokeWidth="2"
                                          transform={`rotate(${wallAngle}, ${30 + wall.x1}, ${30 + wall.y1})`}
                                        />
                                        <text
                                          x={doorCenterX}
                                          y={doorCenterY - 12}
                                          textAnchor="middle"
                                          fontSize="10"
                                          fill="#333"
                                          transform={`rotate(${wallAngle}, ${30 + wall.x1}, ${30 + wall.y1})`}
                                        >
                                          {door.width}"
                                        </text>
                                      </g>
                                    );

                                    currentPos = doorEnd;
                                  });

                                  // Add final wall segment after last door
                                  if (currentPos < 100) {
                                    wallSegments.push(
                                      <rect
                                        key={`wall-${wall.wallNumber}-segment-final`}
                                        x={30 + wall.x1 + (currentPos / 100) * wallLength}
                                        y={30 + wall.y1 - wall.thickness / 2}
                                        width={((100 - currentPos) / 100) * wallLength}
                                        height={wall.thickness}
                                        fill={isSelected ? "#8B5CF6" : "#666"}
                                        stroke={isSelected ? "#7C3AED" : "none"}
                                        strokeWidth={isSelected ? "2" : "0"}
                                        transform={`rotate(${wallAngle}, ${30 + wall.x1}, ${30 + wall.y1})`}
                                        style={{ cursor: 'pointer' }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedWallForEdit(isSelected ? null : wall.id);
                                        }}
                                      />
                                    );
                                  }

                                  return wallSegments;
                                })()}

                                {/* Wall adjustment handles - only show when selected */}
                                {isSelected && (
                                  <>
                                    {/* Start point handle */}
                                    <circle
                                      cx={30 + wall.x1}
                                      cy={30 + wall.y1}
                                      r="6"
                                      fill="#10B981"
                                      stroke="white"
                                      strokeWidth="2"
                                      style={{ cursor: 'move' }}
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        setWallEditMode('start-point');
                                        // TODO: Add drag handling for start point
                                      }}
                                    />

                                    {/* End point handle */}
                                    <circle
                                      cx={30 + wall.x2}
                                      cy={30 + wall.y2}
                                      r="6"
                                      fill="#EF4444"
                                      stroke="white"
                                      strokeWidth="2"
                                      style={{ cursor: 'move' }}
                                      onMouseDown={(e) => {
                                        e.stopPropagation();
                                        setWallEditMode('end-point');
                                        // TODO: Add drag handling for end point
                                      }}
                                    />

                                    {/* Wall info overlay */}
                                    <g transform={`translate(${30 + (wall.x1 + wall.x2) / 2}, ${30 + (wall.y1 + wall.y2) / 2 - 15})`}>
                                      <rect
                                        x="-25"
                                        y="-8"
                                        width="50"
                                        height="16"
                                        fill="rgba(0,0,0,0.8)"
                                        rx="8"
                                      />
                                      <text
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        fontSize="8"
                                        fill="white"
                                        fontWeight="bold"
                                      >
                                        {(wallLength / scale / 12).toFixed(1)}'
                                      </text>
                                    </g>
                                  </>
                                )}

                                {/* Wall existed prior indicator */}
                                {wall.existedPrior && (
                                  <text
                                    x={30 + (wall.x1 + wall.x2) / 2}
                                    y={30 + (wall.y1 + wall.y2) / 2 + 20}
                                    textAnchor="middle"
                                    fontSize="8"
                                    fill="#059669"
                                    fontWeight="bold"
                                  >
                                    ✓ Existed Prior
                                  </text>
                                )}
                              </g>
                            );
                          }
                          return null;
                        })}

                        {/* Wall Drawing Preview */}
                        {wallDrawPreview && (
                          <line
                            x1={30 + wallDrawPreview.x1}
                            y1={30 + wallDrawPreview.y1}
                            x2={30 + wallDrawPreview.x2}
                            y2={30 + wallDrawPreview.y2}
                            stroke="#ff6b6b"
                            strokeWidth="4"
                            strokeDasharray="5,5"
                            strokeLinecap="round"
                            opacity="0.8"
                          />
                        )}

                        {/* Wall Drawing Start Point Indicator */}
                        {wallDrawStart && (
                          <g>
                            <circle
                              cx={30 + wallDrawStart.x}
                              cy={30 + wallDrawStart.y}
                              r="6"
                              fill="#ff6b6b"
                              stroke="white"
                              strokeWidth="2"
                            />
                            <text
                              x={30 + wallDrawStart.x}
                              y={30 + wallDrawStart.y - 10}
                              textAnchor="middle"
                              fontSize="10"
                              fill="#ff6b6b"
                              fontWeight="bold"
                            >
                              START
                            </text>
                          </g>
                        )}
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

                          // Skip rendering if elementSpec is missing
                          if (!elementSpec) {
                            console.warn('Skipping rendering for invalid element type:', element.type);
                            return null;
                          }

                          {/* Special Rendering for Corner Cabinets */ }
                          {/* Corner cabinets have unique L-shaped rendering */ }
                          if (element.type === 'corner' || element.type === 'corner-wall') {
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

                          {/* Standard Element Rendering */ }
                          {/* Calculate display dimensions based on rotation */ }
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
                                style={{
                                  cursor: isDragging ? 'grabbing' : 'grab',
                                  opacity: isDragging && element.id === selectedElement ? 0.7 : 1,
                                  transition: isDragging ? 'none' : 'opacity 0.2s ease'
                                }}
                                onMouseDown={(e) => handleMouseDown(e, element.id)}
                                onTouchStart={(e) => handleMouseDown(e, element.id)}
                              />

                              {/* Door Indication for Cabinets */}
                              {/* Arc showing door swing direction for standard cabinets */}
                              {element.category === 'cabinet' &&
                                element.type !== 'sink-base' &&
                                element.type !== 'vanity-sink' &&
                                element.type !== 'open-shelf' &&
                                element.type !== 'corner' &&
                                element.type !== 'corner-wall' &&
                                renderDoorGraphic(0, 0, element.width * scale, element.depth * scale, 0)}

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

                              {/* Wine Cooler Graphics */}
                              {/* Detailed wine cooler with wine bottles */}
                              {element.type === 'wine-cooler' && (
                                <>
                                  {/* Wine cooler frame */}
                                  <rect
                                    x={2}
                                    y={2}
                                    width={(element.width * scale) - 4}
                                    height={(element.depth * scale) - 4}
                                    fill="none"
                                    stroke="#666"
                                    strokeWidth="2"
                                  />
                                  {/* Glass door frame */}
                                  <rect
                                    x={4}
                                    y={4}
                                    width={(element.width * scale) - 8}
                                    height={(element.depth * scale) - 8}
                                    fill="rgba(135, 206, 235, 0.1)"
                                    stroke="#999"
                                    strokeWidth="1"
                                  />
                                  {/* Wine bottle racks - horizontal lines */}
                                  {[0.2, 0.4, 0.6, 0.8].map((yPos, index) => (
                                    <line
                                      key={index}
                                      x1={6}
                                      y1={(element.depth * scale) * yPos}
                                      x2={(element.width * scale) - 6}
                                      y2={(element.depth * scale) * yPos}
                                      stroke="#8B4513"
                                      strokeWidth="1"
                                    />
                                  ))}
                                  {/* Wine bottles - small circles representing bottle tops */}
                                  {[
                                    { x: 0.2, y: 0.25 }, { x: 0.4, y: 0.25 }, { x: 0.6, y: 0.25 }, { x: 0.8, y: 0.25 },
                                    { x: 0.3, y: 0.45 }, { x: 0.5, y: 0.45 }, { x: 0.7, y: 0.45 },
                                    { x: 0.2, y: 0.65 }, { x: 0.4, y: 0.65 }, { x: 0.6, y: 0.65 }, { x: 0.8, y: 0.65 },
                                    { x: 0.3, y: 0.85 }, { x: 0.5, y: 0.85 }, { x: 0.7, y: 0.85 }
                                  ].map((bottle, index) => (
                                    <circle
                                      key={index}
                                      cx={(element.width * scale) * bottle.x}
                                      cy={(element.depth * scale) * bottle.y}
                                      r="2"
                                      fill="#722F37"
                                      stroke="#5D1A1D"
                                      strokeWidth="0.5"
                                    />
                                  ))}
                                  {/* Door handle */}
                                  <rect x={(element.width * scale) - 8} y={(element.depth * scale) * 0.4} width="4" height="8" fill="#666" rx="2" />
                                  {/* Label */}
                                  <text x={(element.width * scale) / 2} y={(element.depth * scale) - 6} textAnchor="middle" fontSize="6" fill="#666" fontWeight="bold">
                                    WINE
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
                  <WallView
                    currentRoomData={currentRoomData}
                    selectedWall={selectedWall}
                    selectedElement={selectedElement}
                    elementTypes={elementTypes}
                    scale={scale}
                    wallViewRef={wallViewRef}
                    isDraggingWallView={isDraggingWallView}
                    isTouch={isTouch}
                    getElementsOnWall={getElementsOnWall}
                    handleMouseMove={handleMouseMove}
                    handleMouseUp={handleMouseUp}
                    handleWallViewMouseDown={handleWallViewMouseDown}
                  />
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
                        <span>{elementTypes[element.type]?.name || element.type}</span>
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

                {/* Contact information - collect both email and phone */}
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

                {/* Contact preference selector - now for preferred method only */}
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
                  <p className="text-xs text-gray-500 mt-1">
                    We'll collect both your email and phone, but contact you via your preferred method first.
                  </p>
                </div>

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
    </>
  );
};

export default KitchenDesigner;
