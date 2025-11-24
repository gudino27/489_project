import { useState, useEffect } from 'react';
export const usePricing = ({
  sharedMaterialMultipliers,
  setSharedMaterialMultipliers,
  currentRoomData,
}) => {
  const API_BASE =
    process.env.REACT_APP_API_URL || "https://api.gudinocustom.com";

  // Base prices for each cabinet/appliance type
  const [basePrices, setBasePrices] = useState({
    // Kitchen Cabinets
    base: 250,
    "sink-base": 320,
    wall: 180,
    tall: 450,
    corner: 380,
    "drawer-base": 280,
    "double-drawer-base": 350,
    "glass-wall": 220,
    "open-shelf": 160,
    "island-base": 580,
    "peninsula-base": 420,
    pantry: 520,
    "corner-wall": 210,
    // Bathroom Cabinets
    vanity: 280,
    "vanity-sink": 350,
    "double-vanity": 650,
    "floating-vanity": 420,
    "corner-vanity": 380,
    "vanity-tower": 320,
    medicine: 120,
    "medicine-mirror": 180,
    linen: 350,
    "linen-tower": 420,
    // Kitchen Appliances
    refrigerator: 0, // Pricing handled separately for appliances
    stove: 0,
    dishwasher: 0,
    microwave: 0,
    "wine-cooler": 0,
    "range-hood": 0,
    "double-oven": 0,
    // Bathroom Fixtures
    toilet: 0,
    bathtub: 0,
    shower: 0,
  });

  // Material cost multipliers
  const [materialMultipliers, setMaterialMultipliers] = useState(
    sharedMaterialMultipliers || {
      laminate: 1.0, // Standard pricing (no multiplier)
      wood: 1.5, // 50% upcharge for solid wood
      plywood: 1.3, // 30% upcharge for plywood
    }
  );

  // Color pricing
  const [colorPricing, setColorPricing] = useState({
    1: 0, // Single color included
    2: 100, // Two colors add $100
    3: 200, // Three colors add $200
    custom: 500, // Custom colors add $500
  });

  // Wall modification pricing (set by admin)
  const [wallPricing, setWallPricing] = useState({
    addWall: 1500, // Cost to add a wall opening
    removeWall: 2000, // Cost to remove/modify a wall
  });

  // Wall service availability (controlled by admin)
  const [wallAvailability, setWallAvailability] = useState({
    addWallEnabled: true,
    removeWallEnabled: true,
  });

  const [pricesLoading, setPricesLoading] = useState(true);
  const loadPrices = async () => {
    try {
      const [pricesResponse, wallAvailResponse] = await Promise.all([
        fetch(`${API_BASE}/api/prices`),
        fetch(`${API_BASE}/api/prices/wall-availability`),
      ]);

      if (pricesResponse.ok) {
        const data = await pricesResponse.json();
        setBasePrices(data.basePrices);

        // Convert new bilingual array format to old object format for backward compatibility
        const materialObject = {};
        if (Array.isArray(data.materialMultipliers)) {
          data.materialMultipliers.forEach((material) => {
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
      } else {
        console.error("Failed to load prices, using defaults");
      }

      if (wallAvailResponse.ok) {
        const wallAvailData = await wallAvailResponse.json();
        setWallAvailability(wallAvailData);
      } else {
        console.error("Failed to load wall availability, using defaults");
      }
    } catch (error) {
      console.error("Error loading prices/settings:", error);
      // Keep default prices if API fails
    } finally {
      setPricesLoading(false);
    }
  };
  const calculateTotalPrice = (roomData = null) => {
    const data = roomData || currentRoomData;
    let total = 0;

    const cabinets = data.elements.filter((el) => el.category === "cabinet");
    cabinets.forEach((cabinet) => {
      const basePrice = basePrices[cabinet.type] || 250; // Get base price for cabinet type
      const material = data.materials[cabinet.id] || "laminate"; // Get material choice
      const materialMultiplier = materialMultipliers[material]; // Get material cost multiplier

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
    const chargeableRemovedWalls = removedWalls.filter((wall) =>
      dataOriginalWalls.includes(wall)
    );
    if (chargeableRemovedWalls.length > 0) {
      total += chargeableRemovedWalls.length * wallPricing.removeWall;
    }

    // Add cost for custom walls that were added (walls beyond the original 4)
    const currentWalls = data.walls || [1, 2, 3, 4];
    const customAddedWalls = currentWalls.filter(
      (wall) => !dataOriginalWalls.includes(wall)
    );
    if (customAddedWalls.length > 0) {
      total += customAddedWalls.length * wallPricing.addWall;
    }

    return total;
  };

  // Load prices on component mount
  useEffect(() => {
    loadPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync with shared pricing context when pricing version changes
  useEffect(() => {
    if (
      sharedMaterialMultipliers &&
      Object.keys(sharedMaterialMultipliers).length > 0
    ) {
      // Convert new bilingual array format to old object format if needed
      let materialObject = {};
      if (Array.isArray(sharedMaterialMultipliers)) {
        sharedMaterialMultipliers.forEach((material) => {
          materialObject[material.nameEn.toLowerCase()] = material.multiplier;
        });
      } else {
        materialObject = sharedMaterialMultipliers;
      }
      setMaterialMultipliers(materialObject);
    }
  }, [sharedMaterialMultipliers]);

  return {
    // State
    basePrices,
    materialMultipliers,
    colorPricing,
    wallPricing,
    wallAvailability,
    pricesLoading,
    // Functions
    loadPrices,
    calculateTotalPrice,
    // Setters (if needed for external updates)
    setBasePrices,
    setMaterialMultipliers,
    setColorPricing,
    setWallPricing,
    setWallAvailability,
  };
};