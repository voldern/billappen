import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { RootStackParamList } from "../types";
import { RootState } from "../store";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { theme } from "../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../components/Button";
import { ConfettiPiece } from "../components/ConfettiPiece";

const { width, height } = Dimensions.get("window");

type TestResultsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "TestResults"
>;
type TestResultsScreenRouteProp = RouteProp<RootStackParamList, "TestResults">;

interface Props {
  navigation: TestResultsScreenNavigationProp;
  route: TestResultsScreenRouteProp;
}

export default function TestResultsScreen({ navigation, route }: Props) {
  const { testId } = route.params;
  const results = useSelector((state: RootState) => state.results.results);
  const testResult = results.find((r) => r.id === testId);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const insets = useSafeAreaInsets();

  const styles = createStyles(insets);

  useEffect(() => {
    if (!testResult) return;

    const percentage = Math.round(
      (testResult.score / testResult.totalQuestions) * 100
    );
    const passed = percentage >= 85;

    if (passed) {
      // Show confetti
      setShowConfetti(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [testResult]);

  if (!testResult) {
    return (
      <View style={styles.container}>
        <Text>Fant ikke testresultat</Text>
      </View>
    );
  }

  const percentage = Math.round(
    (testResult.score / testResult.totalQuestions) * 100
  );
  const passed = percentage >= 85;

  const getScoreColor = () => {
    if (percentage >= 90) return theme.colors.semantic.success.main;
    if (percentage >= 75) return theme.colors.semantic.warning.main;
    return theme.colors.semantic.error.main;
  };

  const getMotivationalMessage = () => {
    if (percentage === 100) return "Perfekt! Du mestrer stoffet! 🌟";
    if (percentage >= 90) return "Utmerket! Du er nesten klar for eksamen! 🎯";
    if (percentage >= 85) return "Bra jobbet! Du har god kontroll! 👏";
    if (percentage >= 75) return "Godt forsøk! Fortsett å øve! 💪";
    if (percentage >= 50) return "På rett vei! Ikke gi opp! 📚";
    return "Rom for forbedring. Øv mer og prøv igjen! 🚀";
  };

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes} min ${seconds} sek`;
  };

  const scoreColor = getScoreColor();

  return (
    <LinearGradient
      colors={[theme.colors.primary[50], theme.colors.background.primary]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {showConfetti && (
            <View
              style={styles.confetti}
              pointerEvents="none"
              testID="confetti-container"
            >
              {[...Array(12)].map((_, i) => {
                const colors = [
                  theme.colors.primary[400],
                  theme.colors.accent.main,
                  theme.colors.semantic.success.main,
                  theme.colors.semantic.warning.main,
                  "#FFD700",
                ];
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
            <View style={styles.scoreCircleContainer}>
              <LinearGradient
                colors={[scoreColor + "20", scoreColor + "40"]}
                style={styles.scoreCircle}
              >
                <Text style={[styles.scorePercentage, { color: scoreColor }]}>
                  {percentage}%
                </Text>
                <Text style={styles.scoreRatio}>
                  {testResult.score} av {testResult.totalQuestions} riktige
                </Text>
              </LinearGradient>
            </View>

            <View
              style={[
                styles.passedBadge,
                {
                  backgroundColor: passed
                    ? theme.colors.semantic.success.light + "20"
                    : theme.colors.semantic.error.light + "20",
                },
              ]}
            >
              <Ionicons
                name={passed ? "checkmark-circle" : "close-circle"}
                size={24}
                color={
                  passed
                    ? theme.colors.semantic.success.main
                    : theme.colors.semantic.error.main
                }
              />
              <Text
                style={[
                  styles.passedText,
                  {
                    color: passed
                      ? theme.colors.semantic.success.main
                      : theme.colors.semantic.error.main,
                  },
                ]}
              >
                {passed ? "BESTÅTT" : "IKKE BESTÅTT"}
              </Text>
            </View>

            <Text style={styles.motivationalMessage}>
              {getMotivationalMessage()}
            </Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={[theme.colors.primary[100], theme.colors.primary[200]]}
                style={styles.statGradient}
              >
                <Ionicons
                  name="time"
                  size={24}
                  color={theme.colors.primary[700]}
                />
                <Text
                  style={styles.statLabel}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                >
                  Tid brukt
                </Text>
                <Text style={styles.statValue}>
                  {formatDuration(testResult.duration || 0)}
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={[theme.colors.accent.light, theme.colors.accent.muted]}
                style={styles.statGradient}
              >
                <Ionicons
                  name="speedometer"
                  size={24}
                  color={theme.colors.accent.dark}
                />
                <Text
                  style={styles.statLabel}
                  numberOfLines={2}
                  adjustsFontSizeToFit
                >
                  Gjennomsnitt per spørsmål
                </Text>
                <Text style={styles.statValue}>
                  {Math.round(
                    (testResult.duration || 0) /
                      testResult.totalQuestions /
                      1000
                  )}{" "}
                  sek
                </Text>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.categoryBreakdown}>
            <Text style={styles.sectionTitle}>Kategorifordeling</Text>
            {Object.entries(testResult.categoryBreakdown || {}).map(
              ([category, stats], index) => {
                const categoryPercentage =
                  stats.total > 0
                    ? Math.round((stats.correct / stats.total) * 100)
                    : 0;
                const categoryColor =
                  categoryPercentage >= 85
                    ? theme.colors.semantic.success.main
                    : categoryPercentage >= 70
                    ? theme.colors.semantic.warning.main
                    : theme.colors.semantic.error.main;

                return (
                  <View key={category} style={styles.categoryRow}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryName}>{category}</Text>
                      <Text
                        style={[styles.categoryScore, { color: categoryColor }]}
                      >
                        {stats.correct}/{stats.total} ({categoryPercentage}%)
                      </Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View
                        style={[
                          styles.progressBar,
                          {
                            width: `${categoryPercentage}%`,
                            backgroundColor: categoryColor,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              }
            )}
          </View>

          <View style={styles.actions}>
            <Button
              title="Ta ny test"
              onPress={() => navigation.push("NewTest")}
              variant="primary"
              style={styles.primaryButton}
            />

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.push("ResultsList")}
              activeOpacity={0.8}
            >
              <Ionicons
                name="list"
                size={20}
                color={theme.colors.primary[600]}
              />
              <Text style={styles.secondaryButtonText}>Se alle resultater</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const createStyles = (insets: ReturnType<typeof useSafeAreaInsets>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: Math.max(theme.spacing["2xl"], insets.bottom),
    },
    confetti: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: height,
      zIndex: 5,
      overflow: "hidden",
    },
    header: {
      alignItems: "center",
      paddingTop: theme.spacing["2xl"],
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
      justifyContent: "center",
      alignItems: "center",
    },
    scorePercentage: {
      fontSize: 56,
      fontWeight: "bold",
    },
    scoreRatio: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs,
    },
    passedBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.full,
      marginBottom: theme.spacing.md,
    },
    passedText: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: "bold",
      marginLeft: theme.spacing.sm,
    },
    motivationalMessage: {
      fontSize: theme.typography.fontSize.lg,
      color: theme.colors.text.secondary,
      textAlign: "center",
      paddingHorizontal: theme.spacing.xl,
    },
    statsContainer: {
      flexDirection: "row",
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.md,
      marginBottom: theme.spacing.xl,
      justifyContent: "space-between",
    },
    statCard: {
      flex: 1,
      minWidth: 0, // Allows flex items to shrink below their content size
      ...theme.shadows.md,
    },
    statGradient: {
      padding: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      alignItems: "center",
      minHeight: 100,
      justifyContent: "center",
    },
    statLabel: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
      textAlign: "center",
      lineHeight: theme.typography.fontSize.sm * 1.2,
    },
    statValue: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: "600",
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
      fontSize: theme.typography.fontSize["2xl"],
      fontWeight: "600",
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.lg,
    },
    categoryRow: {
      marginBottom: theme.spacing.lg,
    },
    categoryHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: theme.spacing.sm,
    },
    categoryName: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.secondary,
    },
    categoryScore: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: "600",
    },
    progressBarContainer: {
      height: 10,
      backgroundColor: theme.colors.neutral[100],
      borderRadius: theme.borderRadius.full,
      overflow: "hidden",
    },
    progressBar: {
      height: "100%",
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
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
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
      fontWeight: "600",
      marginLeft: theme.spacing.sm,
    },
  });
