import { useEffect } from 'react';
export const useLocalStorage = ({
  kitchenData,
  bathroomData,
  setKitchenData,
  setBathroomData,
  elementTypes,
  step,
  activeRoom,
  customWalls,
  allAvailableWalls,
}) => {
  // Load saved state on component mount
  useEffect(() => {
    const savedKitchen = localStorage.getItem("kitchenDesignState");
    const savedBathroom = localStorage.getItem("bathroomDesignState");

    if (savedKitchen) {
      const state = JSON.parse(savedKitchen);
      // Clean up invalid elements that might exist from previous versions
      const validElements = state.elements
        ? state.elements.filter((element) => {
            const isValid = elementTypes[element.type];
            if (!isValid) {
              console.warn(
                "Removing invalid element type from saved data:",
                element.type
              );
            }
            return isValid;
          })
        : [];

      // Migrate old data format - ensure wall data exists
      const migratedState = {
        ...state,
        elements: validElements,
        customWalls: state.customWalls || [],
        allAvailableWalls: state.allAvailableWalls || [1, 2, 3, 4],
        originalWalls: state.originalWalls || [1, 2, 3, 4],
        doors: state.doors || [],
      };
      setKitchenData(migratedState);
    }

    if (savedBathroom) {
      const state = JSON.parse(savedBathroom);
      // Clean up invalid elements that might exist from previous versions
      const validElements = state.elements
        ? state.elements.filter((element) => {
            const isValid = elementTypes[element.type];
            if (!isValid) {
              console.warn(
                "Removing invalid element type from saved data:",
                element.type
              );
            }
            return isValid;
          })
        : [];

      // Migrate old data format - ensure wall data exists
      const migratedState = {
        ...state,
        elements: validElements,
        customWalls: state.customWalls || [],
        allAvailableWalls: state.allAvailableWalls || [1, 2, 3, 4],
        originalWalls: state.originalWalls || [1, 2, 3, 4],
        doors: state.doors || [],
      };
      setBathroomData(migratedState);
    }
  }, []); // Only run on mount

  // Save state whenever data changes (auto-save functionality)
  useEffect(() => {
    if (step === "design") {
      localStorage.setItem("kitchenDesignState", JSON.stringify(kitchenData));
      localStorage.setItem("bathroomDesignState", JSON.stringify(bathroomData));
    }
  }, [kitchenData, bathroomData, step]);

  // Clean up deleted walls from UI whenever room data changes
  useEffect(() => {
    if (step === "design") {
      const currentRoomData = activeRoom === "kitchen" ? kitchenData : bathroomData;
      const currentWalls = currentRoomData.walls || [];
      const existingCustomWallNumbers = customWalls.map(
        (wall) => wall.wallNumber
      );
      const existingWallNumbers = [
        ...new Set([...currentWalls, ...existingCustomWallNumbers]),
      ];

      // Keep original walls (1-4) plus any existing custom walls
      const cleanedAvailableWalls = allAvailableWalls.filter(
        (wallNum) => wallNum <= 4 || existingWallNumbers.includes(wallNum)
      );

      if (cleanedAvailableWalls.length !== allAvailableWalls.length) {
        // Only update if there's actually a change to avoid infinite loops
        const updatedData =
          activeRoom === "kitchen"
            ? { ...kitchenData, allAvailableWalls: cleanedAvailableWalls }
            : { ...bathroomData, allAvailableWalls: cleanedAvailableWalls };

        if (activeRoom === "kitchen") {
          setKitchenData(updatedData);
        } else {
          setBathroomData(updatedData);
        }
      }
    }
  }, [
    kitchenData,
    bathroomData,
    kitchenData.customWalls,
    bathroomData.customWalls,
    kitchenData.walls,
    bathroomData.walls,
    customWalls,
    allAvailableWalls,
    activeRoom,
    step,
    setKitchenData,
    setBathroomData,
  ]);
};