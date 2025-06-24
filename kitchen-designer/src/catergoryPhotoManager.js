import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Trash2, Edit2, Save, Image, GripVertical, X } from 'lucide-react';

const CategoryPhotoManager = () => {
  const [photos, setPhotos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('kitchen');
  const [uploading, setUploading] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null);

  const [isReordering, setIsReordering] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);

  // Extended categories for portfolio
  const categories = [
    { id: 'kitchen', name: 'Kitchen', icon: '🍳' },
    { id: 'bathroom', name: 'Bathroom', icon: '🚿' },
    { id: 'livingroom', name: 'Living Room', icon: '🛋️' },
    { id: 'bedroom', name: 'Bedroom', icon: '🛏️' },
    { id: 'laundryroom', name: 'Laundry Room', icon: '🧺' },
    { id: 'showcase', name: 'General Showcase', icon: '✨' }
  ];

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Use useCallback to avoid the dependency warning
  const loadPhotos = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/photos`);
      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
      }
    } catch (error) {
      // Fallback to localStorage
      const saved = localStorage.getItem('cabinetPhotos');
      if (saved) {
        setPhotos(JSON.parse(saved));
      }
    }
  }, [API_BASE]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handlePhotoUpload = async (e) => {
  const files = Array.from(e.target.files);
  if (files.length === 0) return;

  setUploading(true);
  console.log('Uploading to category:', selectedCategory); // Debug

  try {
    for (const file of files) {
      const formData = new FormData();
      
      // Create a custom filename that includes category info
      const customFilename = `${selectedCategory}_${file.name}`;
      
      // Append in correct order
      formData.append('category', selectedCategory);
      formData.append('title', file.name.split('.')[0]);
      formData.append('filename', customFilename);
      formData.append('photo', file);
      
      // Log FormData contents (for debugging)
      for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
      }
      
      const response = await fetch(`${API_BASE}/api/photos`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('Upload failed:', error);
      } else {
        const result = await response.json();
        console.log('Upload success:', result);
      }
    }
    
    await loadPhotos();
    alert(`${files.length} photos uploaded successfully to ${selectedCategory}!`);
  } catch (error) {
    console.error('Upload error:', error);
    alert('Failed to upload photos');
  } finally {
    setUploading(false);
    e.target.value = '';
  }
};

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedItem === null) return;

    const currentPhotos = photos.filter(p => p.category === selectedCategory);
    const draggedPhoto = currentPhotos[draggedItem];
    const newPhotos = [...currentPhotos];
    
    // Remove dragged item and insert at new position
    newPhotos.splice(draggedItem, 1);
    newPhotos.splice(dropIndex, 0, draggedPhoto);
    
    // Update display order
    const updatedCategoryPhotos = newPhotos.map((photo, index) => ({
      ...photo,
      display_order: index + 1
    }));
    
    // Update the main photos array
    const otherPhotos = photos.filter(p => p.category !== selectedCategory);
    setPhotos([...otherPhotos, ...updatedCategoryPhotos]);
    
    setDraggedItem(null);
    setHasOrderChanges(true);
  };

  // Save new order to server
 const saveOrder = async () => 
{
  const categoryPhotos = photos
    .filter(p => p.category === selectedCategory)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  
  const photoIds = categoryPhotos.map(p => p.id);

  try {
    const response = await fetch(`${API_BASE}/api/photos/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoIds })
    });

    console.log('Save response status:', response.status);

    // Log response text only if not 204
    if (response.status !== 204) {
      const text = await response.text();
      console.log('Save response text:', text);
    }

    if (response.ok || response.status === 204) {
      setHasOrderChanges(false);
      alert('Photo order saved successfully!');
      await loadPhotos();
    } else {
      alert(`Failed to save photo order (status ${response.status})`);
    }
  } catch (error) {
    console.error('Save order error:', error);
    alert('Failed to save photo order');
  }
};

  const updatePhotoCategory = async (photoId, newCategory) => {
    try {
      const response = await fetch(`${API_BASE}/api/photos/${photoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory })
      });
      
      if (response.ok) {
        await loadPhotos();
      }
    } catch (error) {
      // Fallback for demo
      const updatedPhotos = photos.map(p => 
        p.id === photoId ? { ...p, category: newCategory } : p
      );
      setPhotos(updatedPhotos);
      localStorage.setItem('cabinetPhotos', JSON.stringify(updatedPhotos));
    }
  };

  const deletePhoto = async (photoId) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/photos/${photoId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadPhotos();
      }
    } catch (error) {
      // Fallback for demo
      const updatedPhotos = photos.filter(p => p.id !== photoId);
      setPhotos(updatedPhotos);
      localStorage.setItem('cabinetPhotos', JSON.stringify(updatedPhotos));
    }
  };

  const updatePhotoTitle = async (photoId, newTitle) => {
    try {
      const response = await fetch(`${API_BASE}/api/photos/${photoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      });
      
      if (response.ok) {
        await loadPhotos();
        setEditingPhoto(null);
      }
    } catch (error) {
      // Fallback for demo
      const updatedPhotos = photos.map(p => 
        p.id === photoId ? { ...p, title: newTitle } : p
      );
      setPhotos(updatedPhotos);
      localStorage.setItem('cabinetPhotos', JSON.stringify(updatedPhotos));
      setEditingPhoto(null);
    }
  };

  // Group photos by category
  const photosByCategory = categories.reduce((acc, category) => {
    acc[category.id] = photos.filter(p => p.category === category.id);
    return acc;
  }, {});

  // Get photos for current category
  const currentPhotos = photos
    .filter(p => p.category === selectedCategory)
    .sort((a, b) => (a.display_order || 999) - (b.display_order || 999));

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Portfolio Photo Manager</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setIsReordering(!isReordering);
              if (isReordering && hasOrderChanges) {
                // Ask to save when exiting reorder mode
                if (window.confirm('Save the new photo order?')) {
                  saveOrder();
                } else {
                  loadPhotos(); // Reset changes
                  setHasOrderChanges(false);
                }
              }
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isReordering 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <GripVertical size={16} />
            {isReordering ? 'Done Reordering' : 'Reorder Photos'}
          </button>
          {hasOrderChanges && (
            <button
              onClick={saveOrder}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Save size={16} />
              Save Order
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 font-medium transition-all ${
              selectedCategory === category.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <span className="mr-2">{category.icon}</span>
            {category.name}
            <span className="ml-2 text-sm text-gray-500">
              ({photos.filter(p => p.category === category.id).length})
            </span>
          </button>
        ))}
      </div>

      {/* Instructions for reordering */}
      {isReordering && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Reordering Mode:</strong> Drag and drop photos to change their order. 
            Click "Save Order" when done.
          </p>
        </div>
      )}

      {/* Upload Section - Hide when reordering */}
      {!isReordering && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">
            Upload Photos to {categories.find(c => c.id === selectedCategory)?.name}
          </h3>
          <label className="block">
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors w-fit">
              <Upload size={20} />
              {uploading ? 'Uploading...' : 'Select Photos'}
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
          <p className="text-sm text-gray-600 mt-2">
            You can select multiple photos at once. They will be added to the {categories.find(c => c.id === selectedCategory)?.name} category.
          </p>
        </div>
      )}

      {/* Current Category Photos */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">
          {categories.find(c => c.id === selectedCategory)?.name} Photos ({currentPhotos.length})
        </h3>
        
        {currentPhotos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Image size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">No photos in this category yet.</p>
            <p className="text-sm text-gray-400 mt-1">Upload some photos to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className={`border rounded-lg overflow-hidden group relative ${
                  isReordering ? 'cursor-move' : ''
                } ${draggedItem === index ? 'opacity-50' : ''}`}
                draggable={isReordering}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                {/* Order number badge */}
                <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs z-10">
                  #{index + 1}
                </div>

                {/* Drag handle - visible in reorder mode */}
                {isReordering && (
                  <div className="absolute top-2 right-2 z-10 bg-white bg-opacity-90 p-1 rounded">
                    <GripVertical size={16} className="text-gray-600" />
                  </div>
                )}

                <img
                  src={`${API_BASE}${photo.thumbnail || photo.full || photo.url}`}
                  alt={photo.title}
                  className="w-full h-40 object-cover"
                  draggable={false}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'placeholder.jpg';
                  }}
                />
                
                <div className="p-3">
                  {editingPhoto === photo.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={photo.title}
                        onChange={(e) => {
                          const updated = photos.map(p =>
                            p.id === photo.id ? { ...p, title: e.target.value } : p
                          );
                          setPhotos(updated);
                        }}
                        className="flex-1 px-2 py-1 border rounded text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => updatePhotoTitle(photo.id, photo.title)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => setEditingPhoto(null)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm truncate flex-1">{photo.title}</h4>
                      {!isReordering && (
                        <button
                          onClick={() => setEditingPhoto(photo.id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                  
                  {/* Category selector and delete button - hidden during reordering */}
                  {!isReordering && (
                    <div className="mt-2 flex items-center justify-between">
                      <select
                        value={photo.category}
                        onChange={(e) => updatePhotoCategory(photo.id, e.target.value)}
                        className="text-xs px-2 py-1 border rounded"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => deletePhoto(photo.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Overview */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Category Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map(category => (
            <div key={category.id} className="bg-white p-3 rounded border">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {category.icon} {category.name}
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  {photosByCategory[category.id]?.length || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">How it works:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Photos are automatically displayed in the portfolio carousel</li>
          <li>The order shown here (1, 2, 3...) is the order they'll appear in the slideshow</li>
          <li>You can move photos between categories using the dropdown</li>
          <li>Upload multiple photos at once by selecting them in the file dialog</li>
          <li>Changes are saved automatically and will appear on website immediately</li>
        </ul>
      </div>
    </div>
  );
};

export default CategoryPhotoManager;