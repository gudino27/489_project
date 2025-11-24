export const MATERIAL_TYPES = {
  PAINT: 'paint',
  STAIN: 'stain',
  APPLIANCE: 'appliance'
};

export const GRAIN_TYPES = {
  SMOOTH: { id: 'smooth', name: 'Smooth / Painted' },
  OAK: { id: 'oak', name: 'Oak (Heavy Grain)' },
  MAPLE: { id: 'maple', name: 'Maple (Subtle Grain)' },
  CHERRY: { id: 'cherry', name: 'Cherry (Fine Grain)' },
  WALNUT: { id: 'walnut', name: 'Walnut (Straight Grain)' }
};

export const FINISHES = {
  matte: { roughness: 0.9, metalness: 0, name: 'Matte' },
  eggshell: { roughness: 0.6, metalness: 0, name: 'Eggshell' },
  satin: { roughness: 0.4, metalness: 0, name: 'Satin' },
  semiGloss: { roughness: 0.2, metalness: 0, name: 'Semi-Gloss' },
  gloss: { roughness: 0.1, metalness: 0, name: 'Gloss' },
};

export const APPLIANCE_MATERIALS = [
  { id: 'app-ss', name: 'Stainless Steel', hex: '#d1d5db', type: MATERIAL_TYPES.APPLIANCE, metalness: 0.8, roughness: 0.2 },
  { id: 'app-black-ss', name: 'Black Stainless', hex: '#374151', type: MATERIAL_TYPES.APPLIANCE, metalness: 0.7, roughness: 0.3 },
  { id: 'app-matte-black', name: 'Matte Black', hex: '#111827', type: MATERIAL_TYPES.APPLIANCE, metalness: 0.1, roughness: 0.8 },
  { id: 'app-white', name: 'White', hex: '#f9fafb', type: MATERIAL_TYPES.APPLIANCE, metalness: 0.1, roughness: 0.2 },
  { id: 'app-slate', name: 'Slate', hex: '#4b5563', type: MATERIAL_TYPES.APPLIANCE, metalness: 0.3, roughness: 0.5 },
];

export const PAINTS = [
  // Whites & Off-Whites
  { id: 'sw-7005', brand: 'Sherwin Williams', name: 'Pure White', hex: '#edece6', type: MATERIAL_TYPES.PAINT },
  { id: 'sw-7008', brand: 'Sherwin Williams', name: 'Alabaster', hex: '#f0ece2', type: MATERIAL_TYPES.PAINT },
  { id: 'bm-oc-117', brand: 'Benjamin Moore', name: 'Simply White', hex: '#f6f6e8', type: MATERIAL_TYPES.PAINT },
  { id: 'bm-oc-17', brand: 'Benjamin Moore', name: 'White Dove', hex: '#f0f1eb', type: MATERIAL_TYPES.PAINT },
  
  // Grays & Greiges
  { id: 'sw-7015', brand: 'Sherwin Williams', name: 'Repose Gray', hex: '#ccc9c0', type: MATERIAL_TYPES.PAINT },
  { id: 'sw-7029', brand: 'Sherwin Williams', name: 'Agreeable Gray', hex: '#d1cec4', type: MATERIAL_TYPES.PAINT },
  { id: 'bm-hc-169', brand: 'Benjamin Moore', name: 'Coventry Gray', hex: '#9fa3a3', type: MATERIAL_TYPES.PAINT },
  
  // Blues & Navys
  { id: 'sw-6244', brand: 'Sherwin Williams', name: 'Naval', hex: '#2f3d4c', type: MATERIAL_TYPES.PAINT },
  { id: 'bm-hc-154', brand: 'Benjamin Moore', name: 'Hale Navy', hex: '#4d5662', type: MATERIAL_TYPES.PAINT },
  
  // Greens
  { id: 'sw-6204', brand: 'Sherwin Williams', name: 'Sea Salt', hex: '#cdd2ca', type: MATERIAL_TYPES.PAINT },
  { id: 'bm-2137-40', brand: 'Benjamin Moore', name: 'Estrid', hex: '#6b7d73', type: MATERIAL_TYPES.PAINT },
  
  // Blacks
  { id: 'sw-6258', brand: 'Sherwin Williams', name: 'Tricorn Black', hex: '#2f2f30', type: MATERIAL_TYPES.PAINT },
];

export const STAINS = [
  { id: 'stain-natural', name: 'Natural', hex: '#e3cca8', type: MATERIAL_TYPES.STAIN, defaultGrain: 'maple' },
  { id: 'stain-golden-oak', name: 'Golden Oak', hex: '#d4a063', type: MATERIAL_TYPES.STAIN, defaultGrain: 'oak' },
  { id: 'stain-provincial', name: 'Provincial', hex: '#a67b5b', type: MATERIAL_TYPES.STAIN, defaultGrain: 'oak' },
  { id: 'stain-early-american', name: 'Early American', hex: '#8d5e41', type: MATERIAL_TYPES.STAIN, defaultGrain: 'oak' },
  { id: 'stain-walnut', name: 'Dark Walnut', hex: '#5d4037', type: MATERIAL_TYPES.STAIN, defaultGrain: 'walnut' },
  { id: 'stain-espresso', name: 'Espresso', hex: '#3b2820', type: MATERIAL_TYPES.STAIN, defaultGrain: 'maple' },
  { id: 'stain-cherry', name: 'Traditional Cherry', hex: '#7c3a2e', type: MATERIAL_TYPES.STAIN, defaultGrain: 'cherry' },
  { id: 'stain-weathered-gray', name: 'Weathered Gray', hex: '#8c8c8c', type: MATERIAL_TYPES.STAIN, defaultGrain: 'oak' },
];

export const getMaterialById = (id) => {
  return [...PAINTS, ...STAINS, ...APPLIANCE_MATERIALS].find(m => m.id === id);
};

