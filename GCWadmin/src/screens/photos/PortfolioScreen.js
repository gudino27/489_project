import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
} from 'react-native';
import { useLanguage } from '../../contexts/LanguageContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '../../constants';
import { ContentGlass } from '../../components/GlassView';

const PortfolioScreen = () => {
  const { t } = useLanguage();
  const [portfolioItems, setPortfolioItems] = useState([
    {
      id: 1,
      title: t('designPreview.modernKitchen'),
      category: 'Kitchen',
      featured: true,
      views: 1234,
      imageUrl: 'https://via.placeholder.com/400x300/1e3a8a/ffffff?text=Modern+Kitchen',
    },
    {
      id: 2,
      title: t('designPreview.classicWhite'),
      category: 'Kitchen',
      featured: true,
      views: 892,
      imageUrl: 'https://via.placeholder.com/400x300/3b82f6/ffffff?text=White+Cabinets',
    },
    {
      id: 3,
      title: t('designPreview.contemporaryBath'),
      category: 'Bathroom',
      featured: false,
      views: 567,
      imageUrl: 'https://via.placeholder.com/400x300/1e40af/ffffff?text=Bathroom',
    },
  ]);

  const toggleFeatured = (id) => {
    setPortfolioItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, featured: !item.featured } : item
      )
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Info Card */}
        <ContentGlass style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('photoManager.portfolio')}</Text>
          <Text style={styles.infoText}>
            {t('photoManager.portfolioDescription')}
          </Text>
        </ContentGlass>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <ContentGlass style={styles.statCard}>
            <Text style={styles.statValue}>{portfolioItems.length}</Text>
            <Text style={styles.statLabel}>{t('photoManager.totalItems')}</Text>
          </ContentGlass>
          <ContentGlass style={styles.statCard}>
            <Text style={styles.statValue}>
              {portfolioItems.filter(i => i.featured).length}
            </Text>
            <Text style={styles.statLabel}>{t('photoManager.featured')}</Text>
          </ContentGlass>
          <ContentGlass style={styles.statCard}>
            <Text style={styles.statValue}>
              {portfolioItems.reduce((sum, i) => sum + i.views, 0)}
            </Text>
            <Text style={styles.statLabel}>{t('photoManager.totalViews')}</Text>
          </ContentGlass>
        </View>

        {/* Portfolio Items */}
        {portfolioItems.map((item) => (
          <ContentGlass key={item.id} style={styles.portfolioCard}>
            <Image source={{ uri: item.imageUrl }} style={styles.portfolioImage} />
            <View style={styles.portfolioContent}>
              <View style={styles.portfolioHeader}>
                <View style={styles.portfolioInfo}>
                  <Text style={styles.portfolioTitle}>{item.title}</Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.portfolioStats}>
                <Text style={styles.viewsText}>👁 {item.views.toLocaleString()} {t('photoManager.views')}</Text>
                <View style={styles.featuredToggle}>
                  <Text style={styles.featuredLabel}>{t('photoManager.featured')}</Text>
                  <Switch
                    value={item.featured}
                    onValueChange={() => toggleFeatured(item.id)}
                    trackColor={{ false: COLORS.gray300, true: COLORS.accent }}
                    thumbColor={COLORS.white}
                  />
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.editButton}>
                  <Text style={styles.editButtonText}>{t('common.edit')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton}>
                  <Text style={styles.deleteButtonText}>{t('common.delete')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ContentGlass>
        ))}

        {/* Add New Button */}
        <TouchableOpacity style={styles.addButton}>
          <ContentGlass style={styles.addButtonInner}>
            <Text style={styles.addButtonText}>+ {t('photoManager.addPortfolioItem')}</Text>
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
    textAlign: 'center',
  },
  portfolioCard: {
    marginBottom: SPACING[4],
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  portfolioImage: {
    width: '100%',
    height: 200,
    backgroundColor: COLORS.gray200,
  },
  portfolioContent: {
    padding: SPACING[4],
  },
  portfolioHeader: {
    marginBottom: SPACING[3],
  },
  portfolioInfo: {
    gap: SPACING[2],
  },
  portfolioTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    borderRadius: RADIUS.base,
    backgroundColor: COLORS.primaryLight,
  },
  categoryText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  portfolioStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING[3],
    paddingBottom: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  viewsText: {
    fontSize: TYPOGRAPHY.sm,
    color: COLORS.textLight,
  },
  featuredToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  featuredLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.text,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING[2],
  },
  editButton: {
    flex: 1,
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: TYPOGRAPHY.base,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.white,
  },
  deleteButton: {
    paddingVertical: SPACING[2],
    paddingHorizontal: SPACING[4],
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.error,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: TYPOGRAPHY.base,
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

export default PortfolioScreen;
