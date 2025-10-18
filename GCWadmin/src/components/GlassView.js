/**
 * GlassView Component
 *
 * Matches the web admin's glass effects from admin.css
 * - .admin-nav-glass: backdrop-filter blur(10px), rgba(255,255,255,0.25)
 * - .admin-tab-glass: backdrop-filter blur(5px), rgba(255,255,255,0.1)
 * - .admin-header-glass: backdrop-filter blur(15px), rgba(255,255,255,0.15)
 *
 * Supports iOS 16+ with automatic fallbacks
 */

import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import LinearGradient from 'react-native-linear-gradient';

const GlassView = ({
  children,
  style,
  intensity = 'regular', // 'light' | 'regular' | 'strong'
  tint = 'light', // 'light' | 'dark'
  showBorder = true,
  showShadow = false,
  animated = false,
  ...props
}) => {
  // Glass effect configurations matching web admin
  const glassConfig = {
    light: {
      blurType: 'light',
      blurAmount: 5,
      overlayColor: 'rgba(255, 255, 255, 0.1)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      shadowColor: 'rgba(31, 38, 135, 0.15)',
    },
    regular: {
      blurType: 'light',
      blurAmount: 10,
      overlayColor: 'rgba(255, 255, 255, 0.25)',
      borderColor: 'rgba(255, 255, 255, 0.18)',
      shadowColor: 'rgba(31, 38, 135, 0.37)',
    },
    strong: {
      blurType: 'light',
      blurAmount: 15,
      overlayColor: 'rgba(255, 255, 255, 0.15)',
      borderColor: 'rgba(255, 255, 255, 0.2)',
      shadowColor: 'rgba(31, 38, 135, 0.2)',
    },
  };

  const config = glassConfig[intensity];

  // For iOS 13+, use BlurView
  // For older versions, use semi-transparent overlay
  const renderGlass = () => {
    if (Platform.OS === 'ios' && Platform.Version >= 13) {
      return (
        <BlurView
          style={[styles.absolute, style]}
          blurType={config.blurType}
          blurAmount={config.blurAmount}
          reducedTransparencyFallbackColor={config.overlayColor}
          {...props}
        >
          {/* Overlay to match web admin's rgba */}
          <View
            style={[
              styles.absolute,
              {
                backgroundColor: config.overlayColor,
                borderWidth: showBorder ? 1 : 0,
                borderColor: config.borderColor,
              },
              showShadow && {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.37,
                shadowRadius: 32,
                elevation: 8,
              },
            ]}
          >
            {children}
          </View>
        </BlurView>
      );
    }

    // Fallback for older iOS or non-iOS platforms
    return (
      <View
        style={[
          styles.absolute,
          style,
          {
            backgroundColor: config.overlayColor,
            borderWidth: showBorder ? 1 : 0,
            borderColor: config.borderColor,
          },
        ]}
        {...props}
      >
        {children}
      </View>
    );
  };

  return renderGlass();
};

// Specific glass components matching web admin classes

export const NavGlass = ({ children, style, ...props }) => (
  <GlassView
    intensity="regular"
    showBorder={true}
    showShadow={true}
    style={[styles.navGlass, style]}
    {...props}
  >
    {children}
  </GlassView>
);

export const TabGlass = ({ children, style, active = false, ...props }) => (
  <GlassView
    intensity="light"
    showBorder={true}
    style={[
      styles.tabGlass,
      active && styles.tabGlassActive,
      style,
    ]}
    {...props}
  >
    {children}
  </GlassView>
);

export const HeaderGlass = ({ children, style, ...props }) => (
  <GlassView
    intensity="strong"
    showBorder={true}
    style={[styles.headerGlass, style]}
    {...props}
  >
    {children}
  </GlassView>
);

export const ContentGlass = ({ children, style, ...props }) => (
  <GlassView
    intensity="light"
    showBorder={true}
    showShadow={true}
    style={[styles.contentGlass, style]}
    {...props}
  >
    {children}
  </GlassView>
);

const styles = StyleSheet.create({
  absolute: {
    ...StyleSheet.absoluteFillObject,
  },
  navGlass: {
    borderRadius: 0,
  },
  tabGlass: {
    borderRadius: 12,
    margin: 4,
  },
  tabGlassActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderColor: 'rgba(59, 130, 246, 0.5)',
  },
  headerGlass: {
    borderRadius: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  contentGlass: {
    borderRadius: 16,
    margin: 20,
    padding: 30,
  },
});

export default GlassView;
