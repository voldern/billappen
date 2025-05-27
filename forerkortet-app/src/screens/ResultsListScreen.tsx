import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSelector, useDispatch } from "react-redux";
import { RootStackParamList, TestResult } from "../types";
import { RootState, AppDispatch } from "../store";
import { setResults } from "../store/resultsSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { premiumTheme as theme } from "../constants/premiumTheme";
import { PremiumButton } from "../components/PremiumButton";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

const { width } = Dimensions.get("window");

type ResultsListScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ResultsList"
>;

interface Props {
  navigation: ResultsListScreenNavigationProp;
}

export default function ResultsListScreen({ navigation }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const results = useSelector((state: RootState) => state.results.results);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const savedResults = await AsyncStorage.getItem("testResults");
      if (savedResults) {
        dispatch(setResults(JSON.parse(savedResults)));
      }
    } catch (error) {
      console.error("Error loading results:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `I dag, ${date.toLocaleTimeString("nb-NO", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `I går, ${date.toLocaleTimeString("nb-NO", {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    }

    return date.toLocaleDateString("nb-NO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDuration = (duration: number) => {
    const totalSeconds = Math.floor(duration / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getScoreColor = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return theme.colors.semantic.success.main;
    if (percentage >= 75) return theme.colors.semantic.warning.main;
    return theme.colors.semantic.error.main;
  };

  const getScoreIcon = (score: number, total: number) => {
    const percentage = (score / total) * 100;
    if (percentage >= 90) return "trophy";
    if (percentage >= 75) return "ribbon";
    if (percentage >= 60) return "thumbs-up";
    return "refresh";
  };

  const renderResult = ({ item, index }: { item: TestResult; index: number }) => {
    const percentage = Math.round((item.score / item.totalQuestions) * 100);
    const scoreColor = getScoreColor(item.score, item.totalQuestions);
    const scoreIcon = getScoreIcon(item.score, item.totalQuestions);

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).springify()}
        style={styles.resultCardWrapper}
      >
        <TouchableOpacity
          style={styles.resultCard}
          onPress={() => navigation.navigate("TestResults", { testId: item.id })}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={[theme.colors.background.primary, theme.colors.neutral[50]]}
            style={styles.resultGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.resultContent}>
              <View style={styles.resultLeft}>
                <View
                  style={[
                    styles.scoreIconContainer,
                    { backgroundColor: scoreColor + "20" },
                  ]}
                >
                  <Ionicons name={scoreIcon as any} size={24} color={scoreColor} />
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultDate}>{formatDate(item.date)}</Text>
                  <View style={styles.resultStats}>
                    <Ionicons
                      name="time-outline"
                      size={14}
                      color={theme.colors.text.secondary}
                    />
                    <Text style={styles.resultDuration}>
                      {formatDuration(item.duration)}
                    </Text>
                    <View style={styles.statDivider} />
                    <Ionicons
                      name="help-circle-outline"
                      size={14}
                      color={theme.colors.text.secondary}
                    />
                    <Text style={styles.resultQuestions}>
                      {item.totalQuestions} spørsmål
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.resultRight}>
                <Text style={[styles.percentageText, { color: scoreColor }]}>
                  {percentage}%
                </Text>
                <Text style={styles.scoreText}>
                  {item.score}/{item.totalQuestions}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <LinearGradient
        colors={theme.colors.background.gradient.background}
        style={styles.gradient}
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
          <Text style={styles.headerTitle}>Testhistorikk</Text>
          <View style={styles.headerSpacer} />
        </View>

        {results.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Animated.View
              entering={FadeInUp.delay(200).springify()}
              style={styles.emptyContent}
            >
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name="document-text-outline"
                  size={64}
                  color={theme.colors.neutral[300]}
                />
              </View>
              <Text style={styles.emptyTitle}>Ingen tester ennå</Text>
              <Text style={styles.emptyText}>
                Start din første test og se resultatene dine her
              </Text>
              <PremiumButton
                title="Start Test"
                onPress={() => navigation.navigate("NewTest")}
                variant="primary"
                size="large"
                style={{ marginTop: theme.spacing.xl }}
                icon={
                  <Ionicons
                    name="play"
                    size={20}
                    color={theme.colors.text.inverse}
                  />
                }
              />
            </Animated.View>
          </View>
        ) : (
          <>
            <FlatList
              data={results}
              renderItem={renderResult}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
            <View style={styles.footer}>
              <PremiumButton
                title="Tilbake til hovedmeny"
                onPress={() => navigation.navigate("Landing")}
                variant="secondary"
                size="large"
                icon={
                  <Ionicons
                    name="home"
                    size={20}
                    color={theme.colors.primary[600]}
                  />
                }
              />
            </View>
          </>
        )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral[100],
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
  listContainer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing["3xl"],
  },
  resultCardWrapper: {
    marginBottom: theme.spacing.md,
  },
  resultCard: {
    borderRadius: theme.borderRadius.xl,
    overflow: "hidden",
    ...theme.shadows.md,
  },
  resultGradient: {
    padding: theme.spacing.lg,
  },
  resultContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  scoreIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  resultInfo: {
    flex: 1,
  },
  resultDate: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: "600",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  resultStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  resultDuration: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: theme.colors.neutral[300],
    marginHorizontal: theme.spacing.xs,
  },
  resultQuestions: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  resultRight: {
    alignItems: "flex-end",
  },
  percentageText: {
    fontSize: theme.typography.fontSize["2xl"],
    fontWeight: "700",
    marginBottom: theme.spacing.xs,
  },
  scoreText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontWeight: "500",
  },
  separator: {
    height: theme.spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.xl,
  },
  emptyContent: {
    alignItems: "center",
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
    marginBottom: theme.spacing.xl,
  },
  footer: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[100],
  },
});