/**
 * SetupCompletionBanner Component
 * 
 * Banner shown when onboarding is incomplete.
 * Prompts user to complete setup and links to wizard.
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { Colors } from '../../theme/config';

interface SetupCompletionBannerProps {
  onPress: () => void;
  onDismiss?: () => void;
}

export const SetupCompletionBanner: React.FC<SetupCompletionBannerProps> = ({
  onPress,
  onDismiss,
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🚀</Text>
        </View>
        <View style={styles.textContainer}>
          <Text variant="titleSmall" style={styles.title}>
            Complete Your Setup
          </Text>
          <Text variant="bodySmall" style={styles.description}>
            Add resources and staff to start accepting bookings
          </Text>
        </View>
        {onDismiss && (
          <IconButton
            icon="close"
            size={20}
            onPress={onDismiss}
            style={styles.closeButton}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.PRIMARY,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  icon: {
    fontSize: 32,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: 'white',
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  closeButton: {
    margin: 0,
  },
});
