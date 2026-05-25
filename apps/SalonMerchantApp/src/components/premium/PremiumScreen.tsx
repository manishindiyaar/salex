import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  ViewStyle,
  StatusBar,
} from 'react-native';
import Icon from '@expo/vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Typography } from '../../theme/premium';

interface PremiumScreenProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  scrollable?: boolean;
  style?: ViewStyle;
  headerRight?: React.ReactNode;
}

export const PremiumScreen: React.FC<PremiumScreenProps> = ({
  children,
  title,
  showBackButton = false,
  onBackPress,
  scrollable = false,
  style,
  headerRight,
}) => {
  const navigation = useNavigation();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const ContentContainer = scrollable ? ScrollView : View;
  const extraProps = scrollable
    ? {
        showsVerticalScrollIndicator: false,
        keyboardShouldPersistTaps: 'handled' as const,
        contentContainerStyle: styles.scrollContent,
      }
    : {};

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      
      {/* Header bar */}
      <View style={styles.header}>
        {showBackButton ? (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Icon name="arrow-left" size={24} color={Colors.primaryInk} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backButtonSpacer} />
        )}

        {title ? (
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        ) : null}

        {headerRight ? (
          <View style={styles.headerRightContainer}>{headerRight}</View>
        ) : (
          <View style={styles.backButtonSpacer} />
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ContentContainer style={[styles.content, style]} {...extraProps}>
          {children}
        </ContentContainer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonSpacer: {
    width: 44,
  },
  headerTitle: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    flex: 1,
  },
  headerRightContainer: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl, // 24px standard margin
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xxl,
  },
});
