import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Home, Bath, X, Maximize2 } from 'lucide-react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants';

const { width: screenWidth } = Dimensions.get('window');

const DesignPreview = ({ designData, hasKitchen, hasBathroom }) => {
  const [viewMode, setViewMode] = useState('floor');
  const [selectedWall, setSelectedWall] = useState(1);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [activeRoom, setActiveRoom] = useState(hasKitchen ? 'kitchen' : 'bathroom');

  const getCurrentRoomImages = () => {
    if (activeRoom === 'kitchen') {
      return {
        floor_plan: designData.floor_plan_image,
        wall_views: designData.wall_view_images,
      };
    } else if (activeRoom === 'bathroom') {
      return {
        floor_plan: designData.bathroom_floor_plan_image,
        wall_views: designData.bathroom_wall_view_images,
      };
    }
    return { floor_plan: null, wall_views: null };
  };

  const currentImages = getCurrentRoomImages();

  // If we have saved images
  if (currentImages.floor_plan || currentImages.wall_views) {
    return (
      <View style={styles.container}>
        {/* Room Switcher - Only show if both rooms exist */}
        {hasKitchen && hasBathroom && (
          <View style={styles.roomSwitcher}>
            <TouchableOpacity
              onPress={() => setActiveRoom('kitchen')}
              style={[
                styles.roomButton,
                activeRoom === 'kitchen' && styles.roomButtonActiveKitchen,
              ]}
            >
              <Home
                size={16}
                color={activeRoom === 'kitchen' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.roomButtonText,
                  activeRoom === 'kitchen' && styles.roomButtonTextActive,
                ]}
              >
                Kitchen
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveRoom('bathroom')}
              style={[
                styles.roomButton,
                activeRoom === 'bathroom' && styles.roomButtonActiveBathroom,
              ]}
            >
              <Bath
                size={16}
                color={activeRoom === 'bathroom' ? '#9333EA' : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.roomButtonText,
                  activeRoom === 'bathroom' && { color: '#9333EA', fontWeight: '600' },
                ]}
              >
                Bathroom
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* View Mode Controls */}
        <View style={styles.viewModeControls}>
          <TouchableOpacity
            onPress={() => setViewMode('floor')}
            style={[
              styles.viewModeButton,
              viewMode === 'floor' && styles.viewModeButtonActive,
            ]}
          >
            <Text
              style={[
                styles.viewModeText,
                viewMode === 'floor' && styles.viewModeTextActive,
              ]}
            >
              Floor Plan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('walls')}
            style={[
              styles.viewModeButton,
              viewMode === 'walls' && styles.viewModeButtonActive,
            ]}
          >
            <Text
              style={[
                styles.viewModeText,
                viewMode === 'walls' && styles.viewModeTextActive,
              ]}
            >
              Wall Views
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowFullscreen(true)}
            style={styles.fullscreenButton}
          >
            <Maximize2 size={16} color={COLORS.text} />
            <Text style={styles.fullscreenText}>Fullscreen</Text>
          </TouchableOpacity>
        </View>

        {/* Floor Plan View */}
        {viewMode === 'floor' && currentImages.floor_plan && (
          <View style={styles.imageContainer}>
            <Text style={styles.imageLabel}>
              {activeRoom === 'kitchen' ? 'Kitchen' : 'Bathroom'} Floor Plan
            </Text>
            <Image
              source={{ uri: currentImages.floor_plan }}
              style={styles.image}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Wall Views */}
        {viewMode === 'walls' && currentImages.wall_views && (
          <View>
            <View style={styles.wallSelector}>
              {[1, 2, 3, 4].map((wall) => (
                <TouchableOpacity
                  key={wall}
                  onPress={() => setSelectedWall(wall)}
                  style={[
                    styles.wallButton,
                    selectedWall === wall && styles.wallButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.wallButtonText,
                      selectedWall === wall && styles.wallButtonTextActive,
                    ]}
                  >
                    Wall {wall}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.imageContainer}>
              <Text style={styles.imageLabel}>
                {activeRoom === 'kitchen' ? 'Kitchen' : 'Bathroom'} Wall {selectedWall}
              </Text>
              {currentImages.wall_views.find((w) => w.wall === selectedWall) && (
                <Image
                  source={{
                    uri: currentImages.wall_views.find((w) => w.wall === selectedWall).image,
                  }}
                  style={styles.image}
                  resizeMode="contain"
                />
              )}
            </View>
          </View>
        )}

        {/* Fullscreen Modal */}
        <Modal
          visible={showFullscreen}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowFullscreen(false)}
        >
          <View style={styles.fullscreenModal}>
            <TouchableOpacity
              onPress={() => setShowFullscreen(false)}
              style={styles.fullscreenClose}
            >
              <X size={32} color={COLORS.white} />
            </TouchableOpacity>
            <Image
              source={{
                uri:
                  viewMode === 'floor'
                    ? currentImages.floor_plan
                    : currentImages.wall_views?.find((w) => w.wall === selectedWall)?.image,
              }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      </View>
    );
  }

  // If no images, show message
  return (
    <View style={styles.container}>
      {hasKitchen && hasBathroom && (
        <View style={styles.roomSwitcher}>
          <TouchableOpacity
            onPress={() => setActiveRoom('kitchen')}
            style={[
              styles.roomButton,
              activeRoom === 'kitchen' && styles.roomButtonActiveKitchen,
            ]}
          >
            <Home
              size={16}
              color={activeRoom === 'kitchen' ? COLORS.primary : COLORS.textSecondary}
            />
            <Text style={styles.roomButtonText}>Kitchen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveRoom('bathroom')}
            style={[
              styles.roomButton,
              activeRoom === 'bathroom' && styles.roomButtonActiveBathroom,
            ]}
          >
            <Bath
              size={16}
              color={activeRoom === 'bathroom' ? '#9333EA' : COLORS.textSecondary}
            />
            <Text style={styles.roomButtonText}>Bathroom</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.noDataContainer}>
        {activeRoom === 'kitchen' ? (
          <Home size={48} color={COLORS.textSecondary} />
        ) : (
          <Bath size={48} color={COLORS.textSecondary} />
        )}
        <Text style={styles.noDataText}>
          No design data available for {activeRoom}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING[4],
  },
  roomSwitcher: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING[1],
    marginBottom: SPACING[4],
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'center',
  },
  roomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.md,
  },
  roomButtonActiveKitchen: {
    backgroundColor: COLORS.primary + '20',
  },
  roomButtonActiveBathroom: {
    backgroundColor: '#9333EA20',
  },
  roomButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  roomButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  viewModeControls: {
    flexDirection: 'row',
    gap: SPACING[2],
    marginBottom: SPACING[4],
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.backgroundLight,
    alignItems: 'center',
  },
  viewModeButtonActive: {
    backgroundColor: COLORS.primary,
  },
  viewModeText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  viewModeTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  fullscreenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.backgroundLight,
  },
  fullscreenText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  wallSelector: {
    flexDirection: 'row',
    gap: SPACING[2],
    marginBottom: SPACING[4],
  },
  wallButton: {
    flex: 1,
    paddingVertical: SPACING[1],
    paddingHorizontal: SPACING[2],
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.backgroundLight,
    alignItems: 'center',
  },
  wallButtonActive: {
    backgroundColor: COLORS.primary,
  },
  wallButtonText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
  },
  wallButtonTextActive: {
    color: COLORS.white,
    fontWeight: '600',
  },
  imageContainer: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING[4],
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  image: {
    width: '100%',
    height: 400,
  },
  fullscreenModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[4],
  },
  fullscreenClose: {
    position: 'absolute',
    top: 40,
    right: SPACING[5],
    zIndex: 1,
  },
  fullscreenImage: {
    width: screenWidth - SPACING[5] * 2,
    height: '100%',
  },
  noDataContainer: {
    padding: SPACING[8],
    alignItems: 'center',
    gap: SPACING[4],
  },
  noDataText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

export default DesignPreview;
