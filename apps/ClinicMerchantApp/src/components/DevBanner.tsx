import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AUTH_CONFIG } from '../config';

/**
 * Development Banner Component
 * 
 * Shows a banner when authentication is disabled to make it clear
 * that the app is running in development mode.
 */
const DevBanner: React.FC = () => {
  // Only show in development when auth is disabled
  if (__DEV__ && !AUTH_CONFIG.ENABLE_AUTH) {
    return (
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          🔧 DEV MODE: Authentication Disabled
        </Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FF6B35',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default DevBanner;