import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDispatch, useSelector } from "react-redux";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { RootStackParamList } from "../types";
import { RootState, AppDispatch } from "../store";
import { startTest } from "../store/testSlice";
import firebaseQuestionService from "../services/firebaseQuestionService";
import { theme } from "../constants/theme";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { processQuestionsWithReducedOptions } from "../utils/questionUtils";
import { RouteProp } from "@react-navigation/native";
import { isFeatureEnabled } from "../constants/featureFlags";
import { selectSmartQuestions } from "../utils/questionSelection";
import analyticsService from "../services/analyticsService";
import { showAlert } from "../utils/alert";

type NewTestScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "NewTest"
>;

type NewTestScreenRouteProp = RouteProp<RootStackParamList, "NewTest">;

interface Props {
  navigation: NewTestScreenNavigationProp;
  route: NewTestScreenRouteProp;
}

const { width, height } = Dimensions.get("window");

export default function NewTestScreen({ navigation, route }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = React.useState(false);
  const previousResults = useSelector(
    (state: RootState) => state.results.results
  );

  // Get category parameters from navigation
  const selectedCategory = route.params?.selectedCategory;
  const categoryName = route.params?.categoryName;

  const styles = createStyles(insets);

  const startQuickTest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      setLoading(true);

      let selectedQuestions;
      if (selectedCategory) {
        // Get questions from specific category
        const categoryQuestions =
          await firebaseQuestionService.getQuestionsByCategory(
            selectedCategory
          );
        // Take up to 10 random questions from the category
        const shuffled = [...categoryQuestions].sort(() => Math.random() - 0.5);
        selectedQuestions = shuffled.slice(0, Math.min(10, shuffled.length));
      } else {
        // Get random questions from all categories
        selectedQuestions = await firebaseQuestionService.getRandomQuestions(
          10
        );
      }

      if (selectedQuestions.length === 0) {
        showAlert(
          "Feil",
          selectedCategory
            ? `Ingen spørsmål funnet i kategorien "${categoryName}".`
            : "Kunne ikke laste spørsmål. Sjekk internettforbindelsen."
        );
        return;
      }

      // Process questions to reduce options to 4
      const processedQuestions =
        processQuestionsWithReducedOptions(selectedQuestions);

      dispatch(startTest(processedQuestions));

      await analyticsService.logEvent("start_quick_test");

      // Navigate directly without delay
      navigation.push("Question");
    } catch (error) {
      console.error("Error starting quick test:", error);
      showAlert("Feil", "Kunne ikke starte test. Prøv igjen senere.");
    } finally {
      setLoading(false);
    }
  };

  const startFullTest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      setLoading(true);

      let allQuestions;
      if (selectedCategory) {
        // Get all questions from specific category
        allQuestions = await firebaseQuestionService.getQuestionsByCategory(
          selectedCategory
        );
      } else {
        // Get all questions from all categories
        allQuestions = await firebaseQuestionService.getAllQuestions();
      }

      if (allQuestions.length === 0) {
        showAlert(
          "Feil",
          selectedCategory
            ? `Ingen spørsmål funnet i kategorien "${categoryName}".`
            : "Kunne ikke laste spørsmål. Sjekk internettforbindelsen."
        );
        return;
      }

      let selectedQuestions;
      if (selectedCategory) {
        // For category-specific tests, take up to 45 random questions
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
        selectedQuestions = shuffled.slice(0, Math.min(45, shuffled.length));
      } else {
        // For general tests, use smart selection
        selectedQuestions = selectSmartQuestions({
          targetCount: 45,
          unseenPercentage: 0.8, // 80% unseen questions
          allQuestions,
          previousResults,
        });
      }

      // Process questions to reduce options to 4
      const processedQuestions =
        processQuestionsWithReducedOptions(selectedQuestions);

      dispatch(startTest(processedQuestions));

      await analyticsService.logEvent("start_full_test");

      // Navigate directly without delay
      navigation.push("Question");
    } catch (error) {
      console.error("Error starting full test:", error);
      showAlert("Feil", "Kunne ikke starte test. Prøv igjen senere.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={
            [...theme.colors.background.gradient.primary] as [
              string,
              string,
              ...string[]
            ]
          }
          style={styles.loadingContainer}
        >
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={theme.colors.text.inverse} />
            <Text style={styles.loadingText}>Laster spørsmål...</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={
          [...theme.colors.background.gradient.primary] as [
            string,
            string,
            ...string[]
          ]
        }
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.colors.text.inverse}
              />
            </TouchableOpacity>
            <Text style={styles.title}>
              {selectedCategory ? categoryName : "Velg testtype"}
            </Text>
            <View style={styles.headerPlaceholder} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Category Selection (when no category is selected) */}
            {!selectedCategory &&
              isFeatureEnabled("ENABLE_CATEGORY_SELECTION") && (
                <View style={styles.cardsContainer}>
                  <Card
                    variant="elevated"
                    padding="large"
                    style={styles.testCard}
                  >
                    <View style={styles.testHeader}>
                      <View style={styles.testIcon}>
                        <LinearGradient
                          colors={
                            [
                              theme.colors.accent.main,
                              theme.colors.accent.dark,
                            ] as [string, string]
                          }
                          style={styles.iconGradient}
                        >
                          <Ionicons
                            name="apps"
                            size={24}
                            color={theme.colors.text.inverse}
                          />
                        </LinearGradient>
                      </View>
                      <View style={styles.testTitleContainer}>
                        <Text style={styles.testTitle}>Velg kategori</Text>
                        <View
                          style={[
                            styles.testBadge,
                            { backgroundColor: theme.colors.accent.light },
                          ]}
                        >
                          <Text style={styles.testBadgeText}>
                            Målrettet øving
                          </Text>
                        </View>
                      </View>
                    </View>
                    <Text style={styles.testDescription}>
                      Øv deg på spørsmål fra en spesifikk kategori som
                      fartsregler, vikeplikt, eller trafikklys.
                    </Text>
                    <View style={styles.testInfo}>
                      <View style={styles.infoItem}>
                        <Ionicons
                          name="flag-outline"
                          size={16}
                          color={theme.colors.text.secondary}
                        />
                        <Text style={styles.infoText}>Fokusert læring</Text>
                      </View>
                      <View style={styles.infoItem}>
                        <Ionicons
                          name="school-outline"
                          size={16}
                          color={theme.colors.text.secondary}
                        />
                        <Text style={styles.infoText}>
                          Forbedr svake områder
                        </Text>
                      </View>
                    </View>
                    <Button
                      title="Velg Kategori"
                      onPress={() => navigation.push("CategorySelection")}
                      variant="white"
                      size="medium"
                      fullWidth
                      style={styles.cardButton}
                    />
                  </Card>
                </View>
              )}

            {/* Test Options */}
            <View style={styles.cardsContainer}>
              {/* Quick Test Card */}
              <Card variant="elevated" padding="large" style={styles.testCard}>
                <View style={styles.testHeader}>
                  <View style={styles.testIcon}>
                    <LinearGradient
                      colors={
                        [...theme.colors.background.gradient.secondary] as [
                          string,
                          string,
                          ...string[]
                        ]
                      }
                      style={styles.iconGradient}
                    >
                      <Ionicons
                        name="flash"
                        size={24}
                        color={theme.colors.text.inverse}
                      />
                    </LinearGradient>
                  </View>
                  <View style={styles.testTitleContainer}>
                    <Text style={styles.testTitle}>Hurtigtest</Text>
                    <View style={[styles.testBadge, styles.quickTestBadge]}>
                      <Text style={styles.testBadgeText}>10 spørsmål</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.testDescription}>
                  {selectedCategory
                    ? `Perfekt for en rask øvingsøkt. Test dine kunnskaper med 10 tilfeldig valgte spørsmål fra ${categoryName?.toLowerCase()}.`
                    : "Perfekt for en rask øvingsøkt. Test dine kunnskaper med 10 tilfeldig valgte spørsmål."}
                </Text>
                <View style={styles.testInfo}>
                  <View style={styles.infoItem}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={theme.colors.text.secondary}
                    />
                    <Text style={styles.infoText}>Ca. 5 minutter</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons
                      name="analytics-outline"
                      size={16}
                      color={theme.colors.text.secondary}
                    />
                    <Text style={styles.infoText}>Rask tilbakemelding</Text>
                  </View>
                </View>
                <Button
                  title="Start Hurtigtest"
                  onPress={startQuickTest}
                  variant="white"
                  size="medium"
                  fullWidth
                  style={styles.cardButton}
                />
              </Card>

              {/* Full Test Card */}
              <Card variant="elevated" padding="large" style={styles.testCard}>
                <View style={styles.testHeader}>
                  <View style={styles.testIcon}>
                    <LinearGradient
                      colors={
                        [
                          theme.colors.purple[400],
                          theme.colors.purple[600],
                        ] as [string, string]
                      }
                      style={styles.iconGradient}
                    >
                      <Ionicons
                        name="library"
                        size={24}
                        color={theme.colors.text.inverse}
                      />
                    </LinearGradient>
                  </View>
                  <View style={styles.testTitleContainer}>
                    <Text style={styles.testTitle}>Full test</Text>
                    <View style={[styles.testBadge, styles.fullTestBadge]}>
                      <Text style={styles.testBadgeText}>45 spørsmål</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.testDescription}>
                  {selectedCategory
                    ? `Omfattende test med inntil 45 spørsmål fra ${categoryName?.toLowerCase()}. Få en grundig vurdering av dine kunnskaper i denne kategorien.`
                    : "Omfattende test med 45 strategisk utvalgte spørsmål. Prioriterer spørsmål du ikke har sett før, med balansert fordeling mellom kategorier."}
                </Text>
                <View style={styles.testInfo}>
                  <View style={styles.infoItem}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={theme.colors.text.secondary}
                    />
                    <Text style={styles.infoText}>Ca. 15-20 minutter</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons
                      name="analytics-outline"
                      size={16}
                      color={theme.colors.text.secondary}
                    />
                    <Text style={styles.infoText}>Detaljert analyse</Text>
                  </View>
                </View>
                <Button
                  title="Start Full Test"
                  onPress={startFullTest}
                  variant="white"
                  size="medium"
                  fullWidth
                  style={styles.cardButton}
                />
              </Card>
            </View>

            {/* Tips Section */}
            <View style={styles.tipsSection}>
              <Card variant="blur" padding="large" style={styles.tipsCard}>
                <View style={styles.tipsHeader}>
                  <Ionicons
                    name="bulb"
                    size={24}
                    color={theme.colors.accent.main}
                  />
                  <Text style={styles.tipsTitle}>Tips før du starter:</Text>
                </View>
                <View style={styles.tipsList}>
                  <View style={styles.tipItem}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipText}>Les hvert spørsmål nøye</Text>
                  </View>
                  <View style={styles.tipItem}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipText}>
                      Ta deg god tid til å tenke
                    </Text>
                  </View>
                  <View style={styles.tipItem}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipText}>
                      Du kan ikke gå tilbake til tidligere spørsmål
                    </Text>
                  </View>
                  <View style={styles.tipItem}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipText}>
                      Fokuser og unngå distraksjoner
                    </Text>
                  </View>
                </View>
              </Card>
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const createStyles = (insets: ReturnType<typeof useSafeAreaInsets>) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    gradient: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
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
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.colors.text.inverse,
      textAlign: "center",
    },
    headerPlaceholder: {
      width: 40,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: Math.max(theme.spacing["2xl"], insets.bottom),
    },
    cardsContainer: {
      gap: theme.spacing.lg,
      marginBottom: theme.spacing.xl,
    },
    testCard: {
      marginBottom: 0,
    },
    testHeader: {
      flexDirection: "column",
      alignItems: "center",
      marginBottom: theme.spacing.lg,
    },
    testTitleContainer: {
      alignItems: "center",
      marginBottom: theme.spacing.md,
    },
    testTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: "700",
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
      textAlign: "center",
    },
    testBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.borderRadius.full,
      alignSelf: "flex-start",
    },
    quickTestBadge: {
      backgroundColor: theme.colors.accent.light,
    },
    fullTestBadge: {
      backgroundColor: theme.colors.purple[100],
    },
    testBadgeText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: "600",
      color: theme.colors.text.primary,
    },
    testIcon: {
      marginBottom: theme.spacing.sm,
    },
    iconGradient: {
      width: 48,
      height: 48,
      borderRadius: theme.borderRadius.xl,
      justifyContent: "center",
      alignItems: "center",
    },
    testDescription: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.secondary,
      lineHeight: theme.typography.fontSize.base * 1.5,
      marginBottom: theme.spacing.lg,
      textAlign: "center",
    },
    testInfo: {
      flexDirection: "row",
      justifyContent: "center",
      gap: theme.spacing.lg,
      marginBottom: theme.spacing.lg,
    },
    infoItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    infoText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
    },
    cardButton: {
      marginTop: theme.spacing.sm,
    },
    tipsSection: {
      marginTop: theme.spacing.md,
    },
    tipsCard: {
      backgroundColor: "rgba(255, 255, 255, 0.95)",
    },
    tipsHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.md,
    },
    tipsTitle: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: "700",
      color: theme.colors.text.primary,
    },
    tipsList: {
      gap: theme.spacing.sm,
    },
    tipItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.spacing.sm,
    },
    tipBullet: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.accent.main,
      fontWeight: "700",
      marginTop: 2,
    },
    tipText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.secondary,
      flex: 1,
      lineHeight: theme.typography.fontSize.base * 1.4,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingContent: {
      alignItems: "center",
    },
    loadingText: {
      marginTop: theme.spacing.md,
      fontSize: theme.typography.fontSize.lg,
      color: theme.colors.text.inverse,
      fontWeight: "600",
    },
  });
