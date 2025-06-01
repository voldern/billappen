import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator,
} from "react-native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import { RootStackParamList } from "../types";
import { RootState, AppDispatch } from "../store";
import { answerQuestion, nextQuestion, finishTest } from "../store/testSlice";
import { addResult } from "../store/resultsSlice";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { theme } from "../constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import firebaseQuestionService from "../services/firebaseQuestionService";
import { useAuth } from "../contexts/AuthContext";
import { getSignImage } from "../assets/signImages";
import analytics from "@react-native-firebase/analytics";

type QuestionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Question"
>;

interface Props {
  navigation: QuestionScreenNavigationProp;
}

export default function QuestionScreen({ navigation }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { questions, currentQuestionIndex, answers, startTime } = useSelector(
    (state: RootState) => state.test
  );
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isNavigating, setIsNavigating] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const styles = createStyles(insets);

  // Cleanup on unmount
  useFocusEffect(
    React.useCallback(() => {
      // Component is focused
      setIsNavigating(false);

      return () => {
        // Component is unfocused
        setIsNavigating(true);
      };
    }, [])
  );

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(answerIndex);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleConfirmAnswer = async () => {
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

    await analytics().logEvent("answer_question", {
      question_id: currentQuestion.id,
      selected_answer: selectedAnswer,
      correct_answer: currentQuestion.correctAnswer,
      is_correct: selectedAnswer === currentQuestion.correctAnswer,
      time_spent: timeSpent,
    });
  };

  const handleNextQuestion = async () => {
    if (isNavigating) return; // Prevent multiple navigations

    if (currentQuestionIndex === questions.length - 1) {
      setIsNavigating(true);
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
          // Debug logging for categories
          console.log("Question category:", question.category);

          if (!categoryBreakdown[question.category]) {
            categoryBreakdown[question.category] = { correct: 0, total: 0 };
          }
          categoryBreakdown[question.category].total++;
          if (answer.isCorrect) {
            categoryBreakdown[question.category].correct++;
          }
        }
      });

      // Debug log the categoryBreakdown
      console.log("Category breakdown:", categoryBreakdown);

      const testResult = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        score: allAnswers.filter((a) => a.isCorrect).length,
        totalQuestions: questions.length,
        correctAnswers: allAnswers.filter((a) => a.isCorrect).length,
        percentage:
          (allAnswers.filter((a) => a.isCorrect).length / questions.length) *
          100,
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

        // Save to Firebase if user is authenticated
        if (user) {
          try {
            const firebaseTestId = await firebaseQuestionService.saveTestResult(
              user.uid,
              {
                score: testResult.score,
                totalQuestions: testResult.totalQuestions,
                correctAnswers: allAnswers.filter((a) => a.isCorrect).length,
                percentage:
                  (allAnswers.filter((a) => a.isCorrect).length /
                    questions.length) *
                  100,
                duration: Math.floor(testResult.duration / 1000), // Convert to seconds
                categories: categoryBreakdown,
                answers: testResult.answers.map((answer) => ({
                  questionId: answer.questionId,
                  selectedAnswer: answer.selectedAnswer,
                  isCorrect: answer.isCorrect,
                  timeSpent: Math.floor(answer.timeSpent / 1000), // Convert to seconds
                })),
              }
            );

            if (firebaseTestId) {
              console.log(
                "Test result saved to Firebase with ID:",
                firebaseTestId
              );
            }
          } catch (firebaseError) {
            // Log the error but don't block the user from seeing their results
            console.error("Error saving to Firebase:", firebaseError);
            // The test results are still saved locally in AsyncStorage, so the user won't lose their data
          }
        }
      } catch (error) {
        console.error("Error saving result:", error);
      }

      await analytics().logEvent("finish_test", {
        test_id: testResult.id,
        score: testResult.score,
        total_questions: testResult.totalQuestions,
      });

      // Navigate directly without delays
      navigation.replace("TestResults", { testId: testResult.id });
    } else {
      dispatch(nextQuestion());
      setSelectedAnswer(null);
      setShowExplanation(false);
    }
  };

  const handleQuitTest = () => {
    if (isNavigating) return; // Prevent if already navigating

    Alert.alert(
      "Avslutt test",
      "Er du sikker på at du vil avslutte testen? Din fremgang vil gå tapt.",
      [
        { text: "Nei", style: "cancel" },
        {
          text: "Ja",
          style: "destructive",
          onPress: async () => {
            await analytics().logEvent("quit_test");

            setIsNavigating(true);
            // Reset to Landing screen to ensure clean navigation state
            navigation.reset({
              index: 0,
              routes: [{ name: "Landing" }],
            });
          },
        },
      ]
    );
  };

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
    <View style={styles.container}>
      <LinearGradient
        colors={[
          theme.colors.background.secondary,
          theme.colors.background.primary,
        ]}
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
              color={theme.colors.semantic.error.main}
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
          <View style={styles.questionCard}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {currentQuestion.category}
              </Text>
            </View>

            <Text style={styles.question}>
              {currentQuestion.text || currentQuestion.question}
            </Text>

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
                    <View
                      style={[
                        styles.answerIndex,
                        showExplanation &&
                          index === currentQuestion.correctAnswer &&
                          styles.answerIndexCorrect,
                        showExplanation &&
                          index === selectedAnswer &&
                          index !== currentQuestion.correctAnswer &&
                          styles.answerIndexIncorrect,
                      ]}
                    >
                      <Text
                        style={[
                          styles.answerIndexText,
                          showExplanation &&
                            index === currentQuestion.correctAnswer &&
                            styles.answerIndexTextCorrect,
                          showExplanation &&
                            index === selectedAnswer &&
                            index !== currentQuestion.correctAnswer &&
                            styles.answerIndexTextIncorrect,
                        ]}
                      >
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.answerText,
                        showExplanation &&
                          index === currentQuestion.correctAnswer &&
                          styles.correctAnswerText,
                        showExplanation &&
                          index === selectedAnswer &&
                          index !== currentQuestion.correctAnswer &&
                          styles.incorrectAnswerText,
                      ]}
                    >
                      {option}
                    </Text>
                  </View>
                  {showExplanation &&
                    index === currentQuestion.correctAnswer && (
                      <View style={styles.answerFeedback}>
                        <Ionicons
                          name="checkmark-circle"
                          size={28}
                          color={theme.colors.semantic.success.main}
                        />
                      </View>
                    )}
                  {showExplanation &&
                    index === selectedAnswer &&
                    index !== currentQuestion.correctAnswer && (
                      <Ionicons
                        name="close-circle"
                        size={28}
                        color={theme.colors.semantic.error.main}
                      />
                    )}
                </TouchableOpacity>
              ))}
            </View>

            {showExplanation && currentQuestion.explanation && (
              <View style={styles.explanationContainer}>
                <LinearGradient
                  colors={[theme.colors.primary[50], theme.colors.primary[100]]}
                  style={styles.explanationGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.explanationHeader}>
                    <View style={styles.explanationIconContainer}>
                      <Ionicons
                        name="bulb"
                        size={24}
                        color={theme.colors.primary[600]}
                      />
                    </View>
                    <Text style={styles.explanationTitle}>Forklaring</Text>
                  </View>
                  <Text style={styles.explanationText}>
                    {currentQuestion.explanation}
                  </Text>
                </LinearGradient>
              </View>
            )}
          </View>
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
                colors={[
                  theme.colors.semantic.success.main,
                  theme.colors.semantic.success.dark,
                ]}
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

        {/* Loading Overlay */}
        {isNavigating && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.primary[500]} />
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const createStyles = (insets: ReturnType<typeof useSafeAreaInsets>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.primary[50],
    },
    gradient: {
      flex: 1,
    },
    header: {
      paddingTop: insets.top + theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
      backgroundColor: theme.colors.background.primary,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.neutral[100],
    },
    progressWrapper: {
      paddingRight: 40, // Space for quit button
    },
    progressBar: {
      height: 10,
      backgroundColor: theme.colors.neutral[100],
      borderRadius: theme.borderRadius.full,
      overflow: "hidden",
      ...theme.shadows.sm,
    },
    progressFill: {
      height: "100%",
      backgroundColor: theme.colors.primary[500],
      borderRadius: theme.borderRadius.full,
    },
    progressText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing.sm,
      textAlign: "center",
      fontWeight: "600",
    },
    quitButton: {
      position: "absolute",
      right: theme.spacing.lg,
      top: insets.top + theme.spacing.md,
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
      backgroundColor: theme.colors.background.primary,
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      borderWidth: 2,
      borderColor: theme.colors.neutral[200],
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      ...theme.shadows.sm,
    },
    selectedAnswer: {
      backgroundColor: theme.colors.primary[50],
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      borderWidth: 2,
      borderColor: theme.colors.primary[400],
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.primary[400],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    correctAnswer: {
      backgroundColor: theme.colors.semantic.success.light + "15",
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      borderWidth: 2,
      borderColor: theme.colors.semantic.success.main,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.semantic.success.main,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        android: {
          elevation: 6,
        },
      }),
    },
    correctAnswerHighlighted: {
      backgroundColor: theme.colors.semantic.success.light + "25",
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      borderWidth: 3,
      borderColor: theme.colors.semantic.success.main,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      transform: [{ scale: 1.02 }],
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.semantic.success.main,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    incorrectAnswer: {
      backgroundColor: theme.colors.semantic.error.light + "10",
      borderRadius: theme.borderRadius.lg,
      padding: theme.spacing.lg,
      borderWidth: 2,
      borderColor: theme.colors.semantic.error.light,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      opacity: 0.8,
    },
    answerContent: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    answerIndex: {
      width: 36,
      height: 36,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.neutral[100],
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.md,
      borderWidth: 1,
      borderColor: theme.colors.neutral[200],
    },
    answerIndexText: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: "700",
      color: theme.colors.text.secondary,
    },
    answerIndexCorrect: {
      backgroundColor: theme.colors.semantic.success.main,
      borderColor: theme.colors.semantic.success.main,
    },
    answerIndexIncorrect: {
      backgroundColor: theme.colors.semantic.error.main,
      borderColor: theme.colors.semantic.error.main,
    },
    answerIndexTextCorrect: {
      color: theme.colors.text.inverse,
    },
    answerIndexTextIncorrect: {
      color: theme.colors.text.inverse,
    },
    answerText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.primary,
      flex: 1,
      lineHeight:
        theme.typography.fontSize.base * theme.typography.lineHeight.normal,
    },
    correctAnswerText: {
      color: theme.colors.semantic.success.dark,
      fontWeight: "600",
    },
    incorrectAnswerText: {
      color: theme.colors.semantic.error.dark,
      textDecorationLine: "line-through",
      textDecorationStyle: "solid",
      opacity: 0.8,
    },
    answerFeedback: {
      flexDirection: "row",
      alignItems: "center",
      marginLeft: theme.spacing.sm,
    },
    explanationContainer: {
      marginTop: theme.spacing.xl,
      borderRadius: theme.borderRadius.xl,
      overflow: "hidden",
      ...theme.shadows.lg,
    },
    explanationGradient: {
      padding: theme.spacing.xl,
    },
    explanationHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: theme.spacing.lg,
    },
    explanationIconContainer: {
      width: 40,
      height: 40,
      borderRadius: theme.borderRadius.full,
      backgroundColor: theme.colors.background.primary,
      alignItems: "center",
      justifyContent: "center",
      marginRight: theme.spacing.md,
      ...theme.shadows.sm,
    },
    explanationTitle: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: "700",
      color: theme.colors.primary[800],
    },
    explanationText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.primary[700],
      lineHeight:
        theme.typography.fontSize.base * theme.typography.lineHeight.relaxed,
      fontWeight: "500",
    },
    footer: {
      paddingTop: theme.spacing.lg,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: insets.bottom + theme.spacing.lg,
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
    loadingOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.primary[50],
      justifyContent: "center",
      alignItems: "center",
    },
  });
