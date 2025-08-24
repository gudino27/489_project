import React from 'react';

const DraggableCabinet = React.memo(({
  element,
  scale,
  isSelected,
  isDragging,
  selectedElement,
  dragPreviewPosition,
  onMouseDown,
  elementTypes,
  renderCornerCabinet,
  renderDoorGraphic,
  currentRoomData
}) => {
  const elementSpec = elementTypes[element.type];

  // Skip rendering if elementSpec is missing
  if (!elementSpec) {
    console.warn('Skipping rendering for invalid element type:', element.type);
    return null;
  }

  // Special Rendering for Corner Cabinets
  if (element.type === 'corner' || element.type === 'corner-wall') {
    return (
      <g 
        key={element.id} 
        data-cabinet-id={element.id}
        style={{ willChange: 'transform' }}
      >
        {renderCornerCabinet(element)}

        {/* Corner cabinet number badge */}
        <circle
          cx={element.x + (element.width * scale) / 2}
          cy={element.y + (element.depth * scale) / 2}
          r="12"
          fill="white"
          stroke="#333"
          strokeWidth="1"
        />
        <text
          x={element.x + (element.width * scale) / 2}
          y={element.y + (element.depth * scale) / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="10"
          fill="#333"
          fontWeight="bold"
        >
          {currentRoomData.elements.indexOf(element) + 1}
        </text>

      </g>
    );
  }

  // Standard Element Rendering
  const displayWidth = element.rotation % 180 === 0 ? element.width * scale : element.depth * scale;
  const displayDepth = element.rotation % 180 === 0 ? element.depth * scale : element.width * scale;

  // Visual styling based on element category
  const fillColor = element.category === 'appliance' ? '#e0e0e0' : '#d3d3d3';
  const strokeColor = '#333'; // Consistent stroke color regardless of selection

  return (
    <g 
      key={element.id} 
      data-cabinet-id={element.id}
      transform={`translate(${element.x + displayWidth / 2}, ${element.y + displayDepth / 2}) rotate(${element.rotation}) translate(${-displayWidth / 2}, ${-displayDepth / 2})`}
      style={{ willChange: 'transform' }}
    >

      {/* Main Element Body */}
      <rect
        x={0}
        y={0}
        width={element.width * scale}
        height={element.depth * scale}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={isSelected ? '2' : '1'}
        style={{
          cursor: isDragging && element.id === selectedElement 
            ? (dragPreviewPosition?.snapped ? 'copy' : 'grabbing') 
            : 'grab',
          opacity: isDragging && element.id === selectedElement ? 0.7 : 1,
          transition: isDragging ? 'none' : 'opacity 0.2s ease',
          filter: isDragging && element.id === selectedElement 
            ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' 
            : 'none'
        }}
        onMouseDown={(e) => onMouseDown(e, element.id)}
        onTouchStart={(e) => onMouseDown(e, element.id)}
      />

      {/* Door Indication for Cabinets */}
      {element.category === 'cabinet' &&
        element.type !== 'sink-base' &&
        element.type !== 'vanity-sink' &&
        element.type !== 'open-shelf' &&
        element.type !== 'corner' &&
        element.type !== 'corner-wall' &&
        renderDoorGraphic(0, 0, element.width * scale, element.depth * scale, 0)}

      {/* Special Sink Cabinet Graphics */}
      {(element.type === 'sink-base' || element.type === 'vanity-sink') && (
        <>
          {/* Outer sink rim */}
          <rect
            x={(element.width * scale) * 0.15}
            y={(element.depth * scale) * 0.15}
            width={(element.width * scale) * 0.7}
            height={(element.depth * scale) * 0.7}
            fill="none"
            stroke="#333"
            strokeWidth="1"
            rx="4"
          />
          {/* Inner sink bowl */}
          <rect
            x={(element.width * scale) * 0.2}
            y={(element.depth * scale) * 0.2}
            width={(element.width * scale) * 0.6}
            height={(element.depth * scale) * 0.6}
            fill="none"
            stroke="#333"
            strokeWidth="0.5"
            rx="2"
          />
          {/* Faucet indicator */}
          <circle
            cx={(element.width * scale) * 0.5}
            cy={(element.depth * scale) * 0.3}
            r="3"
            fill="#333"
          />
        </>
      )}

      {/* Stove/Range Graphics */}
      {element.type === 'stove' && (
        <>
          {/* Four burner circles */}
          <circle cx={(element.width * scale) * 0.25} cy={(element.depth * scale) * 0.25} r="8" fill="none" stroke="#666" strokeWidth="1" />
          <circle cx={(element.width * scale) * 0.75} cy={(element.depth * scale) * 0.25} r="8" fill="none" stroke="#666" strokeWidth="1" />
          <circle cx={(element.width * scale) * 0.25} cy={(element.depth * scale) * 0.75} r="8" fill="none" stroke="#666" strokeWidth="1" />
          <circle cx={(element.width * scale) * 0.75} cy={(element.depth * scale) * 0.75} r="8" fill="none" stroke="#666" strokeWidth="1" />
          
          {/* Central control area */}
          <rect
            x={(element.width * scale) * 0.4}
            y={(element.depth * scale) * 0.4}
            width={(element.width * scale) * 0.2}
            height={(element.depth * scale) * 0.2}
            fill="#999"
            stroke="#333"
            strokeWidth="0.5"
          />
        </>
      )}

      {/* Refrigerator Graphics */}
      {element.type === 'refrigerator' && (
        <>
          {/* Vertical divider line for double door */}
          <line
            x1={(element.width * scale) / 2}
            y1={(element.depth * scale) * 0.1}
            x2={(element.width * scale) / 2}
            y2={(element.depth * scale) * 0.9}
            stroke="#333"
            strokeWidth="1"
          />
          {/* Handle indicators */}
          <rect x={(element.width * scale) * 0.45} y={(element.depth * scale) * 0.3} width="2" height="8" fill="#333" />
          <rect x={(element.width * scale) * 0.53} y={(element.depth * scale) * 0.3} width="2" height="8" fill="#333" />
        </>
      )}

      {/* Dishwasher Graphics */}
      {element.type === 'dishwasher' && (
        <>
          {/* Control panel */}
          <rect
            x={(element.width * scale) * 0.1}
            y={(element.depth * scale) * 0.05}
            width={(element.width * scale) * 0.8}
            height={(element.depth * scale) * 0.1}
            fill="#999"
            stroke="#333"
            strokeWidth="0.5"
          />
          {/* Door handle */}
          <rect
            x={(element.width * scale) * 0.05}
            y={(element.depth * scale) * 0.3}
            width="3"
            height={(element.depth * scale) * 0.4}
            fill="#333"
          />
        </>
      )}

      {/* Microwave Graphics */}
      {element.type === 'microwave' && (
        <>
          {/* Door window */}
          <rect
            x={(element.width * scale) * 0.15}
            y={(element.depth * scale) * 0.2}
            width={(element.width * scale) * 0.6}
            height={(element.depth * scale) * 0.5}
            fill="none"
            stroke="#333"
            strokeWidth="1"
          />
          {/* Control panel */}
          <rect
            x={(element.width * scale) * 0.8}
            y={(element.depth * scale) * 0.2}
            width={(element.width * scale) * 0.15}
            height={(element.depth * scale) * 0.6}
            fill="#ccc"
            stroke="#333"
            strokeWidth="0.5"
          />
        </>
      )}

      {/* Element Number Badge */}
      <circle
        cx={(element.width * scale) / 2}
        cy={(element.depth * scale) / 2}
        r="12"
        fill="white"
        stroke="#333"
        strokeWidth="1"
      />
      <text
        x={(element.width * scale) / 2}
        y={(element.depth * scale) / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fill="#333"
        fontWeight="bold"
      >
        {currentRoomData.elements.indexOf(element) + 1}
      </text>

      {/* Element Type Label */}
      <text
        x={(element.width * scale) / 2}
        y={(element.depth * scale) + 15}
        textAnchor="middle"
        fontSize="8"
        fill="#666"
        fontFamily="Arial, sans-serif"
      >
        {elementSpec.name}
      </text>

      {/* Dimension Labels */}
      {isSelected && (
        <g>
          {/* Width dimension */}
          <text
            x={(element.width * scale) / 2}
            y={-8}
            textAnchor="middle"
            fontSize="8"
            fill="#666"
            fontWeight="bold"
          >
            {element.width}"W
          </text>
          {/* Depth dimension */}
          <text
            x={-15}
            y={(element.depth * scale) / 2}
            textAnchor="middle"
            fontSize="8"
            fill="#666"
            fontWeight="bold"
            transform={`rotate(-90, ${-15}, ${(element.depth * scale) / 2})`}
          >
            {element.depth}"D
          </text>
        </g>
      )}

    </g>
  );
});

export default DraggableCabinet;