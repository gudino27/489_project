import React from 'react';
import { Save } from 'lucide-react';

// Reusable Save Button Component for sections
export const SectionSaveButton = ({ 
  sectionKey, 
  sectionChanges, 
  saveStatus, 
  onSave, 
  className = "" 
}) => {
  const hasChanges = sectionChanges[sectionKey];
  
  if (!hasChanges) return null;

  return (
    <div className={`flex justify-end mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg ${className}`}>
      <button
        onClick={onSave}
        disabled={saveStatus === 'saving'}
        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition ${
          saveStatus === 'saving'
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        <Save size={16} />
        {saveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
      </button>
      <div className="ml-3 text-sm text-blue-700 flex items-center">
        ⚠️ You have unsaved changes in this section
      </div>
    </div>
  );
};

// Helper functions for section change management
export const createSectionHelpers = (setSectionChanges, setHasUnsavedChanges) => {
  const markSectionChanged = (section) => {
    setSectionChanges(prev => {
      const newChanges = { ...prev, [section]: true };
      // Update global state if any section has changes
      const hasAnyChanges = Object.values(newChanges).some(changed => changed);
      setHasUnsavedChanges(hasAnyChanges);
      return newChanges;
    });
  };

  const markSectionSaved = (section) => {
    setSectionChanges(prev => {
      const newChanges = { ...prev, [section]: false };
      // Update global state if any section has changes
      const hasAnyChanges = Object.values(newChanges).some(changed => changed);
      setHasUnsavedChanges(hasAnyChanges);
      return newChanges;
    });
  };

  const clearAllSectionChanges = () => {
    setSectionChanges({
      cabinets: false,
      materials: false,
      colors: false,
      walls: false,
      wallAvailability: false
    });
    setHasUnsavedChanges(false);
  };

  return {
    markSectionChanged,
    markSectionSaved,
    clearAllSectionChanges
  };
};