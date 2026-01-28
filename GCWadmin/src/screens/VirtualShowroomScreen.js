import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Image,
  Modal,
  Alert,
  FlatList,
  Switch,
} from 'react-native';
import {
  Eye,
  Settings as SettingsIcon,
  Palette,
  Layers,
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  Link as LinkIcon,
} from 'lucide-react-native';
import { ContentGlass } from '../components/GlassView';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import * as showroomApi from '../api/showroom';

const TABS = [
  { id: 'rooms', label: 'Rooms', IconComponent: Eye },
  { id: 'settings', label: 'Settings', IconComponent: SettingsIcon },
  { id: 'materials', label: 'Materials', IconComponent: Palette },
  { id: 'swappable', label: 'Swappable', IconComponent: Layers },
  { id: 'guide', label: 'Setup Guide', IconComponent: BookOpen },
];

const CATEGORY_ICONS = [
  { value: 'palette', label: 'Palette' },
  { value: 'floor', label: 'Floor' },
  { value: 'wall', label: 'Wall' },
  { value: 'counter', label: 'Counter' },
  { value: 'cabinet', label: 'Cabinet' },
  { value: 'tile', label: 'Tile' },
  { value: 'wood', label: 'Wood' },
  { value: 'stone', label: 'Stone' },
];

const ELEMENT_TYPES = [
  { value: 'surface', label: 'Surface (floor, wall, counter)' },
  { value: 'cabinet', label: 'Cabinet' },
  { value: 'fixture', label: 'Fixture (sink, faucet)' },
  { value: 'accessory', label: 'Accessory' },
];

const PRICE_INDICATORS = [
  { value: '$', label: '$ (Budget)' },
  { value: '$$', label: '$$ (Mid-range)' },
  { value: '$$$', label: '$$$ (Premium)' },
  { value: '$$$$', label: '$$$$ (Luxury)' },
];

const UV_PRESETS = [
  {
    id: 'floor',
    label: 'Floor',
    nameEn: 'Floor',
    nameEs: 'Piso',
    bounds: { minU: 0, maxU: 1, minV: 0.6, maxV: 0.95 },
    color: COLORS.warningMedium,
  },
  {
    id: 'left_wall',
    label: 'Left Wall',
    nameEn: 'Left Wall',
    nameEs: 'Pared Izquierda',
    bounds: { minU: 0, maxU: 0.3, minV: 0.2, maxV: 0.6 },
    color: COLORS.info,
  },
  {
    id: 'center_wall',
    label: 'Center Wall',
    nameEn: 'Center Wall',
    nameEs: 'Pared Central',
    bounds: { minU: 0.3, maxU: 0.7, minV: 0.2, maxV: 0.6 },
    color: COLORS.successMedium,
  },
  {
    id: 'right_wall',
    label: 'Right Wall',
    nameEn: 'Right Wall',
    nameEs: 'Pared Derecha',
    bounds: { minU: 0.7, maxU: 1, minV: 0.2, maxV: 0.6 },
    color: '#a855f7',
  },
  {
    id: 'countertop',
    label: 'Countertop',
    nameEn: 'Countertop',
    nameEs: 'Encimera',
    bounds: { minU: 0.25, maxU: 0.75, minV: 0.45, maxV: 0.6 },
    color: '#ec4899',
  },
];

const VirtualShowroomScreen = () => {
  const { t } = useLanguage();
  const { token } = useAuth();

  // Navigation
  const [activeTab, setActiveTab] = useState('rooms');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Rooms state
  const [rooms, setRooms] = useState([]);
  const [editingRoom, setEditingRoom] = useState(null);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomForm, setRoomForm] = useState({
    room_name_en: '',
    room_name_es: '',
    room_description_en: '',
    room_description_es: '',
    category: 'showroom',
    is_enabled: true,
    is_starting_room: false,
    default_yaw: 0,
    default_pitch: 0,
    default_hfov: 100,
  });

  // Settings state
  const [settings, setSettings] = useState(null);

  // Materials state
  const [categories, setCategories] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [materialsSection, setMaterialsSection] = useState('categories'); // 'categories' or 'materials'
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    category_name_en: '',
    category_name_es: '',
    category_slug: '',
    icon: 'palette',
    display_order: 0,
    is_enabled: true,
  });
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
    display_order: 0,
  });

  // Swappable Elements state
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [elements, setElements] = useState([]);
  const [editingElement, setEditingElement] = useState(null);
  const [showElementModal, setShowElementModal] = useState(false);
  const [elementForm, setElementForm] = useState({
    room_id: '',
    element_name_en: '',
    element_name_es: '',
    element_type: 'surface',
    uv_bounds: { minU: 0.3, maxU: 0.7, minV: 0.3, maxV: 0.7 },
    highlight_color: '#f59e0b',
    default_material_id: '',
    is_enabled: true,
    display_order: 0,
  });
  const [linkingElement, setLinkingElement] = useState(null);
  const [selectedMaterialsToLink, setSelectedMaterialsToLink] = useState([]);

  // Load data
  const loadRooms = useCallback(async () => {
    try {
      const data = await showroomApi.getShowroomRooms();
      setRooms(data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const data = await showroomApi.getShowroomSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const data = await showroomApi.getMaterialCategories();
      setCategories(data);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  const loadMaterials = useCallback(
    async (categoryId = null) => {
      try {
        const data = await showroomApi.getMaterials(categoryId);
        setMaterials(data);
      } catch (error) {
        console.error('Failed to load materials:', error);
      }
    },
    []
  );

  const loadElements = useCallback(async (roomId) => {
    try {
      const data = await showroomApi.getElements(roomId);
      setElements(data);
    } catch (error) {
      console.error('Failed to load elements:', error);
    }
  }, []);

  const loadTabData = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'rooms':
          await loadRooms();
          break;
        case 'settings':
          await loadSettings();
          break;
        case 'materials':
          await loadCategories();
          await loadMaterials(selectedCategory?.id);
          break;
        case 'swappable':
          await loadRooms(); // Need rooms for selector
          if (selectedRoom) {
            await loadElements(selectedRoom.id);
          }
          await loadMaterials(); // Need all materials for linking
          break;
        default:
          break;
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    loadRooms,
    loadSettings,
    loadCategories,
    loadMaterials,
    loadElements,
    selectedCategory,
    selectedRoom,
  ]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  useEffect(() => {
    if (selectedCategory) {
      loadMaterials(selectedCategory.id);
    } else {
      loadMaterials();
    }
  }, [selectedCategory, loadMaterials]);

  useEffect(() => {
    if (selectedRoom) {
      loadElements(selectedRoom.id);
      setElementForm((prev) => ({ ...prev, room_id: selectedRoom.id }));
    }
  }, [selectedRoom, loadElements]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTabData();
    setRefreshing(false);
  };

  // Room handlers
  const handleSaveRoom = async () => {
    try {
      if (!roomForm.room_name_en || !roomForm.room_name_es) {
        Alert.alert('Error', 'Please enter room names in both languages');
        return;
      }

      if (editingRoom) {
        await showroomApi.updateShowroomRoom(editingRoom.id, roomForm);
        Alert.alert('Success', 'Room updated successfully');
      } else {
        await showroomApi.createShowroomRoom(roomForm);
        Alert.alert('Success', 'Room created successfully');
      }

      setShowRoomModal(false);
      setEditingRoom(null);
      resetRoomForm();
      loadRooms();
    } catch (error) {
      Alert.alert('Error', 'Failed to save room');
    }
  };

  const handleDeleteRoom = (room) => {
    Alert.alert('Delete Room', 'Are you sure you want to delete this room?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await showroomApi.deleteShowroomRoom(room.id);
            Alert.alert('Success', 'Room deleted successfully');
            loadRooms();
          } catch (error) {
            Alert.alert('Error', 'Failed to delete room');
          }
        },
      },
    ]);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setRoomForm({
      room_name_en: room.room_name_en || '',
      room_name_es: room.room_name_es || '',
      room_description_en: room.room_description_en || '',
      room_description_es: room.room_description_es || '',
      category: room.category || 'showroom',
      is_enabled: room.is_enabled !== false,
      is_starting_room: room.is_starting_room || false,
      default_yaw: room.default_yaw || 0,
      default_pitch: room.default_pitch || 0,
      default_hfov: room.default_hfov || 100,
    });
    setShowRoomModal(true);
  };

  const resetRoomForm = () => {
    setRoomForm({
      room_name_en: '',
      room_name_es: '',
      room_description_en: '',
      room_description_es: '',
      category: 'showroom',
      is_enabled: true,
      is_starting_room: false,
      default_yaw: 0,
      default_pitch: 0,
      default_hfov: 100,
    });
  };

  // Settings handlers
  const handleSaveSettings = async () => {
    try {
      await showroomApi.updateShowroomSettings(settings);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  // Category handlers
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSaveCategory = async () => {
    try {
      if (!categoryForm.category_name_en || !categoryForm.category_name_es) {
        Alert.alert('Error', 'Please enter category names in both languages');
        return;
      }

      if (editingCategory) {
        await showroomApi.updateMaterialCategory(editingCategory.id, categoryForm);
        Alert.alert('Success', 'Category updated successfully');
      } else {
        await showroomApi.createMaterialCategory(categoryForm);
        Alert.alert('Success', 'Category created successfully');
      }

      setShowCategoryModal(false);
      setEditingCategory(null);
      resetCategoryForm();
      loadCategories();
    } catch (error) {
      Alert.alert('Error', 'Failed to save category');
    }
  };

  const handleDeleteCategory = (category) => {
    Alert.alert(
      'Delete Category',
      'Are you sure? All materials in this category will also be deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await showroomApi.deleteMaterialCategory(category.id);
              Alert.alert('Success', 'Category deleted successfully');
              loadCategories();
              if (selectedCategory?.id === category.id) {
                setSelectedCategory(null);
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      category_name_en: category.category_name_en || '',
      category_name_es: category.category_name_es || '',
      category_slug: category.category_slug || '',
      icon: category.icon || 'palette',
      display_order: category.display_order || 0,
      is_enabled: category.is_enabled !== false,
    });
    setShowCategoryModal(true);
  };

  const resetCategoryForm = () => {
    setCategoryForm({
      category_name_en: '',
      category_name_es: '',
      category_slug: '',
      icon: 'palette',
      display_order: 0,
      is_enabled: true,
    });
  };

  // Material handlers
  const handleSaveMaterial = async () => {
    try {
      if (!materialForm.category_id) {
        Alert.alert('Error', 'Please select a category');
        return;
      }
      if (!materialForm.material_name_en || !materialForm.material_name_es) {
        Alert.alert('Error', 'Please enter material names in both languages');
        return;
      }

      if (editingMaterial) {
        await showroomApi.updateMaterial(editingMaterial.id, materialForm);
        Alert.alert('Success', 'Material updated successfully');
      } else {
        await showroomApi.createMaterial(materialForm);
        Alert.alert('Success', 'Material created successfully');
      }

      setShowMaterialModal(false);
      setEditingMaterial(null);
      resetMaterialForm();
      loadMaterials(selectedCategory?.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to save material');
    }
  };

  const handleDeleteMaterial = (material) => {
    Alert.alert('Delete Material', 'Are you sure you want to delete this material?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await showroomApi.deleteMaterial(material.id);
            Alert.alert('Success', 'Material deleted successfully');
            loadMaterials(selectedCategory?.id);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete material');
          }
        },
      },
    ]);
  };

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
      display_order: material.display_order || 0,
    });
    setShowMaterialModal(true);
  };

  const resetMaterialForm = () => {
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
      display_order: 0,
    });
  };

  // Element handlers
  const handleSaveElement = async () => {
    try {
      if (!selectedRoom?.id) {
        Alert.alert('Error', 'Please select a room first');
        return;
      }
      if (!elementForm.element_name_en || !elementForm.element_name_es) {
        Alert.alert('Error', 'Please enter element names in both languages');
        return;
      }

      const payload = {
        ...elementForm,
        room_id: selectedRoom.id,
        uv_bounds:
          typeof elementForm.uv_bounds === 'string'
            ? elementForm.uv_bounds
            : JSON.stringify(elementForm.uv_bounds),
      };

      if (editingElement) {
        await showroomApi.updateElement(editingElement.id, payload);
        Alert.alert('Success', 'Element updated successfully');
      } else {
        await showroomApi.createElement(payload);
        Alert.alert('Success', 'Element created successfully');
      }

      setShowElementModal(false);
      setEditingElement(null);
      resetElementForm();
      loadElements(selectedRoom.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to save element');
    }
  };

  const handleDeleteElement = (element) => {
    Alert.alert(
      'Delete Element',
      'Are you sure? Material links will also be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await showroomApi.deleteElement(element.id);
              Alert.alert('Success', 'Element deleted successfully');
              loadElements(selectedRoom.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete element');
            }
          },
        },
      ]
    );
  };

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

    setElementForm({
      room_id: element.room_id || selectedRoom?.id || '',
      element_name_en: element.element_name_en || '',
      element_name_es: element.element_name_es || '',
      element_type: element.element_type || 'surface',
      uv_bounds: uvBounds,
      highlight_color: element.highlight_color || '#f59e0b',
      default_material_id: element.default_material_id || '',
      is_enabled: element.is_enabled !== false,
      display_order: element.display_order || 0,
    });
    setShowElementModal(true);
  };

  const resetElementForm = () => {
    setElementForm({
      room_id: selectedRoom?.id || '',
      element_name_en: '',
      element_name_es: '',
      element_type: 'surface',
      uv_bounds: { minU: 0.3, maxU: 0.7, minV: 0.3, maxV: 0.7 },
      highlight_color: '#f59e0b',
      default_material_id: '',
      is_enabled: true,
      display_order: 0,
    });
  };

  const applyUVPreset = (preset) => {
    setElementForm({
      ...elementForm,
      element_name_en: elementForm.element_name_en || preset.nameEn,
      element_name_es: elementForm.element_name_es || preset.nameEs,
      uv_bounds: preset.bounds,
      highlight_color: preset.color,
    });
  };

  // Material linking handlers
  const handleLinkMaterials = async () => {
    if (!linkingElement || selectedMaterialsToLink.length === 0) return;

    try {
      for (const materialId of selectedMaterialsToLink) {
        await showroomApi.linkMaterialToElement(linkingElement.id, materialId);
      }
      Alert.alert('Success', 'Materials linked successfully');
      setLinkingElement(null);
      setSelectedMaterialsToLink([]);
      loadElements(selectedRoom.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to link materials');
    }
  };

  const handleUnlinkMaterial = (elementId, materialId) => {
    Alert.alert('Unlink Material', 'Remove this material from the element?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unlink',
        style: 'destructive',
        onPress: async () => {
          try {
            await showroomApi.unlinkMaterialFromElement(elementId, materialId);
            Alert.alert('Success', 'Material unlinked successfully');
            loadElements(selectedRoom.id);
          } catch (error) {
            Alert.alert('Error', 'Failed to unlink material');
          }
        },
      },
    ]);
  };

  const getElementMaterials = (element) => {
    if (!element.linked_materials) return [];
    try {
      const parsed =
        typeof element.linked_materials === 'string'
          ? JSON.parse(element.linked_materials)
          : element.linked_materials;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const getAvailableMaterials = (element) => {
    const linked = getElementMaterials(element).map((m) => m.id);
    return materials.filter((m) => !linked.includes(m.id));
  };

  // Demo data handlers
  const handleSeedDemo = () => {
    Alert.alert(
      'Load Demo Data',
      'This will create demo rooms, materials, and elements. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load',
          onPress: async () => {
            try {
              const result = await showroomApi.seedDemoData();
              Alert.alert(
                'Success',
                `Demo data created: ${result.data.rooms} rooms, ${result.data.materials} materials, ${result.data.elements} elements`
              );
              loadTabData();
            } catch (error) {
              Alert.alert('Error', 'Failed to load demo data');
            }
          },
        },
      ]
    );
  };

  const handleClearDemo = () => {
    Alert.alert(
      'Clear All Data',
      'This will DELETE all showroom data (rooms, materials, elements). Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            try {
              await showroomApi.clearDemoData();
              Alert.alert('Success', 'All showroom data cleared');
              loadTabData();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  // Render functions
  const renderRoomsTab = () => (
    <View>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          setEditingRoom(null);
          resetRoomForm();
          setShowRoomModal(true);
        }}
      >
        <Plus size={20} color={COLORS.white} />
        <Text style={styles.addButtonText}>Add Room</Text>
      </TouchableOpacity>

      <Text style={styles.infoText}>
        Note: Image uploads for 360° panoramas require using the web admin panel or implementing
        an image picker.
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
      ) : rooms.length === 0 ? (
        <Text style={styles.emptyText}>No rooms yet. Add your first room!</Text>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <ContentGlass intensity="light" style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.room_name_en}</Text>
                  <Text style={styles.cardSubtitle}>{item.category}</Text>
                  {item.is_starting_room && (
                    <View style={styles.startRoomBadge}>
                      <Text style={styles.startRoomBadgeText}>Starting Room</Text>
                    </View>
                  )}
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity onPress={() => handleEditRoom(item)} style={styles.actionButton}>
                    <Pencil size={16} color={COLORS.blue} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteRoom(item)}
                    style={styles.actionButton}
                  >
                    <Trash2 size={16} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </ContentGlass>
          )}
        />
      )}
    </View>
  );

  const renderSettingsTab = () => {
    if (!settings) {
      return <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />;
    }

    return (
      <ScrollView>
        <ContentGlass intensity="light" style={styles.settingsCard}>
          <View style={styles.settingItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>Show Showroom in Navigation</Text>
              <Text style={styles.settingDescription}>
                {settings.showroom_visible
                  ? 'Showroom tab is visible to visitors'
                  : 'Showroom tab is hidden from visitors'}
              </Text>
            </View>
            <Switch
              value={settings.showroom_visible}
              onValueChange={(value) => setSettings({ ...settings, showroom_visible: value })}
              trackColor={{ false: COLORS.gray300, true: COLORS.successMedium }}
              thumbColor={COLORS.white}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Welcome Message (EN)</Text>
            <TextInput
              style={styles.input}
              value={settings.welcome_message_en || ''}
              onChangeText={(text) => setSettings({ ...settings, welcome_message_en: text })}
              placeholder="Enter welcome message"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Welcome Message (ES)</Text>
            <TextInput
              style={styles.input}
              value={settings.welcome_message_es || ''}
              onChangeText={(text) => setSettings({ ...settings, welcome_message_es: text })}
              placeholder="Ingrese mensaje de bienvenida"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.checkboxGroup}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() =>
                setSettings({ ...settings, vr_mode_enabled: !settings.vr_mode_enabled })
              }
            >
              <View
                style={[styles.checkboxBox, settings.vr_mode_enabled && styles.checkboxBoxChecked]}
              >
                {settings.vr_mode_enabled && <Check size={16} color={COLORS.white} />}
              </View>
              <Text style={styles.checkboxLabel}>VR Mode Enabled</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkbox}
              onPress={() =>
                setSettings({ ...settings, auto_rotate_enabled: !settings.auto_rotate_enabled })
              }
            >
              <View
                style={[
                  styles.checkboxBox,
                  settings.auto_rotate_enabled && styles.checkboxBoxChecked,
                ]}
              >
                {settings.auto_rotate_enabled && <Check size={16} color={COLORS.white} />}
              </View>
              <Text style={styles.checkboxLabel}>Auto Rotate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => setSettings({ ...settings, show_compass: !settings.show_compass })}
            >
              <View style={[styles.checkboxBox, settings.show_compass && styles.checkboxBoxChecked]}>
                {settings.show_compass && <Check size={16} color={COLORS.white} />}
              </View>
              <Text style={styles.checkboxLabel}>Show Compass</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.checkbox}
              onPress={() =>
                setSettings({ ...settings, show_zoom_controls: !settings.show_zoom_controls })
              }
            >
              <View
                style={[
                  styles.checkboxBox,
                  settings.show_zoom_controls && styles.checkboxBoxChecked,
                ]}
              >
                {settings.show_zoom_controls && <Check size={16} color={COLORS.white} />}
              </View>
              <Text style={styles.checkboxLabel}>Show Zoom Controls</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
            <Check size={20} color={COLORS.white} />
            <Text style={styles.saveButtonText}>Save Settings</Text>
          </TouchableOpacity>
        </ContentGlass>
      </ScrollView>
    );
  };

  const renderMaterialsTab = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.sectionToggle}>
        <TouchableOpacity
          style={[
            styles.sectionButton,
            materialsSection === 'categories' && styles.sectionButtonActive,
          ]}
          onPress={() => setMaterialsSection('categories')}
        >
          <Text
            style={[
              styles.sectionButtonText,
              materialsSection === 'categories' && styles.sectionButtonTextActive,
            ]}
          >
            Categories ({categories.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sectionButton,
            materialsSection === 'materials' && styles.sectionButtonActive,
          ]}
          onPress={() => setMaterialsSection('materials')}
        >
          <Text
            style={[
              styles.sectionButtonText,
              materialsSection === 'materials' && styles.sectionButtonTextActive,
            ]}
          >
            Materials ({materials.length})
          </Text>
        </TouchableOpacity>
      </View>

      {materialsSection === 'categories' ? (
        <View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingCategory(null);
              resetCategoryForm();
              setShowCategoryModal(true);
            }}
          >
            <Plus size={20} color={COLORS.white} />
            <Text style={styles.addButtonText}>Add Category</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : categories.length === 0 ? (
            <Text style={styles.emptyText}>No categories yet. Create one to get started!</Text>
          ) : (
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <ContentGlass
                  intensity="light"
                  style={[
                    styles.card,
                    selectedCategory?.id === item.id && styles.cardSelected,
                  ]}
                >
                  <TouchableOpacity
                    onPress={() =>
                      setSelectedCategory(selectedCategory?.id === item.id ? null : item)
                    }
                  >
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{item.category_name_en}</Text>
                        <Text style={styles.cardSubtitle}>{item.category_slug}</Text>
                      </View>
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          onPress={() => handleEditCategory(item)}
                          style={styles.actionButton}
                        >
                          <Pencil size={16} color={COLORS.blue} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteCategory(item)}
                          style={styles.actionButton}
                        >
                          <Trash2 size={16} color={COLORS.error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </TouchableOpacity>
                </ContentGlass>
              )}
            />
          )}
        </View>
      ) : (
        <View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingMaterial(null);
              resetMaterialForm();
              setShowMaterialModal(true);
            }}
          >
            <Plus size={20} color={COLORS.white} />
            <Text style={styles.addButtonText}>Add Material</Text>
          </TouchableOpacity>

          {selectedCategory && (
            <ContentGlass intensity="light" style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                Filtering: {selectedCategory.category_name_en}
              </Text>
            </ContentGlass>
          )}

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : materials.length === 0 ? (
            <Text style={styles.emptyText}>
              {selectedCategory ? 'No materials in this category.' : 'No materials yet.'}
            </Text>
          ) : (
            <FlatList
              data={materials}
              keyExtractor={(item) => item.id.toString()}
              numColumns={2}
              columnWrapperStyle={styles.materialGrid}
              renderItem={({ item }) => (
                <ContentGlass intensity="light" style={styles.materialCard}>
                  <View
                    style={[styles.materialSwatch, { backgroundColor: item.color_hex || '#ccc' }]}
                  />
                  <Text style={styles.materialName}>{item.material_name_en}</Text>
                  <Text style={styles.materialCode}>{item.material_code || '-'}</Text>
                  <Text style={styles.materialPrice}>{item.price_indicator}</Text>
                  <View style={styles.materialActions}>
                    <TouchableOpacity onPress={() => handleEditMaterial(item)}>
                      <Pencil size={14} color={COLORS.blue} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteMaterial(item)}>
                      <Trash2 size={14} color={COLORS.error} />
                    </TouchableOpacity>
                  </View>
                </ContentGlass>
              )}
            />
          )}
        </View>
      )}
    </View>
  );

  const renderSwappableTab = () => (
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionTitle}>Select Room</Text>
      {rooms.length === 0 ? (
        <Text style={styles.warningText}>
          No rooms yet! Go to the Rooms tab first to add a showroom room.
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomSelector}>
          {rooms.map((room) => (
            <TouchableOpacity
              key={room.id}
              style={[
                styles.roomSelectorButton,
                selectedRoom?.id === room.id && styles.roomSelectorButtonActive,
              ]}
              onPress={() => setSelectedRoom(room)}
            >
              <Text
                style={[
                  styles.roomSelectorButtonText,
                  selectedRoom?.id === room.id && styles.roomSelectorButtonTextActive,
                ]}
              >
                {room.room_name_en}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {selectedRoom && (
        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setEditingElement(null);
              resetElementForm();
              setShowElementModal(true);
            }}
          >
            <Plus size={20} color={COLORS.white} />
            <Text style={styles.addButtonText}>Add Swappable Element</Text>
          </TouchableOpacity>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : elements.length === 0 ? (
            <Text style={styles.emptyText}>
              No swappable elements yet. Add one to get started.
            </Text>
          ) : (
            <FlatList
              data={elements}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => {
                const linkedMaterials = getElementMaterials(item);
                return (
                  <ContentGlass intensity="light" style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View
                          style={[
                            styles.colorDot,
                            { backgroundColor: item.highlight_color || '#f59e0b' },
                          ]}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardTitle}>{item.element_name_en}</Text>
                          <Text style={styles.cardSubtitle}>{item.element_type}</Text>
                        </View>
                      </View>
                      <View style={styles.cardActions}>
                        <TouchableOpacity
                          onPress={() => handleEditElement(item)}
                          style={styles.actionButton}
                        >
                          <Pencil size={16} color={COLORS.blue} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteElement(item)}
                          style={styles.actionButton}
                        >
                          <Trash2 size={16} color={COLORS.error} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.linkedMaterialsSection}>
                      <View style={styles.linkedMaterialsHeader}>
                        <Text style={styles.linkedMaterialsTitle}>
                          Linked Materials ({linkedMaterials.length})
                        </Text>
                        <TouchableOpacity
                          style={styles.linkButton}
                          onPress={() => {
                            setLinkingElement(item);
                            setSelectedMaterialsToLink([]);
                          }}
                        >
                          <LinkIcon size={14} color={COLORS.accent} />
                          <Text style={styles.linkButtonText}>Link</Text>
                        </TouchableOpacity>
                      </View>
                      {linkedMaterials.length > 0 ? (
                        <View style={styles.linkedMaterialsList}>
                          {linkedMaterials.map((mat) => (
                            <View key={mat.id} style={styles.linkedMaterialChip}>
                              <View
                                style={[
                                  styles.linkedMaterialColor,
                                  { backgroundColor: mat.color_hex || '#ccc' },
                                ]}
                              />
                              <Text style={styles.linkedMaterialName}>{mat.material_name_en}</Text>
                              <TouchableOpacity
                                onPress={() => handleUnlinkMaterial(item.id, mat.id)}
                              >
                                <X size={14} color={COLORS.error} />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.noMaterialsText}>No materials linked</Text>
                      )}
                    </View>
                  </ContentGlass>
                );
              }}
            />
          )}
        </View>
      )}
    </View>
  );

  const renderGuideTab = () => (
    <ScrollView>
      <ContentGlass intensity="light" style={styles.guideCard}>
        <Text style={styles.guideTitle}>Quick Start Demo</Text>
        <Text style={styles.guideText}>
          Load sample data with demo panoramas to test the virtual showroom features. This will
          create rooms, materials, and swappable elements automatically.
        </Text>
        <View style={styles.guideButtons}>
          <TouchableOpacity style={styles.demoButton} onPress={handleSeedDemo}>
            <Text style={styles.demoButtonText}>Load Demo Data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearDemo}>
            <Text style={styles.clearButtonText}>Clear All Data</Text>
          </TouchableOpacity>
        </View>
      </ContentGlass>

      <ContentGlass intensity="light" style={styles.guideCard}>
        <Text style={styles.guideTitle}>Setup Guide</Text>
        <Text style={styles.guideSubtitle}>1. Create 360° Panorama Images</Text>
        <Text style={styles.guideText}>
          Use a 360° camera (Ricoh Theta, Insta360) or smartphone app (Google Street View) to
          capture equirectangular panoramas (2:1 ratio). Recommended resolution: 4096x2048 or
          higher.
        </Text>

        <Text style={styles.guideSubtitle}>2. Add Showroom Rooms</Text>
        <Text style={styles.guideText}>
          In the Rooms tab, create rooms with bilingual names and upload your 360° panorama images.
          Set one room as the "Starting Room" for visitors.
        </Text>

        <Text style={styles.guideSubtitle}>3. Create Material Categories & Materials</Text>
        <Text style={styles.guideText}>
          In the Materials tab, first create categories (Flooring, Countertops, etc.), then add
          materials with colors and optional texture images.
        </Text>

        <Text style={styles.guideSubtitle}>4. Define Swappable Elements</Text>
        <Text style={styles.guideText}>
          In the Swappable Elements tab, select a room and use preset buttons (Floor, Wall, etc.)
          to quickly define clickable regions. Then link materials to each element.
        </Text>

        <Text style={styles.guideSubtitle}>5. Test Your Showroom</Text>
        <Text style={styles.guideText}>
          Visit /showroom on your website to test the virtual tour. Visitors can click and drag to
          look around, and click on highlighted surfaces to change materials.
        </Text>
      </ContentGlass>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'rooms':
        return renderRoomsTab();
      case 'settings':
        return renderSettingsTab();
      case 'materials':
        return renderMaterialsTab();
      case 'swappable':
        return renderSwappableTab();
      case 'guide':
        return renderGuideTab();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ContentGlass intensity="medium" style={styles.header}>
        <Text style={styles.title}>Virtual Showroom Manager</Text>
        <Text style={styles.subtitle}>Manage your 360° showroom experience</Text>
      </ContentGlass>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {renderTabContent()}
      </ScrollView>

      {/* Room Modal */}
      <Modal visible={showRoomModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingRoom ? 'Edit Room' : 'Add New Room'}
              </Text>
              <TouchableOpacity onPress={() => setShowRoomModal(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name (English) *</Text>
                <TextInput
                  style={styles.input}
                  value={roomForm.room_name_en}
                  onChangeText={(text) => setRoomForm({ ...roomForm, room_name_en: text })}
                  placeholder="e.g., Modern Kitchen Showroom"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Name (Spanish) *</Text>
                <TextInput
                  style={styles.input}
                  value={roomForm.room_name_es}
                  onChangeText={(text) => setRoomForm({ ...roomForm, room_name_es: text })}
                  placeholder="e.g., Sala de Exposición de Cocina Moderna"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description (English)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={roomForm.room_description_en}
                  onChangeText={(text) => setRoomForm({ ...roomForm, room_description_en: text })}
                  placeholder="Optional description"
                  placeholderTextColor={COLORS.textLight}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Description (Spanish)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={roomForm.room_description_es}
                  onChangeText={(text) => setRoomForm({ ...roomForm, room_description_es: text })}
                  placeholder="Descripción opcional"
                  placeholderTextColor={COLORS.textLight}
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.checkboxGroup}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setRoomForm({ ...roomForm, is_enabled: !roomForm.is_enabled })}
                >
                  <View style={[styles.checkboxBox, roomForm.is_enabled && styles.checkboxBoxChecked]}>
                    {roomForm.is_enabled && <Check size={16} color={COLORS.white} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Enabled</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() =>
                    setRoomForm({ ...roomForm, is_starting_room: !roomForm.is_starting_room })
                  }
                >
                  <View
                    style={[styles.checkboxBox, roomForm.is_starting_room && styles.checkboxBoxChecked]}
                  >
                    {roomForm.is_starting_room && <Check size={16} color={COLORS.white} />}
                  </View>
                  <Text style={styles.checkboxLabel}>Starting Room</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowRoomModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveRoom}>
                <Check size={20} color={COLORS.white} />
                <Text style={styles.saveButtonText}>
                  {editingRoom ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Category Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name (English) *</Text>
                <TextInput
                  style={styles.input}
                  value={categoryForm.category_name_en}
                  onChangeText={(text) => {
                    setCategoryForm({
                      ...categoryForm,
                      category_name_en: text,
                      category_slug: editingCategory
                        ? categoryForm.category_slug
                        : generateSlug(text),
                    });
                  }}
                  placeholder="e.g., Flooring"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Name (Spanish) *</Text>
                <TextInput
                  style={styles.input}
                  value={categoryForm.category_name_es}
                  onChangeText={(text) => setCategoryForm({ ...categoryForm, category_name_es: text })}
                  placeholder="e.g., Pisos"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Slug</Text>
                <TextInput
                  style={styles.input}
                  value={categoryForm.category_slug}
                  onChangeText={(text) => setCategoryForm({ ...categoryForm, category_slug: text })}
                  placeholder="auto-generated"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.checkbox}>
                <View
                  style={[styles.checkboxBox, categoryForm.is_enabled && styles.checkboxBoxChecked]}
                  onTouchEnd={() =>
                    setCategoryForm({ ...categoryForm, is_enabled: !categoryForm.is_enabled })
                  }
                >
                  {categoryForm.is_enabled && <Check size={16} color={COLORS.white} />}
                </View>
                <Text style={styles.checkboxLabel}>Enabled</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCategoryModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveCategory}>
                <Check size={20} color={COLORS.white} />
                <Text style={styles.saveButtonText}>
                  {editingCategory ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Material Modal */}
      <Modal visible={showMaterialModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingMaterial ? 'Edit Material' : 'Add Material'}
              </Text>
              <TouchableOpacity onPress={() => setShowMaterialModal(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        materialForm.category_id === cat.id && styles.categoryChipActive,
                      ]}
                      onPress={() => setMaterialForm({ ...materialForm, category_id: cat.id })}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          materialForm.category_id === cat.id && styles.categoryChipTextActive,
                        ]}
                      >
                        {cat.category_name_en}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Name (English) *</Text>
                <TextInput
                  style={styles.input}
                  value={materialForm.material_name_en}
                  onChangeText={(text) => setMaterialForm({ ...materialForm, material_name_en: text })}
                  placeholder="e.g., Oak Hardwood"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Name (Spanish) *</Text>
                <TextInput
                  style={styles.input}
                  value={materialForm.material_name_es}
                  onChangeText={(text) => setMaterialForm({ ...materialForm, material_name_es: text })}
                  placeholder="e.g., Madera de Roble"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Material Code</Text>
                <TextInput
                  style={styles.input}
                  value={materialForm.material_code}
                  onChangeText={(text) => setMaterialForm({ ...materialForm, material_code: text })}
                  placeholder="e.g., OAK-001"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Color</Text>
                <View style={styles.colorInputGroup}>
                  <View
                    style={[styles.colorPreview, { backgroundColor: materialForm.color_hex }]}
                  />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={materialForm.color_hex}
                    onChangeText={(text) => setMaterialForm({ ...materialForm, color_hex: text })}
                    placeholder="#cccccc"
                    placeholderTextColor={COLORS.textLight}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Price Indicator</Text>
                <View style={styles.priceIndicators}>
                  {PRICE_INDICATORS.map((price) => (
                    <TouchableOpacity
                      key={price.value}
                      style={[
                        styles.priceChip,
                        materialForm.price_indicator === price.value && styles.priceChipActive,
                      ]}
                      onPress={() =>
                        setMaterialForm({ ...materialForm, price_indicator: price.value })
                      }
                    >
                      <Text
                        style={[
                          styles.priceChipText,
                          materialForm.price_indicator === price.value &&
                            styles.priceChipTextActive,
                        ]}
                      >
                        {price.value}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.checkbox}>
                <View
                  style={[styles.checkboxBox, materialForm.is_enabled && styles.checkboxBoxChecked]}
                  onTouchEnd={() =>
                    setMaterialForm({ ...materialForm, is_enabled: !materialForm.is_enabled })
                  }
                >
                  {materialForm.is_enabled && <Check size={16} color={COLORS.white} />}
                </View>
                <Text style={styles.checkboxLabel}>Enabled</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowMaterialModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveMaterial}>
                <Check size={20} color={COLORS.white} />
                <Text style={styles.saveButtonText}>
                  {editingMaterial ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Element Modal */}
      <Modal visible={showElementModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingElement ? 'Edit Element' : 'Add Swappable Element'}
              </Text>
              <TouchableOpacity onPress={() => setShowElementModal(false)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name (English) *</Text>
                <TextInput
                  style={styles.input}
                  value={elementForm.element_name_en}
                  onChangeText={(text) => setElementForm({ ...elementForm, element_name_en: text })}
                  placeholder="e.g., Floor, Countertop"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Name (Spanish) *</Text>
                <TextInput
                  style={styles.input}
                  value={elementForm.element_name_es}
                  onChangeText={(text) => setElementForm({ ...elementForm, element_name_es: text })}
                  placeholder="e.g., Piso, Encimera"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Quick Presets</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {UV_PRESETS.map((preset) => (
                    <TouchableOpacity
                      key={preset.id}
                      style={[styles.presetButton, { borderColor: preset.color }]}
                      onPress={() => applyUVPreset(preset)}
                    >
                      <Text style={styles.presetButtonText}>{preset.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.checkbox}>
                <View
                  style={[styles.checkboxBox, elementForm.is_enabled && styles.checkboxBoxChecked]}
                  onTouchEnd={() =>
                    setElementForm({ ...elementForm, is_enabled: !elementForm.is_enabled })
                  }
                >
                  {elementForm.is_enabled && <Check size={16} color={COLORS.white} />}
                </View>
                <Text style={styles.checkboxLabel}>Enabled</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowElementModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveElement}>
                <Check size={20} color={COLORS.white} />
                <Text style={styles.saveButtonText}>
                  {editingElement ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Link Materials Modal */}
      <Modal visible={!!linkingElement} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Link Materials to "{linkingElement?.element_name_en}"
              </Text>
              <TouchableOpacity onPress={() => setLinkingElement(null)}>
                <X size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <FlatList
                data={linkingElement ? getAvailableMaterials(linkingElement) : []}
                keyExtractor={(item) => item.id.toString()}
                numColumns={3}
                columnWrapperStyle={styles.linkMaterialGrid}
                renderItem={({ item }) => {
                  const isSelected = selectedMaterialsToLink.includes(item.id);
                  return (
                    <TouchableOpacity
                      style={[
                        styles.linkMaterialCard,
                        isSelected && styles.linkMaterialCardSelected,
                      ]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedMaterialsToLink((prev) => prev.filter((id) => id !== item.id));
                        } else {
                          setSelectedMaterialsToLink((prev) => [...prev, item.id]);
                        }
                      }}
                    >
                      <View
                        style={[
                          styles.linkMaterialSwatch,
                          { backgroundColor: item.color_hex || '#ccc' },
                        ]}
                      />
                      <Text style={styles.linkMaterialName} numberOfLines={2}>
                        {item.material_name_en}
                      </Text>
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>All materials are already linked.</Text>
                }
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <Text style={styles.selectedCount}>
                {selectedMaterialsToLink.length} selected
              </Text>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setLinkingElement(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  selectedMaterialsToLink.length === 0 && styles.saveButtonDisabled,
                ]}
                onPress={handleLinkMaterials}
                disabled={selectedMaterialsToLink.length === 0}
              >
                <LinkIcon size={20} color={COLORS.white} />
                <Text style={styles.saveButtonText}>Link Selected</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
  },
  tabsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabsContent: {
    paddingHorizontal: SPACING.sm,
  },
  tab: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.semibold,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: SPACING.sm,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    gap: SPACING.xs,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
  },
  loader: {
    marginTop: SPACING.xl,
  },
  emptyText: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  card: {
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderRadius: RADIUS.lg,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  cardSubtitle: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.xs,
  },
  startRoomBadge: {
    backgroundColor: COLORS.accentLight + '40',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
    marginTop: SPACING.xs,
  },
  startRoomBadgeText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.accentDark,
    fontWeight: TYPOGRAPHY.medium,
  },
  infoText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.info,
    backgroundColor: COLORS.infoBg,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  warningText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.warning,
    backgroundColor: COLORS.warningBg,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  settingsCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingLabel: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  settingDescription: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
  },
  formGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textMedium,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    fontSize: TYPOGRAPHY.base,
    color: COLORS.text,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  checkboxGroup: {
    marginVertical: SPACING.md,
    gap: SPACING.sm,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxLabel: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.text,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
  },
  sectionToggle: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
  },
  sectionButtonActive: {
    backgroundColor: COLORS.accent,
  },
  sectionButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textSecondary,
  },
  sectionButtonTextActive: {
    color: COLORS.white,
  },
  filterBadge: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  filterBadgeText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.medium,
  },
  materialGrid: {
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  materialCard: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  materialSwatch: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  materialName: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  materialCode: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textSecondary,
  },
  materialPrice: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  materialActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  roomSelector: {
    maxHeight: 50,
    marginBottom: SPACING.md,
  },
  roomSelectorButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray100,
    marginRight: SPACING.sm,
  },
  roomSelectorButtonActive: {
    backgroundColor: COLORS.accent,
  },
  roomSelectorButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textSecondary,
  },
  roomSelectorButtonTextActive: {
    color: COLORS.white,
  },
  colorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  linkedMaterialsSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  linkedMaterialsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  linkedMaterialsTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textMedium,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.accentLight + '40',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  linkButtonText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.accentDark,
    fontWeight: TYPOGRAPHY.medium,
  },
  linkedMaterialsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  linkedMaterialChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.sm,
  },
  linkedMaterialColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  linkedMaterialName: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.text,
  },
  noMaterialsText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
  },
  guideCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  guideTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  guideSubtitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  guideText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  guideButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  demoButton: {
    flex: 1,
    backgroundColor: COLORS.accent,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  demoButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
  },
  clearButton: {
    flex: 1,
    backgroundColor: COLORS.errorMedium,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  clearButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  modalBody: {
    padding: SPACING.md,
    maxHeight: 500,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray200,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textMedium,
  },
  categoryChip: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray100,
    marginRight: SPACING.xs,
  },
  categoryChipActive: {
    backgroundColor: COLORS.accent,
  },
  categoryChipText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.medium,
  },
  categoryChipTextActive: {
    color: COLORS.white,
  },
  colorInputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  priceIndicators: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  priceChip: {
    flex: 1,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
  },
  priceChipActive: {
    backgroundColor: COLORS.accent,
  },
  priceChipText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textSecondary,
  },
  priceChipTextActive: {
    color: COLORS.white,
  },
  presetButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    marginRight: SPACING.xs,
  },
  presetButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.text,
  },
  linkMaterialGrid: {
    gap: SPACING.sm,
    justifyContent: 'space-between',
  },
  linkMaterialCard: {
    flex: 1,
    maxWidth: '31%',
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  linkMaterialCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accentLight + '20',
  },
  linkMaterialSwatch: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  linkMaterialName: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.text,
    textAlign: 'center',
  },
  selectedCount: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textSecondary,
    marginRight: 'auto',
  },
});

export default VirtualShowroomScreen;
