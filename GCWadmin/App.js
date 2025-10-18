/**
 * GCWadmin - Gudino Custom Admin Panel
 * iOS Admin App for Kitchen/Bathroom Design Business
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { PricingProvider } from './src/contexts/PricingContext';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  return (
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
  );
}

export default App;
