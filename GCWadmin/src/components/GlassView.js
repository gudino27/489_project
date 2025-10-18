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
    // TEMPORARY: Use fallback until native module is compiled
    // After rebuilding in Xcode, this will automatically use BlurView
    const useBlur = false; // Set to true after Xcode rebuild

    if (useBlur && Platform.OS === 'ios' && Platform.Version >= 13) {
      return (
        <BlurView
          style={[style]}
          blurType={config.blurType}
          blurAmount={config.blurAmount}
          reducedTransparencyFallbackColor={config.overlayColor}
          {...props}
        >
          <View
            style={[
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
          style,
          {
            backgroundColor: config.overlayColor,
            borderWidth: showBorder ? 1 : 0,
            borderColor: config.borderColor,
          },
          showShadow && {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 4,
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
  navGlass: {
    borderRadius: 0,
  },
  tabGlass: {
    borderRadius: 12,
  },
  tabGlassActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.5)',
    borderColor: 'rgba(59, 130, 246, 0.8)',
  },
  headerGlass: {
    borderRadius: 0,
  },
  contentGlass: {
    borderRadius: 16,
  },
});

export default GlassView;
