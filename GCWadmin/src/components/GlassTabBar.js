/**
 * GlassTabBar Component
 *
 * Custom tab bar with glass effect matching web admin's .admin-tab-glass
 * Used as tabBar prop in Bottom Tab Navigator
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { COLORS } from '../constants/colors';

const GlassTabBar = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <BlurView
      style={[styles.container, { paddingBottom: insets.bottom }]}
      intensity={60}
      tint="light"
    >
      {/* Glass overlay matching admin.css */}
      <View style={styles.overlay}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Tab icons matching web admin
          const icons = {
            Invoices: '📄',
            Photos: '📸',
            Designs: '🎨',
            More: '⋯',
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tab, isFocused && styles.tabActive]}
            >
              {/* Icon */}
              <Text style={[styles.icon, isFocused && styles.iconActive]}>
                {icons[route.name] || '•'}
              </Text>

              {/* Label */}
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {label}
              </Text>

              {/* Active indicator (glass pill) */}
              {isFocused && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    // Matching .admin-nav-glass shadow
    shadowColor: 'rgba(31, 38, 135, 0.37)',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 10,
  },
  overlay: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.25)', // Matches admin-nav-glass
    paddingTop: 8,
    paddingBottom: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    position: 'relative',
    // Matching .admin-tab-glass transition
    transitionProperty: 'transform, background-color',
    transitionDuration: '0.3s',
  },
  tabActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)', // Subtle blue tint when active
    borderRadius: 12,
    // Slight elevation on active tab (matching web hover)
    transform: [{ translateY: -2 }],
  },
  icon: {
    fontSize: 24,
    opacity: 0.6,
    marginBottom: 4,
  },
  iconActive: {
    opacity: 1,
    // Blue tint for active icon
    textShadowColor: 'rgba(59, 130, 246, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  labelActive: {
    color: '#1d4ed8', // Matching .admin-tab-glass.active color
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 32,
    height: 3,
    backgroundColor: '#3b82f6', // Blue accent matching web admin
    borderRadius: 2,
    // Glass effect on indicator
    shadowColor: 'rgba(59, 130, 246, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
});

export default GlassTabBar;
