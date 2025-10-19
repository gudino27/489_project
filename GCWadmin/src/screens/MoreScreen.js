import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { COLORS } from '../constants/colors';
import { ContentGlass } from '../components/GlassView';

const MoreScreen = () => {
  const { user, logout } = useAuth();
  const { t, currentLanguage, changeLanguage } = useLanguage();

  const handleLogout = () => {
    Alert.alert(
      t('more.logout'),
      t('more.logout_confirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('more.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ],
      { cancelable: true }
    );
  };

  const menuItems = [
    { title: t('more.employees'), screen: 'Employees' },
    { title: t('more.price_management'), screen: 'PriceManagement' },
    { title: t('more.testimonials'), screen: 'Testimonials' },
    { title: t('more.analytics'), screen: 'Analytics', adminOnly: true },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user?.username?.charAt(0).toUpperCase() || 'A'}
            </Text>
          </View>
          <Text style={styles.username}>{user?.username || 'Admin'}</Text>
          <Text style={styles.role}>{user?.role || 'Administrator'}</Text>
        </View>

        {/* Language Selector */}
        <ContentGlass style={styles.languageSection}>
          <Text style={styles.sectionTitle}>🌐 {t('language.select')}</Text>
          <View style={styles.languageButtons}>
            <TouchableOpacity
              style={[
                styles.languageButton,
                currentLanguage === 'en' && styles.languageButtonActive
              ]}
              onPress={() => changeLanguage('en')}
            >
              <Text style={[
                styles.languageButtonText,
                currentLanguage === 'en' && styles.languageButtonTextActive
              ]}>
                English
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.languageButton,
                currentLanguage === 'es' && styles.languageButtonActive
              ]}
              onPress={() => changeLanguage('es')}
            >
              <Text style={[
                styles.languageButtonText,
                currentLanguage === 'es' && styles.languageButtonTextActive
              ]}>
                Español
              </Text>
            </TouchableOpacity>
          </View>
        </ContentGlass>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => {
            if (item.adminOnly && user?.role !== 'super_admin') {
              return null;
            }

            return (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  Alert.alert(t('common.coming_soon'), `${item.title}`);
                }}
              >
                <ContentGlass style={styles.menuItem}>
                  <Text style={styles.menuItemText}>{item.title}</Text>
                  <Text style={styles.menuItemArrow}>›</Text>
                </ContentGlass>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>{t('more.logout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: COLORS.primary,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
  },
  languageSection: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  languageButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  languageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  languageButtonTextActive: {
    color: COLORS.white,
  },
  menuSection: {
    marginTop: 20,
    padding: 16,
    gap: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  menuItemArrow: {
    fontSize: 24,
    color: COLORS.textLight,
  },
  logoutButton: {
    margin: 20,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MoreScreen;
