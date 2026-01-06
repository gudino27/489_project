// MaterialsTab - Admin interface for managing material categories and materials
// Allows adding/editing/deleting materials with texture uploads
import React, { useState, useEffect, useCallback } from 'react';

const MaterialsTab = ({ token, API_BASE, language }) => {
  // Categories state
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    category_name_en: '',
    category_name_es: '',
    category_slug: '',
    icon: 'palette',
    display_order: 0,
    is_enabled: true
  });

  // Materials state
  const [materials, setMaterials] = useState([]);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [materialForm, setMaterialForm] = useState({
    category_id: '',
    material_name_en: '',
    material_name_es: '',
    material_code: '',
    color_hex: '#cccccc',
    roughness: 0.5,
    metalness: 0.0,
    repeat_scale_x: 1.0,
    repeat_scale_y: 1.0,
    price_indicator: '$',
    is_enabled: true,
    display_order: 0
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [textureFile, setTextureFile] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeSection, setActiveSection] = useState('categories');

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

  // Fetch materials for a category
  const fetchMaterials = useCallback(async (categoryId) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/showroom/admin/materials${categoryId ? `?category_id=${categoryId}` : ''}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
      }
    } catch (error) {
      console.error('Failed to fetch materials:', error);
    }
  }, [API_BASE, token]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchCategories();
      await fetchMaterials();
      setLoading(false);
    };
    load();
  }, [fetchCategories, fetchMaterials]);

  // Refresh materials when category selection changes
  useEffect(() => {
    if (selectedCategory) {
      fetchMaterials(selectedCategory.id);
    } else {
      fetchMaterials();
    }
  }, [selectedCategory, fetchMaterials]);

  // Generate slug from name
  const generateSlug = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  // Save category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const url = editingCategory
        ? `${API_BASE}/api/showroom/admin/material-categories/${editingCategory.id}`
        : `${API_BASE}/api/showroom/admin/material-categories`;

      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(categoryForm)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: editingCategory ? 'Category updated!' : 'Category created!' });
        resetCategoryForm();
        await fetchCategories();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save category');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this category? All materials in it will also be deleted.')) return;

    try {
      const response = await fetch(`${API_BASE}/api/showroom/admin/material-categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Category deleted!' });
        await fetchCategories();
        if (selectedCategory?.id === categoryId) {
          setSelectedCategory(null);
        }
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete category' });
    }
  };

  // Edit category
  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      category_name_en: category.category_name_en || '',
      category_name_es: category.category_name_es || '',
      category_slug: category.category_slug || '',
      icon: category.icon || 'palette',
      display_order: category.display_order || 0,
      is_enabled: category.is_enabled !== false
    });
  };

  // Reset category form
  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCategoryForm({
      category_name_en: '',
      category_name_es: '',
      category_slug: '',
      icon: 'palette',
      display_order: 0,
      is_enabled: true
    });
  };

  // Save material
  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();

      // Add form fields
      Object.keys(materialForm).forEach(key => {
        formData.append(key, materialForm[key]);
      });

      // Add files if present
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }
      if (textureFile) {
        formData.append('texture', textureFile);
      }

      const url = editingMaterial
        ? `${API_BASE}/api/showroom/admin/materials/${editingMaterial.id}`
        : `${API_BASE}/api/showroom/admin/materials`;

      const response = await fetch(url, {
        method: editingMaterial ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        setMessage({ type: 'success', text: editingMaterial ? 'Material updated!' : 'Material created!' });
        resetMaterialForm();
        await fetchMaterials(selectedCategory?.id);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save material');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  // Delete material
  const handleDeleteMaterial = async (materialId) => {
    if (!window.confirm('Delete this material?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/showroom/admin/materials/${materialId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Material deleted!' });
        await fetchMaterials(selectedCategory?.id);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete material' });
    }
  };

  // Edit material
  const handleEditMaterial = (material) => {
    setEditingMaterial(material);
    setMaterialForm({
      category_id: material.category_id || '',
      material_name_en: material.material_name_en || '',
      material_name_es: material.material_name_es || '',
      material_code: material.material_code || '',
      color_hex: material.color_hex || '#cccccc',
      roughness: material.roughness ?? 0.5,
      metalness: material.metalness ?? 0.0,
      repeat_scale_x: material.repeat_scale_x ?? 1.0,
      repeat_scale_y: material.repeat_scale_y ?? 1.0,
      price_indicator: material.price_indicator || '$',
      is_enabled: material.is_enabled !== false,
      display_order: material.display_order || 0
    });
    setActiveSection('materials');
  };

  // Reset material form
  const resetMaterialForm = () => {
    setEditingMaterial(null);
    setMaterialForm({
      category_id: selectedCategory?.id || '',
      material_name_en: '',
      material_name_es: '',
      material_code: '',
      color_hex: '#cccccc',
      roughness: 0.5,
      metalness: 0.0,
      repeat_scale_x: 1.0,
      repeat_scale_y: 1.0,
      price_indicator: '$',
      is_enabled: true,
      display_order: 0
    });
    setThumbnailFile(null);
    setTextureFile(null);
  };

  // Icon options for categories
  const iconOptions = [
    { value: 'palette', label: 'Palette' },
    { value: 'floor', label: 'Floor' },
    { value: 'wall', label: 'Wall' },
    { value: 'counter', label: 'Counter' },
    { value: 'cabinet', label: 'Cabinet' },
    { value: 'tile', label: 'Tile' },
    { value: 'wood', label: 'Wood' },
    { value: 'stone', label: 'Stone' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

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

      {/* Quick Start Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-blue-500 text-xl">?</div>
          <div>
            <h4 className="font-semibold text-blue-800 mb-1">How Materials Work</h4>
            <p className="text-blue-700 text-sm mb-2">
              Materials are finishes that visitors can apply to surfaces in your 360° showroom (floors, walls, countertops, etc).
            </p>
            <div className="text-blue-600 text-xs space-y-1">
              <p><strong>Step 1:</strong> Create Categories (e.g., "Flooring", "Countertops", "Cabinet Finishes")</p>
              <p><strong>Step 2:</strong> Add Materials to each category with colors and optional texture images</p>
              <p><strong>Step 3:</strong> Go to <strong>Swappable Elements</strong> tab to define which areas of your panorama can be customized</p>
              <p><strong>Step 4:</strong> Link your materials to those elements so visitors can swap them</p>
            </div>
          </div>
        </div>
      </div>

      {/* What Are Materials Info */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h4 className="font-semibold text-green-800 mb-2">What Are Materials?</h4>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white rounded p-3 border">
            <p className="font-medium text-green-700 mb-1">Option 1: Solid Colors (Easiest)</p>
            <p className="text-gray-600 text-xs">Just pick a color - no image needed. Good for painted walls, solid cabinets.</p>
          </div>
          <div className="bg-white rounded p-3 border">
            <p className="font-medium text-green-700 mb-1">Option 2: Texture Images (Realistic)</p>
            <p className="text-gray-600 text-xs">Upload a tileable texture photo (wood grain, marble, tile). The image repeats across the surface.</p>
          </div>
        </div>
        <div className="mt-3 text-xs text-green-700">
          <p className="font-medium mb-1">Free Texture Resources:</p>
          <div className="flex flex-wrap gap-2">
            <a href="https://polyhaven.com/textures" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-900">Poly Haven (CC0)</a>
            <span>•</span>
            <a href="https://ambientcg.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-900">ambientCG (CC0)</a>
            <span>•</span>
            <a href="https://www.textures.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-900">Textures.com (Free tier)</a>
            <span>•</span>
            <a href="https://cc0textures.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-900">CC0 Textures</a>
          </div>
          <p className="mt-2 text-gray-500">Tip: Download "diffuse" or "color" maps. Size: 512x512 to 1024x1024 pixels works best.</p>
        </div>
      </div>

      {/* Section Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSection('categories')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeSection === 'categories'
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Categories {categories.length > 0 && `(${categories.length})`}
        </button>
        <button
          onClick={() => setActiveSection('materials')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeSection === 'materials'
              ? 'bg-amber-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Materials {materials.length > 0 && `(${materials.length})`}
        </button>
      </div>

      {/* Empty State Warning */}
      {categories.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-700">
          <strong>Get Started:</strong> Create at least one category first (e.g., "Flooring"), then add materials to it.
        </div>
      )}

      {/* Categories Section */}
      {activeSection === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Form */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (English) *
                  </label>
                  <input
                    type="text"
                    value={categoryForm.category_name_en}
                    onChange={(e) => {
                      const name = e.target.value;
                      setCategoryForm({
                        ...categoryForm,
                        category_name_en: name,
                        category_slug: editingCategory ? categoryForm.category_slug : generateSlug(name)
                      });
                    }}
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
                    value={categoryForm.category_name_es}
                    onChange={(e) => setCategoryForm({ ...categoryForm, category_name_es: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={categoryForm.category_slug}
                    onChange={(e) => setCategoryForm({ ...categoryForm, category_slug: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 bg-gray-50"
                    placeholder="auto-generated"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <select
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    {iconOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={categoryForm.display_order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={categoryForm.is_enabled}
                      onChange={(e) => setCategoryForm({ ...categoryForm, is_enabled: e.target.checked })}
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
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingCategory ? 'Update' : 'Add Category')}
                </button>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={resetCategoryForm}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Categories List */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">
              Categories ({categories.length})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No categories yet.</p>
              ) : (
                categories.map((cat) => (
                  <div
                    key={cat.id}
                    className={`p-3 border rounded-lg flex justify-between items-center cursor-pointer transition-colors ${
                      selectedCategory?.id === cat.id
                        ? 'bg-amber-50 border-amber-300'
                        : cat.is_enabled ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 opacity-60'
                    }`}
                    onClick={() => setSelectedCategory(selectedCategory?.id === cat.id ? null : cat)}
                  >
                    <div>
                      <h4 className="font-medium">{cat.category_name_en}</h4>
                      <p className="text-sm text-gray-500">{cat.category_slug}</p>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEditCategory(cat)}
                        className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Materials Section */}
      {activeSection === 'materials' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Material Form */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingMaterial ? 'Edit Material' : 'Add Material'}
            </h3>
            <form onSubmit={handleSaveMaterial} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={materialForm.category_id}
                  onChange={(e) => setMaterialForm({ ...materialForm, category_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  required
                >
                  <option value="">Select category...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.category_name_en}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (English) *
                  </label>
                  <input
                    type="text"
                    value={materialForm.material_name_en}
                    onChange={(e) => setMaterialForm({ ...materialForm, material_name_en: e.target.value })}
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
                    value={materialForm.material_name_es}
                    onChange={(e) => setMaterialForm({ ...materialForm, material_name_es: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Material Code
                  </label>
                  <input
                    type="text"
                    value={materialForm.material_code}
                    onChange={(e) => setMaterialForm({ ...materialForm, material_code: e.target.value })}
                    placeholder="e.g., OAK-001"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={materialForm.color_hex}
                      onChange={(e) => setMaterialForm({ ...materialForm, color_hex: e.target.value })}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={materialForm.color_hex}
                      onChange={(e) => setMaterialForm({ ...materialForm, color_hex: e.target.value })}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Texture uploads */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Thumbnail Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setThumbnailFile(e.target.files[0])}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                  />
                  {editingMaterial?.thumbnail_url && !thumbnailFile && (
                    <p className="text-xs text-gray-500 mt-1">Current: {editingMaterial.thumbnail_url.split('/').pop()}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Texture Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setTextureFile(e.target.files[0])}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                  />
                  {editingMaterial?.texture_url && !textureFile && (
                    <p className="text-xs text-gray-500 mt-1">Current: {editingMaterial.texture_url.split('/').pop()}</p>
                  )}
                </div>
              </div>

              {/* PBR Properties */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Roughness ({materialForm.roughness})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={materialForm.roughness}
                    onChange={(e) => setMaterialForm({ ...materialForm, roughness: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Metalness ({materialForm.metalness})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={materialForm.metalness}
                    onChange={(e) => setMaterialForm({ ...materialForm, metalness: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Texture repeat */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repeat Scale X
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={materialForm.repeat_scale_x}
                    onChange={(e) => setMaterialForm({ ...materialForm, repeat_scale_x: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Repeat Scale Y
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={materialForm.repeat_scale_y}
                    onChange={(e) => setMaterialForm({ ...materialForm, repeat_scale_y: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Indicator
                  </label>
                  <select
                    value={materialForm.price_indicator}
                    onChange={(e) => setMaterialForm({ ...materialForm, price_indicator: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="$">$ (Budget)</option>
                    <option value="$$">$$ (Mid-range)</option>
                    <option value="$$$">$$$ (Premium)</option>
                    <option value="$$$$">$$$$ (Luxury)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={materialForm.display_order}
                    onChange={(e) => setMaterialForm({ ...materialForm, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="flex items-center pt-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={materialForm.is_enabled}
                      onChange={(e) => setMaterialForm({ ...materialForm, is_enabled: e.target.checked })}
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
                  className="flex-1 bg-amber-500 hover:bg-amber-600 py-2 rounded-lg font-medium disabled:opacity-50"
                  style={{ color:'black', boxShadow: '0 4px 6px rgba(82, 82, 82, 1)' }}

                >
                  {saving ? 'Saving...' : (editingMaterial ? 'Update' : 'Add Material')}
                </button>
                {editingMaterial && (
                  <button
                    type="button"
                    onClick={resetMaterialForm}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Materials List */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Materials ({materials.length})
              </h3>
              {selectedCategory && (
                <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  Filtering: {selectedCategory.category_name_en}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
              {materials.length === 0 ? (
                <p className="text-gray-500 text-center py-8 col-span-2">
                  {selectedCategory ? 'No materials in this category.' : 'No materials yet.'}
                </p>
              ) : (
                materials.map((mat) => (
                  <div
                    key={mat.id}
                    className={`p-3 border rounded-lg ${
                      mat.is_enabled ? 'bg-white' : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Thumbnail or color swatch */}
                      <div
                        className="w-16 h-16 rounded-lg flex-shrink-0 border overflow-hidden"
                        style={{ backgroundColor: mat.color_hex || '#ccc' }}
                      >
                        {mat.thumbnail_url && (
                          <img
                            src={mat.thumbnail_url.startsWith('http') ? mat.thumbnail_url : `${API_BASE}${mat.thumbnail_url}`}
                            alt={mat.material_name_en}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{mat.material_name_en}</h4>
                        <p className="text-xs text-gray-500">{mat.material_code || '-'}</p>
                        <p className="text-xs text-gray-400">{mat.price_indicator}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2 justify-end">
                      <button
                        onClick={() => handleEditMaterial(mat)}
                        className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMaterial(mat.id)}
                        className="text-red-600 hover:text-red-800 text-xs px-2 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialsTab;
