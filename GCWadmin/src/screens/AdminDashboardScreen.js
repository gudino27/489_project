import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  DollarSign,
  Image as ImageIcon,
  IdCard,
  FileText,
  Receipt,
  MessageSquare,
  Users,
  BarChart3,
  MessageCircle,
  Shield,
  LogOut,
} from 'lucide-react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '../constants';
import { NavGlass, TabGlass } from '../components/GlassView';
import InvoicesScreen from './InvoicesScreen';
import PhotosScreen from './PhotosScreen';
import DesignsScreen from './DesignsScreen';
import TestimonialsScreen from './TestimonialsScreen';
import MoreScreen from './MoreScreen';
import PriceManagementScreen from './prices/PriceManagementScreen';
import PortfolioScreen from './photos/PortfolioScreen';
import GalleryScreen from './photos/GalleryScreen';
import VideosScreen from './photos/VideosScreen';
import ClientManagementScreen from './ClientManagementScreen';
import TaxRatesScreen from './TaxRatesScreen';
import LineItemLabelsScreen from './LineItemLabelsScreen';
import InvoiceTrackingScreen from './InvoiceTrackingScreen';
import EmployeeManagementScreen from './EmployeeManagementScreen';
import UserManagementScreen from './UserManagementScreen';
import AnalyticsScreen from './AnalyticsScreen';
import SmsRoutingScreen from './SmsRoutingScreen';
import SecurityMonitorScreen from './SecurityMonitorScreen';

const AdminDashboardScreen = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState('prices');
  const [activeTab, setActiveTab] = useState('cabinets');

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

  // Icon grid sections (2 rows, 5 per row)
  const sections = [
    { key: 'prices', label: 'Prices', icon: DollarSign },
    { key: 'photos', label: 'Photos', icon: ImageIcon },
    { key: 'employees', label: 'Employees', icon: IdCard },
    { key: 'designs', label: 'Designs', icon: FileText },
    { key: 'invoices', label: 'Invoices', icon: Receipt },
    { key: 'testimonials', label: 'Testimonials', icon: MessageSquare },
    { key: 'users', label: 'Users', icon: Users, superAdminOnly: true },
    { key: 'analytics', label: 'Analytics', icon: BarChart3, superAdminOnly: true },
    { key: 'sms-routing', label: 'SMS Routing', icon: MessageCircle, superAdminOnly: true },
    { key: 'security', label: 'Security', icon: Shield, superAdminOnly: true },
  ];

  // Filter sections based on user role
  const availableSections = sections.filter(section => 
    !section.superAdminOnly || user?.role === 'super_admin'
  );

  // Section-specific tabs
  const sectionTabs = {
    prices: [
      { key: 'cabinets', label: 'Cabinets' },
      { key: 'materials', label: 'Materials' },
      { key: 'colors', label: 'Colors' },
      { key: 'walls', label: 'Walls' },
    ],
    photos: [
      { key: 'portfolio', label: 'Portfolio' },
      { key: 'gallery', label: 'Gallery' },
      { key: 'videos', label: 'Videos' },
    ],
    invoices: [
      { key: 'list', label: 'All Invoices' },
      { key: 'clients', label: 'Clients' },
      { key: 'tax-rates', label: 'Tax Rates' },
      { key: 'labels', label: 'Line Items' },
      { key: 'tracking', label: 'Tracking' },
    ],
  };

  const getCurrentTabs = () => {
    return sectionTabs[activeSection] || [];
  };

  const renderContent = () => {
    console.log('=== RENDERING CONTENT ===');
    console.log('Active Section:', activeSection);
    console.log('Active Tab:', activeTab);
    
    // Render screens based on section
    if (activeSection === 'prices') {
      return <PriceManagementScreen />;
    }

    if (activeSection === 'photos') {
      switch (activeTab) {
        case 'portfolio':
          return <PortfolioScreen />;
        case 'gallery':
          return <GalleryScreen />;
        case 'videos':
          return <VideosScreen />;
        default:
          return <PortfolioScreen />;
      }
    }

    if (activeSection === 'invoices') {
      switch (activeTab) {
        case 'list':
          return <InvoicesScreen />;
        case 'clients':
          return <ClientManagementScreen />;
        case 'tax-rates':
          return <TaxRatesScreen />;
        case 'labels':
          return <LineItemLabelsScreen />;
        case 'tracking':
          return <InvoiceTrackingScreen />;
        default:
          return <InvoicesScreen />;
      }
    }

    switch (activeSection) {
      case 'designs':
        return <DesignsScreen />;
      case 'testimonials':
        return <TestimonialsScreen />;
      case 'employees':
        return <EmployeeManagementScreen />;
      case 'users':
        return user?.role === 'super_admin' ? <UserManagementScreen /> : null;
      case 'analytics':
        return user?.role === 'super_admin' ? <AnalyticsScreen /> : null;
      case 'sms-routing':
        return user?.role === 'super_admin' ? <SmsRoutingScreen /> : null;
      case 'security':
        return user?.role === 'super_admin' ? <SecurityMonitorScreen /> : null;
      default:
        return (
          <View style={styles.placeholderContent}>
            <Text style={styles.placeholderText}>
              {sections.find(s => s.key === activeSection)?.label}
            </Text>
            <Text style={styles.placeholderSubtext}>
              Implementation coming soon
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header - Matches Web */}
      <NavGlass style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <View style={styles.headerRight}>
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>Welcome</Text>
              <Text style={styles.username}>{user?.username || 'Admin'}</Text>
              {user?.role === 'super_admin' && (
                <Shield size={16} color={COLORS.accent} style={styles.badgeIcon} />
              )}
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <LogOut size={20} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
      </NavGlass>

      {/* Horizontal Navigation Tabs - MATCHES WEB EXACTLY */}
      <NavGlass style={styles.navTabs}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.navTabsContent}
        >
          {availableSections.map((section) => {
            const IconComponent = section.icon;
            const isActive = activeSection === section.key;

            return (
              <TouchableOpacity
                key={section.key}
                onPress={() => {
                  setActiveSection(section.key);
                  // Reset to first tab when switching sections
                  const tabs = sectionTabs[section.key];
                  if (tabs && tabs.length > 0) {
                    setActiveTab(tabs[0].key);
                  }
                }}
              >
                <TabGlass
                  style={styles.navTab}
                  active={isActive}
                >
                  <View style={styles.navTabContent}>
                    <IconComponent
                      size={16}
                      color={isActive ? COLORS.accent : COLORS.text}
                    />
                    <Text
                      style={[
                        styles.navTabLabel,
                        isActive && styles.navTabLabelActive,
                      ]}
                    >
                      {section.label}
                    </Text>
                  </View>
                </TabGlass>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </NavGlass>

      {/* Section Title */}
      <View style={styles.sectionTitleContainer}>
        <Text style={styles.sectionTitle}>
          {sections.find(s => s.key === activeSection)?.label}
        </Text>
      </View>

      {/* Section-Specific Horizontal Tabs */}
      {getCurrentTabs().length > 0 && (
        <NavGlass style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {getCurrentTabs().map((tab) => (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
              >
                <TabGlass
                  style={styles.tab}
                  active={activeTab === tab.key}
                >
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
      )}

      {/* Content Area */}
      <ScrollView style={styles.content}>
        {renderContent()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  
  // Header - Matches Web
  header: {
    paddingTop: 50,
    paddingBottom: SPACING[3],
    paddingHorizontal: SPACING[4],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: TYPOGRAPHY['2xl'],
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[3],
  },
  userInfo: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: SPACING[2],
  },
  welcomeText: {
    fontSize: TYPOGRAPHY.xs,
    color: COLORS.textLight,
  },
  username: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  badgeIcon: {
    marginLeft: SPACING[1],
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.glassDark,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Horizontal Navigation Tabs - MATCHES WEB
  navTabs: {
    paddingVertical: SPACING[2],
  },
  navTabsContent: {
    paddingHorizontal: SPACING[4],
    gap: SPACING[2],
    flexDirection: 'row',
  },
  navTab: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.xl,
    minHeight: 40,
    justifyContent: 'center',
  },
  navTabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
  },
  navTabLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  navTabLabelActive: {
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.bold,
  },
  sectionTitleContainer: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  tabsContainer: {
    paddingVertical: SPACING[2],
  },
  tabsScrollContent: {
    paddingHorizontal: SPACING[4],
    gap: SPACING[2],
  },
  tab: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[2],
    borderRadius: RADIUS.xl,
  },
  tabLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  tabLabelActive: {
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.bold,
  },
  content: {
    flex: 1,
  },
  placeholderContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING[8],
  },
  placeholderText: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
    marginBottom: SPACING[2],
  },
  placeholderSubtext: {
    fontSize: TYPOGRAPHY.base,
    color: COLORS.textLight,
  },
});

export default AdminDashboardScreen;
