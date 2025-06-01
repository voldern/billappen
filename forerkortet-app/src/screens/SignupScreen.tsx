import React, { useEffect, useState } from "react";
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
import * as Haptics from "expo-haptics";
import { RootStackParamList } from "../types";
import { theme } from "../constants/theme";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useAuth } from "../contexts/AuthContext";
import { CommonActions } from "@react-navigation/native";
import analyticsService from "../services/analyticsService";
import { showAlert } from "../utils/alert";

type SignupScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Signup"
>;

interface Props {
  navigation: SignupScreenNavigationProp;
}

export default function SignupScreen({ navigation }: Props) {
  const { signUp, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const insets = useSafeAreaInsets();

  const handleSignup = async () => {
    if (!email || !password || !confirmPassword) {
      showAlert("Feil", "Vennligst fyll ut alle feltene");
      return;
    }

    if (!email.includes("@")) {
      showAlert("Feil", "Vennligst skriv inn en gyldig e-postadresse");
      return;
    }

    if (password.length < 6) {
      showAlert("Feil", "Passordet må være minst 6 tegn");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Feil", "Passordene samsvarer ikke");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);

    try {
      const { error } = await signUp(email.trim().toLowerCase(), password);

      if (error) {
        if (error.message.includes("User already registered")) {
          showAlert(
            "Konto eksisterer",
            "Det finnes allerede en konto med denne e-postadressen"
          );
        } else {
          showAlert(
            "Feil",
            error.message || "En feil oppstod under registrering"
          );
        }
      } else {
        // Successful signup
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        await analyticsService.logSignUp({
          method: "email",
        });

        showAlert(
          "Suksess!",
          "Vennligst sjekk e-posten din for å bekrefte kontoen din før du logger inn.",
          [
            {
              text: "OK",
              onPress: () => {
                navigation.dispatch(
                  CommonActions.reset({
                    index: 0,
                    routes: [{ name: "Landing" }],
                  })
                );
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Signup error:", error);
      showAlert("Feil", "En uventet feil oppstod. Prøv igjen senere.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate("Login");
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const styles = createStyles(insets);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleGoBack}
              >
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={theme.colors.text.inverse}
                />
              </TouchableOpacity>
            </View>

            {/* Logo Section */}
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={[
                    theme.colors.background.elevated,
                    theme.colors.background.primary,
                  ]}
                  style={styles.logoGradient}
                >
                  <Ionicons
                    name="person-add"
                    size={48}
                    color={theme.colors.primary[600]}
                  />
                </LinearGradient>
              </View>
              <Text style={styles.welcomeTitle}>Opprett konto</Text>
              <Text style={styles.welcomeSubtitle}>
                Start din læringsreise i dag
              </Text>
            </View>

            {/* Signup Form */}
            <View style={styles.formSection}>
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
                      editable={!loading && !authLoading}
                    />
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Passord</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={theme.colors.text.secondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.textInput, styles.passwordInput]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Minst 6 tegn"
                      placeholderTextColor={theme.colors.text.secondary}
                      secureTextEntry={!showPassword}
                      autoCorrect={false}
                      editable={!loading && !authLoading}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={20}
                        color={theme.colors.text.secondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Bekreft passord</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color={theme.colors.text.secondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={[styles.textInput, styles.passwordInput]}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Skriv passordet på nytt"
                      placeholderTextColor={theme.colors.text.secondary}
                      secureTextEntry={!showConfirmPassword}
                      autoCorrect={false}
                      editable={!loading && !authLoading}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={styles.eyeButton}
                    >
                      <Ionicons
                        name={
                          showConfirmPassword
                            ? "eye-off-outline"
                            : "eye-outline"
                        }
                        size={20}
                        color={theme.colors.text.secondary}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <Button
                  title={loading || authLoading ? "Laster..." : "Opprett konto"}
                  onPress={handleSignup}
                  variant="primary"
                  size="large"
                  fullWidth
                  disabled={loading || authLoading}
                  style={styles.signupButton}
                  icon={
                    loading || authLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={theme.colors.text.inverse}
                      />
                    ) : (
                      <Ionicons
                        name="person-add-outline"
                        size={20}
                        color={theme.colors.text.inverse}
                      />
                    )
                  }
                />
              </Card>

              {/* Login Link */}
              <View style={styles.loginSection}>
                <Text style={styles.loginText}>Har du allerede en konto?</Text>
                <TouchableOpacity
                  onPress={handleLogin}
                  style={styles.loginButton}
                >
                  <Text style={styles.loginButtonText}>Logg inn</Text>
                </TouchableOpacity>
              </View>
            </View>
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
      paddingVertical: theme.spacing.xl,
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
      marginBottom: theme.spacing.xs,
      textAlign: "center",
    },
    welcomeSubtitle: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.inverse,
      opacity: 0.9,
      textAlign: "center",
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
    passwordInput: {
      paddingRight: theme.spacing.sm,
    },
    eyeButton: {
      padding: theme.spacing.xs,
    },
    signupButton: {
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
    dividerContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: theme.spacing.lg,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.neutral[300],
    },
    dividerText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      marginHorizontal: theme.spacing.md,
      fontWeight: "600",
    },
    googleButtonContainer: {
      alignItems: "center",
      marginBottom: theme.spacing.sm,
    },
    googleButton: {
      width: "100%",
    },
    googleLoadingContainer: {
      height: 48,
      justifyContent: "center",
      alignItems: "center",
    },
  });
