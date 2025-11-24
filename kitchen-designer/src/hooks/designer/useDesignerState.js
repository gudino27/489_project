import { useState } from 'react';
export const useDesignerState = () => {
  // -----------------------------
  // Application State
  // -----------------------------
  const [step, setStep] = useState("dimensions"); // 'dimensions' or 'design'
  const [activeRoom, setActiveRoom] = useState("kitchen"); // Currently designing room

  // -----------------------------
  // Room Data State
  // -----------------------------
  const [kitchenData, setKitchenData] = useState({
    dimensions: { width: "", height: "", wallHeight: "96" },
    elements: [],
    materials: {},
    colorCount: 1,
    walls: [1, 2, 3, 4],
    removedWalls: [],
    customWalls: [],
    allAvailableWalls: [1, 2, 3, 4],
    originalWalls: [1, 2, 3, 4],
    doors: [],
  });

  const [bathroomData, setBathroomData] = useState({
    dimensions: { width: "", height: "", wallHeight: "96" },
    elements: [],
    materials: {},
    colorCount: 1,
    walls: [1, 2, 3, 4],
    removedWalls: [],
    customWalls: [],
    allAvailableWalls: [1, 2, 3, 4],
    originalWalls: [1, 2, 3, 4],
    doors: [],
  });

  // Current room helpers
  const currentRoomData = activeRoom === "kitchen" ? kitchenData : bathroomData;
  const setCurrentRoomData = activeRoom === "kitchen" ? setKitchenData : setBathroomData;
  const customWalls = currentRoomData.customWalls || [];
  const allAvailableWalls = currentRoomData.allAvailableWalls || [1, 2, 3, 4];
  const originalWalls = currentRoomData.originalWalls || [1, 2, 3, 4];

  // -----------------------------
  // UI and Interaction State
  // -----------------------------
  const [selectedElement, setSelectedElement] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingWallView, setIsDraggingWallView] = useState(false);
  const [dragPreviewPosition, setDragPreviewPosition] = useState(null);
  const [scale, setScale] = useState(1);
  const [viewMode, setViewMode] = useState("floor");

  // Touch/gesture state
  const [pinchState, setPinchState] = useState({
    initialDistance: null,
    initialScale: 1,
  });
  const [lastTap, setLastTap] = useState(0);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  // Wall/door management state
  const [selectedWall, setSelectedWall] = useState(1);
  const [isDrawingWall, setIsDrawingWall] = useState(false);
  const [wallDrawStart, setWallDrawStart] = useState(null);
  const [wallDrawPreview, setWallDrawPreview] = useState(null);
  const [selectedWallForEdit, setSelectedWallForEdit] = useState(null);
  const [wallEditMode, setWallEditMode] = useState(null);
  const [showWallPreview, setShowWallPreview] = useState(false);
  const [wallRemovalDisabled, setWallRemovalDisabled] = useState(false);
  const [isRotatingWall, setIsRotatingWall] = useState(null);
  const [rotationStart, setRotationStart] = useState(null);
  const [isDoorMode, setIsDoorMode] = useState(false);
  const [doorModeType, setDoorModeType] = useState("standard");

  // UI panels state
  const [showPricing, setShowPricing] = useState(false);
  const [showQuoteForm, setShowQuoteForm] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showFloorPlanPresets, setShowFloorPlanPresets] = useState(false);

  // Collapsible sections
  const [collapsedSections, setCollapsedSections] = useState({
    wallManagement: false,
    cabinetOptions: false,
    appliances: false,
    properties: false,
  });

  // Helper function
  const toggleSection = (sectionName) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  // -----------------------------
  // Client Information
  // -----------------------------
  const [clientInfo, setClientInfo] = useState({
    name: "",
    contactPreference: "email",
    email: "",
    phone: "",
    comments: "",
    includeKitchen: true,
    includeBathroom: false,
  });

  return {
    // Application state
    step,
    setStep,
    activeRoom,
    setActiveRoom,

    // Room data
    kitchenData,
    setKitchenData,
    bathroomData,
    setBathroomData,
    currentRoomData,
    setCurrentRoomData,
    customWalls,
    allAvailableWalls,
    originalWalls,

    // UI state
    selectedElement,
    setSelectedElement,
    isPanelOpen,
    setIsPanelOpen,
    dragOffset,
    setDragOffset,
    isDragging,
    setIsDragging,
    isDraggingWallView,
    setIsDraggingWallView,
    dragPreviewPosition,
    setDragPreviewPosition,
    scale,
    setScale,
    viewMode,
    setViewMode,

    // Touch/gesture state
    pinchState,
    setPinchState,
    lastTap,
    setLastTap,
    longPressTimer,
    setLongPressTimer,
    isLongPressing,
    setIsLongPressing,

    // Wall/door state
    selectedWall,
    setSelectedWall,
    isDrawingWall,
    setIsDrawingWall,
    wallDrawStart,
    setWallDrawStart,
    wallDrawPreview,
    setWallDrawPreview,
    selectedWallForEdit,
    setSelectedWallForEdit,
    wallEditMode,
    setWallEditMode,
    showWallPreview,
    setShowWallPreview,
    wallRemovalDisabled,
    setWallRemovalDisabled,
    isRotatingWall,
    setIsRotatingWall,
    rotationStart,
    setRotationStart,
    isDoorMode,
    setIsDoorMode,
    doorModeType,
    setDoorModeType,

    // UI panels
    showPricing,
    setShowPricing,
    showQuoteForm,
    setShowQuoteForm,
    sidebarCollapsed,
    setSidebarCollapsed,
    showFloorPlanPresets,
    setShowFloorPlanPresets,

    // Collapsible sections
    collapsedSections,
    setCollapsedSections,
    toggleSection,

    // Client info
    clientInfo,
    setClientInfo,
  };
};