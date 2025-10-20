import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  Platform
} from 'react-native';
import { COLORS } from '../constants/colors';
import { photosApi } from '../api/photos';
import { API_BASE } from '../api/config';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const COLUMNS = 3;
const PHOTO_MARGIN = 4;
const PHOTO_SIZE = (SCREEN_WIDTH - (PHOTO_MARGIN * (COLUMNS + 1))) / COLUMNS;

const PhotosScreen = () => {
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const { token } = useAuth();
  const [allPhotos, setAllPhotos] = useState([]);
  const [filteredPhotos, setFilteredPhotos] = useState([]);
  const [currentCategory, setCurrentCategory] = useState('kitchen');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [photoStats, setPhotoStats] = useState({ photos: 0, videos: 0 });

  // Categories - will update when language changes
  const categories = React.useMemo(() => [
    { key: 'kitchen', label: t('categories.kitchen'), icon: '🏠' },
    { key: 'bathroom', label: t('categories.bathroom'), icon: '🚿' },
    { key: 'livingroom', label: t('categories.livingroom'), icon: '🛋️' },
    { key: 'laundryroom', label: t('categories.laundryroom'), icon: '🧺' },
    { key: 'bedroom', label: t('categories.bedroom'), icon: '🛏️' },
    { key: 'showcase', label: t('categories.showcase'), icon: '⭐' },
  ], [currentLanguage]);

  const loadPhotos = useCallback(async () => {
    try {
      setLoading(true);
      if (!token) {
        throw new Error('Authentication token not found');
      }
      const data = await photosApi.getPhotos(token);
      setAllPhotos(data);
      filterPhotosByCategory(currentCategory, data);
    } catch (error) {
      console.error('Error loading photos:', error);
      Alert.alert('Error', 'Failed to load photos. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentCategory, token, filterPhotosByCategory]);

  const filterPhotosByCategory = useCallback((category, photos = allPhotos) => {
    const filtered = photos.filter((photo) => {
      const str = JSON.stringify(photo).toLowerCase();
      return str.includes(category.toLowerCase());
    });
    
    // Calculate stats
    const photoCount = filtered.filter(item => !item.mime_type || !item.mime_type.startsWith('video/')).length;
    const videoCount = filtered.filter(item => item.mime_type && item.mime_type.startsWith('video/')).length;
    
    setPhotoStats({ photos: photoCount, videos: videoCount });
    setFilteredPhotos(filtered);
  }, [allPhotos]);

  const selectCategory = useCallback((category) => {
    setCurrentCategory(category);
    filterPhotosByCategory(category);
  }, [filterPhotosByCategory]);

  const openModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  useEffect(() => {
    loadPhotos();
  }, []);

  const renderCategoryButton = ({ item }) => {
    const isActive = item.key === currentCategory;
    return (
      <TouchableOpacity
        style={[styles.categoryButton, isActive && styles.categoryButtonActive]}
        onPress={() => selectCategory(item.key)}
      >
        <Text style={styles.categoryIcon}>{item.icon}</Text>
        <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderPhotoItem = ({ item }) => {
    const isVideo = item.mime_type && item.mime_type.startsWith('video/');
    const imageUrl = `${API_BASE}${item.thumbnail || item.url}`;

    return (
      <TouchableOpacity
        style={styles.photoItem}
        onPress={() => openModal(item)}
      >
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.photoImage}
          resizeMode="cover"
        />
        {isVideo && (
          <View style={styles.videoOverlay}>
            <View style={styles.playIcon}>
              <Text style={styles.playIconText}>▶</Text>
            </View>
          </View>
        )}
        {item.title && (
          <View style={styles.photoCaption}>
            <Text style={styles.photoCaptionText} numberOfLines={1}>
              {item.title}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <View style={styles.categoriesContainer}>
        <Text style={styles.categoryTitle}>Categories</Text>
        <FlatList
          horizontal
          data={categories}
          renderItem={renderCategoryButton}
          keyExtractor={(item) => item.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
        
        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{photoStats.photos}</Text>
            <Text style={styles.statLabel}>Photos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{photoStats.videos}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{filteredPhotos.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>
      </View>

      {/* Photo Grid */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue} />
        </View>
      ) : (
        <FlatList
          data={filteredPhotos}
          renderItem={renderPhotoItem}
          keyExtractor={(item) => item.id?.toString()}
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
              <Text style={styles.emptyText}>No photos found in this category</Text>
            </View>
          }
        />
      )}

      {/* Image/Video Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalBackground} 
            activeOpacity={1} 
            onPress={closeModal}
          >
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
              
              {selectedItem && (
                <>
                  {selectedItem.mime_type && selectedItem.mime_type.startsWith('video/') ? (
                    <View style={styles.videoPlaceholder}>
                      <Text style={styles.videoPlaceholderText}>
                        Video Player Coming Soon
                      </Text>
                      <Text style={styles.videoSubtext}>
                        Tap to close and view thumbnail
                      </Text>
                      <Image 
                        source={{ uri: `${API_BASE}${selectedItem.thumbnail || selectedItem.url}` }}
                        style={styles.modalImage}
                        resizeMode="contain"
                      />
                    </View>
                  ) : (
                    <ScrollView
                      style={styles.scrollView}
                      contentContainerStyle={styles.scrollViewContent}
                      maximumZoomScale={3}
                      minimumZoomScale={1}
                      showsHorizontalScrollIndicator={false}
                      showsVerticalScrollIndicator={false}
                    >
                      <Image 
                        source={{ uri: `${API_BASE}${selectedItem.url}` }}
                        style={styles.modalImage}
                        resizeMode="contain"
                      />
                    </ScrollView>
                  )}
                  
                  {selectedItem.title && (
                    <View style={styles.modalCaption}>
                      <Text style={styles.modalCaptionText}>{selectedItem.title}</Text>
                      <Text style={styles.modalCaptionSubtext}>
                        {selectedItem.category || currentCategory}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          </TouchableOpacity>
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
  categoriesContainer: {
    backgroundColor: COLORS.white,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoriesList: {
    paddingHorizontal: 12,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: COLORS.gray100,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryButtonActive: {
    backgroundColor: COLORS.blue,
    borderColor: COLORS.blueDark,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMedium,
  },
  categoryTextActive: {
    color: COLORS.white,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.blue,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  photoGrid: {
    padding: PHOTO_MARGIN,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    margin: PHOTO_MARGIN,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.gray200,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIconText: {
    color: COLORS.white,
    fontSize: 16,
    marginLeft: 2,
  },
  photoCaption: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
  },
  photoCaptionText: {
    color: COLORS.white,
    fontSize: 10,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textLight,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalBackground: {
    flex: 1,
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    maxHeight: '80%',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCaption: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
  },
  modalCaptionText: {
    color: COLORS.white,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalCaptionSubtext: {
    color: COLORS.gray300,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  videoPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholderText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  videoSubtext: {
    color: COLORS.gray400,
    fontSize: 14,
    marginBottom: 20,
  },
});

export default PhotosScreen;
