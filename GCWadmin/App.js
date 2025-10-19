/**
 * GCWadmin - Gudino Custom Admin Panel
 * iOS Admin App for Kitchen/Bathroom Design Business
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/contexts/AuthContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { PricingProvider } from './src/contexts/PricingContext';
import AppNavigator from './src/navigation/AppNavigator';
import { setupNotificationListeners, cleanupNotificationListeners } from './src/utils/notifications';

function App() {
  useEffect(() => {
    // Set up notification listeners when app starts
    const listeners = setupNotificationListeners();

    // Cleanup listeners when app unmounts
    return () => {
      cleanupNotificationListeners(listeners);
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LanguageProvider>
          <AuthProvider>
            <PricingProvider>
              <StatusBar barStyle="light-content" />
              <AppNavigator />
            </PricingProvider>
          </AuthProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
