import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState } from '../store';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { GradientButton } from '../components/GradientButton';
import { ConfettiPiece } from '../components/ConfettiPiece';

const { width, height } = Dimensions.get('window');

type TestResultsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'TestResults'>;
type TestResultsScreenRouteProp = RouteProp<RootStackParamList, 'TestResults'>;

interface Props {
  navigation: TestResultsScreenNavigationProp;
  route: TestResultsScreenRouteProp;
}

export default function TestResultsScreen({ navigation, route }: Props) {
  const { testId } = route.params;
  const results = useSelector((state: RootState) => state.results.results);
  const testResult = results.find(r => r.id === testId);

  const scoreScale = useSharedValue(0);
  const scoreRotation = useSharedValue(0);
  const statsOpacity = useSharedValue(0);
  const categorySlide = useSharedValue(50);
  const [showConfetti, setShowConfetti] = React.useState(false);

  useEffect(() => {
    if (!testResult) return;
    
    const percentage = Math.round((testResult.score / testResult.totalQuestions) * 100);
    const passed = percentage >= 85;
    
    // Animate score circle
    scoreScale.value = withSequence(
      withSpring(1.2, { damping: 10 }),
      withSpring(1, { damping: 15 })
    );
    
    if (passed) {
      scoreRotation.value = withSequence(
        withTiming(10, { duration: 100 }),
        withTiming(-10, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
      
      // Show confetti
      setShowConfetti(true);
      
      // Hide confetti after animation completes
      setTimeout(() => {
        setShowConfetti(false);
      }, 4000);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    // Animate stats and categories
    statsOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    categorySlide.value = withDelay(500, withSpring(0, { damping: 15 }));
  }, [testResult]);

  if (!testResult) {
    return (
      <View style={styles.container}>
        <Text>Fant ikke testresultat</Text>
      </View>
    );
  }

  const percentage = Math.round((testResult.score / testResult.totalQuestions) * 100);
  const passed = percentage >= 85;
  
  const getScoreColor = () => {
    if (percentage >= 90) return theme.colors.success.main;
    if (percentage >= 75) return theme.colors.warning.main;
    return theme.colors.error.main;
  };

  const getMotivationalMessage = () => {
    if (percentage === 100) return 'Perfekt! Du mestrer stoffet! 🌟';
    if (percentage >= 90) return 'Utmerket! Du er nesten klar for eksamen! 🎯';
    if (percentage >= 85) return 'Bra jobbet! Du har god kontroll! 👏';
    if (percentage >= 75) return 'Godt forsøk! Fortsett å øve! 💪';
    if (percentage >= 50) return 'På rett vei! Ikke gi opp! 📚';
    return 'Rom for forbedring. Øv mer og prøv igjen! 🚀';
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes} min ${seconds} sek`;
  };

  const scoreColor = getScoreColor();

  const scoreAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scoreScale.value },
      { rotate: `${scoreRotation.value}deg` }
    ],
  }));

  const statsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: statsOpacity.value,
  }));

  const categoryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: categorySlide.value }],
    opacity: interpolate(categorySlide.value, [50, 0], [0, 1]),
  }));

  return (
    <LinearGradient
      colors={[theme.colors.primary[50], theme.colors.background.primary]}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {showConfetti && (
          <View style={styles.confetti} pointerEvents="none">
            {[...Array(12)].map((_, i) => {
              const colors = [theme.colors.primary[400], theme.colors.secondary[400], theme.colors.success.main, theme.colors.warning.main, '#FFD700'];
              return (
                <ConfettiPiece
                  key={i}
                  color={colors[Math.floor(Math.random() * colors.length)]}
                  initialX={Math.random() * (width - 20)}
                  initialY={-20 - Math.random() * 50}
                  rotation={Math.random() * 360}
                  delay={i * 100}
                />
              );
            })}
          </View>
        )}

        <View style={styles.header}>
          <Animated.View style={[styles.scoreCircleContainer, scoreAnimatedStyle]}>
            <LinearGradient
              colors={[scoreColor + '20', scoreColor + '40']}
              style={styles.scoreCircle}
            >
              <Text style={[styles.scorePercentage, { color: scoreColor }]}>{percentage}%</Text>
              <Text style={styles.scoreRatio}>
                {testResult.score} av {testResult.totalQuestions} riktige
              </Text>
            </LinearGradient>
          </Animated.View>
          
          <View style={[styles.passedBadge, { backgroundColor: passed ? theme.colors.success.light + '20' : theme.colors.error.light + '20' }]}>
            <Ionicons 
              name={passed ? "checkmark-circle" : "close-circle"} 
              size={24} 
              color={passed ? theme.colors.success.main : theme.colors.error.main} 
            />
            <Text style={[styles.passedText, { color: passed ? theme.colors.success.main : theme.colors.error.main }]}>
              {passed ? 'BESTÅTT' : 'IKKE BESTÅTT'}
            </Text>
          </View>
          
          <Text style={styles.motivationalMessage}>{getMotivationalMessage()}</Text>
        </View>

        <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={[theme.colors.primary[100], theme.colors.primary[200]]}
              style={styles.statGradient}
            >
              <Ionicons name="time" size={24} color={theme.colors.primary[700]} />
              <Text style={styles.statLabel} numberOfLines={2} adjustsFontSizeToFit>
                Tid brukt
              </Text>
              <Text style={styles.statValue}>{formatDuration(testResult.duration)}</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={[theme.colors.secondary[100], theme.colors.secondary[200]]}
              style={styles.statGradient}
            >
              <Ionicons name="speedometer" size={24} color={theme.colors.secondary[700]} />
              <Text style={styles.statLabel} numberOfLines={2} adjustsFontSizeToFit>
                Gjennomsnitt per spørsmål
              </Text>
              <Text style={styles.statValue}>
                {Math.round(testResult.duration / testResult.totalQuestions / 1000)} sek
              </Text>
            </LinearGradient>
          </View>
        </Animated.View>

        <Animated.View style={[styles.categoryBreakdown, categoryAnimatedStyle]}>
          <Text style={styles.sectionTitle}>Kategorifordeling</Text>
          {Object.entries(testResult.categoryBreakdown || {}).map(([category, stats], index) => {
            const categoryPercentage = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
            const categoryColor = categoryPercentage >= 85 ? theme.colors.success.main : categoryPercentage >= 70 ? theme.colors.warning.main : theme.colors.error.main;
            
            return (
              <View
                key={category}
                style={styles.categoryRow}
              >
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryName}>{category}</Text>
                  <Text style={[styles.categoryScore, { color: categoryColor }]}>
                    {stats.correct}/{stats.total} ({categoryPercentage}%)
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar,
                      { 
                        width: `${categoryPercentage}%`,
                        backgroundColor: categoryColor 
                      }
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </Animated.View>

        <View style={styles.actions}>
          <GradientButton
            title="Ta ny test"
            onPress={() => navigation.navigate('NewTest')}
            variant="primary"
            style={styles.primaryButton}
          />
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Landing')}
            activeOpacity={0.8}
          >
            <Ionicons name="home" size={20} color={theme.colors.primary[600]} />
            <Text style={styles.secondaryButtonText}>Tilbake til hovedmeny</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing['2xl'],
  },
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height,
    zIndex: 5,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    paddingTop: theme.spacing['2xl'],
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  scoreCircleContainer: {
    marginBottom: theme.spacing.lg,
    ...theme.shadows.xl,
  },
  scoreCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scorePercentage: {
    fontSize: 56,
    fontWeight: 'bold',
  },
  scoreRatio: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  passedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.md,
  },
  passedText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    marginLeft: theme.spacing.sm,
  },
  motivationalMessage: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    minWidth: 0, // Allows flex items to shrink below their content size
    ...theme.shadows.md,
  },
  statGradient: {
    padding: theme.spacing.lg,
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
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
  categoryBreakdown: {
    backgroundColor: theme.colors.background.primary,
    marginHorizontal: theme.spacing.lg,
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    ...theme.shadows.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
  },
  categoryRow: {
    marginBottom: theme.spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  categoryName: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  categoryScore: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: theme.borderRadius.full,
  },
  actions: {
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  primaryButton: {
    marginBottom: 0,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    borderColor: theme.colors.primary[200],
    ...theme.shadows.sm,
  },
  secondaryButtonText: {
    color: theme.colors.primary[600],
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    marginLeft: theme.spacing.sm,
  },
});