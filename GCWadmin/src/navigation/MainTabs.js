import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import InvoicesStack from './InvoicesStack';
import PhotosScreen from '../screens/PhotosScreen';
import DesignsScreen from '../screens/DesignsScreen';
import MoreScreen from '../screens/MoreScreen';
import GlassTabBar from '../components/GlassTabBar';
import { COLORS } from '../constants/colors';

const Tab = createBottomTabNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.primary,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Invoices"
        component={InvoicesStack}
        options={{
          title: 'Invoices',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Photos"
        component={PhotosScreen}
        options={{
          title: 'Photos',
        }}
      />
      <Tab.Screen
        name="Designs"
        component={DesignsScreen}
        options={{
          title: 'Designs',
        }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          title: 'More',
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabs;
