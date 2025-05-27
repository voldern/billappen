import React, { useEffect, useState, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import { premiumTheme as theme } from "../constants/premiumTheme";
import { PremiumCard } from "../components/PremiumCard";
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../types";
import { ProgressChart } from "../components/ProgressChart";
import { AchievementBadge } from "../components/AchievementBadge";
import { checkAchievements, UserStats } from "../utils/achievements";
import { useAuthGuard } from "../hooks/useAuthGuard";

const { width } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "Progress">;

interface StatCardProps {
  icon: string;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  color,
  delay = 0,
}) => {
  const isOdd = delay === 300 || delay === 500; // Third and fourth cards
  return (
    <View style={[styles.statCardWrapper, isOdd && styles.statCardWrapperOdd]}>
      <Animated.View
        entering={FadeInUp.delay(delay).springify()}
        style={styles.statCard}
      >
        <View style={styles.statCardContent}>
          <View style={[styles.statIconContainer, { backgroundColor: color + "20" }]}>
            <Ionicons name={icon as any} size={24} color={color} />
          </View>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statValue}>{value}</Text>
          {subtitle ? (
            <Text style={styles.statSubtitle}>{subtitle}</Text>
          ) : (
            <View style={styles.statSubtitlePlaceholder} />
          )}
        </View>
      </Animated.View>
    </View>
  );
};

interface CategoryStatProps {
  category: string;
  correct: number;
  total: number;
  percentage: number;
  delay?: number;
}

const CategoryStat: React.FC<CategoryStatProps> = ({
  category,
  correct,
  total,
  percentage,
  delay = 0,
}) => {
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    progressWidth.value = withTiming(percentage, { duration: 1000 });
  }, [percentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      style={styles.categoryStatContainer}
    >
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryName}>{category}</Text>
        <Text style={styles.categoryScore}>
          {correct}/{total} ({percentage}%)
        </Text>
      </View>
      <View style={styles.categoryProgressBar}>
        <Animated.View
          style={[
            styles.categoryProgressFill,
            animatedStyle,
            {
              backgroundColor:
                percentage >= 80
                  ? theme.colors.semantic.success.main
                  : percentage >= 60
                  ? theme.colors.semantic.warning.main
                  : theme.colors.semantic.error.main,
            },
          ]}
        />
      </View>
    </Animated.View>
  );
};

export default function ProgressScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, loading: authLoading } = useAuthGuard();
  const results = useSelector((state: RootState) => state.results.results);
  const [stats, setStats] = useState({
    totalTests: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    averageScore: 0,
    bestScore: 0,
    totalTime: 0,
    categoryBreakdown: {} as Record<string, { correct: number; total: number }>,
  });

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('ResultsList')}
          style={{ marginRight: theme.spacing.md }}
        >
          <Ionicons name="list" size={24} color={theme.colors.primary[600]} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (user) {
      calculateStats();
    }
  }, [results, user]);

  const calculateStats = () => {
    if (!results || results.length === 0) return;

    let totalQuestions = 0;
    let correctAnswers = 0;
    let totalTime = 0;
    let bestScore = 0;
    const categoryBreakdown: Record<string, { correct: number; total: number }> = {};

    results.forEach((result) => {
      totalQuestions += result.totalQuestions;
      correctAnswers += result.score;
      totalTime += result.duration;
      
      const scorePercentage = (result.score / result.totalQuestions) * 100;
      if (scorePercentage > bestScore) {
        bestScore = scorePercentage;
      }

      // Process category breakdown
      Object.entries(result.categoryBreakdown || {}).forEach(([category, data]) => {
        if (!categoryBreakdown[category]) {
          categoryBreakdown[category] = { correct: 0, total: 0 };
        }
        categoryBreakdown[category].correct += data.correct;
        categoryBreakdown[category].total += data.total;
      });
    });

    const averageScore = totalQuestions > 0 
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 0;

    setStats({
      totalTests: results.length,
      totalQuestions,
      correctAnswers,
      averageScore,
      bestScore: Math.round(bestScore),
      totalTime,
      categoryBreakdown,
    });
  };

  const formatTime = (milliseconds: number): string => {
    // Convert milliseconds to seconds
    const totalSeconds = Math.floor(milliseconds / 1000);
    
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}t`;
    } else if (hours > 0) {
      return `${hours}t ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes} min`;
    } else {
      return `${totalSeconds}s`;
    }
  };

  const getMotivationalMessage = () => {
    if (stats.averageScore >= 85) {
      return "Fantastisk! Du er nesten klar for eksamen! 🌟";
    } else if (stats.averageScore >= 70) {
      return "Bra jobbet! Fortsett slik så når du målet! 💪";
    } else if (stats.averageScore >= 50) {
      return "Du er på rett vei! Øv litt mer for å forbedre deg! 📈";
    } else {
      return "Rom for forbedring! Hver øvelse gjør deg bedre! 🎯";
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <LinearGradient
        colors={theme.colors.background.gradient.background}
        style={styles.gradient}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Din Fremgang</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("ResultsList")}
              style={styles.historyButton}
            >
              <Ionicons
                name="list"
                size={24}
                color={theme.colors.text.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Hero Stats */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={styles.heroSection}
          >
            <LinearGradient
              colors={theme.colors.background.gradient.primary}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroContent}>
                <View style={styles.scoreCircle}>
                  <Text style={styles.scoreValue}>{stats.averageScore}%</Text>
                  <Text style={styles.scoreLabel}>Gjennomsnitt</Text>
                </View>
                <Text style={styles.motivationalText}>
                  {getMotivationalMessage()}
                </Text>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Quick Stats */}
          <View style={styles.statsGrid}>
            <StatCard
              icon="trophy"
              title="Beste Score"
              value={`${stats.bestScore}%`}
              color={theme.colors.semantic.success.main}
              delay={200}
            />
            <StatCard
              icon="document-text"
              title="Tester Fullført"
              value={stats.totalTests}
              color={theme.colors.primary[600]}
              delay={300}
            />
            <StatCard
              icon="help-circle"
              title="Spørsmål"
              value={stats.totalQuestions}
              subtitle={`${stats.correctAnswers} riktige`}
              color={theme.colors.purple[600]}
              delay={400}
            />
            <StatCard
              icon="time"
              title="Total Øvingstid"
              value={formatTime(stats.totalTime)}
              color={theme.colors.accent.main}
              delay={500}
            />
          </View>

          {/* Progress Chart */}
          {results.length > 1 && (
            <PremiumCard variant="elevated" style={styles.chartCard}>
              <ProgressChart results={results} />
            </PremiumCard>
          )}

          {/* Category Breakdown */}
          {Object.keys(stats.categoryBreakdown).length > 0 && (
            <PremiumCard variant="elevated" style={styles.categoryCard}>
              <Text style={styles.sectionTitle}>Fremgang per Kategori</Text>
              <View style={styles.categoryList}>
                {Object.entries(stats.categoryBreakdown).map(
                  ([category, data], index) => {
                    const percentage = Math.round(
                      (data.correct / data.total) * 100
                    );
                    return (
                      <CategoryStat
                        key={category}
                        category={category}
                        correct={data.correct}
                        total={data.total}
                        percentage={percentage}
                        delay={600 + index * 100}
                      />
                    );
                  }
                )}
              </View>
            </PremiumCard>
          )}

          {/* Achievements Section */}
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>Dine Prestasjoner</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.achievementsScroll}
            >
              {checkAchievements({
                totalTests: stats.totalTests,
                perfectTests: results.filter(r => r.score === r.totalQuestions).length,
                totalQuestions: stats.totalQuestions,
                correctAnswers: stats.correctAnswers,
                averageScore: stats.averageScore,
                streak: 0, // TODO: Implement streak calculation
              }).map((achievement, index) => (
                <View key={achievement.id} style={styles.achievementWrapper}>
                  <AchievementBadge
                    achievement={{
                      ...achievement,
                      progress: achievement.id === 'hundred_questions' && !achievement.unlocked
                        ? { current: stats.totalQuestions, target: 100 }
                        : achievement.id === 'five_tests' && !achievement.unlocked
                        ? { current: stats.totalTests, target: 5 }
                        : achievement.id === 'ten_tests' && !achievement.unlocked
                        ? { current: stats.totalTests, target: 10 }
                        : undefined,
                    }}
                    delay={index * 100}
                  />
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Empty State */}
          {results.length === 0 && (
            <Animated.View
              entering={FadeInDown.delay(200).springify()}
              style={styles.emptyState}
            >
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name="bar-chart"
                  size={64}
                  color={theme.colors.neutral[300]}
                />
              </View>
              <Text style={styles.emptyTitle}>Ingen statistikk ennå</Text>
              <Text style={styles.emptyText}>
                Start din første test for å se din fremgang her!
              </Text>
            </Animated.View>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing["3xl"],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.sm,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: "700",
    color: theme.colors.text.primary,
  },
  headerSpacer: {
    width: 40,
  },
  historyButton: {
    width: 40,
    height: 40,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
    ...theme.shadows.sm,
  },
  heroSection: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
    ...theme.shadows.lg,
  },
  heroGradient: {
    padding: theme.spacing.xl,
  },
  heroContent: {
    alignItems: "center",
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: "700",
    color: theme.colors.primary[700],
  },
  scoreLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: "600",
  },
  motivationalText: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.text.inverse,
    fontWeight: "600",
    textAlign: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  statCardWrapper: {
    width: "50%",
    paddingRight: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  statCardWrapperOdd: {
    paddingRight: 0,
    paddingLeft: theme.spacing.sm,
  },
  statCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    minHeight: 180,
    ...theme.shadows.md,
  },
  statCardContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.sm,
  },
  statTitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: "500",
    marginBottom: theme.spacing.xs,
    textAlign: "center",
    paddingHorizontal: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: "700",
    color: theme.colors.text.primary,
    textAlign: "center",
  },
  statSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: "center",
  },
  statSubtitlePlaceholder: {
    height: theme.typography.fontSize.xs + theme.spacing.xs,
  },
  chartCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  categoryCard: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  categoryList: {
    gap: theme.spacing.md,
  },
  categoryStatContainer: {
    marginBottom: theme.spacing.md,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: theme.spacing.sm,
  },
  categoryName: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: "600",
    color: theme.colors.text.primary,
  },
  categoryScore: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: "500",
  },
  categoryProgressBar: {
    height: 8,
    backgroundColor: theme.colors.neutral[100],
    borderRadius: theme.borderRadius.full,
    overflow: "hidden",
  },
  categoryProgressFill: {
    height: "100%",
    borderRadius: theme.borderRadius.full,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: theme.spacing["3xl"],
    paddingHorizontal: theme.spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.neutral[50],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  achievementsSection: {
    marginBottom: theme.spacing.xl,
  },
  achievementsScroll: {
    paddingHorizontal: theme.spacing.lg,
  },
  achievementWrapper: {
    width: 160,
    marginRight: theme.spacing.md,
  },
});