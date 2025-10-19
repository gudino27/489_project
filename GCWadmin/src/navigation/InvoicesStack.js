import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import InvoicesScreen from '../screens/InvoicesScreen';
import InvoiceDetailsScreen from '../screens/invoices/InvoiceDetailsScreen';
import CreateInvoiceScreen from '../screens/CreateInvoiceScreen';
import { COLORS } from '../constants/colors';

const Stack = createNativeStackNavigator();

const InvoicesStack = () => {
  return (
    <Stack.Navigator
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
      <Stack.Screen
        name="InvoicesList"
        component={InvoicesScreen}
        options={{
          headerShown: false, // Hide header as it's shown in the tab navigator
        }}
      />
      <Stack.Screen
        name="InvoiceDetails"
        component={InvoiceDetailsScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreateInvoice"
        component={CreateInvoiceScreen}
        options={{
          title: 'Create Invoice',
        }}
      />
    </Stack.Navigator>
  );
};

export default InvoicesStack;
