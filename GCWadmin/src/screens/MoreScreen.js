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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
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
    { title: 'Employees', screen: 'Employees' },
    { title: 'Price Management', screen: 'PriceManagement' },
    { title: 'Testimonials', screen: 'Testimonials' },
    { title: 'Analytics', screen: 'Analytics', adminOnly: true },
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

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => {
            if (item.adminOnly && user?.role !== 'super_admin') {
              return null;
            }

            return (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  Alert.alert('Coming Soon', `${item.title} will be implemented soon`);
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
          <Text style={styles.logoutButtonText}>Logout</Text>
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
