import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants';
import { ContentGlass } from '../../components/GlassView';

const { width } = Dimensions.get('window');
const IMAGE_SIZE = (width - (SPACING[4] * 3)) / 2;

const GalleryScreen = () => {
  const { t } = useLanguage();
  const [galleryImages, setGalleryImages] = useState([
    { id: 1, url: 'https://via.placeholder.com/300/1e3a8a/ffffff?text=Image+1', tags: ['kitchen', 'modern'] },
    { id: 2, url: 'https://via.placeholder.com/300/3b82f6/ffffff?text=Image+2', tags: ['bathroom'] },
    { id: 3, url: 'https://via.placeholder.com/300/1e40af/ffffff?text=Image+3', tags: ['kitchen', 'classic'] },
    { id: 4, url: 'https://via.placeholder.com/300/2563eb/ffffff?text=Image+4', tags: ['outdoor'] },
    { id: 5, url: 'https://via.placeholder.com/300/1d4ed8/ffffff?text=Image+5', tags: ['kitchen'] },
    { id: 6, url: 'https://via.placeholder.com/300/1e3a8a/ffffff?text=Image+6', tags: ['bathroom', 'modern'] },
  ]);

  const [selectedFilter, setSelectedFilter] = useState('all');

  const filters = ['all', 'kitchen', 'bathroom', 'outdoor', 'modern', 'classic'];

  const filteredImages = selectedFilter === 'all'
    ? galleryImages
    : galleryImages.filter(img => img.tags.includes(selectedFilter));

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <ContentGlass style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('photoManager.gallery')}</Text>
          <Text style={styles.infoText}>
            {t('photoManager.galleryDescription')}
          </Text>
        </ContentGlass>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setSelectedFilter(filter)}
              style={[
                styles.filterChip,
                selectedFilter === filter && styles.filterChipActive,
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedFilter === filter && styles.filterTextActive,
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Image Count */}
        <Text style={styles.imageCount}>
          {filteredImages.length} {filteredImages.length === 1 ? t('photoManager.image') : t('photoManager.images')}
        </Text>

        {/* Image Grid */}
        <View style={styles.imageGrid}>
          {filteredImages.map((image) => (
            <TouchableOpacity key={image.id} style={styles.imageContainer}>
              <ContentGlass style={styles.imageCard}>
                <Image source={{ uri: image.url }} style={styles.galleryImage} />
                <View style={styles.imageTags}>
                  {image.tags.map((tag, index) => (
                    <View key={index} style={styles.tagBadge}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
                <TouchableOpacity style={styles.deleteIconButton}>
                  <Text style={styles.deleteIcon}>×</Text>
                </TouchableOpacity>
              </ContentGlass>
            </TouchableOpacity>
          ))}
        </View>

        {/* Add Photos Button */}
        <TouchableOpacity style={styles.addButton}>
          <ContentGlass style={styles.addButtonInner}>
            <Text style={styles.addButtonText}>+ {t('photoManager.addPhotos')}</Text>
          </ContentGlass>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING[4],
    paddingBottom: SPACING[8],
  },
  infoCard: {
    padding: SPACING[4],
    marginBottom: SPACING[4],
    borderRadius: RADIUS.xl,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING[2],
  },
  infoText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    lineHeight: TYPOGRAPHY.lineHeights.relaxed * TYPOGRAPHY.sm,
  },
  filtersContainer: {
    marginBottom: SPACING[3],
  },
  filtersContent: {
    gap: SPACING[2],
  },
  filterChip: {
    paddingHorizontal: SPACING[3],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.text,
  },
  filterTextActive: {
    color: COLORS.white,
  },
  imageCount: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
    marginBottom: SPACING[3],
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[2],
  },
  imageContainer: {
    width: IMAGE_SIZE,
  },
  imageCard: {
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: IMAGE_SIZE,
    backgroundColor: COLORS.gray200,
  },
  imageTags: {
    position: 'absolute',
    bottom: SPACING[2],
    left: SPACING[2],
    right: SPACING[2],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[1],
  },
  tagBadge: {
    paddingHorizontal: SPACING[2],
    paddingVertical: 2,
    borderRadius: RADIUS.base,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  tagText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.white,
  },
  deleteIconButton: {
    position: 'absolute',
    top: SPACING[2],
    right: SPACING[2],
    width: 28,
    height: 28,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 20,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  addButton: {
    marginTop: SPACING[4],
  },
  addButtonInner: {
    padding: SPACING[4],
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.primary,
  },
});

export default GalleryScreen;
