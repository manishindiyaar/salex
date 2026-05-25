import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import Icon from '@expo/vector-icons/Feather';

import { Button, GradientView } from '@components/index';
import { Colors, Spacing, Typography, BorderRadius } from '../../theme/config';
import { useOnboardingStore } from '@store/onboardingStore';
import { CLINIC_CONFIG } from '../../config/clinicConfig';

interface DayHours {
  open: string;
  close: string;
  closed: boolean;
}

interface BusinessHoursScreenProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

const BusinessHoursScreen: React.FC<BusinessHoursScreenProps> = ({ navigation }) => {
  const { businessDraft, updateBusinessDraft } = useOnboardingStore();
  
  const getDefaultHours = () => {
    if (businessDraft.hoursOfOperation) return businessDraft.hoursOfOperation;
    // Pre-populate with Salon default hours from clinicConfig
    return { ...CLINIC_CONFIG.defaultHours };
  };
  
  // Initialize with template defaults or existing hours
  const [hours, setHours] = useState<Record<string, DayHours>>(getDefaultHours());
  const [isLoading, setIsLoading] = useState(false);

  const dayNames: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday', 
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };

  const timeSlots = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
    '22:00', '22:30', '23:00',
  ];

  const toggleDay = (day: string) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        closed: !prev[day].closed,
        // Set default hours when opening
        open: !prev[day].closed ? prev[day].open : '09:00',
        close: !prev[day].closed ? prev[day].close : '18:00',
      }
    }));
  };

  const updateTime = (day: string, type: 'open' | 'close', time: string) => {
    setHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [type]: time,
      }
    }));
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const copyToAllDays = (sourceDay: string) => {
    const sourceHours = hours[sourceDay];
    Alert.alert(
      'Copy Hours',
      `Copy ${dayNames[sourceDay]} hours to all other days?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Copy',
          onPress: () => {
            const newHours = { ...hours };
            Object.keys(newHours).forEach(day => {
              if (day !== sourceDay) {
                newHours[day] = { ...sourceHours };
              }
            });
            setHours(newHours);
          }
        }
      ]
    );
  };

  const setCommonHours = (preset: string) => {
    let newHours = { ...hours };
    
    switch (preset) {
      case 'business':
        // Monday-Friday 9-5, Saturday 9-3, Sunday closed
        Object.keys(newHours).forEach(day => {
          if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].includes(day)) {
            newHours[day] = { open: '09:00', close: '17:00', closed: false };
          } else if (day === 'saturday') {
            newHours[day] = { open: '09:00', close: '15:00', closed: false };
          } else {
            newHours[day] = { open: '', close: '', closed: true };
          }
        });
        break;
      case 'retail':
        // Monday-Saturday 10-8, Sunday 12-6
        Object.keys(newHours).forEach(day => {
          if (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].includes(day)) {
            newHours[day] = { open: '10:00', close: '20:00', closed: false };
          } else {
            newHours[day] = { open: '12:00', close: '18:00', closed: false };
          }
        });
        break;
      case '247':
        // 24/7 operation
        Object.keys(newHours).forEach(day => {
          newHours[day] = { open: '00:00', close: '23:59', closed: false };
        });
        break;
    }
    
    setHours(newHours);
  };

  const validateHours = () => {
    const openDays = Object.entries(hours).filter(([_, dayHours]) => !dayHours.closed);
    
    if (openDays.length === 0) {
      Alert.alert('Business Hours Required', 'Please set hours for at least one day.');
      return false;
    }

    for (const [day, dayHours] of openDays) {
      if (!dayHours.open || !dayHours.close) {
        Alert.alert('Invalid Hours', `Please set both opening and closing times for ${dayNames[day]}.`);
        return false;
      }

      const openTime = dayHours.open.split(':').map(Number);
      const closeTime = dayHours.close.split(':').map(Number);
      const openMinutes = openTime[0] * 60 + openTime[1];
      const closeMinutes = closeTime[0] * 60 + closeTime[1];

      if (openMinutes >= closeMinutes) {
        Alert.alert('Invalid Hours', `${dayNames[day]} closing time must be after opening time.`);
        return false;
      }
    }

    return true;
  };

  const handleContinue = async () => {
    if (!validateHours()) {
      return;
    }

    setIsLoading(true);

    // Update the business draft in store
    updateBusinessDraft({
      hoursOfOperation: hours,
    });

    // Mock API delay - in production would save to backend
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('ReviewComplete');
    }, 1000);
  };

  const renderTimeSelector = (day: string, type: 'open' | 'close', currentTime: string) => (
    <View style={styles.timeSelector}>
      <Text style={styles.timeSelectorLabel}>{type === 'open' ? 'Opens' : 'Closes'}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timeOptions}
      >
        {timeSlots.map(time => (
          <TouchableOpacity
            key={time}
            style={[
              styles.timeOption,
              currentTime === time && styles.timeOptionSelected
            ]}
            onPress={() => updateTime(day, type, time)}
          >
            <Text style={[
              styles.timeOptionText,
              currentTime === time && styles.timeOptionTextSelected
            ]}>
              {formatTime(time)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.BACKGROUND} />
      <GradientView variant="dark" style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color={Colors.TEXT} />
          </TouchableOpacity>
          
          <View style={styles.headerContent}>
            <View style={styles.logoContainer}>
              <Icon name="clock" size={32} color={Colors.PRIMARY} />
            </View>
            <Text style={styles.title}>Business Hours</Text>
            <Text style={styles.subtitle}>
              When are you open for appointments?
            </Text>
            
            {/* Progress indicator */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '100%' }]} />
              </View>
              <Text style={styles.progressText}>Step 5 of 5</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Setup</Text>
            <View style={styles.presetButtons}>
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => setCommonHours('business')}
              >
                <Icon name="briefcase" size={16} color={Colors.PRIMARY} />
                <Text style={styles.presetButtonText}>Business Hours</Text>
                <Text style={styles.presetButtonSub}>Mon-Fri 9-5</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.presetButton}
                onPress={() => setCommonHours('retail')}
              >
                <Icon name="shopping-bag" size={16} color={Colors.PRIMARY} />
                <Text style={styles.presetButtonText}>Retail Hours</Text>
                <Text style={styles.presetButtonSub}>Extended weekends</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Daily Hours */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly Schedule</Text>
            {Object.entries(dayNames).map(([day, displayName]) => (
              <View key={day} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayInfo}>
                    <Text style={styles.dayName}>{displayName}</Text>
                    {!hours[day].closed && (
                      <Text style={styles.dayHours}>
                        {formatTime(hours[day].open)} - {formatTime(hours[day].close)}
                      </Text>
                    )}
                    {hours[day].closed && (
                      <Text style={styles.dayClosed}>Closed</Text>
                    )}
                  </View>
                  
                  <View style={styles.dayActions}>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => copyToAllDays(day)}
                    >
                      <Icon name="copy" size={16} color={Colors.TEXT_SECONDARY} />
                    </TouchableOpacity>
                    
                    <Switch
                      value={!hours[day].closed}
                      onValueChange={() => toggleDay(day)}
                      trackColor={{ false: Colors.DISABLED, true: Colors.PRIMARY + '40' }}
                      thumbColor={!hours[day].closed ? Colors.PRIMARY : Colors.TEXT_SECONDARY}
                    />
                  </View>
                </View>

                {!hours[day].closed && (
                  <View style={styles.timeControls}>
                    {renderTimeSelector(day, 'open', hours[day].open)}
                    {renderTimeSelector(day, 'close', hours[day].close)}
                  </View>
                )}
              </View>
            ))}
          </View>

          {/* Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Icon name="calendar" size={16} color={Colors.PRIMARY} />
                <Text style={styles.summaryText}>
                  Open {Object.values(hours).filter(h => !h.closed).length} days per week
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Icon name="clock" size={16} color={Colors.PRIMARY} />
                <Text style={styles.summaryText}>
                  Customers can book during your business hours
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Icon name="bell" size={16} color={Colors.PRIMARY} />
                <Text style={styles.summaryText}>
                  You'll receive notifications for new bookings
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Button
            title="Complete Setup"
            onPress={handleContinue}
            loading={isLoading}
            size="large"
            fullWidth
          />
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
  header: {
    paddingTop: Spacing.XL,
    paddingBottom: Spacing.LG,
  },
  backButton: {
    position: 'absolute',
    top: Spacing.XL,
    left: Spacing.LG,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.SM,
    backgroundColor: Colors.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  headerContent: {
    alignItems: 'center',
    paddingHorizontal: Spacing.LG,
    paddingTop: Spacing.XL,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.ROUND,
    backgroundColor: Colors.SURFACE,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.LG,
  },
  title: {
    ...Typography.H2,
    color: Colors.TEXT,
    textAlign: 'center',
    marginBottom: Spacing.SM,
  },
  subtitle: {
    ...Typography.Body1,
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.LG,
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '80%',
    height: 4,
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.SM,
    marginBottom: Spacing.XS,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.PRIMARY,
    borderRadius: BorderRadius.SM,
  },
  progressText: {
    ...Typography.Caption,
    color: Colors.TEXT_TERTIARY,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.LG,
  },
  section: {
    marginBottom: Spacing.XL,
  },
  sectionTitle: {
    ...Typography.H4,
    color: Colors.TEXT,
    marginBottom: Spacing.MD,
  },
  presetButtons: {
    flexDirection: 'row',
    gap: Spacing.MD,
  },
  presetButton: {
    flex: 1,
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  presetButtonText: {
    ...Typography.Body1,
    color: Colors.TEXT,
    fontWeight: '600',
    marginTop: Spacing.SM,
    textAlign: 'center',
  },
  presetButtonSub: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    marginTop: Spacing.XS,
    textAlign: 'center',
  },
  dayCard: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    marginBottom: Spacing.MD,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    ...Typography.H4,
    color: Colors.TEXT,
    marginBottom: Spacing.XS,
  },
  dayHours: {
    ...Typography.Body1,
    color: Colors.TEXT_SECONDARY,
  },
  dayClosed: {
    ...Typography.Body1,
    color: Colors.TEXT_TERTIARY,
    fontStyle: 'italic',
  },
  dayActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.MD,
  },
  copyButton: {
    padding: Spacing.SM,
  },
  timeControls: {
    marginTop: Spacing.LG,
    gap: Spacing.MD,
  },
  timeSelector: {
    marginBottom: Spacing.SM,
  },
  timeSelectorLabel: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    marginBottom: Spacing.SM,
  },
  timeOptions: {
    paddingRight: Spacing.LG,
  },
  timeOption: {
    backgroundColor: Colors.SURFACE_VARIANT,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
    marginRight: Spacing.SM,
    borderWidth: 1,
    borderColor: Colors.BORDER,
  },
  timeOptionSelected: {
    backgroundColor: Colors.PRIMARY,
    borderColor: Colors.PRIMARY,
  },
  timeOptionText: {
    ...Typography.Body2,
    color: Colors.TEXT,
    fontSize: 13,
  },
  timeOptionTextSelected: {
    color: Colors.TEXT,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.MD,
  },
  summaryText: {
    ...Typography.Body1,
    color: Colors.TEXT,
    marginLeft: Spacing.MD,
    flex: 1,
  },
  footer: {
    paddingHorizontal: Spacing.LG,
    paddingBottom: Spacing.XL,
  },
  templateDefaultsCard: {
    backgroundColor: Colors.SURFACE,
    borderRadius: BorderRadius.LG,
    padding: Spacing.LG,
    borderWidth: 2,
    borderColor: Colors.PRIMARY + '30',
  },
  templateDefaultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  templateDefaultsTitle: {
    ...Typography.H4,
    color: Colors.TEXT,
    marginLeft: Spacing.SM,
  },
  templateDefaultsDescription: {
    ...Typography.Body2,
    color: Colors.TEXT_SECONDARY,
    lineHeight: 20,
    marginBottom: Spacing.LG,
  },
  useTemplateButton: {
    alignSelf: 'flex-start',
  },
});

export default BusinessHoursScreen;