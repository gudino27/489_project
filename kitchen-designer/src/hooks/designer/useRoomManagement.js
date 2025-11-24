export const useRoomManagement = ({
  currentRoomData,
  activeRoom,
  setActiveRoom,
  kitchenData,
  bathroomData,
  setKitchenData,
  setBathroomData,
  setSelectedElement,
  setStep,
  setScale,
  setViewMode,
  step,
}) => {
  const handleDimensionsSubmit = () => {
    const dims = currentRoomData.dimensions;
    if (dims.width && dims.height && dims.wallHeight) {
      // Calculate optimal canvas scale based on room size
      const widthInches = parseFloat(dims.width) * 12;
      const heightInches = parseFloat(dims.height) * 12;
      const maxCanvasSize = 600;
      const newScale = Math.min(
        maxCanvasSize / widthInches,
        maxCanvasSize / heightInches
      );
      setScale(newScale);
      setStep("design"); // Move to design interface
    }
  };
  const resetDesign = () => {
    if (activeRoom === "kitchen") {
      setKitchenData({
        dimensions: { width: "", height: "", wallHeight: "96" },
        elements: [],
        materials: {},
        colorCount: 1,
      });
    } else {
      setBathroomData({
        dimensions: { width: "", height: "", wallHeight: "96" },
        elements: [],
        materials: {},
        colorCount: 1,
      });
    }
    setSelectedElement(null);
    setStep("dimensions");
    localStorage.removeItem(`${activeRoom}DesignState`);
  };
  const switchRoom = (room) => {
    setActiveRoom(room);
    setSelectedElement(null);
    setViewMode("floor");

    // Get the target room's data
    const roomData = room === "kitchen" ? kitchenData : bathroomData;

    // If the target room has no dimensions set, go back to dimensions step
    if (!roomData.dimensions.width || !roomData.dimensions.height) {
      setStep("dimensions");
    } else {
      // Room has dimensions, update canvas scale and stay in design step
      const widthInches = parseFloat(roomData.dimensions.width) * 12;
      const heightInches = parseFloat(roomData.dimensions.height) * 12;
      const maxCanvasSize = 600;
      const newScale = Math.min(
        maxCanvasSize / widthInches,
        maxCanvasSize / heightInches
      );
      setScale(newScale);
      // Ensure we're on design step if room has dimensions
      if (step !== "design") {
        setStep("design");
      }
    }
  };

  return {
    handleDimensionsSubmit,
    resetDesign,
    switchRoom,
  };
};
