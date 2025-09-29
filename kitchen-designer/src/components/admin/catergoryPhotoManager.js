import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Trash2, Edit2, Save, Image, GripVertical, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const CategoryPhotoManager = ({ token, API_BASE }) => { // Add token and API_BASE as props
  const { t } = useLanguage();
  const [photos, setPhotos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('kitchen');
  const [uploading, setUploading] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null);

  const [isReordering, setIsReordering] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);

  // Extended categories for portfolio
  const categories = [
    { id: 'kitchen', name: t('categories.kitchen'), icon: '🍳' },
    { id: 'bathroom', name: t('categories.bathroom'), icon: '🚿' },
    { id: 'livingroom', name: t('categories.livingRoom'), icon: '🛋️' },
    { id: 'bedroom', name: t('categories.bedroom'), icon: '🛏️' },
    { id: 'laundryroom', name: t('categories.laundryRoom'), icon: '🧺' },
    { id: 'showcase', name: t('categories.showcase'), icon: '✨' }
  ];

  // Use API_BASE from props or fallback
  const apiBase = API_BASE || process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Create headers with authentication
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${token}`
  });

  const getAuthHeadersJson = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  // Use useCallback to avoid the dependency warning
  const loadPhotos = useCallback(async () => {
    if (!token) {
      console.warn('No token available for photo loading');
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/photos`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setPhotos(data);
      } else if (response.status === 401) {
        console.error('Authentication failed - token may be expired');
      } else {
        console.error('Failed to load photos:', response.status);
      }
    } catch (error) {
      console.error('Error loading photos:', error);
      // Fallback to localStorage only if network error
      const saved = localStorage.getItem('cabinetPhotos');
      if (saved) {
        setPhotos(JSON.parse(saved));
      }
    }
  }, [apiBase, token]);

  useEffect(() => {
    if (token) {
      loadPhotos();
    }
  }, [loadPhotos, token]);

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (!token) {
      alert('Authentication required for photo upload');
      return;
    }

    setUploading(true);
    console.log('Uploading to category:', selectedCategory);

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

        const response = await fetch(`${apiBase}/api/photos`, {
          method: 'POST',
          headers: getAuthHeaders(), // Add auth headers
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Upload failed:', error);
          if (response.status === 401) {
            alert('Authentication failed - please log in again');
            return;
          }
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
  const saveOrder = async () => {
    if (!token) {
      alert('Authentication required');
      return;
    }

    const categoryPhotos = photos
      .filter(p => p.category === selectedCategory)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    const photoIds = categoryPhotos.map(p => p.id);

    try {
      const response = await fetch(`${apiBase}/api/photos/reorder`, {
        method: 'PUT',
        headers: getAuthHeadersJson(), // Add auth headers
        body: JSON.stringify({ photoIds })
      });

      console.log('Save response status:', response.status);

      if (response.ok || response.status === 204) {
        setHasOrderChanges(false);
        alert('Photo order saved successfully!');
        await loadPhotos();
      } else if (response.status === 401) {
        alert('Authentication failed - please log in again');
      } else {
        alert(`Failed to save photo order (status ${response.status})`);
      }
    } catch (error) {
      console.error('Save order error:', error);
      alert('Failed to save photo order');
    }
  };

  const updatePhotoCategory = async (photoId, newCategory) => {
    if (!token) {
      alert('Authentication required');
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/photos/${photoId}`, {
        method: 'PUT',
        headers: getAuthHeadersJson(), // Add auth headers
        body: JSON.stringify({ category: newCategory })
      });

      if (response.ok) {
        await loadPhotos();
      } else if (response.status === 401) {
        alert('Authentication failed - please log in again');
      }
    } catch (error) {
      console.error('Error updating photo category:', error);
      // Fallback for demo
      const updatedPhotos = photos.map(p =>
        p.id === photoId ? { ...p, category: newCategory } : p
      );
      setPhotos(updatedPhotos);
      localStorage.setItem('cabinetPhotos', JSON.stringify(updatedPhotos));
    }
  };

  const deletePhoto = async (photoId) => {
    if (!window.confirm(t('photoManager.deleteConfirm'))) return;

    if (!token) {
      alert('Authentication required');
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/photos/${photoId}`, {
        method: 'DELETE',
        headers: getAuthHeaders() // Add auth headers
      });

      if (response.ok) {
        await loadPhotos();
      } else if (response.status === 401) {
        alert('Authentication failed - please log in again');
      }
    } catch (error) {
      console.error('Error deleting photo:', error);
      // Fallback for demo
      const updatedPhotos = photos.filter(p => p.id !== photoId);
      setPhotos(updatedPhotos);
      localStorage.setItem('cabinetPhotos', JSON.stringify(updatedPhotos));
    }
  };

  const updatePhotoTitle = async (photoId, newTitle) => {
    if (!token) {
      alert('Authentication required');
      return;
    }

    try {
      const response = await fetch(`${apiBase}/api/photos/${photoId}`, {
        method: 'PUT',
        headers: getAuthHeadersJson(), // Add auth headers
        body: JSON.stringify({ title: newTitle })
      });

      if (response.ok) {
        await loadPhotos();
        setEditingPhoto(null);
      } else if (response.status === 401) {
        alert('Authentication failed - please log in again');
      }
    } catch (error) {
      console.error('Error updating photo title:', error);
      // Fallback for demo
      const updatedPhotos = photos.map(p =>
        p.id === photoId ? { ...p, title: newTitle } : p
      );
      setPhotos(updatedPhotos);
      localStorage.setItem('cabinetPhotos', JSON.stringify(updatedPhotos));
      setEditingPhoto(null);
    }
  };

  // Show loading or no token message
  if (!token) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center py-12">
          <div className="text-gray-500 mb-3">{t('photoManager.authRequired')}</div>
          <p className="text-sm text-gray-400">{t('photoManager.loginToManage')}</p>
        </div>
      </div>
    );
  }

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
        <h2 className="text-2xl font-bold">{t('photoManager.title')}</h2>
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${isReordering
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            <GripVertical size={16} />
            {isReordering ? t('photoManager.doneReordering') : t('photoManager.reorderPhotos')}
          </button>
          {hasOrderChanges && (
            <button
              onClick={saveOrder}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Save size={16} />
              {t('photoManager.saveOrder')}
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
            className={`px-4 py-2 font-medium transition-all ${selectedCategory === category.id
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
            <strong>{t('photoManager.reorderingMode')}</strong> {t('photoManager.dragDropInstructions')}
          </p>
        </div>
      )}

      {/* Upload Section - Hide when reordering */}
      {!isReordering && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">
            {t('photoManager.uploadTo')} {categories.find(c => c.id === selectedCategory)?.name}
          </h3>
          <label className="inline-block">
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors ">
              <Upload size={20} />
              {uploading ? t('photoManager.uploading') : t('photoManager.selectPhotos')}
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
            {t('photoManager.multiplePhotos')} {categories.find(c => c.id === selectedCategory)?.name} {t('photoManager.category')}
          </p>
        </div>
      )}

      {/* Current Category Photos */}
      <div className="mb-5">
        <h3 className="text-lg font-semibold mb-3">
          {categories.find(c => c.id === selectedCategory)?.name} Photos ({currentPhotos.length})
        </h3>

        {currentPhotos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Image size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">{t('photoManager.noPhotos')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('photoManager.getStarted')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className={`border rounded-lg overflow-hidden group relative ${isReordering ? 'cursor-move' : ''
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
                  src={`${apiBase}${photo.thumbnail || photo.full || photo.url}`}
                  alt={photo.title}
                  className="w-full h-40 object-cover"
                  draggable={false}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'placeholder.jpg';
                  }}
                />

                <div className="p-2">
                  {editingPhoto === photo.id ? (
                    <div className="items-center gap-1">
                      <input
                        type="text"
                        value={photo.title}
                        onChange={(e) => {
                          const updated = photos.map(p =>
                            p.id === photo.id ? { ...p, title: e.target.value } : p
                          );
                          setPhotos(updated);
                        }}
                        className="rounded text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => updatePhotoTitle(photo.id, photo.title)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                        style={{ minHeight: '44px', minWidth: '44px' }}
                        title={t('photoManager.saveChanges') || 'Save changes'}
                      >
                        <Save size={16} />
                      </button>
                      <button
                        onClick={() => setEditingPhoto(null)}
                        className=" text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        style={{ minHeight: '44px', minWidth: '44px' }}
                        title={t('photoManager.cancel') || 'Cancel'}
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
                          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          style={{ minHeight: '44px', minWidth: '44px' }}
                          title={t('photoManager.editPhoto') || 'Edit photo'}
                        >
                          <Edit2 size={16} />
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
                        className="text-xs px-1 py-1 border rounded"
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => deletePhoto(photo.id)}
                        className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        style={{ minHeight: '44px', minWidth: '44px' }}
                        title={t('photoManager.deletePhoto') || 'Delete photo'}
                      >
                        <Trash2 size={18} />
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
        <h3 className="text-lg font-semibold mb-3">{t('photoManager.categoryOverview')}</h3>
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
        <h4 className="font-semibold text-blue-900 mb-2">{t('photoManager.howItWorks')}</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>{t('photoManager.instruction1')}</li>
          <li>{t('photoManager.instruction2')}</li>
          <li>{t('photoManager.instruction3')}</li>
          <li>{t('photoManager.instruction4')}</li>
          <li>{t('photoManager.instruction5')}</li>
        </ul>
      </div>
    </div>
  );
};

export default CategoryPhotoManager;