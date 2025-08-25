import jsPDF from 'jspdf';
import { elementTypes } from '../constants/elementTypes';

//  constants 
const COMPANY_NAME = process.env.REACT_APP_COMPANY_NAME || 'Gudino Custom';
const API_BASE = process.env.REACT_APP_API_BASE || 'https://api.gudinocustom.com';
const originalWalls = [1, 2, 3, 4];

export const generatePDF = async ({
  clientInfo,
  kitchenData,
  bathroomData,
  calculateTotalPrice,
  basePrices,
  materialMultipliers,
  wallPricing
}) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let currentY = 20;

  // PDF Header
  pdf.setFontSize(20);
  pdf.text('Cabinet Design Quote', pageWidth / 2, currentY, { align: 'center' });
  currentY += 10;

  pdf.setFontSize(12);
  pdf.text(COMPANY_NAME, pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  // Client Information Section
  pdf.setFontSize(12);
  pdf.text(`Client: ${clientInfo.name}`, 20, currentY);
  currentY += 8;
  pdf.text(`Contact: ${clientInfo.contactPreference === 'email' ? clientInfo.email : clientInfo.phone}`, 20, currentY);
  currentY += 8;
  pdf.text(`Contact Method: ${clientInfo.contactPreference}`, 20, currentY);
  currentY += 8;
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, currentY);
  currentY += 15;

  // Process each room included in quote
  const roomsToInclude = [];
  if (clientInfo.includeKitchen && kitchenData.elements.length > 0) roomsToInclude.push({ name: 'Kitchen', data: kitchenData });
  if (clientInfo.includeBathroom && bathroomData.elements.length > 0) roomsToInclude.push({ name: 'Bathroom', data: bathroomData });

  for (const room of roomsToInclude) {
    // Start new page if needed
    if (currentY > pageHeight - 50) {
      pdf.addPage();
      currentY = 20;
    }

    // Room header
    pdf.setFontSize(16);
    pdf.text(room.name + ' Design', 20, currentY);
    currentY += 10;

    // Room dimensions
    pdf.setFontSize(10);
    pdf.text(`Room Dimensions: ${room.data.dimensions.width}' × ${room.data.dimensions.height}' × ${room.data.dimensions.wallHeight}" height`, 20, currentY);
    currentY += 10;

    // Cabinet specifications for this room
    const cabinets = room.data.elements.filter(el => el.category === 'cabinet');
    if (cabinets.length > 0) {
      pdf.setFontSize(12);
      pdf.text('Cabinet Specifications:', 20, currentY);
      currentY += 8;

      pdf.setFontSize(10);
      cabinets.forEach((cabinet, index) => {
        const spec = elementTypes[cabinet.type];
        const material = room.data.materials[cabinet.id] || 'laminate';
        const basePrice = basePrices[cabinet.type] || 250;
        const materialMultiplier = materialMultipliers[material];
        const sizeMultiplier = cabinet.width / 24;
        const price = basePrice * materialMultiplier * sizeMultiplier;

        pdf.text(`${index + 1}. ${spec.name}: ${cabinet.width}" × ${cabinet.depth}" × ${cabinet.actualHeight || spec.fixedHeight}"`, 25, currentY);
        pdf.text(`Material: ${material} - $${price.toFixed(2)}`, 140, currentY);
        currentY += 6;

        // Check if new page needed
        if (currentY > pageHeight - 20) {
          pdf.addPage();
          currentY = 20;
        }
      });

      // Wall modifications for this room
      const removedWalls = room.data.removedWalls || [];
      const chargeableRemoved = removedWalls.filter(wall => originalWalls.includes(wall));
      const customAdded = (room.data.walls || []).filter(wall => !originalWalls.includes(wall));

      if (chargeableRemoved.length > 0 || customAdded.length > 0) {
        currentY += 5;
        pdf.setFontSize(10);
        pdf.text('Wall Modifications:', 20, currentY);
        currentY += 5;

        if (chargeableRemoved.length > 0) {
          pdf.text(`• ${chargeableRemoved.length} wall(s) removed: $${(chargeableRemoved.length * wallPricing.removeWall).toFixed(2)}`, 25, currentY);
          currentY += 5;
        }

        if (customAdded.length > 0) {
          pdf.text(`• ${customAdded.length} custom wall(s) added: $${(customAdded.length * wallPricing.addWall).toFixed(2)}`, 25, currentY);
          currentY += 5;
        }
      }

      // Room subtotal
      currentY += 5;
      const roomTotal = calculateTotalPrice(room.data);
      pdf.setFontSize(11);
      pdf.text(`${room.name} Total: $${roomTotal.toFixed(2)}`, 20, currentY);
      currentY += 10;
    }
  }

  // Grand total calculation
  if (currentY > pageHeight - 40) {
    pdf.addPage();
    currentY = 20;
  }

  currentY += 10;
  pdf.setFontSize(14);
  let grandTotal = 0;
  if (clientInfo.includeKitchen) grandTotal += calculateTotalPrice(kitchenData);
  if (clientInfo.includeBathroom) grandTotal += calculateTotalPrice(bathroomData);

  pdf.text(`Total Estimate: $${grandTotal.toFixed(2)}`, 20, currentY);
  currentY += 10;

  // Disclaimer
  pdf.setFontSize(10);
  pdf.text('* This is an estimate. Final pricing may vary based on specific requirements.', 20, currentY);
  currentY += 10;

  // Customer comments section
  if (clientInfo.comments) {
    pdf.text('Customer Notes:', 20, currentY);
    currentY += 6;
    const lines = pdf.splitTextToSize(clientInfo.comments, 170);
    pdf.text(lines, 20, currentY);
  }

  // Save PDF with client name and date
  pdf.save(`cabinet-design-${clientInfo.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);

  // Return PDF blob for potential email attachment
  return pdf.output('blob');
};

export const sendQuote = async ({
  clientInfo,
  kitchenData,
  bathroomData,
  calculateTotalPrice,
  canvasRef,
  wallViewRef,
  viewMode,
  setViewMode,
  selectedWall,
  setSelectedWall
}) => {
  // Validate required client information
  if (!clientInfo.name || !clientInfo.email || !clientInfo.phone) {
    if (!clientInfo.name) {
      alert('please fill in your name');
      return;
    }
    else if (!clientInfo.email) {
      alert('please fill in your email');
      return;
    }
    else if (!clientInfo.phone) {
      alert('please fill in your phone number');
      return;
    }
  }

  try {
    // Show loading state
    const loadingMessage = document.createElement('div');
    loadingMessage.innerHTML = 'Capturing your design...';
    loadingMessage.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 1000;';
    document.body.appendChild(loadingMessage);

    // Helper function to capture SVG and convert to canvas for PDF
    const captureSVG = async (svgElement) => {
      if (!svgElement) return null;

      try {
        // Clone the SVG to avoid modifying the original
        const clonedSvg = svgElement.cloneNode(true);

        // Set explicit dimensions if missing
        const rect = svgElement.getBoundingClientRect();
        if (!clonedSvg.getAttribute('width')) {
          clonedSvg.setAttribute('width', rect.width);
        }
        if (!clonedSvg.getAttribute('height')) {
          clonedSvg.setAttribute('height', rect.height);
        }

        // Add white background
        const background = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        background.setAttribute('width', '100%');
        background.setAttribute('height', '100%');
        background.setAttribute('fill', 'white');
        clonedSvg.insertBefore(background, clonedSvg.firstChild);

        // Convert SVG to canvas for better PDF compatibility
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = parseFloat(clonedSvg.getAttribute('width')) || rect.width;
        canvas.height = parseFloat(clonedSvg.getAttribute('height')) || rect.height;

        // Create image from SVG
        const img = new Image();
        const svgData = new XMLSerializer().serializeToString(clonedSvg);
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        return new Promise((resolve) => {
          img.onload = () => {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            const dataURL = canvas.toDataURL('image/png', 1.0);
            resolve(dataURL);
          };
          img.onerror = () => {
            console.error('Error loading SVG image');
            URL.revokeObjectURL(url);
            resolve(null);
          };
          img.src = url;
        });
      } catch (error) {
        console.error('Error capturing SVG:', error);
        return null;
      }
    };

    // Capture floor plan
    let floorPlanImage = null;
    if (viewMode !== 'floor') {
      setViewMode('floor');
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const floorCanvas = canvasRef.current;
    if (floorCanvas) {
      floorPlanImage = await captureSVG(floorCanvas);
    }

    // Capture wall views
    const wallViewImages = [];
    setViewMode('wall');
    await new Promise(resolve => setTimeout(resolve, 100));

    for (let wall = 1; wall <= 4; wall++) {
      setSelectedWall(wall);
      await new Promise(resolve => setTimeout(resolve, 100));

      const wallCanvas = wallViewRef.current;
      if (wallCanvas) {
        const wallImage = await captureSVG(wallCanvas);
        if (wallImage) {
          wallViewImages.push({
            wall: wall,
            image: wallImage
          });
        }
      }
    }

    // Return to floor view
    setViewMode('floor');

    loadingMessage.innerHTML = 'Generating PDF...';

    // Generate PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let currentY = 20;

    // PDF Header
    pdf.setFontSize(20);
    pdf.text('Cabinet Design Quote', pageWidth / 2, currentY, { align: 'center' });
    currentY += 10;

    pdf.setFontSize(12);
    pdf.text(COMPANY_NAME, pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;

    // Client Information
    pdf.setFontSize(12);
    pdf.text(`Client: ${clientInfo.name}`, 20, currentY);
    currentY += 8;
    pdf.text(`Contact: ${clientInfo.contactPreference === 'email' ? clientInfo.email : clientInfo.phone}`, 20, currentY);
    currentY += 8;
    pdf.text(`Date: ${new Date().toLocaleDateString()}`, 20, currentY);
    currentY += 15;

    // Add floor plan to PDF
    if (floorPlanImage) {
      pdf.setFontSize(14);
      pdf.text('Floor Plan Design', 20, currentY);
      currentY += 10;

      try {
        pdf.addImage(floorPlanImage, 'PNG', 20, currentY, 170, 100);
        currentY += 110;
      } catch (e) {
        console.error('Error adding floor plan to PDF:', e);
        pdf.text('(Wall view available in admin panel)', 20, currentY);
        currentY += 10;
      }
    }

    // Calculate totals
    let grandTotal = 0;
    if (clientInfo.includeKitchen) grandTotal += calculateTotalPrice(kitchenData);
    if (clientInfo.includeBathroom) grandTotal += calculateTotalPrice(bathroomData);

    // Add wall views on new page
    if (wallViewImages.length > 0) {
      pdf.addPage();
      currentY = 20;

      pdf.setFontSize(16);
      pdf.text('Wall Elevation Views', pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;

      for (let i = 0; i < wallViewImages.length; i++) {
        if (i % 2 === 0 && i > 0) {
          pdf.addPage();
          currentY = 20;
        }

        pdf.setFontSize(12);
        pdf.text(`Wall ${wallViewImages[i].wall}`, 20, currentY);
        currentY += 5;

        try {
          pdf.addImage(wallViewImages[i].image, 'PNG', 20, currentY, 170, 80);
          currentY += 90;
        } catch (e) {
          console.error('Error adding wall view to PDF:', e);
          pdf.text('(Wall view available in admin panel)', 20, currentY);
          currentY += 10;
        }
      }
    }

    // Add specifications
    pdf.addPage();
    currentY = 20;

    pdf.setFontSize(16);
    pdf.text('Cabinet Specifications', 20, currentY);
    currentY += 15;

    // Process each room
    const roomsToInclude = [];
    if (clientInfo.includeKitchen && kitchenData.elements.length > 0) {
      roomsToInclude.push({ name: 'Kitchen', data: kitchenData });
    }
    if (clientInfo.includeBathroom && bathroomData.elements.length > 0) {
      roomsToInclude.push({ name: 'Bathroom', data: bathroomData });
    }

    for (const room of roomsToInclude) {
      pdf.setFontSize(14);
      pdf.text(`${room.name} (${room.data.dimensions.width}' × ${room.data.dimensions.height}')`, 20, currentY);
      currentY += 8;

      const cabinets = room.data.elements.filter(el => el.category === 'cabinet');

      pdf.setFontSize(10);
      cabinets.forEach((cabinet, index) => {
        const material = room.data.materials[cabinet.id] || 'laminate';
        pdf.text(`${index + 1}. ${cabinet.type}: ${cabinet.width}" × ${cabinet.depth}" - ${material}`, 25, currentY);
        currentY += 6;

        if (currentY > pageHeight - 30) {
          pdf.addPage();
          currentY = 20;
        }
      });

      const roomTotal = calculateTotalPrice(room.data);
      pdf.setFontSize(11);
      pdf.text(`${room.name} Total: $${roomTotal.toFixed(2)}`, 20, currentY);
      currentY += 10;
    }

    // Grand total
    pdf.setFontSize(14);
    pdf.text(`Total Estimate: $${grandTotal.toFixed(2)}`, 20, currentY);

    // Get PDF blob
    const pdfBlob = pdf.output('blob');

    loadingMessage.innerHTML = 'Sending design...';

    // Create form data
    const formData = new FormData();
    formData.append('pdf', pdfBlob, 'design.pdf');

    // Design data with images
    const designData = {
      client_name: clientInfo.name,
      client_email: clientInfo.email || '',
      client_phone: clientInfo.phone || '',
      contact_preference: clientInfo.contactPreference,
      kitchen_data: clientInfo.includeKitchen ? kitchenData : null,
      bathroom_data: clientInfo.includeBathroom ? bathroomData : null,
      include_kitchen: clientInfo.includeKitchen,
      include_bathroom: clientInfo.includeBathroom,
      total_price: grandTotal,
      comments: clientInfo.comments || '',
      floor_plan_image: floorPlanImage,
      wall_view_images: wallViewImages
    };

    console.log('Sending design:', {
      hasFloorPlan: !!floorPlanImage,
      wallViews: wallViewImages.length,
      dataSize: JSON.stringify(designData).length
    });

    formData.append('designData', JSON.stringify(designData));

    // Send to backend
    const response = await fetch(`${API_BASE}/api/designs`, {
      method: 'POST',
      body: formData
    });

    document.body.removeChild(loadingMessage);

    if (response.ok) {
      const result = await response.json();

      alert(`Thank you! Your design has been sent to ${COMPANY_NAME}.`);

      // Reset client info (return the reset object)
      const resetClientInfo = {
        name: '',
        email: '',
        phone: '',
        contactPreference: 'email',
        includeKitchen: true,
        includeBathroom: false,
        comments: ''
      };

      // Offer download
      if (window.confirm('Would you like to download a copy?')) {
        pdf.save(`cabinet-design-${clientInfo.name.replace(/\s+/g, '-')}.pdf`);
      }

      return { success: true, resetClientInfo };
    } else {
      throw new Error('Failed to send design');
    }

  } catch (error) {
    console.error('Error:', error);
    alert('Error sending your design. Please try again.');
    return { success: false };
  }
};