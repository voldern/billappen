import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  StatusBar,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useDispatch } from "react-redux";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { RootStackParamList } from "../types";
import { AppDispatch } from "../store";
import { startTest } from "../store/testSlice";
import firebaseQuestionService from "../services/firebaseQuestionService";
import { premiumTheme } from "../constants/premiumTheme";
import { PremiumButton } from "../components/PremiumButton";
import { PremiumCard } from "../components/PremiumCard";
import { processQuestionsWithReducedOptions } from "../utils/questionUtils";
import { RouteProp } from "@react-navigation/native";

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
  const [loading, setLoading] = React.useState(false);
  
  // Get category parameters from navigation
  const selectedCategory = route.params?.selectedCategory;
  const categoryName = route.params?.categoryName;
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-50);
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);
  const tipsOpacity = useSharedValue(0);
  const tipsTranslateY = useSharedValue(50);
  
  const styles = createStyles();
  
  useEffect(() => {
    // Entrance animations
    headerOpacity.value = withTiming(1, { duration: 600 });
    headerTranslateY.value = withSpring(0, { damping: 20, stiffness: 90 });
    
    cardScale.value = withDelay(200, withSpring(1, { damping: 15, stiffness: 80 }));
    cardOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    
    tipsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    tipsTranslateY.value = withDelay(400, withSpring(0, { damping: 20, stiffness: 90 }));
  }, []);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ scale: cardScale.value }],
  }));

  const tipsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tipsOpacity.value,
    transform: [{ translateY: tipsTranslateY.value }],
  }));

  const startQuickTest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      setLoading(true);
      
      let selectedQuestions;
      if (selectedCategory) {
        // Get questions from specific category
        const categoryQuestions = await firebaseQuestionService.getQuestionsByCategory(selectedCategory);
        // Take up to 10 random questions from the category
        const shuffled = [...categoryQuestions].sort(() => Math.random() - 0.5);
        selectedQuestions = shuffled.slice(0, Math.min(10, shuffled.length));
      } else {
        // Get random questions from all categories
        selectedQuestions = await firebaseQuestionService.getRandomQuestions(10);
      }

      if (selectedQuestions.length === 0) {
        Alert.alert(
          "Feil",
          selectedCategory 
            ? `Ingen spørsmål funnet i kategorien "${categoryName}".`
            : "Kunne ikke laste spørsmål. Sjekk internettforbindelsen."
        );
        return;
      }

      // Process questions to reduce options to 4
      const processedQuestions = processQuestionsWithReducedOptions(selectedQuestions);
      
      dispatch(startTest(processedQuestions));
      navigation.navigate("Question");
    } catch (error) {
      console.error("Error starting quick test:", error);
      Alert.alert("Feil", "Kunne ikke starte test. Prøv igjen senere.");
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
        allQuestions = await firebaseQuestionService.getQuestionsByCategory(selectedCategory);
      } else {
        // Get all questions from all categories
        allQuestions = await firebaseQuestionService.getAllQuestions();
      }

      if (allQuestions.length === 0) {
        Alert.alert(
          "Feil",
          selectedCategory 
            ? `Ingen spørsmål funnet i kategorien "${categoryName}".`
            : "Kunne ikke laste spørsmål. Sjekk internettforbindelsen."
        );
        return;
      }

      // Shuffle questions for the full test
      const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
      
      // Process questions to reduce options to 4
      const processedQuestions = processQuestionsWithReducedOptions(shuffled);

      dispatch(startTest(processedQuestions));
      navigation.navigate("Question");
    } catch (error) {
      console.error("Error starting full test:", error);
      Alert.alert("Feil", "Kunne ikke starte test. Prøv igjen senere.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={premiumTheme.colors.background.gradient.primary}
          style={styles.loadingContainer}
        >
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color={premiumTheme.colors.text.inverse} />
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
        colors={premiumTheme.colors.background.gradient.primary}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          {/* Header */}
          <Animated.View style={[styles.header, headerAnimatedStyle]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={premiumTheme.colors.text.inverse}
              />
            </TouchableOpacity>
            <Text style={styles.title}>
              {selectedCategory ? categoryName : "Velg testtype"}
            </Text>
            <View style={styles.headerPlaceholder} />
          </Animated.View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Category Selection (when no category is selected) */}
            {!selectedCategory && (
              <Animated.View style={[styles.cardsContainer, cardAnimatedStyle]}>
                <PremiumCard
                  variant="elevated"
                  padding="large"
                  style={styles.testCard}
                >
                  <View style={styles.testHeader}>
                    <View style={styles.testIcon}>
                      <LinearGradient
                        colors={[premiumTheme.colors.accent.main, premiumTheme.colors.accent.dark]}
                        style={styles.iconGradient}
                      >
                        <Ionicons
                          name="apps"
                          size={24}
                          color={premiumTheme.colors.text.inverse}
                        />
                      </LinearGradient>
                    </View>
                    <View style={styles.testTitleContainer}>
                      <Text style={styles.testTitle}>Velg kategori</Text>
                      <View style={[styles.testBadge, { backgroundColor: premiumTheme.colors.accent.light }]}>
                        <Text style={styles.testBadgeText}>Målrettet øving</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.testDescription}>
                    Øv deg på spørsmål fra en spesifikk kategori som fartsregler, vikeplikt, eller trafikklys.
                  </Text>
                  <View style={styles.testInfo}>
                    <View style={styles.infoItem}>
                      <Ionicons
                        name="flag-outline"
                        size={16}
                        color={premiumTheme.colors.text.secondary}
                      />
                      <Text style={styles.infoText}>Fokusert læring</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Ionicons
                        name="school-outline"
                        size={16}
                        color={premiumTheme.colors.text.secondary}
                      />
                      <Text style={styles.infoText}>Forbedr svake områder</Text>
                    </View>
                  </View>
                  <PremiumButton
                    title="Velg Kategori"
                    onPress={() => navigation.navigate("CategorySelection")}
                    variant="white"
                    size="medium"
                    fullWidth
                    style={styles.cardButton}
                  />
                </PremiumCard>
              </Animated.View>
            )}

            {/* Test Options */}
            <Animated.View style={[styles.cardsContainer, cardAnimatedStyle]}>
              {/* Quick Test Card */}
              <PremiumCard
                variant="elevated"
                padding="large"
                style={styles.testCard}
              >
                <View style={styles.testHeader}>
                  <View style={styles.testIcon}>
                    <LinearGradient
                      colors={premiumTheme.colors.background.gradient.secondary}
                      style={styles.iconGradient}
                    >
                      <Ionicons
                        name="flash"
                        size={24}
                        color={premiumTheme.colors.text.inverse}
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
                    : "Perfekt for en rask øvingsøkt. Test dine kunnskaper med 10 tilfeldig valgte spørsmål."
                  }
                </Text>
                <View style={styles.testInfo}>
                  <View style={styles.infoItem}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={premiumTheme.colors.text.secondary}
                    />
                    <Text style={styles.infoText}>Ca. 5 minutter</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons
                      name="analytics-outline"
                      size={16}
                      color={premiumTheme.colors.text.secondary}
                    />
                    <Text style={styles.infoText}>Rask tilbakemelding</Text>
                  </View>
                </View>
                <PremiumButton
                  title="Start Hurtigtest"
                  onPress={startQuickTest}
                  variant="white"
                  size="medium"
                  fullWidth
                  style={styles.cardButton}
                />
              </PremiumCard>

              {/* Full Test Card */}
              <PremiumCard
                variant="elevated"
                padding="large"
                style={styles.testCard}
              >
                <View style={styles.testHeader}>
                  <View style={styles.testIcon}>
                    <LinearGradient
                      colors={[premiumTheme.colors.purple[400], premiumTheme.colors.purple[600]]}
                      style={styles.iconGradient}
                    >
                      <Ionicons
                        name="library"
                        size={24}
                        color={premiumTheme.colors.text.inverse}
                      />
                    </LinearGradient>
                  </View>
                  <View style={styles.testTitleContainer}>
                    <Text style={styles.testTitle}>Full test</Text>
                    <View style={[styles.testBadge, styles.fullTestBadge]}>
                      <Text style={styles.testBadgeText}>Alle spørsmål</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.testDescription}>
                  {selectedCategory 
                    ? `Omfattende test med alle spørsmål fra ${categoryName?.toLowerCase()}. Få en grundig vurdering av dine kunnskaper i denne kategorien.`
                    : "Omfattende test som dekker alle tilgjengelige spørsmål. Få en grundig vurdering av dine kunnskaper."
                  }
                </Text>
                <View style={styles.testInfo}>
                  <View style={styles.infoItem}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={premiumTheme.colors.text.secondary}
                    />
                    <Text style={styles.infoText}>Ca. 15-20 minutter</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Ionicons
                      name="analytics-outline"
                      size={16}
                      color={premiumTheme.colors.text.secondary}
                    />
                    <Text style={styles.infoText}>Detaljert analyse</Text>
                  </View>
                </View>
                <PremiumButton
                  title="Start Full Test"
                  onPress={startFullTest}
                  variant="white"
                  size="medium"
                  fullWidth
                  style={styles.cardButton}
                />
              </PremiumCard>
            </Animated.View>

            {/* Tips Section */}
            <Animated.View style={[styles.tipsSection, tipsAnimatedStyle]}>
              <PremiumCard
                variant="blur"
                padding="large"
                style={styles.tipsCard}
              >
                <View style={styles.tipsHeader}>
                  <Ionicons
                    name="bulb"
                    size={24}
                    color={premiumTheme.colors.accent.main}
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
                    <Text style={styles.tipText}>Ta deg god tid til å tenke</Text>
                  </View>
                  <View style={styles.tipItem}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipText}>Du kan ikke gå tilbake til tidligere spørsmål</Text>
                  </View>
                  <View style={styles.tipItem}>
                    <Text style={styles.tipBullet}>•</Text>
                    <Text style={styles.tipText}>Fokuser og unngå distraksjoner</Text>
                  </View>
                </View>
              </PremiumCard>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const createStyles = () => StyleSheet.create({
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
    paddingHorizontal: premiumTheme.spacing.lg,
    paddingVertical: premiumTheme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: premiumTheme.borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: premiumTheme.colors.text.inverse,
    textAlign: "center",
  },
  headerPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: premiumTheme.spacing.lg,
    paddingBottom: premiumTheme.spacing["2xl"],
  },
  cardsContainer: {
    gap: premiumTheme.spacing.lg,
    marginBottom: premiumTheme.spacing.xl,
  },
  testCard: {
    marginBottom: 0,
  },
  testHeader: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: premiumTheme.spacing.lg,
  },
  testTitleContainer: {
    alignItems: "center",
    marginBottom: premiumTheme.spacing.md,
  },
  testTitle: {
    fontSize: premiumTheme.typography.fontSize.xl,
    fontWeight: "700",
    color: premiumTheme.colors.text.primary,
    marginBottom: premiumTheme.spacing.xs,
    textAlign: "center",
  },
  testBadge: {
    paddingHorizontal: premiumTheme.spacing.sm,
    paddingVertical: premiumTheme.spacing.xs,
    borderRadius: premiumTheme.borderRadius.full,
    alignSelf: "flex-start",
  },
  quickTestBadge: {
    backgroundColor: premiumTheme.colors.accent.light,
  },
  fullTestBadge: {
    backgroundColor: premiumTheme.colors.purple[100],
  },
  testBadgeText: {
    fontSize: premiumTheme.typography.fontSize.sm,
    fontWeight: "600",
    color: premiumTheme.colors.text.primary,
  },
  testIcon: {
    marginBottom: premiumTheme.spacing.sm,
  },
  iconGradient: {
    width: 48,
    height: 48,
    borderRadius: premiumTheme.borderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
  },
  testDescription: {
    fontSize: premiumTheme.typography.fontSize.base,
    color: premiumTheme.colors.text.secondary,
    lineHeight: premiumTheme.typography.fontSize.base * 1.5,
    marginBottom: premiumTheme.spacing.lg,
    textAlign: "center",
  },
  testInfo: {
    flexDirection: "row",
    justifyContent: "center",
    gap: premiumTheme.spacing.lg,
    marginBottom: premiumTheme.spacing.lg,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: premiumTheme.spacing.xs,
  },
  infoText: {
    fontSize: premiumTheme.typography.fontSize.sm,
    color: premiumTheme.colors.text.secondary,
  },
  cardButton: {
    marginTop: premiumTheme.spacing.sm,
  },
  tipsSection: {
    marginTop: premiumTheme.spacing.md,
  },
  tipsCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: premiumTheme.spacing.sm,
    marginBottom: premiumTheme.spacing.md,
  },
  tipsTitle: {
    fontSize: premiumTheme.typography.fontSize.lg,
    fontWeight: "700",
    color: premiumTheme.colors.text.primary,
  },
  tipsList: {
    gap: premiumTheme.spacing.sm,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: premiumTheme.spacing.sm,
  },
  tipBullet: {
    fontSize: premiumTheme.typography.fontSize.base,
    color: premiumTheme.colors.accent.main,
    fontWeight: "700",
    marginTop: 2,
  },
  tipText: {
    fontSize: premiumTheme.typography.fontSize.base,
    color: premiumTheme.colors.text.secondary,
    flex: 1,
    lineHeight: premiumTheme.typography.fontSize.base * 1.4,
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
    marginTop: premiumTheme.spacing.md,
    fontSize: premiumTheme.typography.fontSize.lg,
    color: premiumTheme.colors.text.inverse,
    fontWeight: "600",
  },
});