import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { PremiumScreen } from '../../components/premium/PremiumScreen';
import { PremiumButton } from '../../components/premium/PremiumButton';
import { ChoicePill } from '../../components/premium/ChoicePill';
import { Colors, Spacing, Typography } from '../../theme/premium';

interface GoalsScreenProps {
  route: {
    params: {
      businessId: string;
    };
  };
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

const GOALS_LIST = [
  'Fill empty slots',
  'Manage staff schedules',
  'Set up services and prices',
  'Track daily revenue',
  'Reduce no-shows',
  "I'm not sure",
];

const GoalsScreen: React.FC<GoalsScreenProps> = ({ route, navigation }) => {
  const { businessId } = route.params;
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const handleToggleGoal = (goal: string) => {
    if (goal === "I'm not sure") {
      setSelectedGoals([goal]);
      return;
    }

    let updated = [...selectedGoals].filter(g => g !== "I'm not sure");
    if (updated.includes(goal)) {
      updated = updated.filter(g => g !== goal);
    } else {
      updated.push(goal);
    }
    setSelectedGoals(updated);
  };

  const handleContinue = () => {
    // Simply navigate to ContactLocation screen
    navigation.navigate('ContactLocation');
  };

  const isNextEnabled = selectedGoals.length > 0;

  return (
    <PremiumScreen showBackButton onBackPress={() => navigation.goBack()}>
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header titles */}
          <Text style={[styles.title, Typography.sectionHeadline]}>
            Where would you like to start?
          </Text>
          <Text style={[styles.subtitle, Typography.body]}>
            Select what matters most right now
          </Text>

          {/* Goals Options List */}
          <View style={styles.listContainer}>
            {GOALS_LIST.map((goal, index) => (
              <ChoicePill
                key={index}
                label={goal}
                selected={selectedGoals.includes(goal)}
                onPress={() => handleToggleGoal(goal)}
              />
            ))}
          </View>
        </ScrollView>

        {/* Action button */}
        <View style={styles.actionContainer}>
          <PremiumButton
            title="NEXT ➔"
            variant="filled"
            disabled={!isNextEnabled}
            onPress={handleContinue}
          />
        </View>
      </View>
    </PremiumScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: Spacing.xl,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    color: Colors.secondaryText,
    marginBottom: Spacing.xl,
  },
  listContainer: {
    width: '100%',
    marginVertical: Spacing.md,
  },
  actionContainer: {
    width: '100%',
    marginTop: Spacing.md,
  },
});

export default GoalsScreen;
