import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import DashboardScreen from '../screens/main/DashboardScreen';
import BookingsScreen from '../screens/main/BookingsScreen';
import ServicesScreen from '../screens/main/ServicesScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import { AccountSuspendedScreen } from '../screens/AccountSuspendedScreen';
import { Colors } from '../theme/config';
import { useBusinessStore } from '../store/businessStore';

/**
 * High-Strength 4-Tab Navigation
 * 
 * Tab 1: Home (Command Center) - Today's bookings, revenue, chai-break
 * Tab 2: Bookings - Full booking management with filters
 * Tab 3: Catalogue (Service Menu) - Manage services and prices
 * Tab 4: My Account (History) - Revenue summaries, booking history
 */

export type RootTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Catalogue: undefined;
  MyAccount: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export default function TabNavigator() {
  const { business } = useBusinessStore();

  // Check if business is deactivated
  if (business && business.isActive === false) {
    return <AccountSuspendedScreen businessName={business.name} />;
  }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Bookings') {
            iconName = 'calendar';
          } else if (route.name === 'Catalogue') {
            iconName = 'scissors';
          } else if (route.name === 'MyAccount') {
            iconName = 'user';
          }

          return (
            <View style={focused ? styles.activeIconContainer : undefined}>
              <Icon name={iconName as any} size={size} color={color} />
            </View>
          );
        },
        tabBarActiveTintColor: Colors.PRIMARY,
        tabBarInactiveTintColor: Colors.TEXT_SECONDARY,
        tabBarStyle: {
          backgroundColor: Colors.BACKGROUND,
          borderTopColor: Colors.BORDER,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter-Medium',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={DashboardScreen} 
        options={{ 
          title: 'Home',
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Bookings" 
        component={BookingsScreen} 
        options={{ 
          title: 'Bookings',
          tabBarLabel: 'Bookings',
        }}
      />
      <Tab.Screen 
        name="Catalogue" 
        component={ServicesScreen} 
        options={{ 
          title: 'Catalogue',
          tabBarLabel: 'Catalogue',
        }}
      />
      <Tab.Screen 
        name="MyAccount" 
        component={ProfileScreen} 
        options={{ 
          title: 'My Account',
          tabBarLabel: 'My Account',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  activeIconContainer: {
    backgroundColor: 'rgba(3, 3, 31, 0.05)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});
