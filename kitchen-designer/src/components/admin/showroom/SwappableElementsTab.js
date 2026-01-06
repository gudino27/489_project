// SwappableElementsTab - Admin interface for managing swappable elements in panorama
// Allows defining regions on panorama that can have materials swapped
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';

// Lazy load the 3D preview to avoid loading Three.js unless needed
const AdminPanoramaPreview = lazy(() => import('./AdminPanoramaPreview'));

const SwappableElementsTab = ({ token, API_BASE, language, rooms = [] }) => {
  // State
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [elements, setElements] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingElement, setEditingElement] = useState(null);
  const [elementForm, setElementForm] = useState({
    room_id: '',
    element_name_en: '',
    element_name_es: '',
    element_type: 'surface',
    uv_bounds: { minU: 0.3, maxU: 0.7, minV: 0.3, maxV: 0.7 },
    polygon_points: null, // Store exact polygon points from 3D selection
    highlight_color: '#f59e0b',
    default_material_id: '',
    is_enabled: true,
    display_order: 0
  });

  // Material linking state
  const [linkingElement, setLinkingElement] = useState(null);
  const [selectedMaterialsToLink, setSelectedMaterialsToLink] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // 3D drawing state (only 3D mode now - 2D removed for better workflow)
  const [points3D, setPoints3D] = useState([]); // Points collected in 3D mode
  const [is3DDrawMode, setIs3DDrawMode] = useState(false); // Toggle for 3D drawing


  // Fetch elements for a room
  const fetchElements = useCallback(async (roomId) => {
    if (!roomId) {
      setElements([]);
      return;
    }
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/showroom/admin/elements?room_id=${roomId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setElements(data);
      }
    } catch (error) {
      console.error('Failed to fetch elements:', error);
    } finally {
      setLoading(false);
    }
  }, [API_BASE, token]);

  // Fetch all materials for linking
  const fetchMaterials = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/showroom/admin/materials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    }
  }, [API_BASE, token]);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/showroom/admin/material-categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  }, [API_BASE, token]);

  // Initial load
  useEffect(() => {
    fetchMaterials();
    fetchCategories();
  }, [fetchMaterials, fetchCategories]);

  // Fetch elements when room changes
  useEffect(() => {
    if (selectedRoom) {
      fetchElements(selectedRoom.id);
      setElementForm(prev => ({ ...prev, room_id: selectedRoom.id }));
    }
  }, [selectedRoom, fetchElements]);

  // Save element
  const handleSaveElement = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validate room selection
    if (!selectedRoom?.id) {
      setMessage({ type: 'error', text: 'Please select a room first!' });
      return;
    }

    // Validate required fields
    if (!elementForm.element_name_en?.trim()) {
      setMessage({ type: 'error', text: 'Please enter an element name (English)' });
      return;
    }
    if (!elementForm.element_name_es?.trim()) {
      setMessage({ type: 'error', text: 'Please enter an element name (Spanish)' });
      return;
    }

    setSaving(true);

    try {
      // Debug: Log raw form data before processing
      console.log('[SwappableElements] Raw form data before save:', {
        polygon_points: elementForm.polygon_points,
        polygon_points_type: typeof elementForm.polygon_points,
        polygon_points_isArray: Array.isArray(elementForm.polygon_points),
        polygon_points_length: elementForm.polygon_points?.length,
        uv_bounds: elementForm.uv_bounds
      });

      const payload = {
        ...elementForm,
        room_id: selectedRoom.id, // Ensure room_id is set
        uv_bounds: typeof elementForm.uv_bounds === 'string'
          ? elementForm.uv_bounds
          : JSON.stringify(elementForm.uv_bounds),
        // Include polygon points if available (from 3D selection)
        polygon_points: elementForm.polygon_points
          ? (typeof elementForm.polygon_points === 'string'
              ? elementForm.polygon_points
              : JSON.stringify(elementForm.polygon_points))
          : null
      };

      // Debug: Log processed payload
      console.log('[SwappableElements] Processed payload:', {
        polygon_points: payload.polygon_points,
        polygon_points_parsed: payload.polygon_points ? JSON.parse(payload.polygon_points) : null,
        uv_bounds: payload.uv_bounds
      });

      const url = editingElement
        ? `${API_BASE}/api/showroom/admin/elements/${editingElement.id}`
        : `${API_BASE}/api/showroom/admin/elements`;

      const response = await fetch(url, {
        method: editingElement ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: editingElement ? 'Element updated!' : 'Element created!' });
        resetElementForm();
        await fetchElements(selectedRoom?.id);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save element');
      }
    } catch (error) {
      console.error('[SwappableElements] Error saving:', error);
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  // Delete element
  const handleDeleteElement = async (elementId) => {
    if (!window.confirm('Delete this element? Material links will also be removed.')) return;

    try {
      const response = await fetch(`${API_BASE}/api/showroom/admin/elements/${elementId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Element deleted!' });
        await fetchElements(selectedRoom?.id);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete element' });
    }
  };

  // Edit element
  const handleEditElement = (element) => {
    setEditingElement(element);
    let uvBounds = element.uv_bounds;
    if (typeof uvBounds === 'string') {
      try {
        uvBounds = JSON.parse(uvBounds);
      } catch {
        uvBounds = { minU: 0.3, maxU: 0.7, minV: 0.3, maxV: 0.7 };
      }
    }

    // Parse polygon points if available
    let polygonPoints = element.polygon_points;
    if (typeof polygonPoints === 'string') {
      try {
        polygonPoints = JSON.parse(polygonPoints);
      } catch {
        polygonPoints = null;
      }
    }

    setElementForm({
      room_id: element.room_id || selectedRoom?.id || '',
      element_name_en: element.element_name_en || '',
      element_name_es: element.element_name_es || '',
      element_type: element.element_type || 'surface',
      uv_bounds: uvBounds || { minU: 0.3, maxU: 0.7, minV: 0.3, maxV: 0.7 },
      polygon_points: polygonPoints || null,
      highlight_color: element.highlight_color || '#f59e0b',
      default_material_id: element.default_material_id || '',
      is_enabled: element.is_enabled !== false,
      display_order: element.display_order || 0
    });

    // Load polygon points into 3D drawing state if available
    if (polygonPoints && Array.isArray(polygonPoints)) {
      setPoints3D(polygonPoints);
    } else {
      setPoints3D([]);
    }
    setIs3DDrawMode(false);
  };

  // Reset element form
  const resetElementForm = () => {
    setEditingElement(null);
    setElementForm({
      room_id: selectedRoom?.id || '',
      element_name_en: '',
      element_name_es: '',
      element_type: 'surface',
      uv_bounds: { minU: 0.3, maxU: 0.7, minV: 0.3, maxV: 0.7 },
      polygon_points: null,
      highlight_color: '#f59e0b',
      default_material_id: '',
      is_enabled: true,
      display_order: 0
    });
    // Clear 3D drawing state
    setPoints3D([]);
    setIs3DDrawMode(false);
  };

  // Link materials to element
  const handleLinkMaterials = async () => {
    if (!linkingElement || selectedMaterialsToLink.length === 0) return;

    setSaving(true);
    try {
      for (const materialId of selectedMaterialsToLink) {
        await fetch(`${API_BASE}/api/showroom/admin/elements/${linkingElement.id}/link-material`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ material_id: materialId })
        });
      }
      setMessage({ type: 'success', text: 'Materials linked!' });
      setLinkingElement(null);
      setSelectedMaterialsToLink([]);
      await fetchElements(selectedRoom?.id);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to link materials' });
    } finally {
      setSaving(false);
    }
  };

  // Unlink material from element
  const handleUnlinkMaterial = async (elementId, materialId) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/showroom/admin/elements/${elementId}/unlink-material/${materialId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      if (response.ok) {
        setMessage({ type: 'success', text: 'Material unlinked!' });
        await fetchElements(selectedRoom?.id);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to unlink material' });
    }
  };

  // Set default material for element
  const handleSetDefaultMaterial = async (elementId, materialId) => {
    try {
      const response = await fetch(`${API_BASE}/api/showroom/admin/elements/${elementId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ default_material_id: materialId })
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Default material set!' });
        await fetchElements(selectedRoom?.id);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to set default material' });
    }
  };

  // Element type options
  const elementTypes = [
    { value: 'surface', label: 'Surface (floor, wall, counter)' },
    { value: 'cabinet', label: 'Cabinet' },
    { value: 'fixture', label: 'Fixture (sink, faucet)' },
    { value: 'accessory', label: 'Accessory' }
  ];

  // Get materials for an element
  const getElementMaterials = (element) => {
    if (!element.linked_materials) return [];
    try {
      const parsed = typeof element.linked_materials === 'string'
        ? JSON.parse(element.linked_materials)
        : element.linked_materials;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Get available materials (not linked to element)
  const getAvailableMaterials = (element) => {
    const linked = getElementMaterials(element).map(m => m.id);
    return materials.filter(m => !linked.includes(m.id));
  };

  return (
    <div className="space-y-6">
      {/* Message */}
      {message.text && (
        <div className={`p-3 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-100 text-green-700 border border-green-300'
            : 'bg-red-100 text-red-700 border border-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Quick Start Guide - Simplified */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">What are Swappable Elements?</h4>
        <p className="text-blue-700 text-sm mb-3">
          These are clickable regions in your panorama where visitors can change materials (like changing flooring or wall color).
        </p>
        <div className="bg-white/50 rounded p-3">
          <p className="text-blue-800 text-sm font-medium mb-1">Quick Steps:</p>
          <ol className="text-blue-600 text-sm list-decimal ml-5 space-y-0.5">
            <li>Select a room below</li>
            <li>Click a <strong>preset button</strong> (Floor, Wall, etc.) to auto-fill the form</li>
            <li>Save the element, then click <strong>"Link Materials"</strong> to add materials visitors can swap to</li>
          </ol>
        </div>
      </div>

      {/* Room Selector */}
      <div className="bg-white rounded-lg border p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Room to Manage Elements
        </label>
        <div className="flex flex-wrap gap-2">
          {rooms.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-700 w-full">
              <strong>No rooms yet!</strong> Go to the <strong>Rooms</strong> tab first to add a showroom room with a 360° panorama.
            </div>
          ) : (
            rooms.map(room => (
              <button
                key={room.id}
                onClick={() => setSelectedRoom(room)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedRoom?.id === room.id
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {room.room_name_en}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Content (only show if room selected) */}
      {selectedRoom && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Element Form */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingElement ? 'Edit Element' : 'Add Swappable Element'}
            </h3>
            <form onSubmit={handleSaveElement} className="space-y-4" noValidate>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (English) *
                  </label>
                  <input
                    type="text"
                    value={elementForm.element_name_en}
                    onChange={(e) => setElementForm({ ...elementForm, element_name_en: e.target.value })}
                    placeholder="e.g., Floor, Countertop"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (Spanish) *
                  </label>
                  <input
                    type="text"
                    value={elementForm.element_name_es}
                    onChange={(e) => setElementForm({ ...elementForm, element_name_es: e.target.value })}
                    placeholder="e.g., Piso, Encimera"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Element Type
                  </label>
                  <select
                    value={elementForm.element_type}
                    onChange={(e) => setElementForm({ ...elementForm, element_type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    {elementTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Highlight Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={elementForm.highlight_color}
                      onChange={(e) => setElementForm({ ...elementForm, highlight_color: e.target.value })}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={elementForm.highlight_color}
                      onChange={(e) => setElementForm({ ...elementForm, highlight_color: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* UV Bounds with Presets */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Area on Panorama
                </label>

                {/* Quick Presets */}
                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-2">Click a preset to auto-fill:</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setElementForm({
                        ...elementForm,
                        element_name_en: elementForm.element_name_en || 'Floor',
                        element_name_es: elementForm.element_name_es || 'Piso',
                        uv_bounds: { minU: 0, maxU: 1, minV: 0.6, maxV: 0.95 }
                      })}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded text-sm font-medium border border-amber-300"
                    >
                      🟫 Floor
                    </button>
                    <button
                      type="button"
                      onClick={() => setElementForm({
                        ...elementForm,
                        element_name_en: elementForm.element_name_en || 'Left Wall',
                        element_name_es: elementForm.element_name_es || 'Pared Izquierda',
                        uv_bounds: { minU: 0, maxU: 0.3, minV: 0.2, maxV: 0.6 }
                      })}
                      className="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded text-sm font-medium border border-blue-300"
                    >
                      ⬅️ Left Wall
                    </button>
                    <button
                      type="button"
                      onClick={() => setElementForm({
                        ...elementForm,
                        element_name_en: elementForm.element_name_en || 'Center Wall',
                        element_name_es: elementForm.element_name_es || 'Pared Central',
                        uv_bounds: { minU: 0.3, maxU: 0.7, minV: 0.2, maxV: 0.6 }
                      })}
                      className="px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-800 rounded text-sm font-medium border border-green-300"
                    >
                      🔲 Center Wall
                    </button>
                    <button
                      type="button"
                      onClick={() => setElementForm({
                        ...elementForm,
                        element_name_en: elementForm.element_name_en || 'Right Wall',
                        element_name_es: elementForm.element_name_es || 'Pared Derecha',
                        uv_bounds: { minU: 0.7, maxU: 1, minV: 0.2, maxV: 0.6 }
                      })}
                      className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded text-sm font-medium border border-purple-300"
                    >
                      ➡️ Right Wall
                    </button>
                    <button
                      type="button"
                      onClick={() => setElementForm({
                        ...elementForm,
                        element_name_en: elementForm.element_name_en || 'Countertop',
                        element_name_es: elementForm.element_name_es || 'Encimera',
                        uv_bounds: { minU: 0.25, maxU: 0.75, minV: 0.45, maxV: 0.6 }
                      })}
                      className="px-3 py-1.5 bg-pink-100 hover:bg-pink-200 text-pink-800 rounded text-sm font-medium border border-pink-300"
                    >
                      🔳 Countertop
                    </button>
                    <button
                      type="button"
                      onClick={() => setElementForm({
                        ...elementForm,
                        element_name_en: elementForm.element_name_en || 'Ceiling',
                        element_name_es: elementForm.element_name_es || 'Techo',
                        uv_bounds: { minU: 0, maxU: 1, minV: 0.05, maxV: 0.2 }
                      })}
                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm font-medium border border-gray-400"
                    >
                      ⬜ Ceiling
                    </button>
                  </div>
                  {/* Cabinet presets */}
                  <p className="text-xs text-gray-500 mt-2 mb-1">Cabinet presets (use zoom to refine):</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setElementForm({
                        ...elementForm,
                        element_name_en: elementForm.element_name_en || 'Upper Cabinets',
                        element_name_es: elementForm.element_name_es || 'Gabinetes Superiores',
                        element_type: 'cabinet',
                        uv_bounds: { minU: 0.2, maxU: 0.8, minV: 0.25, maxV: 0.45 }
                      })}
                      className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded text-sm font-medium border border-orange-300"
                    >
                      🗄️ Upper Cabinets
                    </button>
                    <button
                      type="button"
                      onClick={() => setElementForm({
                        ...elementForm,
                        element_name_en: elementForm.element_name_en || 'Lower Cabinets',
                        element_name_es: elementForm.element_name_es || 'Gabinetes Inferiores',
                        element_type: 'cabinet',
                        uv_bounds: { minU: 0.2, maxU: 0.8, minV: 0.5, maxV: 0.7 }
                      })}
                      className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded text-sm font-medium border border-orange-300"
                    >
                      🗄️ Lower Cabinets
                    </button>
                    <button
                      type="button"
                      onClick={() => setElementForm({
                        ...elementForm,
                        element_name_en: elementForm.element_name_en || 'Island Cabinet',
                        element_name_es: elementForm.element_name_es || 'Gabinete de Isla',
                        element_type: 'cabinet',
                        uv_bounds: { minU: 0.35, maxU: 0.65, minV: 0.55, maxV: 0.75 }
                      })}
                      className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-800 rounded text-sm font-medium border border-orange-300"
                    >
                      🏝️ Island
                    </button>
                  </div>
                </div>

                {/* 3D Preview and Selection - always visible when room has panorama */}
                {selectedRoom?.image_360_url && (
                    <div className="mt-2">
                      {/* 3D Mode Toggle */}
                      <div className="flex items-center justify-between mb-2 bg-gray-800 rounded-t-lg px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-medium">3D View</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${is3DDrawMode ? 'bg-amber-500 text-white' : 'bg-gray-600 text-gray-300'}`}>
                            {is3DDrawMode ? 'Draw Mode' : 'Preview'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {is3DDrawMode && points3D.length > 0 && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  if (points3D.length > 0) {
                                    const newPoints = points3D.slice(0, -1);
                                    setPoints3D(newPoints);
                                    setElementForm(prev => ({
                                      ...prev,
                                      polygon_points: newPoints.length > 0 ? newPoints : null
                                    }));
                                  }
                                }}
                                className="text-xs px-2 py-1 bg-gray-600 hover:bg-gray-500 text-white rounded"
                              >
                                Undo
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPoints3D([]);
                                  setElementForm(prev => ({ ...prev, polygon_points: null }));
                                }}
                                className="text-xs px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded"
                              >
                                Clear
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setIs3DDrawMode(!is3DDrawMode);
                              if (!is3DDrawMode) {
                                setPoints3D([]); // Clear points when entering draw mode
                              }
                            }}
                            className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
                              is3DDrawMode
                                ? 'bg-green-500 hover:bg-green-600 text-white'
                                : 'bg-amber-500 hover:bg-amber-600 text-white'
                            }`}
                          >
                            {is3DDrawMode ? 'Exit Draw Mode' : 'Draw in 3D'}
                          </button>
                        </div>
                      </div>

                      <Suspense fallback={
                        <div className="bg-gray-900 rounded-b-lg h-[400px] flex items-center justify-center">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500 mx-auto mb-2"></div>
                            <p className="text-gray-400 text-sm">Loading 3D preview...</p>
                          </div>
                        </div>
                      }>
                        <AdminPanoramaPreview
                          panoramaUrl={`${API_BASE}${selectedRoom.image_360_url}`}
                          uvBounds={elementForm.uv_bounds}
                          highlightColor={elementForm.highlight_color}
                          elementName={elementForm.element_name_en}
                          existingElements={elements.filter(el => el.id !== editingElement?.id)}
                          isDrawMode={is3DDrawMode}
                          drawingPoints={points3D}
                          onPointAdded={(uv) => {
                            console.log('[SwappableElementsTab] 3D point added:', {
                              newPoint: uv,
                              existingPoints: points3D.length,
                              allPointsAfter: [...points3D, uv]
                            });
                            const newPoints = [...points3D, uv];
                            setPoints3D(newPoints);
                            // Store polygon points in form for saving
                            setElementForm(prev => {
                              console.log('[SwappableElementsTab] Updating form polygon_points:', newPoints);
                              return { ...prev, polygon_points: newPoints };
                            });
                          }}
                          onBoundsUpdate={(bounds) => {
                            console.log('[SwappableElementsTab] 3D bounds updated:', bounds);
                            setElementForm(prev => ({ ...prev, uv_bounds: bounds }));
                          }}
                        />
                      </Suspense>

                      {/* Instructions for 3D mode */}
                      {is3DDrawMode && (
                        <div className="bg-amber-50 border border-amber-200 rounded-b-lg px-3 py-2 -mt-1">
                          <p className="text-amber-800 text-xs">
                            <strong>3D Draw Mode:</strong> Click directly on the panorama to place points.
                            The overlay will automatically update to cover the selected area.
                            {points3D.length > 0 && ` (${points3D.length} points placed)`}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                {/* Manual adjustment (collapsible) */}
                <details className="text-xs">
                  <summary className="text-gray-500 cursor-pointer hover:text-gray-700 mb-2">
                    Fine-tune manually (advanced)
                  </summary>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <div>
                      <label className="block text-gray-600 mb-1">Left</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={elementForm.uv_bounds.minU}
                        onChange={(e) => setElementForm({
                          ...elementForm,
                          uv_bounds: { ...elementForm.uv_bounds, minU: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Right</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={elementForm.uv_bounds.maxU}
                        onChange={(e) => setElementForm({
                          ...elementForm,
                          uv_bounds: { ...elementForm.uv_bounds, maxU: parseFloat(e.target.value) || 1 }
                        })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Top</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={elementForm.uv_bounds.minV}
                        onChange={(e) => setElementForm({
                          ...elementForm,
                          uv_bounds: { ...elementForm.uv_bounds, minV: parseFloat(e.target.value) || 0 }
                        })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-600 mb-1">Bottom</label>
                      <input
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={elementForm.uv_bounds.maxV}
                        onChange={(e) => setElementForm({
                          ...elementForm,
                          uv_bounds: { ...elementForm.uv_bounds, maxV: parseFloat(e.target.value) || 1 }
                        })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                  </div>
                </details>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={elementForm.display_order}
                    onChange={(e) => setElementForm({ ...elementForm, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={elementForm.is_enabled}
                      onChange={(e) => setElementForm({ ...elementForm, is_enabled: e.target.checked })}
                      className="rounded text-amber-500"
                    />
                    <span className="text-sm">Enabled</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-amber-500 hover:bg-amber-600  py-2 rounded-lg font-medium disabled:opacity-50"
                  style={{ color:'black', boxShadow: '0 4px 6px rgba(82, 82, 82, 1)' }}

                >
                  {saving ? 'Saving...' : (editingElement ? 'Update' : 'Add Element')}
                </button>
                {editingElement && (
                  <button
                    type="button"
                    onClick={resetElementForm}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Elements List */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">
              Elements in "{selectedRoom.room_name_en}" ({elements.length})
            </h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
              </div>
            ) : elements.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No swappable elements yet. Add one to get started.
              </p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {elements.map((el) => {
                  const linkedMaterials = getElementMaterials(el);
                  return (
                    <div
                      key={el.id}
                      className={`p-4 border rounded-lg ${
                        el.is_enabled ? 'bg-white' : 'bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: el.highlight_color || '#f59e0b' }}
                          />
                          <div>
                            <h4 className="font-medium">{el.element_name_en}</h4>
                            <p className="text-xs text-gray-500">{el.element_type}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              // Copy element - pre-fill form with same bounds but new name
                              const bounds = typeof el.uv_bounds === 'string' ? JSON.parse(el.uv_bounds) : el.uv_bounds;
                              setEditingElement(null);
                              setElementForm({
                                room_id: selectedRoom.id,
                                element_name_en: `${el.element_name_en} (Copy)`,
                                element_name_es: `${el.element_name_es} (Copia)`,
                                element_type: el.element_type,
                                uv_bounds: bounds,
                                highlight_color: el.highlight_color || '#f59e0b',
                                default_material_id: '',
                                is_enabled: true,
                                display_order: el.display_order + 1
                              });
                              setMessage({ type: 'success', text: 'Element copied! Edit the name and save.' });
                            }}
                            className="text-green-600 hover:text-green-800 text-sm"
                            title="Copy this element's position"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => handleEditElement(el)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteElement(el.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Linked materials */}
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            Linked Materials ({linkedMaterials.length})
                          </span>
                          <button
                            onClick={() => {
                              setLinkingElement(el);
                              setSelectedMaterialsToLink([]);
                            }}
                            className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded hover:bg-amber-200"
                          >
                            + Link Material
                          </button>
                        </div>
                        {linkedMaterials.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {linkedMaterials.map((mat) => (
                              <div
                                key={mat.id}
                                className={`flex items-center gap-1 text-xs px-2 py-1 rounded border ${
                                  el.default_material_id === mat.id
                                    ? 'bg-amber-100 border-amber-300'
                                    : 'bg-gray-100'
                                }`}
                              >
                                <span
                                  className="w-3 h-3 rounded-sm border"
                                  style={{ backgroundColor: mat.color_hex || '#ccc' }}
                                />
                                <span>{mat.material_name_en}</span>
                                {el.default_material_id !== mat.id && (
                                  <button
                                    onClick={() => handleSetDefaultMaterial(el.id, mat.id)}
                                    className="text-amber-600 hover:text-amber-800 ml-1"
                                    title="Set as default"
                                  >
                                    *
                                  </button>
                                )}
                                <button
                                  onClick={() => handleUnlinkMaterial(el.id, mat.id)}
                                  className="text-red-600 hover:text-red-800 ml-1"
                                  title="Unlink"
                                >
                                  x
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400">No materials linked</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Material Linking Modal */}
      {linkingElement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Link Materials to "{linkingElement.element_name_en}"
              </h3>
              <button
                onClick={() => setLinkingElement(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Category filter */}
            <div className="mb-4 flex gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Filter by category:</span>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                  onClick={() => {
                    // Could add category filter state here
                  }}
                >
                  {cat.category_name_en}
                </button>
              ))}
            </div>

            {/* Available materials grid */}
            <div className="flex-1 overflow-y-auto">
              <div className="grid grid-cols-4 gap-3">
                {getAvailableMaterials(linkingElement).map((mat) => {
                  const isSelected = selectedMaterialsToLink.includes(mat.id);
                  return (
                    <button
                      key={mat.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedMaterialsToLink(prev => prev.filter(id => id !== mat.id));
                        } else {
                          setSelectedMaterialsToLink(prev => [...prev, mat.id]);
                        }
                      }}
                      className={`p-2 border rounded-lg text-left transition-colors ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <div
                        className="w-full h-12 rounded mb-2 border"
                        style={{ backgroundColor: mat.color_hex || '#ccc' }}
                      >
                        {mat.thumbnail_url && (
                          <img
                            src={mat.thumbnail_url.startsWith('http') ? mat.thumbnail_url : `${API_BASE}${mat.thumbnail_url}`}
                            alt=""
                            className="w-full h-full object-cover rounded"
                          />
                        )}
                      </div>
                      <p className="text-xs font-medium truncate">{mat.material_name_en}</p>
                      <p className="text-xs text-gray-500">{mat.price_indicator}</p>
                    </button>
                  );
                })}
              </div>
              {getAvailableMaterials(linkingElement).length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  All materials are already linked to this element.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {selectedMaterialsToLink.length} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setLinkingElement(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLinkMaterials}
                  disabled={selectedMaterialsToLink.length === 0 || saving}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600  rounded-lg disabled:opacity-50"
                  style={{ color:'black', boxShadow: '0 4px 6px rgba(82, 82, 82, 1)' }}

                >
                  {saving ? 'Linking...' : 'Link Selected'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SwappableElementsTab;
