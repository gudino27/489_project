import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
} from 'react-native';
import {
  Upload,
  Trash2,
  Edit2,
  Save,
  X,
  Video,
  Image as ImageIcon,
  GripVertical,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import DraggableFlatList, {
  ScaleDecorator,
  OpacityDecorator,
} from 'react-native-draggable-flatlist';
import { useAuth } from '../../contexts/AuthContext';
import { photosApi } from '../../api/photos';
import { API_BASE } from '../../api/config';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOWS } from '../../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMNS = 2;
const PHOTO_MARGIN = SPACING[2];
const PHOTO_SIZE = (SCREEN_WIDTH - PHOTO_MARGIN * (COLUMNS + 3)) / COLUMNS;

const PhotoManagementScreen = () => {
  const { token } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('kitchen');
  const [uploading, setUploading] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [hasOrderChanges, setHasOrderChanges] = useState(false);
  const [reorderingPhotoId, setReorderingPhotoId] = useState(null);
  const [manualPosition, setManualPosition] = useState('');

  const categories = [
    { id: 'kitchen', name: 'Kitchen', icon: '🍳' },
    { id: 'bathroom', name: 'Bathroom', icon: '🚿' },
    { id: 'livingroom', name: 'Living Room', icon: '🛋️' },
    { id: 'bedroom', name: 'Bedroom', icon: '🛏️' },
    { id: 'laundryroom', name: 'Laundry Room', icon: '🧺' },
    { id: 'showcase', name: 'Showcase', icon: '✨' },
  ];

  const isVideo = item => {
    return item.mime_type && item.mime_type.startsWith('video/');
  };

  const loadPhotos = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data = await photosApi.getPhotos(token);
      setPhotos(data);
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert('Error', 'Failed to load photos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const handleImagePick = async (isVideoUpload = false, useCamera = false) => {
    try {
      // Request permissions
      const permissionMethod = useCamera
        ? ImagePicker.requestCameraPermissionsAsync
        : ImagePicker.requestMediaLibraryPermissionsAsync;
      
      const { status } = await permissionMethod();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          `Please allow access to your ${useCamera ? 'camera' : 'photo library'}`,
        );
        return;
      }

      const launchMethod = useCamera
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;

      const result = await launchMethod({
        mediaTypes: isVideoUpload ? 'videos' : 'images',
        allowsMultipleSelection: !useCamera, // Camera doesn't support multiple
        quality: 0.8,
      });

      if (!result.canceled) {
        await handlePhotoUpload(result.assets);
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const showImageSourcePicker = (isVideoUpload = false) => {
    Alert.alert(
      isVideoUpload ? 'Add Video' : 'Add Photo',
      'Choose source',
      [
        {
          text: 'Camera',
          onPress: () => handleImagePick(isVideoUpload, true),
        },
        {
          text: 'Gallery',
          onPress: () => handleImagePick(isVideoUpload, false),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
  };

  const handlePhotoUpload = async assets => {
    if (!token) {
      Alert.alert('Error', 'Authentication required');
      return;
    }

    setUploading(true);

    try {
      for (const asset of assets) {
        const formData = new FormData();

        const filename = asset.uri.split('/').pop();
        const customFilename = `${selectedCategory}_${filename}`;

        formData.append('category', selectedCategory);
        formData.append('title', filename.split('.')[0]);
        formData.append('filename', customFilename);
        formData.append('photo', {
          uri: asset.uri,
          type: asset.type === 'video' ? 'video/mp4' : 'image/jpeg',
          name: filename,
        });

        await photosApi.uploadPhoto(token, formData);
      }

      await loadPhotos();
      Alert.alert(
        'Success',
        `${assets.length} item(s) uploaded to ${selectedCategory}!`,
      );
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload items');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async photoId => {
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await photosApi.deletePhoto(token, photoId);
            await loadPhotos();
            Alert.alert('Success', 'Photo deleted');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete photo');
          }
        },
      },
    ]);
  };

  const updatePhotoTitle = async (photoId, newTitle) => {
    try {
      await photosApi.updatePhoto(token, photoId, { title: newTitle });
      await loadPhotos();
      setEditingPhoto(null);
      Alert.alert('Success', 'Title updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update title');
    }
  };

  const updatePhotoCategory = async (photoId, newCategory) => {
    try {
      await photosApi.updatePhoto(token, photoId, { category: newCategory });
      await loadPhotos();
    } catch (error) {
      Alert.alert('Error', 'Failed to update category');
    }
  };

  const saveOrder = async () => {
    const categoryPhotos = currentPhotos.map((photo, index) => ({
      ...photo,
      display_order: index + 1,
    }));

    const photoIds = categoryPhotos.map(p => p.id);

    try {
      await photosApi.reorderPhotos(token, photoIds);
      setHasOrderChanges(false);
      Alert.alert('Success', 'Photo order saved!');
      await loadPhotos();
    } catch (error) {
      Alert.alert('Error', 'Failed to save order');
    }
  };

  const handleDragEnd = ({ data }) => {
    // Update the photos state with new order
    setPhotos(prevPhotos => {
      // Keep photos from other categories unchanged
      const otherPhotos = prevPhotos.filter(
        p => p.category !== selectedCategory,
      );

      // Update display_order for reordered photos
      const updatedPhotos = data.map((photo, index) => ({
        ...photo,
        display_order: index + 1,
      }));

      return [...otherPhotos, ...updatedPhotos];
    });

    setHasOrderChanges(true);
  };

  const currentPhotos = photos
    .filter(p => p.category === selectedCategory)
    .sort((a, b) => (a.display_order || 999) - (b.display_order || 999));

  const photosByCategory = categories.reduce((acc, category) => {
    acc[category.id] = photos.filter(p => p.category === category.id);
    return acc;
  }, {});

  const renderCategoryTab = ({ item }) => {
    const count = photosByCategory[item.id]?.length || 0;
    const isActive = item.id === selectedCategory;

    return (
      <TouchableOpacity
        style={[styles.categoryTab, isActive && styles.categoryTabActive]}
        onPress={() => setSelectedCategory(item.id)}
      >
        <Text style={styles.categoryIcon}>{item.icon}</Text>
        <Text
          style={[styles.categoryName, isActive && styles.categoryNameActive]}
        >
          {item.name}
        </Text>
        <Text
          style={[styles.categoryCount, isActive && styles.categoryCountActive]}
        >
          ({count})
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPhotoItem = ({ item, index, drag, isActive, getIndex }) => {
    const itemIndex = getIndex !== undefined ? getIndex() : index;
    
    const renderContent = () => (
      <View style={[styles.photoCard, isActive && styles.photoCardDragging]}>
        {/* Drag Handle - visible in reorder mode */}
        {isReordering && (
          <View style={styles.dragHandle}>
            <GripVertical size={20} color={COLORS.white} />
          </View>
        )}

        {/* Order Badge */}
        <View style={styles.orderBadge}>
          <Text style={styles.orderText}>#{itemIndex !== undefined ? itemIndex + 1 : '?'}</Text>
        </View>

        {/* Photo/Video */}
        <Image
          source={{ uri: `${API_BASE}${item.thumbnail || item.url}` }}
          style={styles.photoImage}
          resizeMode="cover"
        />

        {/* Video Indicator */}
        {isVideo(item) && (
          <View style={styles.videoOverlay}>
            <Video size={32} color={COLORS.white} />
          </View>
        )}

        {/* Title Editor */}
        <View style={styles.photoInfo}>
          {editingPhoto === item.id ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.titleInput}
                value={editingTitle}
                onChangeText={setEditingTitle}
                placeholder="Photo title"
                autoFocus
              />
              <View style={styles.editButtons}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => updatePhotoTitle(item.id, editingTitle)}
                >
                  <Save size={16} color={COLORS.white} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setEditingPhoto(null)}
                >
                  <X size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.titleRow}>
              <Text style={styles.photoTitle} numberOfLines={1}>
                {item.title}
              </Text>
              {!isReordering && (
                <TouchableOpacity
                  style={styles.editIconButton}
                  onPress={() => {
                    setEditingPhoto(item.id);
                    setEditingTitle(item.title);
                  }}
                >
                  <Edit2 size={16} color={COLORS.blue} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Actions */}
          {!isReordering && (
            <View style={styles.actions}>
              <View style={styles.categorySelector}>
                <Text style={styles.categorySelectorLabel}>Category:</Text>
                <TouchableOpacity
                  style={styles.categoryButton}
                  onPress={() => {
                    // Show category picker modal
                    Alert.alert(
                      'Change Category',
                      '',
                      categories.map(cat => ({
                        text: `${cat.icon} ${cat.name}`,
                        onPress: () => updatePhotoCategory(item.id, cat.id),
                      })),
                    );
                  }}
                >
                  <Text style={styles.categoryButtonText}>
                    {categories.find(c => c.id === item.category)?.icon}{' '}
                    {item.category}
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deletePhoto(item.id)}
              >
                <Trash2 size={16} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          )}

          {/* Manual Position Input - visible in reorder mode */}
          {isReordering && (
            <View style={styles.positionInput}>
              <Text style={styles.positionLabel}>Move to:</Text>
              <TextInput
                style={styles.positionTextInput}
                value={reorderingPhotoId === item.id ? manualPosition : ''}
                onChangeText={(text) => {
                  setReorderingPhotoId(item.id);
                  setManualPosition(text);
                }}
                placeholder="#"
                keyboardType="number-pad"
                maxLength={3}
              />
              <TouchableOpacity
                style={styles.positionGoButton}
                onPress={() => {
                  const newPos = parseInt(manualPosition);
                  if (newPos > 0 && newPos <= currentPhotos.length) {
                    const fromIndex = currentPhotos.findIndex(p => p.id === item.id);
                    const toIndex = newPos - 1;
                    if (fromIndex !== toIndex) {
                      const newData = [...currentPhotos];
                      const [movedItem] = newData.splice(fromIndex, 1);
                      newData.splice(toIndex, 0, movedItem);
                      handleDragEnd({ data: newData });
                    }
                  }
                  setReorderingPhotoId(null);
                  setManualPosition('');
                }}
              >
                <Text style={styles.positionGoText}>Go</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );

    if (!isReordering) {
      return renderContent();
    }

    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          activeOpacity={1}
        >
          {renderContent()}
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.blue} />
        <Text style={styles.loadingText}>Loading photos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Photo Manager</Text>
        <TouchableOpacity
          style={[
            styles.reorderButton,
            isReordering && styles.reorderButtonActive,
          ]}
          onPress={() => {
            if (isReordering && hasOrderChanges) {
              Alert.alert(
                'Save Changes?',
                'Do you want to save the new photo order?',
                [
                  { text: 'Cancel', onPress: () => loadPhotos() },
                  { text: 'Save', onPress: saveOrder },
                  {
                    text: 'Discard',
                    onPress: () => {
                      setIsReordering(false);
                      setHasOrderChanges(false);
                      loadPhotos();
                    },
                  },
                ],
              );
            } else {
              setIsReordering(!isReordering);
            }
          }}
        >
          <GripVertical
            size={16}
            color={isReordering ? COLORS.white : COLORS.text}
          />
          <Text
            style={[
              styles.reorderButtonText,
              isReordering && styles.reorderButtonTextActive,
            ]}
          >
            {isReordering ? 'Done' : 'Reorder'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <FlatList
        horizontal
        data={categories}
        renderItem={renderCategoryTab}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryTabs}
        contentContainerStyle={styles.categoryTabsContent}
      />

      {/* Upload Section */}
      {!isReordering && (
        <View style={styles.uploadSection}>
          <Text style={styles.uploadTitle}>
            Upload to {categories.find(c => c.id === selectedCategory)?.name}
          </Text>
          <View style={styles.uploadButtons}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => showImageSourcePicker(false)}
              disabled={uploading}
            >
              <ImageIcon size={20} color={COLORS.white} />
              <Text style={styles.uploadButtonText}>
                {uploading ? 'Uploading...' : 'Add Photos'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.uploadButton, styles.videoButton]}
              onPress={() => showImageSourcePicker(true)}
              disabled={uploading}
            >
              <Video size={20} color={COLORS.white} />
              <Text style={styles.uploadButtonText}>Add Videos</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Reordering Instructions */}
      {isReordering && (
        <View style={styles.reorderingInfo}>
          <Text style={styles.reorderingText}>
            <Text style={styles.reorderingBold}>Reordering Mode: </Text>
            Long press and drag photos to reorder them
          </Text>
          {hasOrderChanges && (
            <TouchableOpacity
              style={styles.saveOrderButton}
              onPress={saveOrder}
            >
              <Save size={16} color={COLORS.white} />
              <Text style={styles.saveOrderText}>Save Order</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Photo Grid */}
      {isReordering ? (
        <DraggableFlatList
          data={currentPhotos}
          renderItem={renderPhotoItem}
          keyExtractor={item => item.id?.toString()}
          onDragEnd={handleDragEnd}
          numColumns={2}
          containerStyle={styles.photoGrid}
          columnWrapperStyle={styles.photoRow}
        />
      ) : (
        <FlatList
          data={currentPhotos}
          renderItem={renderPhotoItem}
          keyExtractor={item => item.id?.toString()}
          numColumns={COLUMNS}
          contentContainerStyle={styles.photoGrid}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadPhotos();
              }}
              tintColor={COLORS.blue}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <ImageIcon size={48} color={COLORS.textLight} />
              <Text style={styles.emptyText}>No photos in this category</Text>
              <Text style={styles.emptySubtext}>
                Upload some photos to get started
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING[3],
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING[4],
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  reorderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    backgroundColor: COLORS.gray200,
    borderRadius: RADIUS.lg,
  },
  reorderButtonActive: {
    backgroundColor: COLORS.blue,
  },
  reorderButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  reorderButtonTextActive: {
    color: COLORS.white,
  },
  categoryTabs: {
    flexGrow: 0,
    flexShrink: 0,
    height: 80,
    backgroundColor: COLORS.white,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.border,
  },
  categoryTabsContent: {
    paddingHorizontal: SPACING[2],
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    marginHorizontal: SPACING[1],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  categoryTabActive: {
    borderBottomColor: COLORS.blue,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: SPACING[1],
  },
  categoryName: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textMedium,
  },
  categoryNameActive: {
    color: COLORS.blue,
    fontWeight: TYPOGRAPHY.bold,
  },
  categoryCount: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    marginLeft: SPACING[1],
  },
  categoryCountActive: {
    color: COLORS.blue,
  },
  uploadSection: {
    padding: SPACING[4],
    backgroundColor: COLORS.gray100,
  },
  uploadTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
    marginBottom: SPACING[3],
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[3],
    backgroundColor: COLORS.blue,
    borderRadius: RADIUS.lg,
  },
  videoButton: {
    backgroundColor: '#9333ea', // purple-600
  },
  uploadButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  reorderingInfo: {
    padding: SPACING[3],
    backgroundColor: '#dbeafe', // blue-100
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reorderingText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    color: '#1e40af', // blue-800
  },
  reorderingBold: {
    fontWeight: TYPOGRAPHY.bold,
  },
  saveOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.lg,
  },
  saveOrderText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  photoGrid: {
    padding: SPACING[2],
    paddingBottom: SPACING[20],
  },
  photoCard: {
    width: PHOTO_SIZE,
    margin: PHOTO_MARGIN,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  photoCardDragging: {
    ...SHADOWS.xl,
    opacity: 0.8,
  },
  dragHandle: {
    position: 'absolute',
    top: SPACING[2],
    right: SPACING[2],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: SPACING[2],
    borderRadius: RADIUS.full,
    zIndex: 10,
  },
  orderBadge: {
    position: 'absolute',
    top: SPACING[2],
    left: SPACING[2],
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: RADIUS.base,
    zIndex: 10,
  },
  orderText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  photoImage: {
    width: '100%',
    height: PHOTO_SIZE * 0.75,
    backgroundColor: COLORS.gray200,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: PHOTO_SIZE * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  photoInfo: {
    padding: SPACING[2],
  },
  editContainer: {
    marginBottom: SPACING[2],
  },
  titleInput: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.base,
    padding: SPACING[2],
    fontSize: TYPOGRAPHY.sm,
    marginBottom: SPACING[2],
  },
  editButtons: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  saveButton: {
    flex: 1,
    paddingVertical: SPACING[2],
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.base,
    alignItems: 'center',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: SPACING[2],
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.base,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  photoTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.text,
  },
  editIconButton: {
    padding: SPACING[1],
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categorySelector: {
    flex: 1,
  },
  categorySelectorLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
    marginBottom: SPACING[1],
  },
  categoryButton: {
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    backgroundColor: COLORS.gray100,
    borderRadius: RADIUS.base,
  },
  categoryButtonText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.text,
  },
  deleteButton: {
    padding: SPACING[2],
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.base,
    marginLeft: SPACING[2],
  },
  positionInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING[2],
    paddingTop: SPACING[2],
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  positionLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMedium,
    fontWeight: TYPOGRAPHY.medium,
    marginRight: SPACING[2],
  },
  positionTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.base,
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.text,
    textAlign: 'center',
  },
  positionGoButton: {
    marginLeft: SPACING[2],
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[1],
    backgroundColor: COLORS.blue,
    borderRadius: RADIUS.base,
  },
  positionGoText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  photoRow: {
    justifyContent: 'space-between',
    paddingHorizontal: SPACING[2],
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING[12],
  },
  emptyText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.textMedium,
    marginTop: SPACING[3],
  },
  emptySubtext: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    marginTop: SPACING[1],
  },
  overview: {
    padding: SPACING[4],
    backgroundColor: COLORS.gray100,
  },
  overviewTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING[3],
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[2],
  },
  overviewCard: {
    width: (SCREEN_WIDTH - SPACING[4] * 2 - SPACING[2]) / 2,
    padding: SPACING[3],
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[2],
  },
  overviewCategory: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.text,
    flex: 1,
  },
  overviewCount: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.blue,
  },
  overviewStats: {
    gap: SPACING[1],
  },
  overviewStat: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textMedium,
  },
});

export default PhotoManagementScreen;
