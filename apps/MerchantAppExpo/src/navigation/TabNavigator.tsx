import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import BookingsScreen from '../screens/main/BookingsScreen';
import ServicesScreen from '../screens/main/ServicesScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import DashboardScreen from '../screens/main/DashboardScreen';
import QrCodeScreen from '../screens/main/QrCodeScreen';
import { Colors } from '../theme/config';

export type RootTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Services: undefined;
  Profile: undefined;
  QrCode: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

/**
 * NOTE:
 * - Registered Bookings, Services, and Business Profile screens wired to Zustand stores.
 * - Kept a Home/Welcome route (can be replaced with dashboard if desired).
 * - This navigator is imported from App.tsx.
 */
export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home';
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'calendar' : 'calendar';
          } else if (route.name === 'Services') {
            iconName = focused ? 'scissors' : 'scissors';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'user' : 'user';
          } else if (route.name === 'QrCode') {
            iconName = focused ? 'square' : 'square';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.PRIMARY,
        tabBarInactiveTintColor: Colors.TEXT_SECONDARY,
        tabBarStyle: {
          backgroundColor: Colors.SURFACE,
          borderTopColor: Colors.BORDER,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={DashboardScreen} 
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Services" component={ServicesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
      <Tab.Screen 
        name="QrCode" 
        component={QrCodeScreen} 
        options={{ title: 'QR Code' }}
      />
    </Tab.Navigator>
  );
}
