export const getEventCoordinates = (e) => {
  if (e.touches && e.touches.length > 0) {
    // Extract touch coordinates immediately before event is pooled
    const clientX = e.touches[0].clientX;
    const clientY = e.touches[0].clientY;
    return { clientX, clientY };
  }
  if (e.changedTouches && e.changedTouches.length > 0) {
    // Handle touchend events which use changedTouches
    const clientX = e.changedTouches[0].clientX;
    const clientY = e.changedTouches[0].clientY;
    return { clientX, clientY };
  }
  // Mouse events
  const clientX = e.clientX;
  const clientY = e.clientY;
  return { clientX, clientY };
};
export const screenToSVGCoordinates = (svg, clientX, clientY) => {
  if (!svg) return { x: 0, y: 0 };

  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;

  const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
  return { x: svgP.x, y: svgP.y };
};
export const calculateDistance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};
