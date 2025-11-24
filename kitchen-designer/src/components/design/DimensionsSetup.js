import React from 'react';
import { Home, Bath } from 'lucide-react';
import MainNavBar from '../ui/Navigation';
import { useLanguage } from '../../contexts/LanguageContext';
const DimensionsSetup = ({
  activeRoom,
  switchRoom,
  currentRoomData,
  setCurrentRoomData,
  handleDimensionsSubmit,
  kitchenData,
  bathroomData,
}) => {
  const { t } = useLanguage();

  return (
    <>
      <MainNavBar />
      <div
        className="min-h-screen p-8"
        style={{ background: "rgb(110,110,110)" }}
      >
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
                    onClick={() => switchRoom("kitchen")}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      activeRoom === "kitchen"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Home size={20} />
                    Kitchen
                  </button>
                  {/* Bathroom selection button */}
                  <button
                    onClick={() => switchRoom("bathroom")}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      activeRoom === "bathroom"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
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
                    {t("designer.roomWidth")}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentRoomData.dimensions.width}
                    onChange={(e) =>
                      setCurrentRoomData({
                        ...currentRoomData,
                        dimensions: {
                          ...currentRoomData.dimensions,
                          width: e.target.value,
                        },
                      })
                    }
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    placeholder="e.g. 12"
                    min="5"
                    max="50"
                  />
                </div>
                {/* Room depth input */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t("designer.roomDepth")}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={currentRoomData.dimensions.height}
                    onChange={(e) =>
                      setCurrentRoomData({
                        ...currentRoomData,
                        dimensions: {
                          ...currentRoomData.dimensions,
                          height: e.target.value,
                        },
                      })
                    }
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
                  {t("designer.wallHeight")}
                </label>
                <input
                  type="number"
                  value={currentRoomData.dimensions.wallHeight}
                  onChange={(e) =>
                    setCurrentRoomData({
                      ...currentRoomData,
                      dimensions: {
                        ...currentRoomData.dimensions,
                        wallHeight: e.target.value,
                      },
                    })
                  }
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
                  <p>
                    Kitchen design in progress ({kitchenData.elements.length}{" "}
                    items)
                  </p>
                )}
                {bathroomData.elements.length > 0 && (
                  <p>
                    Bathroom design in progress (
                    {bathroomData.elements.length} items)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DimensionsSetup;