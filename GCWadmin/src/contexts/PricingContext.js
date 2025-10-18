import React, { createContext, useContext, useState } from 'react';

const PricingContext = createContext();

export const usePricing = () => {
  const context = useContext(PricingContext);
  if (!context) {
    throw new Error('usePricing must be used within a PricingProvider');
  }
  return context;
};

export const PricingProvider = ({ children }) => {
  const [materialMultipliers, setMaterialMultipliers] = useState({});
  const [basePrices, setBasePrices] = useState({});
  const [colorPricing, setColorPricing] = useState({});
  const [wallPricing, setWallPricing] = useState({});
  const [pricingVersion, setPricingVersion] = useState(0);

  // Function to trigger a reload of pricing data
  const refreshPricing = () => {
    setPricingVersion(prev => prev + 1);
  };

  // Function to update material multipliers and notify all consumers
  const updateMaterialMultipliers = (newMaterials) => {
    setMaterialMultipliers(newMaterials);
    refreshPricing();
  };

  const value = {
    materialMultipliers,
    setMaterialMultipliers: updateMaterialMultipliers,
    basePrices,
    setBasePrices,
    colorPricing,
    setColorPricing,
    wallPricing,
    setWallPricing,
    pricingVersion,
    refreshPricing
  };

  return (
    <PricingContext.Provider value={value}>
      {children}
    </PricingContext.Provider>
  );
};

export default PricingContext;
