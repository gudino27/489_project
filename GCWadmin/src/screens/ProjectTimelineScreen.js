import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Calendar, Clock, Users } from 'lucide-react-native';
import ContentGlass from '../components/ContentGlass';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import * as timelinesApi from '../api/timelines';

const TABS = [
  { id: 'timelines', label: 'Timelines', IconComponent: Calendar },
  { id: 'create', label: 'Create Timeline', IconComponent: Clock },
  { id: 'phases', label: 'Phases', IconComponent: Users },
];

const ProjectTimelineScreen = () => {
  const { t } = useLanguage();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('timelines');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Will implement data fetching in next task
    setRefreshing(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'timelines':
        return <Text style={styles.placeholder}>Timelines List</Text>;
      case 'create':
        return <Text style={styles.placeholder}>Create Timeline Form</Text>;
      case 'phases':
        return <Text style={styles.placeholder}>Phases List</Text>;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <ContentGlass intensity="medium" style={styles.header}>
        <Text style={styles.title}>{t('timelines.title')}</Text>
        <Text style={styles.subtitle}>{t('timelines.subtitle')}</Text>
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
              <tab.IconComponent
                size={20}
                color={isActive ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {t(`timelines.tabs.${tab.id}`)}
              </Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  tabsContainer: {
    maxHeight: 60,
    marginBottom: SPACING.md,
  },
  tabsContent: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    gap: SPACING.xs,
  },
  tabActive: {
    backgroundColor: COLORS.primary + '20',
  },
  tabText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  content: {
    flex: 1,
    padding: SPACING.md,
  },
  placeholder: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
});

export default ProjectTimelineScreen;
