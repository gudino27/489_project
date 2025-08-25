import React from 'react';

const ElementList = ({
  currentRoomData,
  viewMode,
  elementTypes
}) => {
  if (currentRoomData.elements.length === 0 || viewMode !== 'floor') {
    return null;
  }

  return (
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
  );
};

export default ElementList;