import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import { BrandMark } from '../components/premium/BrandMark';
import { StepDots } from '../components/premium/StepDots';
import { IllustrationStage } from '../components/premium/IllustrationStage';
import { Colors, Spacing } from '../theme/premium';

interface WelcomeScreenProps {
  navigation: { navigate: (screen: string) => void };
}

const SLIDES = [
  { headline: 'Run your salon like a premium brand', subtitle: 'Elevate your client experience and streamline daily operations.' },
  { headline: 'Bookings, staff, and payments in one place', subtitle: 'Sync your calendars, track schedules, and checkout in seconds.' },
  { headline: 'Know what happens before the day gets busy', subtitle: 'Insights and notifications to keep you steps ahead.' },
];

export default function WelcomeScreen({ navigation }: WelcomeScreenProps) {
  const [idx, setIdx] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % SLIDES.length), 4500);
    return () => clearInterval(t);
  }, []);

  const go = () => navigation.navigate('PhoneAuth');

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Logo */}
      <View style={styles.logo}><BrandMark size={36} /></View>

      {/* Slide content */}
      <View style={styles.slide}>
        <IllustrationStage index={idx} />
        <Text style={styles.headline} numberOfLines={4}>{SLIDES[idx].headline}</Text>
        <Text style={styles.sub} numberOfLines={3}>{SLIDES[idx].subtitle}</Text>
      </View>

      {/* Dots */}
      <View style={styles.dots}>
        <StepDots total={SLIDES.length} activeIndex={idx} onDotPress={setIdx} />
      </View>

      {/* Buttons */}
      <View style={styles.btns}>
        <TouchableOpacity style={[styles.btn, styles.outline]} onPress={go} activeOpacity={0.8}>
          <Text style={[styles.btnTxt, { color: Colors.primaryInk }]}>SIGN IN</Text>
        </TouchableOpacity>
        <View style={{ width: 12 }} />
        <TouchableOpacity style={[styles.btn, styles.filled]} onPress={go} activeOpacity={0.8}>
          <Text style={[styles.btnTxt, { color: '#fff' }]}>GET STARTED</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: Colors.background },
  logo:     { alignItems: 'center', paddingVertical: Spacing.md },
  slide:    { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl },
  headline: { fontFamily: 'InstrumentSerif-Regular', fontSize: 34, lineHeight: 40, color: Colors.primaryInk, textAlign: 'center', marginTop: Spacing.lg, marginBottom: Spacing.sm },
  sub:      { fontFamily: 'Inter-Regular', fontSize: 15, lineHeight: 22, color: Colors.secondaryText, textAlign: 'center' },
  dots:     { alignItems: 'center', paddingVertical: Spacing.md },
  btns:     { flexDirection: 'row', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  btn:      { flex: 1, height: 56, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  outline:  { borderWidth: 1.5, borderColor: Colors.primaryInk },
  filled:   { backgroundColor: Colors.primaryInk },
  btnTxt:   { fontFamily: 'SpaceMono-Bold', fontSize: 13, letterSpacing: 3 },
});
