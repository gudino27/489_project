import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import translations from '../../utils/translations';
import MaterialsTab from './showroom/MaterialsTab';
import SwappableElementsTab from './showroom/SwappableElementsTab';

// ShowroomManager Component
// Admin interface for managing the virtual 360° showroom
const ShowroomManager = ({ token, API_BASE }) => {
  const { language } = useLanguage();
  const t = translations[language]?.admin?.showroom || translations.en?.admin?.showroom || {};

  // State
  const [activeTab, setActiveTab] = useState('rooms');
  const [rooms, setRooms] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Room form state
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomForm, setRoomForm] = useState({
    room_name_en: '',
    room_name_es: '',
    room_description_en: '',
    room_description_es: '',
    image_360_url: '',
    category: 'showroom',
    is_enabled: true,
    is_starting_room: false,
    default_yaw: 0,
    default_pitch: 0,
    default_hfov: 100
  });
  const [panoramaFile, setPanoramaFile] = useState(null);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [roomsRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE}/api/showroom/admin/rooms`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE}/api/showroom/admin/settings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(roomsData);
      }
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
      }
    } catch (error) {
      console.error('Error fetching showroom data:', error);
      setMessage({ type: 'error', text: 'Failed to load showroom data' });
    } finally {
      setLoading(false);
    }
  }, [API_BASE, token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Save room
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Validate: require file for new rooms, optional for updates
      if (!editingRoom && !panoramaFile) {
        setMessage({ type: 'error', text: 'Please upload a 360° panorama image' });
        setSaving(false);
        return;
      }

      const url = editingRoom
        ? `${API_BASE}/api/showroom/admin/rooms/${editingRoom.id}`
        : `${API_BASE}/api/showroom/admin/rooms`;

      const method = editingRoom ? 'PUT' : 'POST';

      // Use FormData for file upload
      const formData = new FormData();
      formData.append('room_name_en', roomForm.room_name_en);
      formData.append('room_name_es', roomForm.room_name_es);
      formData.append('room_description_en', roomForm.room_description_en || '');
      formData.append('room_description_es', roomForm.room_description_es || '');
      formData.append('category', roomForm.category);
      formData.append('is_enabled', roomForm.is_enabled);
      formData.append('is_starting_room', roomForm.is_starting_room);
      formData.append('default_yaw', roomForm.default_yaw);
      formData.append('default_pitch', roomForm.default_pitch);
      formData.append('default_hfov', roomForm.default_hfov);

      // Add file if selected
      if (panoramaFile) {
        formData.append('image360', panoramaFile);
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setMessage({ type: 'success', text: editingRoom ? 'Room updated!' : 'Room created!' });
        setEditingRoom(null);
        setRoomForm({
          room_name_en: '',
          room_name_es: '',
          room_description_en: '',
          room_description_es: '',
          image_360_url: '',
          category: 'showroom',
          is_enabled: true,
          is_starting_room: false,
          default_yaw: 0,
          default_pitch: 0,
          default_hfov: 100
        });
        setPanoramaFile(null);
        fetchData();
      } else {
        throw new Error('Failed to save room');
      }
    } catch (error) {
      console.error('Error saving room:', error);
      setMessage({ type: 'error', text: 'Failed to save room' });
    } finally {
      setSaving(false);
    }
  };

  // Delete room
  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/showroom/admin/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Room deleted!' });
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting room:', error);
      setMessage({ type: 'error', text: 'Failed to delete room' });
    }
  };

  // Edit room
  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setPanoramaFile(null); // Clear any previously selected file
    setRoomForm({
      room_name_en: room.room_name_en || '',
      room_name_es: room.room_name_es || '',
      room_description_en: room.room_description_en || '',
      room_description_es: room.room_description_es || '',
      image_360_url: room.image_360_url || '',
      category: room.category || 'showroom',
      is_enabled: room.is_enabled !== false,
      is_starting_room: room.is_starting_room || false,
      default_yaw: room.default_yaw || 0,
      default_pitch: room.default_pitch || 0,
      default_hfov: room.default_hfov || 100
    });
  };

  // Save settings
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/showroom/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved!' });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {t.title || 'Virtual Showroom Manager'}
      </h2>

      {/* Message */}
      {message.text && (
        <div className={`mb-4 p-3 rounded-lg ${
          message.type === 'success'
            ? 'bg-green-100 text-green-700 border border-green-300'
            : 'bg-red-100 text-red-700 border border-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'rooms'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.roomsTab || 'Rooms'}
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'settings'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.settingsTab || 'Settings'}
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'materials'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.materialsTab || 'Materials'}
        </button>
        <button
          onClick={() => setActiveTab('elements')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'elements'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {t.elementsTab || 'Swappable Elements'}
        </button>
        <button
          onClick={() => setActiveTab('guide')}
          className={`px-4 py-2 font-medium ${
            activeTab === 'guide'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Setup Guide
        </button>
      </div>

      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Room Form */}
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <h3 className="text-lg font-semibold text-gray-800">
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </h3>
              {!editingRoom && (
                <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  Fill form below
                </span>
              )}
            </div>
            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name (English) *
                  </label>
                  <input
                    type="text"
                    value={roomForm.room_name_en}
                    onChange={(e) => setRoomForm({ ...roomForm, room_name_en: e.target.value })}
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
                    value={roomForm.room_name_es}
                    onChange={(e) => setRoomForm({ ...roomForm, room_name_es: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  360° Panorama Image {!editingRoom && '*'}
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={(e) => setPanoramaFile(e.target.files[0])}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Equirectangular format (2:1 ratio), JPEG/PNG/WebP, max 50MB
                </p>
                {editingRoom && editingRoom.image_360_url && !panoramaFile && (
                  <div className="mt-2 flex items-center gap-2">
                    <img
                      src={editingRoom.thumbnail_url
                        ? (editingRoom.thumbnail_url.startsWith('http') ? editingRoom.thumbnail_url : `${API_BASE}${editingRoom.thumbnail_url}`)
                        : (editingRoom.image_360_url.startsWith('http') ? editingRoom.image_360_url : `${API_BASE}${editingRoom.image_360_url}`)
                      }
                      alt="Current panorama"
                      className="w-24 h-12 object-cover rounded border"
                    />
                    <span className="text-xs text-gray-500">Current image (upload new to replace)</span>
                  </div>
                )}
                {panoramaFile && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-amber-600">{panoramaFile.name}</span>
                    <button
                      type="button"
                      onClick={() => setPanoramaFile(null)}
                      className="text-red-500 hover:text-red-700 text-xs"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (EN)
                  </label>
                  <textarea
                    value={roomForm.room_description_en}
                    onChange={(e) => setRoomForm({ ...roomForm, room_description_en: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (ES)
                  </label>
                  <textarea
                    value={roomForm.room_description_es}
                    onChange={(e) => setRoomForm({ ...roomForm, room_description_es: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                    rows={2}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    value={roomForm.category}
                    onChange={(e) => setRoomForm({ ...roomForm, category: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="showroom">Showroom</option>
                    <option value="workshop">Workshop</option>
                    <option value="gallery">Gallery</option>
                  </select>
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={roomForm.is_enabled}
                      onChange={(e) => setRoomForm({ ...roomForm, is_enabled: e.target.checked })}
                      className="rounded text-amber-500"
                    />
                    <span className="text-sm">Enabled</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={roomForm.is_starting_room}
                      onChange={(e) => setRoomForm({ ...roomForm, is_starting_room: e.target.checked })}
                      className="rounded text-amber-500"
                    />
                    <span className="text-sm">Start Room</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 py-3 rounded-lg font-semibold text-lg disabled:opacity-50 shadow-md"
                  style={{ color:'black', boxShadow: '0 4px 6px rgba(82, 82, 82, 1)' }}
                >
                  {saving ? 'Saving...' : (editingRoom ? 'Update Room' : '+ Add Room')}
                </button>
                {editingRoom && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRoom(null);
                      setRoomForm({
                        room_name_en: '',
                        room_name_es: '',
                        room_description_en: '',
                        room_description_es: '',
                        image_360_url: '',
                        category: 'showroom',
                        is_enabled: true,
                        is_starting_room: false,
                        default_yaw: 0,
                        default_pitch: 0,
                        default_hfov: 100
                      });
                      setPanoramaFile(null);
                    }}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Rooms List */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-4">
              Rooms ({rooms.length})
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {rooms.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No rooms yet. Add your first room!</p>
              ) : (
                rooms.map((room) => (
                  <div
                    key={room.id}
                    className={`p-3 border rounded-lg ${
                      room.is_enabled ? 'bg-white' : 'bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      {(room.thumbnail_url || room.image_360_url) && (
                        <img
                          src={(room.thumbnail_url || room.image_360_url).startsWith('http')
                            ? (room.thumbnail_url || room.image_360_url)
                            : `${API_BASE}${room.thumbnail_url || room.image_360_url}`
                          }
                          alt={room.room_name_en}
                          className="w-20 h-10 object-cover rounded border flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{room.room_name_en}</h4>
                            <p className="text-sm text-gray-500">{room.category}</p>
                            {room.is_starting_room && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                                Starting Room
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditRoom(room)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteRoom(room.id)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && settings && (
        <div className="bg-white rounded-lg border p-6 max-w-2xl">
          <h3 className="text-lg font-semibold mb-4">Showroom Settings</h3>
          <div className="space-y-4">
            {/* Visibility Toggle - Primary Setting */}
            <div className={`p-4 rounded-lg border-2 ${settings.showroom_visible ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-300'}`}>
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-medium text-gray-800">Show Showroom in Navigation</span>
                  <p className="text-sm text-gray-500 mt-1">
                    {settings.showroom_visible
                      ? 'Showroom tab is visible to visitors'
                      : 'Showroom tab is hidden from visitors (you can still configure it here)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, showroom_visible: !settings.showroom_visible })}
                  className={`relative w-14 h-8 rounded-full transition-colors duration-200 ${settings.showroom_visible ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${settings.showroom_visible ? 'translate-x-6' : 'translate-x-0'}`}
                  ></span>
                </button>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Welcome Message (EN)
                </label>
                <input
                  type="text"
                  value={settings.welcome_message_en || ''}
                  onChange={(e) => setSettings({ ...settings, welcome_message_en: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Welcome Message (ES)
                </label>
                <input
                  type="text"
                  value={settings.welcome_message_es || ''}
                  onChange={(e) => setSettings({ ...settings, welcome_message_es: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Navigation Style
              </label>
              <select
                value={settings.navigation_style || 'dropdown'}
                onChange={(e) => setSettings({ ...settings, navigation_style: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="dropdown">Dropdown</option>
                <option value="arrows">Arrows</option>
                <option value="minimap">Minimap</option>
              </select>
            </div>

            {/* Three.js Viewer Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <span className="font-medium text-green-800">Three.js Viewer Active</span>
                  <p className="text-sm text-green-600 mt-1">
                    The showroom uses Three.js for 360° viewing with material swapping.
                    Visitors can click on customizable surfaces to change materials and finishes.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.vr_mode_enabled}
                  onChange={(e) => setSettings({ ...settings, vr_mode_enabled: e.target.checked })}
                  className="rounded text-amber-500"
                />
                <span>VR Mode Enabled</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.auto_rotate_enabled}
                  onChange={(e) => setSettings({ ...settings, auto_rotate_enabled: e.target.checked })}
                  className="rounded text-amber-500"
                />
                <span>Auto Rotate</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.show_compass}
                  onChange={(e) => setSettings({ ...settings, show_compass: e.target.checked })}
                  className="rounded text-amber-500"
                />
                <span>Show Compass</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.show_zoom_controls}
                  onChange={(e) => setSettings({ ...settings, show_zoom_controls: e.target.checked })}
                  className="rounded text-amber-500"
                />
                <span>Show Zoom Controls</span>
              </label>
            </div>

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-amber-500 hover:bg-amber-600  py-2 rounded-lg font-medium z-index-50 disabled:opacity-50 px-6 mt-4"
              style={{ color:'black', boxShadow: '0 4px 6px rgba(82, 82, 82, 1)' }}
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <MaterialsTab
          token={token}
          API_BASE={API_BASE}
          language={language}
        />
      )}

      {/* Swappable Elements Tab */}
      {activeTab === 'elements' && (
        <SwappableElementsTab
          token={token}
          API_BASE={API_BASE}
          language={language}
          rooms={rooms}
        />
      )}

      {/* Setup Guide Tab */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          {/* Demo Data Controls */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-amber-800 mb-3">Quick Start Demo</h3>
            <p className="text-amber-700 mb-4">
              Load sample data with 3DVista demo panoramas to test the virtual showroom features.
              This will create rooms, materials, and swappable elements automatically.
            </p>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!window.confirm('This will create demo rooms, materials, and elements. Continue?')) return;
                  setSaving(true);
                  try {
                    const response = await fetch(`${API_BASE}/api/showroom/admin/seed-demo`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (response.ok) {
                      setMessage({ type: 'success', text: `Demo data created: ${data.data.rooms} rooms, ${data.data.materials} materials, ${data.data.elements} elements` });
                      fetchData();
                    } else {
                      throw new Error(data.error);
                    }
                  } catch (error) {
                    setMessage({ type: 'error', text: error.message });
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                {saving ? 'Loading...' : 'Load Demo Data'}
              </button>
              <button
                onClick={async () => {
                  if (!window.confirm('This will DELETE all showroom data (rooms, materials, elements). Are you sure?')) return;
                  setSaving(true);
                  try {
                    const response = await fetch(`${API_BASE}/api/showroom/admin/clear-demo`, {
                      method: 'DELETE',
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (response.ok) {
                      setMessage({ type: 'success', text: 'All showroom data cleared' });
                      fetchData();
                    }
                  } catch (error) {
                    setMessage({ type: 'error', text: 'Failed to clear data' });
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50"
              >
                Clear All Data
              </button>
            </div>
          </div>

          {/* Material Swapping Workflow Overview */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-800 mb-4">Material Swapping: How It Works</h3>
            <p className="text-blue-700 mb-4">
              The material swapping feature lets visitors customize finishes in your 360° showroom.
              Here's the complete workflow:
            </p>

            {/* Visual Workflow */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              <div className="bg-white rounded-lg p-3 border-2 border-blue-300 text-center min-w-[120px]">
                <div className="text-2xl mb-1">1. Rooms</div>
                <div className="text-xs text-gray-600">Upload 360° panoramas</div>
              </div>
              <div className="text-blue-400 text-2xl">→</div>
              <div className="bg-white rounded-lg p-3 border-2 border-green-300 text-center min-w-[120px]">
                <div className="text-2xl mb-1">2. Materials</div>
                <div className="text-xs text-gray-600">Create finishes/textures</div>
              </div>
              <div className="text-blue-400 text-2xl">→</div>
              <div className="bg-white rounded-lg p-3 border-2 border-purple-300 text-center min-w-[120px]">
                <div className="text-2xl mb-1">3. Elements</div>
                <div className="text-xs text-gray-600">Define swappable regions</div>
              </div>
              <div className="text-blue-400 text-2xl">→</div>
              <div className="bg-white rounded-lg p-3 border-2 border-amber-300 text-center min-w-[120px]">
                <div className="text-2xl mb-1">4. Link</div>
                <div className="text-xs text-gray-600">Connect materials to regions</div>
              </div>
            </div>

            <div className="bg-white/50 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-medium mb-2">Quick Summary:</p>
              <ol className="list-decimal ml-5 space-y-1">
                <li><strong>Rooms tab:</strong> Add a room with a 360° panorama image</li>
                <li><strong>Materials tab:</strong> Create categories (Flooring, Countertops, etc.) then add materials with colors/textures</li>
                <li><strong>Swappable Elements tab:</strong> Define which regions of the panorama can be customized (floor area, wall, countertop)</li>
                <li><strong>Link materials:</strong> Connect materials to elements so visitors can swap them</li>
              </ol>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="bg-white rounded-lg border p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Detailed Setup Guide</h3>

            {/* Step 1 */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-2">
                <span className="bg-amber-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">1</span>
                Create 360° Panorama Images
              </h4>
              <div className="ml-9 text-gray-600 space-y-2">
                <p className="font-medium">Equipment Options:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li><strong>Smartphone Apps (Free):</strong> Google Street View, Panorama 360</li>
                  <li><strong>360° Cameras ($250-$1000):</strong> Ricoh Theta, Insta360 ONE X3</li>
                  <li><strong>DSLR + Panoramic Head:</strong> Best quality, requires stitching software</li>
                  <li><strong>3D Rendering:</strong> Blender, SketchUp with 360° render settings</li>
                </ul>
                <p className="mt-3 font-medium">Image Requirements:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li>Format: Equirectangular projection (2:1 aspect ratio)</li>
                  <li>Resolution: Minimum 4096x2048, recommended 8192x4096</li>
                  <li>File type: JPEG or PNG</li>
                  <li>File size: Keep under 15MB for optimal loading</li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-2">
                <span className="bg-amber-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">2</span>
                Add Showroom Rooms
              </h4>
              <div className="ml-9 text-gray-600">
                <p>In the <strong>Rooms</strong> tab:</p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Add room name in English and Spanish</li>
                  <li>Upload or link your 360° panorama image</li>
                  <li>Set one room as the "Starting Room"</li>
                  <li>Adjust default view angles (yaw, pitch, field of view)</li>
                </ul>
              </div>
            </div>

            {/* Step 3 */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-2">
                <span className="bg-amber-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">3</span>
                Create Material Categories & Materials
              </h4>
              <div className="ml-9 text-gray-600">
                <p>In the <strong>Materials</strong> tab:</p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Create categories (Flooring, Countertops, Cabinet Finishes, etc.)</li>
                  <li>Add materials with colors, textures, and pricing indicators</li>
                  <li>Upload texture images for realistic material appearance</li>
                </ul>
              </div>
            </div>

            {/* Step 4 */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-2">
                <span className="bg-amber-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">4</span>
                Define Swappable Elements
              </h4>
              <div className="ml-9 text-gray-600">
                <p>In the <strong>Swappable Elements</strong> tab:</p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Select a room to add elements to</li>
                  <li>Name the element (e.g., "Floor", "Countertop", "Left Wall")</li>
                  <li>Use preset buttons or draw the region on the panorama</li>
                  <li>Link materials that can be applied to this element</li>
                </ul>
                <div className="mt-3 bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium text-gray-700 mb-2">Understanding UV Bounds:</p>
                  <p className="text-sm">UV coordinates range from 0 to 1, where (0,0) is top-left and (1,1) is bottom-right of the panorama image.</p>
                  <div className="mt-2 text-sm">
                    <p><strong>Example - Floor:</strong> minU: 0, maxU: 1, minV: 0.65, maxV: 0.95</p>
                    <p><strong>Example - Left Wall:</strong> minU: 0, maxU: 0.25, minV: 0.2, maxV: 0.65</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-700 flex items-center gap-2 mb-2">
                <span className="bg-amber-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm">5</span>
                Test Your Showroom
              </h4>
              <div className="ml-9 text-gray-600">
                <p>Visit <strong>/showroom</strong> on your website to test the virtual tour.</p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li>Click and drag to look around</li>
                  <li>Scroll to zoom in/out</li>
                  <li>Click on highlighted surfaces to change materials</li>
                  <li>Use hotspots to navigate between rooms</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Pro Tips</h3>
            <ul className="text-blue-700 space-y-2">
              <li>• Use a tripod at eye level (5-6 feet) for best results</li>
              <li>• Capture panoramas during consistent lighting conditions</li>
              <li>• For seamless textures, use 512x512 or 1024x1024 tileable images</li>
              <li>• Test on both desktop and mobile devices</li>
              <li>• Keep the number of swappable elements reasonable (3-5 per room) for performance</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowroomManager;
