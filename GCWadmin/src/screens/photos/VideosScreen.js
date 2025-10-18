import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../../constants';
import { ContentGlass } from '../../components/GlassView';

const VideosScreen = () => {
  const [videos, setVideos] = useState([
    {
      id: 1,
      title: 'Kitchen Transformation Time-lapse',
      duration: '2:34',
      views: 5432,
      uploadDate: '2024-03-15',
      thumbnail: 'https://via.placeholder.com/400x225/1e3a8a/ffffff?text=Kitchen+Video',
    },
    {
      id: 2,
      title: 'Cabinet Installation Process',
      duration: '5:12',
      views: 3210,
      uploadDate: '2024-03-10',
      thumbnail: 'https://via.placeholder.com/400x225/3b82f6/ffffff?text=Installation+Video',
    },
    {
      id: 3,
      title: 'Customer Testimonial - Smith Family',
      duration: '1:45',
      views: 1892,
      uploadDate: '2024-03-05',
      thumbnail: 'https://via.placeholder.com/400x225/1e40af/ffffff?text=Testimonial',
    },
  ]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <ContentGlass style={styles.infoCard}>
          <Text style={styles.infoTitle}>Video Management</Text>
          <Text style={styles.infoText}>
            Upload and manage project videos, time-lapses, and customer testimonials.
          </Text>
        </ContentGlass>

        {/* Stats */}
        <View style={styles.statsRow}>
          <ContentGlass style={styles.statCard}>
            <Text style={styles.statValue}>{videos.length}</Text>
            <Text style={styles.statLabel}>Videos</Text>
          </ContentGlass>
          <ContentGlass style={styles.statCard}>
            <Text style={styles.statValue}>
              {videos.reduce((sum, v) => sum + v.views, 0).toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Total Views</Text>
          </ContentGlass>
        </View>

        {/* Video List */}
        {videos.map((video) => (
          <ContentGlass key={video.id} style={styles.videoCard}>
            <View style={styles.videoThumbnail}>
              <View style={styles.thumbnailPlaceholder}>
                <Text style={styles.playIcon}>▶</Text>
              </View>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{video.duration}</Text>
              </View>
            </View>

            <View style={styles.videoContent}>
              <Text style={styles.videoTitle}>{video.title}</Text>

              <View style={styles.videoMeta}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>👁</Text>
                  <Text style={styles.metaText}>{video.views.toLocaleString()} views</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>📅</Text>
                  <Text style={styles.metaText}>{formatDate(video.uploadDate)}</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.editButton}>
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ContentGlass>
        ))}

        {/* Add Video Button */}
        <TouchableOpacity style={styles.addButton}>
          <ContentGlass style={styles.addButtonInner}>
            <Text style={styles.addButtonText}>+ Upload Video</Text>
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
  statsRow: {
    flexDirection: 'row',
    gap: SPACING[2],
    marginBottom: SPACING[4],
  },
  statCard: {
    flex: 1,
    padding: SPACING[3],
    borderRadius: RADIUS.lg,
    alignItems: 'center',
  },
  statValue: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.primary,
    marginBottom: SPACING[1],
  },
  statLabel: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
  },
  videoCard: {
    marginBottom: SPACING[3],
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  videoThumbnail: {
    width: '100%',
    height: 200,
    position: 'relative',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.gray800,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    fontSize: 48,
    color: COLORS.white,
  },
  durationBadge: {
    position: 'absolute',
    bottom: SPACING[2],
    right: SPACING[2],
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: RADIUS.base,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  durationText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.white,
  },
  videoContent: {
    padding: SPACING[4],
  },
  videoTitle: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING[3],
  },
  videoMeta: {
    flexDirection: 'row',
    gap: SPACING[4],
    marginBottom: SPACING[3],
    paddingBottom: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[1],
  },
  metaIcon: {
    fontSize: TYPOGRAPHY.sm,
  },
  metaText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  editButton: {
    flex: 1,
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  viewButton: {
    flex: 1,
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.info,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  deleteButton: {
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[3],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.error,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  addButton: {
    marginTop: SPACING[2],
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

export default VideosScreen;
