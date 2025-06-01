import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { RootStackParamList } from "../types";
import { theme } from "../constants/theme";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useAuth } from "../contexts/AuthContext";
import analyticsService from "../services/analyticsService";
import { showAlert } from "../utils/alert";

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "ForgotPassword"
>;

interface Props {
  navigation: ForgotPasswordScreenNavigationProp;
}

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { resetPassword } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const styles = createStyles(insets);

  // Animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);

  React.useEffect(() => {
    // Entrance animations
    logoScale.value = withSpring(1, { damping: 15, stiffness: 80 });
    logoOpacity.value = withTiming(1, { duration: 600 });

    formOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    formTranslateY.value = withDelay(
      200,
      withSpring(0, { damping: 20, stiffness: 90 })
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: formOpacity.value,
    transform: [{ translateY: formTranslateY.value }],
  }));

  const handleResetPassword = async () => {
    if (!email) {
      showAlert("Feil", "Vennligst skriv inn e-postadressen din");
      return;
    }

    if (!email.includes("@")) {
      showAlert("Feil", "Vennligst skriv inn en gyldig e-postadresse");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);

    try {
      const { error } = await resetPassword(email.trim().toLowerCase());

      if (error) {
        showAlert(
          "Feil",
          error.message || "En feil oppstod under sending av e-post"
        );
      } else {
        setSent(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error("Reset password error:", error);
      showAlert("Feil", "En uventet feil oppstod. Prøv igjen senere.");
    } finally {
      await analyticsService.logEvent("reset_password", {
        email: email,
      });

      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate("Login");
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={theme.colors.background.gradient.primary}
          style={styles.gradient}
        >
          <SafeAreaView style={styles.safeArea} edges={["top"]}>
            <View style={styles.successContainer}>
              <Animated.View style={[styles.successContent, logoAnimatedStyle]}>
                <View style={styles.successIconContainer}>
                  <Ionicons
                    name="mail-outline"
                    size={64}
                    color={theme.colors.text.inverse}
                  />
                </View>
                <Text style={styles.successTitle}>E-post sendt!</Text>
                <Text style={styles.successMessage}>
                  Vi har sendt instruksjoner for å tilbakestille passordet til{" "}
                  {email}. Sjekk innboksen din og følg lenken for å opprette et
                  nytt passord.
                </Text>
                <Button
                  title="Tilbake til innlogging"
                  onPress={handleBackToLogin}
                  variant="secondary"
                  size="large"
                  style={styles.backButton}
                  icon={
                    <Ionicons
                      name="arrow-back"
                      size={20}
                      color={theme.colors.primary[600]}
                    />
                  }
                />
              </Animated.View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={theme.colors.background.gradient.primary}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
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
            </View>

            {/* Logo Section */}
            <Animated.View style={[styles.logoSection, logoAnimatedStyle]}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={[
                    theme.colors.background.elevated,
                    theme.colors.background.primary,
                  ]}
                  style={styles.logoGradient}
                >
                  <Ionicons
                    name="key"
                    size={48}
                    color={theme.colors.primary[600]}
                  />
                </LinearGradient>
              </View>
              <Text style={styles.welcomeTitle}>Glemt passord?</Text>
              <Text style={styles.welcomeSubtitle}>
                Ingen grunn til bekymring! Skriv inn e-postadressen din så
                sender vi deg instruksjoner.
              </Text>
            </Animated.View>

            {/* Reset Form */}
            <Animated.View style={[styles.formSection, formAnimatedStyle]}>
              <Card variant="elevated" padding="large" style={styles.formCard}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>E-postadresse</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={theme.colors.text.secondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.textInput}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="din@epost.no"
                      placeholderTextColor={theme.colors.text.secondary}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      editable={!loading}
                    />
                  </View>
                </View>

                <Button
                  title={loading ? undefined : "Send tilbakestillingslenke"}
                  onPress={handleResetPassword}
                  variant="primary"
                  size="large"
                  fullWidth
                  disabled={loading}
                  style={styles.resetButton}
                  icon={
                    loading ? (
                      <ActivityIndicator
                        size="small"
                        color={theme.colors.text.inverse}
                      />
                    ) : (
                      <Ionicons
                        name="mail"
                        size={20}
                        color={theme.colors.text.inverse}
                      />
                    )
                  }
                />
              </Card>

              {/* Back to Login Link */}
              <View style={styles.loginSection}>
                <Text style={styles.loginText}>Husket du passordet?</Text>
                <TouchableOpacity
                  onPress={handleBackToLogin}
                  style={styles.loginButton}
                >
                  <Text style={styles.loginButtonText}>
                    Tilbake til innlogging
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
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
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: Math.max(theme.spacing.xl, insets.bottom),
    },
    header: {
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
    logoSection: {
      alignItems: "center",
      paddingVertical: theme.spacing["2xl"],
    },
    logoContainer: {
      marginBottom: theme.spacing.lg,
      ...theme.shadows.xl,
    },
    logoGradient: {
      width: 96,
      height: 96,
      borderRadius: theme.borderRadius["2xl"],
      justifyContent: "center",
      alignItems: "center",
    },
    welcomeTitle: {
      fontSize: theme.typography.fontSize["3xl"],
      fontWeight: "700",
      color: theme.colors.text.inverse,
      marginBottom: theme.spacing.md,
      textAlign: "center",
    },
    welcomeSubtitle: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.inverse,
      opacity: 0.9,
      textAlign: "center",
      lineHeight: theme.typography.fontSize.base * 1.5,
    },
    formSection: {
      flex: 1,
    },
    formCard: {
      marginBottom: theme.spacing.xl,
    },
    inputContainer: {
      marginBottom: theme.spacing.lg,
    },
    inputLabel: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: "600",
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.xs,
    },
    inputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.background.elevated,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.neutral[200],
      paddingHorizontal: theme.spacing.md,
    },
    inputIcon: {
      marginRight: theme.spacing.sm,
    },
    textInput: {
      flex: 1,
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.primary,
      paddingVertical: theme.spacing.md,
    },
    resetButton: {
      marginTop: theme.spacing.sm,
    },
    loginSection: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: theme.spacing.lg,
    },
    loginText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.inverse,
      opacity: 0.9,
    },
    loginButton: {
      marginLeft: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    loginButtonText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.inverse,
      fontWeight: "700",
      textDecorationLine: "underline",
    },
    successContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: theme.spacing.lg,
    },
    successContent: {
      alignItems: "center",
      maxWidth: 400,
    },
    successIconContainer: {
      width: 120,
      height: 120,
      borderRadius: theme.borderRadius.full,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: theme.spacing.xl,
    },
    successTitle: {
      fontSize: theme.typography.fontSize["3xl"],
      fontWeight: "700",
      color: theme.colors.text.inverse,
      marginBottom: theme.spacing.lg,
      textAlign: "center",
    },
    successMessage: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.inverse,
      opacity: 0.9,
      textAlign: "center",
      lineHeight: theme.typography.fontSize.base * 1.5,
      marginBottom: theme.spacing["2xl"],
    },
  });
