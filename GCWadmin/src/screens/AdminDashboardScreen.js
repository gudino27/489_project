import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '../utils/AuthContext';
import { COLORS } from '../constants/colors';
import { ContentGlass, NavGlass, TabGlass } from '../components/GlassView';
import InvoicesScreen from './InvoicesScreen';
import PhotosScreen from './PhotosScreen';
import DesignsScreen from './DesignsScreen';
import MoreScreen from './MoreScreen';

const AdminDashboardScreen = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('invoices');

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const tabs = [
    { key: 'invoices', label: 'Invoices', icon: '📄' },
    { key: 'photos', label: 'Photos', icon: '📸' },
    { key: 'designs', label: 'Designs', icon: '✏️' },
    { key: 'more', label: 'More', icon: '⋯' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'invoices':
        return <InvoicesScreen />;
      case 'photos':
        return <PhotosScreen />;
      case 'designs':
        return <DesignsScreen />;
      case 'more':
        return <MoreScreen />;
      default:
        return <InvoicesScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <NavGlass style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <View style={styles.headerRight}>
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>Welcome</Text>
              <Text style={styles.username}>{user?.username || 'Admin'}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutIcon}>⎋</Text>
            </TouchableOpacity>
          </View>
        </View>
      </NavGlass>

      {/* Horizontal Tab Navigation */}
      <NavGlass style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
            >
              <TabGlass
                style={styles.tab}
                active={activeTab === tab.key}
              >
                <Text style={styles.tabIcon}>{tab.icon}</Text>
                <Text
                  style={[
                    styles.tabLabel,
                    activeTab === tab.key && styles.tabLabelActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TabGlass>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </NavGlass>

      {/* Content Area */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    paddingTop: 50, // Safe area top
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userInfo: {
    alignItems: 'flex-end',
  },
  welcomeText: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutIcon: {
    fontSize: 18,
    color: COLORS.text,
  },
  tabsContainer: {
    paddingVertical: 8,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    minWidth: 100,
  },
  tabIcon: {
    fontSize: 16,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  tabLabelActive: {
    color: COLORS.accent,
  },
  content: {
    flex: 1,
  },
});

export default AdminDashboardScreen;
