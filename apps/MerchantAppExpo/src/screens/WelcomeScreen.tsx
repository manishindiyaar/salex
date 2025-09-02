import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Animated,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GradientView } from '../components/ui/GradientView';
import { Button } from '../components/ui/Button';
import { Colors, Typography, Spacing, BorderRadius } from '@theme/config';

interface WelcomeScreenProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

// Mock data for UI display - will be replaced with real data from API in future
const MOCK_DATA = {
  businessName: 'Salex',
  tagline: 'Bookings, payments and insights – without the clutter.',
  usersCount: 5000,
  satisfactionRating: 4.8,
  features: [
    'WhatsApp Bookings',
    'Smart Scheduling', 
    'Business Analytics',
    'Customer Management'
  ]
};

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    // Navigate to Phone Auth as per your complete flow plan
    navigation.navigate('PhoneAuth');
  };

  // Debug function to clear all app data
  const handleClearStorage = async () => {
    Alert.alert(
      'Clear App Data',
      'This will clear all app data and restart fresh. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              // Force remove individual keys if clear() fails
              await AsyncStorage.multiRemove(['@salex_onboarded', 'business_id']);
              
              try {
                await AsyncStorage.clear();
              } catch (clearError) {
                console.log('⚠️ Full clear failed, but individual keys removed');
              }
              
              Alert.alert('Success', 'App data cleared! Please force close and reopen the app completely.');
              console.log('✅ AsyncStorage cleared successfully');
            } catch (error) {
              console.error('❌ Failed to clear AsyncStorage:', error);
              Alert.alert('Error', 'Failed to clear app data. Try restarting the app.');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.BACKGROUND} />
      
      {/* Debug Clear Button - Remove in production */}
      <TouchableOpacity 
        style={styles.debugButton} 
        onPress={handleClearStorage}
      >
        <Text style={styles.debugText}>🔧 Clear Data</Text>
      </TouchableOpacity>
      
      <GradientView variant="dark" style={styles.gradient}>
        <View style={styles.content}>
          {/* Logo & Brand Section */}
          <Animated.View 
            style={[
              styles.brandSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.logoContainer}>
              <Icon name="scissors" size={40} color={Colors.TEXT} />
            </View>
            <Text style={styles.brandName}>Welcome to Salex</Text>
            <Text style={styles.tagline}>Streamline your salon with smart bookings and seamless customer management</Text>
          </Animated.View>

          {/* Features Section */}
          <Animated.View 
            style={[
              styles.featuresSection,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <View style={styles.featuresRow}>
              {MOCK_DATA.features.slice(0, 2).map((feature, index) => (
                <View key={index} style={styles.featureItemMinimal}>
                  <Icon name="check" size={16} color={'#A6A6A6'} />
                  <Text style={styles.featureTextMinimal}>{feature}</Text>
                </View>
              ))}
            </View>
            <View style={styles.featuresRow}>
              {MOCK_DATA.features.slice(2, 4).map((feature, index) => (
                <View key={index} style={styles.featureItemMinimal}>
                  <Icon name="check" size={16} color={'#A6A6A6'} />
                  <Text style={styles.featureTextMinimal}>{feature}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* CTA Section */}
          <Animated.View 
            style={[
              styles.ctaSection,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Button
              title="Get Started"
              onPress={handleGetStarted}
              size="large"
              fullWidth
              style={styles.getStartedButton}
            />
            <Text style={styles.footerText}>
              Join thousands of salon owners who trust Salex
            </Text>
          </Animated.View>
        </View>
      </GradientView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.BACKGROUND,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.XL,
    justifyContent: 'space-between',
  },
  brandSection: {
    alignItems: 'center',
    marginTop: Spacing.XXL,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.ROUND,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  brandName: {
    fontFamily: 'Inter',
    color: Colors.TEXT,
    marginBottom: Spacing.XS,
    fontWeight: '700',
    fontSize: 28,
    letterSpacing: -0.2,
  },
  tagline: {
    fontFamily: 'Inter',
    color: '#A6A6A6',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.MD,
    fontSize: 12,
    marginTop: Spacing.XS,
  },
  featuresSection: {
    alignItems: 'center',
    gap: Spacing.SM,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: Spacing.LG,
  },
  featureItemMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureTextMinimal: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#D8D8D8',
    marginLeft: Spacing.XS,
  },
  ctaSection: {
    alignItems: 'center',
    paddingBottom: Spacing.LG,
  },
  getStartedButton: {
    backgroundColor: Colors.PRIMARY,
    marginBottom: Spacing.LG,
    borderRadius: BorderRadius.LG,
    shadowColor: Colors.PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  footerText: {
    fontFamily: 'Inter',
    color: '#777777',
    textAlign: 'center',
    paddingHorizontal: Spacing.MD,
    fontSize: 11,
  },
  debugButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 1000,
  },
  debugText: {
    color: Colors.TEXT,
    fontSize: 12,
    fontWeight: '600',
  },
});

export default WelcomeScreen;
