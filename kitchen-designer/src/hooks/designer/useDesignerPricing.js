import { useState, useEffect } from 'react';
export const usePricing = (sharedMaterialMultipliers, setSharedMaterialMultipliers, pricingVersion) => {
  const API_BASE = process.env.REACT_APP_API_URL || "https://api.gudinocustom.com";

  // Pricing state
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
    // Appliances/Fixtures
    refrigerator: 0,
    stove: 0,
    dishwasher: 0,
    microwave: 0,
    "wine-cooler": 0,
    "range-hood": 0,
    "double-oven": 0,
    toilet: 0,
    bathtub: 0,
    shower: 0,
  });

  const [materialMultipliers, setMaterialMultipliers] = useState(
    sharedMaterialMultipliers || {
      laminate: 1.0,
      wood: 1.5,
      plywood: 1.3,
    }
  );

  const [colorPricing, setColorPricing] = useState({
    1: 0,
    2: 100,
    3: 200,
    custom: 500,
  });

  const [wallPricing, setWallPricing] = useState({
    addWall: 1500,
    removeWall: 2000,
  });

  const [wallAvailability, setWallAvailability] = useState({
    addWallEnabled: true,
    removeWallEnabled: true,
  });

  const [pricesLoading, setPricesLoading] = useState(true);

  // Load prices from API
  const loadPrices = async () => {
    try {
      const [pricesResponse, wallAvailResponse] = await Promise.all([
        fetch(`${API_BASE}/api/prices`),
        fetch(`${API_BASE}/api/prices/wall-availability`),
      ]);

      if (pricesResponse.ok) {
        const data = await pricesResponse.json();
        setBasePrices(data.basePrices);

        // Convert bilingual array format to object format
        const materialObject = {};
        if (Array.isArray(data.materialMultipliers)) {
          data.materialMultipliers.forEach((material) => {
            materialObject[material.nameEn.toLowerCase()] = material.multiplier;
          });
        } else {
          Object.assign(materialObject, data.materialMultipliers);
        }

        setMaterialMultipliers(materialObject);
        setSharedMaterialMultipliers(materialObject);
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
    } finally {
      setPricesLoading(false);
    }
  };

  // Load prices on mount
  useEffect(() => {
    loadPrices();
  }, []);

  // Sync with shared pricing context
  useEffect(() => {
    if (sharedMaterialMultipliers && Object.keys(sharedMaterialMultipliers).length > 0) {
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
  }, [pricingVersion, sharedMaterialMultipliers]);

  // Calculate total price for a room
  const calculateTotalPrice = (roomData, currentRoomData) => {
    const data = roomData || currentRoomData;
    let total = 0;

    // Calculate cabinet costs
    const cabinets = data.elements.filter((el) => el.category === "cabinet");
    cabinets.forEach((cabinet) => {
      const basePrice = basePrices[cabinet.type] || 250;
      const material = data.materials[cabinet.id] || "laminate";
      const materialMultiplier = materialMultipliers[material] || 1.0;
      const sizeMultiplier = cabinet.width / 24;
      total += basePrice * materialMultiplier * sizeMultiplier;
    });

    // Add color upcharge
    total += colorPricing[data.colorCount] || 0;
    // Add wall modification costs
    const removedWalls = data.removedWalls || [];
    const dataOriginalWalls = data.originalWalls || [1, 2, 3, 4];
    const chargeableRemovedWalls = removedWalls.filter((wall) =>
      dataOriginalWalls.includes(wall)
    );
    if (chargeableRemovedWalls.length > 0) {
      total += chargeableRemovedWalls.length * wallPricing.removeWall;
    }
    // Add custom wall costs
    const currentWalls = data.walls || [1, 2, 3, 4];
    const customAddedWalls = currentWalls.filter(
      (wall) => !dataOriginalWalls.includes(wall)
    );
    if (customAddedWalls.length > 0) {
      total += customAddedWalls.length * wallPricing.addWall;
    }

    return total;
  };
  return {
    basePrices,
    setBasePrices,
    materialMultipliers,
    setMaterialMultipliers,
    colorPricing,
    setColorPricing,
    wallPricing,
    setWallPricing,
    wallAvailability,
    setWallAvailability,
    pricesLoading,
    loadPrices,
    calculateTotalPrice,
  };
};