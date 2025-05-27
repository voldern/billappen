import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState, AppDispatch } from '../store';
import { setResults } from '../store/resultsSlice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { GradientButton } from '../components/GradientButton';
import { premiumTheme as theme } from '../constants/premiumTheme';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

type LandingScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Landing'>;

interface Props {
  navigation: LandingScreenNavigationProp;
}

export default function LandingScreen({ navigation }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const results = useSelector((state: RootState) => state.results.results);
  
  const heroScale = useSharedValue(0);
  const heroOpacity = useSharedValue(0);
  const carRotation = useSharedValue(0);
  const statsSlide = useSharedValue(-100);
  const floatY = useSharedValue(0);
  
  const styles = createStyles();

  useEffect(() => {
    loadResults();
    
    // Animate hero section
    heroScale.value = withSpring(1, { damping: 15 });
    heroOpacity.value = withTiming(1, { duration: 800 });
    
    // Animate car icon
    carRotation.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 2000 }),
        withTiming(5, { duration: 2000 })
      ),
      -1,
      true
    );
    
    // Animate stats
    statsSlide.value = withSpring(0, { delay: 300, damping: 15 });
    
    // Floating animation
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const loadResults = async () => {
    try {
      const savedResults = await AsyncStorage.getItem('testResults');
      if (savedResults) {
        dispatch(setResults(JSON.parse(savedResults)));
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  };

  const latestResult = results[0];
  const averageScore = results.length > 0
    ? Math.round(results.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / results.length)
    : 0;

  const heroAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
    opacity: heroOpacity.value,
  }));

  const carAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${carRotation.value}deg` },
      { translateY: floatY.value }
    ],
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: statsSlide.value }],
  }));

  return (
    <LinearGradient
      colors={[theme.colors.primary[50], theme.colors.background.primary]}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.heroSection, heroAnimatedStyle]}>
          <View style={styles.heroBackground}>
            <LinearGradient
              colors={[theme.colors.primary[500], theme.colors.primary[700]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            />
            <View style={styles.heroPattern} />
          </View>
          
          <Animated.View style={[styles.carIconContainer, carAnimatedStyle]}>
            <Ionicons name="car-sport" size={80} color={theme.colors.text.inverse} />
          </Animated.View>
          
          <Text style={styles.heroTitle}>Førerkort</Text>
          <Text style={styles.heroSubtitle}>Mester teoriprøven med stil</Text>
        </Animated.View>

        {results.length > 0 && (
          <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={[theme.colors.primary[100], theme.colors.primary[200]]}
                style={styles.statGradient}
              >
                <Ionicons name="trophy" size={24} color={theme.colors.primary[700]} />
                <Text style={styles.statLabel} numberOfLines={2} adjustsFontSizeToFit>
                  Siste resultat
                </Text>
                <Text style={styles.statValue}>
                  {latestResult ? `${Math.round((latestResult.score / latestResult.totalQuestions) * 100)}%` : '-'}
                </Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={[theme.colors.accent.light, theme.colors.accent.muted]}
                style={styles.statGradient}
              >
                <Ionicons name="trending-up" size={24} color={theme.colors.accent.dark} />
                <Text style={styles.statLabel} numberOfLines={2} adjustsFontSizeToFit>
                  Gjennomsnitt
                </Text>
                <Text style={styles.statValue}>{averageScore}%</Text>
              </LinearGradient>
            </View>
            
            <View style={styles.statCard}>
              <LinearGradient
                colors={[theme.colors.success.light + '30', theme.colors.success.main + '30']}
                style={styles.statGradient}
              >
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.success.dark} />
                <Text style={styles.statLabel} numberOfLines={2} adjustsFontSizeToFit>
                  Tester tatt
                </Text>
                <Text style={styles.statValue}>{results.length}</Text>
              </LinearGradient>
            </View>
          </Animated.View>
        )}

        <View style={styles.actions}>
          <GradientButton
            title="Start ny test"
            onPress={() => navigation.navigate('NewTest')}
            variant="primary"
            style={styles.mainButton}
          />
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Progress')}
            activeOpacity={0.8}
          >
            <View style={styles.secondaryButtonContent}>
              <Ionicons name="stats-chart" size={24} color={theme.colors.primary[600]} />
              <Text style={styles.secondaryButtonText}>Din Fremgang</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.features}>
          <Text style={styles.featuresTitle}>Hvorfor velge oss?</Text>
          <View style={styles.featureCard}>
            <Ionicons name="gift" size={32} color={theme.colors.success.main} />
            <Text style={styles.featureTitle}>Helt gratis</Text>
            <Text style={styles.featureDescription}>Ingen skjulte kostnader eller abonnementer</Text>
          </View>
          <View style={styles.featureCard}>
            <Ionicons name="flash" size={32} color={theme.colors.primary[600]} />
            <Text style={styles.featureTitle}>Moderne læring</Text>
            <Text style={styles.featureDescription}>Interaktiv og engasjerende måte å lære på</Text>
          </View>
          <View style={styles.featureCard}>
            <Ionicons name="analytics" size={32} color={theme.colors.accent.main} />
            <Text style={styles.featureTitle}>Detaljert statistikk</Text>
            <Text style={styles.featureDescription}>Følg fremgangen din over tid</Text>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const createStyles = () => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing['2xl'],
  },
  heroSection: {
    height: height * 0.4,
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  heroBackground: {
    position: 'absolute',
    width: width,
    height: '100%',
    overflow: 'hidden',
  },
  heroGradient: {
    flex: 1,
    borderBottomLeftRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xl,
  },
  heroPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
    backgroundColor: 'transparent',
  },
  carIconContainer: {
    marginBottom: theme.spacing.lg,
  },
  heroTitle: {
    fontSize: theme.typography.fontSize['5xl'],
    fontWeight: 'bold',
    color: theme.colors.text.inverse,
    marginBottom: theme.spacing.xs,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    fontSize: theme.typography.fontSize.xl,
    color: theme.colors.text.inverse,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  statCard: {
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    minWidth: 0, // Allows flex items to shrink below their content size
    ...theme.shadows.md,
  },
  statGradient: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.sm * 1.2,
  },
  statValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: theme.colors.text.primary,
  },
  actions: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing['2xl'],
  },
  mainButton: {
    marginBottom: theme.spacing.md,
  },
  secondaryButton: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.full,
    padding: theme.spacing.md,
    ...theme.shadows.md,
  },
  secondaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.primary[600],
    marginLeft: theme.spacing.sm,
  },
  features: {
    paddingHorizontal: theme.spacing.lg,
  },
  featuresTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  featureCard: {
    backgroundColor: theme.colors.background.primary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.sm,
  },
  featureTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  featureDescription: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
});