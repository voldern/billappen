import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSelector, useDispatch } from "react-redux";
import { RootStackParamList } from "../types";
import { RootState, AppDispatch } from "../store";
import { answerQuestion, nextQuestion, finishTest } from "../store/testSlice";
import { addResult } from "../store/resultsSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { theme } from "../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import supabaseQuestionService from "../services/supabaseQuestionService";
import { getSignImage } from "../assets/signImages";

const { width, height } = Dimensions.get("window");

type QuestionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Question"
>;

interface Props {
  navigation: QuestionScreenNavigationProp;
}

export default function QuestionScreen({ navigation }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { questions, currentQuestionIndex, answers, startTime } = useSelector(
    (state: RootState) => state.test
  );
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const translateX = useSharedValue(0);
  const cardOpacity = useSharedValue(0);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  useEffect(() => {
    setQuestionStartTime(Date.now());

    // Animate card entrance
    cardOpacity.value = 0;
    translateX.value = width;
    cardOpacity.value = withTiming(1, { duration: 300 });
    translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
  }, [currentQuestionIndex]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(answerIndex);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleConfirmAnswer = () => {
    if (selectedAnswer === null) return;

    const timeSpent = Date.now() - questionStartTime;
    dispatch(
      answerQuestion({
        questionId: currentQuestion.id,
        selectedAnswer,
        timeSpent,
      })
    );
    setShowExplanation(true);

    if (selectedAnswer === currentQuestion.correctAnswer) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex === questions.length - 1) {
      dispatch(finishTest());

      // Ensure we have all answers including the last one
      // Since there might be a timing issue with Redux state updates,
      // we need to make sure we include the current answer if it's not in the store yet
      const currentAnswer = answers.find(
        (a) => a.questionId === currentQuestion.id
      );
      let allAnswers = answers;

      // If the current question's answer is not in the store yet, we have a timing issue
      if (!currentAnswer && selectedAnswer !== null) {
        allAnswers = [
          ...answers,
          {
            questionId: currentQuestion.id,
            selectedAnswer: selectedAnswer!,
            isCorrect: selectedAnswer === currentQuestion.correctAnswer,
            timeSpent: Date.now() - questionStartTime,
          },
        ];
      }

      // Calculate category breakdown
      const categoryBreakdown: Record<
        string,
        { correct: number; total: number }
      > = {};
      allAnswers.forEach((answer) => {
        const question = questions.find((q) => q.id === answer.questionId);
        if (question) {
          if (!categoryBreakdown[question.category]) {
            categoryBreakdown[question.category] = { correct: 0, total: 0 };
          }
          categoryBreakdown[question.category].total++;
          if (answer.isCorrect) {
            categoryBreakdown[question.category].correct++;
          }
        }
      });

      const testResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        score: allAnswers.filter((a) => a.isCorrect).length,
        totalQuestions: questions.length,
        duration: Date.now() - startTime,
        answers: allAnswers,
        categoryBreakdown,
      };

      dispatch(addResult(testResult));

      try {
        // Save to AsyncStorage
        const savedResults = await AsyncStorage.getItem("testResults");
        const results = savedResults ? JSON.parse(savedResults) : [];
        results.unshift(testResult);
        await AsyncStorage.setItem("testResults", JSON.stringify(results));

        // Save to Supabase
        const supabaseTestId = await supabaseQuestionService.saveTestResult({
          score: testResult.score,
          totalQuestions: testResult.totalQuestions,
          duration: Math.floor(testResult.duration / 1000), // Convert to seconds
          answers: testResult.answers.map((answer) => ({
            questionId: answer.questionId,
            selectedAnswer: answer.selectedAnswer,
            isCorrect: answer.isCorrect,
            timeSpent: Math.floor(answer.timeSpent / 1000), // Convert to seconds
          })),
        });

        if (supabaseTestId) {
          console.log("Test result saved to Supabase with ID:", supabaseTestId);
        }
      } catch (error) {
        console.error("Error saving result:", error);
      }

      navigation.replace("TestResults", { testId: testResult.id });
    } else {
      dispatch(nextQuestion());
      setSelectedAnswer(null);
      setShowExplanation(false);

      // Animate transition
      translateX.value = width;
      translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
    }
  };

  const handleQuitTest = () => {
    Alert.alert(
      "Avslutt test",
      "Er du sikker på at du vil avslutte testen? Din fremgang vil gå tapt.",
      [
        { text: "Nei", style: "cancel" },
        {
          text: "Ja",
          style: "destructive",
          onPress: () => navigation.navigate("Landing"),
        },
      ]
    );
  };

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: cardOpacity.value,
  }));

  const getAnswerStyle = (index: number) => {
    if (!showExplanation) {
      return selectedAnswer === index ? styles.selectedAnswer : styles.answer;
    }

    const isCorrect = index === currentQuestion.correctAnswer;
    const wasSelected = index === selectedAnswer;

    if (isCorrect) {
      // Highlight correct answer more prominently if user got it wrong
      return wasSelected || selectedAnswer === currentQuestion.correctAnswer
        ? styles.correctAnswer
        : styles.correctAnswerHighlighted;
    }
    if (wasSelected && !isCorrect) return styles.incorrectAnswer;
    return styles.answer;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <LinearGradient
        colors={[theme.colors.primary[50], theme.colors.background.primary]}
        style={styles.gradient}
      >
        {/* Fixed Header */}
        <View style={styles.header}>
          <View style={styles.progressWrapper}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              Spørsmål {currentQuestionIndex + 1} av {questions.length}
            </Text>
          </View>

          <TouchableOpacity style={styles.quitButton} onPress={handleQuitTest}>
            <Ionicons
              name="close-circle"
              size={32}
              color={theme.colors.error.main}
            />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={[styles.questionCard, cardAnimatedStyle]}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {currentQuestion.category}
              </Text>
            </View>

            <Text style={styles.question}>{currentQuestion.question}</Text>

            {currentQuestion.signId && getSignImage(currentQuestion.signId) && (
              <View style={styles.imageContainer}>
                <Image
                  source={getSignImage(currentQuestion.signId)}
                  style={styles.signImage}
                  resizeMode="contain"
                />
              </View>
            )}

            <View style={styles.answersContainer}>
              {currentQuestion.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={getAnswerStyle(index)}
                  onPress={() => handleAnswerSelect(index)}
                  disabled={showExplanation}
                  activeOpacity={0.7}
                >
                  <View style={styles.answerContent}>
                    <View style={styles.answerIndex}>
                      <Text style={styles.answerIndexText}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text style={styles.answerText}>{option}</Text>
                  </View>
                  {showExplanation &&
                    index === currentQuestion.correctAnswer && (
                      <View style={styles.answerFeedback}>
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={theme.colors.success.main}
                        />
                        {selectedAnswer !== currentQuestion.correctAnswer && (
                          <Text style={styles.correctAnswerLabel}>Riktig svar</Text>
                        )}
                      </View>
                    )}
                  {showExplanation &&
                    index === selectedAnswer &&
                    index !== currentQuestion.correctAnswer && (
                      <Ionicons
                        name="close-circle"
                        size={24}
                        color={theme.colors.error.main}
                      />
                    )}
                </TouchableOpacity>
              ))}
            </View>

            {showExplanation && (
              <View style={styles.explanationContainer}>
                <View style={styles.explanationHeader}>
                  <Ionicons
                    name="information-circle"
                    size={20}
                    color={theme.colors.primary[600]}
                  />
                  <Text style={styles.explanationTitle}>Forklaring</Text>
                </View>
                <Text style={styles.explanationText}>
                  {currentQuestion.explanation}
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Fixed Footer */}
        <View style={styles.footer}>
          {!showExplanation ? (
            <TouchableOpacity
              style={[
                styles.actionButton,
                selectedAnswer === null && styles.actionButtonDisabled,
              ]}
              onPress={handleConfirmAnswer}
              disabled={selectedAnswer === null}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={
                  selectedAnswer === null
                    ? [theme.colors.neutral[300], theme.colors.neutral[400]]
                    : [theme.colors.primary[500], theme.colors.primary[700]]
                }
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Bekreft svar</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleNextQuestion}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[theme.colors.success.main, theme.colors.success.dark]}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {currentQuestionIndex === questions.length - 1
                    ? "Se resultat"
                    : "Neste spørsmål"}
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={20}
                  color={theme.colors.text.inverse}
                />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary[50],
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.background.primary,
    ...theme.shadows.sm,
  },
  progressWrapper: {
    paddingRight: 40, // Space for quit button
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.colors.primary[500],
  },
  progressText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: "center",
  },
  quitButton: {
    position: "absolute",
    right: theme.spacing.lg,
    top: theme.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  questionCard: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  categoryBadge: {
    backgroundColor: theme.colors.primary[100],
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    alignSelf: "flex-start",
    marginBottom: theme.spacing.md,
  },
  categoryText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary[700],
    fontWeight: "600",
  },
  question: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.lg,
    lineHeight:
      theme.typography.fontSize.lg * theme.typography.lineHeight.normal,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.neutral[50],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  signImage: {
    width: 120,
    height: 120,
    maxWidth: "100%",
  },
  answersContainer: {
    gap: theme.spacing.sm,
  },
  answer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedAnswer: {
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary[300],
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  correctAnswer: {
    backgroundColor: theme.colors.success.light + "20",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.success.main,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  correctAnswerHighlighted: {
    backgroundColor: theme.colors.success.light + "40",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.success.main,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.success.main,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  incorrectAnswer: {
    backgroundColor: theme.colors.error.light + "20",
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.error.main,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  answerContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  answerIndex: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.neutral[200],
    alignItems: "center",
    justifyContent: "center",
    marginRight: theme.spacing.md,
  },
  answerIndexText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: "600",
    color: theme.colors.text.secondary,
  },
  answerText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    flex: 1,
  },
  answerFeedback: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  correctAnswerLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.success.main,
    fontWeight: "600",
  },
  explanationContainer: {
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary[50],
    borderRadius: theme.borderRadius.md,
  },
  explanationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  explanationTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: "600",
    color: theme.colors.primary[700],
    marginLeft: theme.spacing.sm,
  },
  explanationText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    lineHeight:
      theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
  },
  footer: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: theme.colors.neutral[200],
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  actionButton: {
    borderRadius: theme.borderRadius.full,
    overflow: "hidden",
    ...theme.shadows.md,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: "600",
    color: theme.colors.text.inverse,
    marginRight: theme.spacing.xs,
  },
});
