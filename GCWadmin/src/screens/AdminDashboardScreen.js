import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  StatusBar,
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
  ChevronDown,
  Globe,
  Clock,
  Instagram,
  Calendar,
  Eye,
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
import PhotoManagementScreen from './photos/PhotoManagementScreen';
import ClientManagementScreen from './ClientManagementScreen';
import TaxRatesScreen from './TaxRatesScreen';
import LineItemLabelsScreen from './LineItemLabelsScreen';
import InvoiceTrackingScreen from './InvoiceTrackingScreen';
import EmployeeManagementScreen from './employees/EmployeeManagementScreen';
import UserManagementScreen from './UserManagementScreen';
import AnalyticsScreen from './AnalyticsScreen';
import SmsRoutingScreen from './SmsRoutingScreen';
import SecurityMonitorScreen from './SecurityMonitorScreen';
import TimeClockScreen from './TimeClockScreen';
import InstagramManagerScreen from './InstagramManagerScreen';

const AdminDashboardScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { t, currentLanguage, changeLanguage } = useLanguage();
  const [activeSection, setActiveSection] = useState('prices');
  const [activeTab, setActiveTab] = useState('cabinets');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      t('admin.logout'),
      t('admin.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('admin.logout'),
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
    { key: 'prices', label: t('admin.tabs.prices'), icon: DollarSign },
    { key: 'photos', label: t('admin.tabs.photos'), icon: ImageIcon },
    { key: 'employees', label: t('admin.tabs.employees'), icon: IdCard },
    { key: 'timeclock', label: t('timeclock.title'), icon: Clock },
    { key: 'designs', label: t('admin.tabs.designs'), icon: FileText },
    { key: 'invoices', label: t('admin.tabs.invoices'), icon: Receipt },
    { key: 'testimonials', label: t('admin.tabs.testimonials'), icon: MessageSquare },
    { key: 'instagram', label: t('admin.tabs.instagram'), icon: Instagram },
    { key: 'users', label: t('admin.tabs.users'), icon: Users, superAdminOnly: true },
    { key: 'analytics', label: t('admin.tabs.analytics'), icon: BarChart3, superAdminOnly: true },
    { key: 'sms-routing', label: t('admin.tabs.sms-routing'), icon: MessageCircle, superAdminOnly: true },
    { key: 'security', label: t('admin.tabs.security'), icon: Shield, superAdminOnly: true },
  ];

  // Filter sections based on user role
  const availableSections = sections.filter(section => 
    !section.superAdminOnly || user?.role === 'super_admin'
  );

  // Section-specific tabs
  // Note: 'prices' and 'photos' sections removed because they manage their own tabs internally
  const sectionTabs = {
    invoices: [
      { key: 'list', label: t('admin.tabs.allInvoices') },
      { key: 'clients', label: t('admin.tabs.clients') },
      { key: 'tax-rates', label: t('admin.tabs.taxRates') },
      { key: 'labels', label: t('admin.tabs.lineItems') },
      { key: 'tracking', label: t('admin.tabs.tracking') },
    ],
  };

  const getCurrentTabs = () => {
    return sectionTabs[activeSection] || [];
  };

  const renderContent = () => {
    // Render screens based on section
    if (activeSection === 'prices') {
      return <PriceManagementScreen />;
    }

    if (activeSection === 'photos') {
      // Photo management with upload, delete, edit, reorder capabilities
      return <PhotoManagementScreen />;
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
      case 'timeclock':
        return <TimeClockScreen navigation={navigation} />;
      case 'users':
        return user?.role === 'super_admin' ? <UserManagementScreen /> : null;
      case 'analytics':
        return user?.role === 'super_admin' ? <AnalyticsScreen /> : null;
      case 'sms-routing':
        return user?.role === 'super_admin' ? <SmsRoutingScreen /> : null;
      case 'security':
        return user?.role === 'super_admin' ? <SecurityMonitorScreen /> : null;
      case 'instagram':
        return <InstagramManagerScreen />;
      default:
        return (
          <View style={styles.placeholderContent}>
            <Text style={styles.placeholderText}>
              {sections.find(s => s.key === activeSection)?.label}
            </Text>
            <Text style={styles.placeholderSubtext}>
              {t('admin.implementationComingSoon')}
            </Text>
          </View>
        );
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />
      {/* Header - Matches Web */}
      <NavGlass style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('admin.panel')}</Text>
          <View style={styles.headerRight}>
            <View style={styles.userInfo}>
              <Text style={styles.welcomeText}>{t('admin.welcome')}</Text>
              <Text style={styles.username}>{user?.username || t('admin.defaultUsername')}</Text>
              {user?.role === 'super_admin' && (
                <Shield size={16} color={COLORS.accent} style={styles.badgeIcon} />
              )}
            </View>
            
            {/* Language Dropdown Selector */}
            <TouchableOpacity 
              style={styles.languageSelector}
              onPress={() => setShowLanguageMenu(!showLanguageMenu)}
            >
              <Globe size={12} color={COLORS.textLight} />
              <Text style={styles.languageSelectorText}>
                {currentLanguage.toUpperCase()}
              </Text>
              <ChevronDown size={12} color={COLORS.textLight} />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <LogOut size={18} color={COLORS.text} />
            </TouchableOpacity>
          </View>
        </View>
      </NavGlass>

      {/* Language Selection Modal */}
      <Modal
        visible={showLanguageMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLanguageMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageMenu(false)}
        >
          <View style={styles.languageMenu}>
            <TouchableOpacity
              style={[
                styles.languageMenuItem,
                currentLanguage === 'en' && styles.languageMenuItemActive
              ]}
              onPress={() => {
                changeLanguage('en');
                setShowLanguageMenu(false);
              }}
            >
              <Text style={[
                styles.languageMenuText,
                currentLanguage === 'en' && styles.languageMenuTextActive
              ]}>
                {t('language.english')}
              </Text>
              {currentLanguage === 'en' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
            <View style={styles.languageMenuDivider} />
            <TouchableOpacity
              style={[
                styles.languageMenuItem,
                currentLanguage === 'es' && styles.languageMenuItemActive
              ]}
              onPress={() => {
                changeLanguage('es');
                setShowLanguageMenu(false);
              }}
            >
              <Text style={[
                styles.languageMenuText,
                currentLanguage === 'es' && styles.languageMenuTextActive
              ]}>
                {t('language.spanish')}
              </Text>
              {currentLanguage === 'es' && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

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
      <View style={styles.content}>
        {renderContent()}
      </View>
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
    gap: SPACING[1],
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: TYPOGRAPHY.bold,
    color: COLORS.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
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
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.text,
  },
  badgeIcon: {
    marginLeft: SPACING[0],
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.glassDark,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Language Dropdown Selector
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.glassDark,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[1],
    gap: 4,
    minWidth: 60,
  },
  languageSelectorText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: TYPOGRAPHY.semibold,
    color: COLORS.textLight,
  },
  
  // Language Menu Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: SPACING[4],
  },
  languageMenu: {
    backgroundColor: COLORS.glass,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    minWidth: 150,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  languageMenuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
  },
  languageMenuItemActive: {
    backgroundColor: COLORS.glassDark,
  },
  languageMenuText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: TYPOGRAPHY.medium,
    color: COLORS.text,
  },
  languageMenuTextActive: {
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.bold,
  },
  languageMenuDivider: {
    height: 1,
    backgroundColor: COLORS.glassBorder,
  },
  checkmark: {
    fontSize: TYPOGRAPHY.lg,
    color: COLORS.accent,
    fontWeight: TYPOGRAPHY.bold,
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
