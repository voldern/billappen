import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
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
import { RouteProp } from "@react-navigation/native";
import { CommonActions } from "@react-navigation/native";
import analytics from "@react-native-firebase/analytics";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Login"
>;

type LoginScreenRouteProp = RouteProp<RootStackParamList, "Login">;

interface Props {
  navigation: LoginScreenNavigationProp;
  route: LoginScreenRouteProp;
}

export default function LoginScreen({ navigation, route }: Props) {
  const { signIn, loading: authLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const styles = createStyles(insets);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Feil", "Vennligst fyll ut alle feltene");
      return;
    }

    if (!email.includes("@")) {
      Alert.alert("Feil", "Vennligst skriv inn en gyldig e-postadresse");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLoading(true);

    try {
      const { error, user } = await signIn(
        email.trim().toLowerCase(),
        password
      );

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          Alert.alert("Feil", "Ugyldig e-post eller passord");
        } else if (error.message.includes("Email not confirmed")) {
          Alert.alert(
            "E-post ikke bekreftet",
            "Vennligst sjekk e-posten din og klikk på bekreftelseslenken før du logger inn."
          );
        } else {
          Alert.alert(
            "Feil",
            error.message || "En feil oppstod under innlogging"
          );
        }
      } else {
        // Successful login
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        await analytics().logLogin({
          method: "email",
        });
        await analytics().setUserId(user!.uid);
        await analytics().setUserProperty("email", email);

        // Navigate back to landing page after successful login
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: "Landing" }],
          })
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert("Feil", "En uventet feil oppstod. Prøv igjen senere.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate("ForgotPassword");
  };

  const handleSignUp = () => {
    navigation.navigate("Signup");
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

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
                    name="car-sport"
                    size={48}
                    color={theme.colors.primary[600]}
                  />
                </LinearGradient>
              </View>
              <Text style={styles.welcomeTitle}>Velkommen tilbake</Text>
              <Text style={styles.welcomeSubtitle}>
                Logg inn for å fortsette din læring
              </Text>
            </View>

            {/* Login Form */}
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
                      placeholder="Skriv inn passordet ditt"
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

                <TouchableOpacity
                  onPress={handleForgotPassword}
                  style={styles.forgotPasswordButton}
                >
                  <Text style={styles.forgotPasswordText}>Glemt passord?</Text>
                </TouchableOpacity>

                <Button
                  title={loading || authLoading ? "Laster..." : "Logg inn"}
                  onPress={handleLogin}
                  variant="primary"
                  size="large"
                  fullWidth
                  disabled={loading || authLoading}
                  style={styles.loginButton}
                  icon={
                    loading || authLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={theme.colors.text.inverse}
                      />
                    ) : (
                      <Ionicons
                        name="log-in-outline"
                        size={20}
                        color={theme.colors.text.inverse}
                      />
                    )
                  }
                />
              </Card>

              {/* Sign Up Link */}
              <View style={styles.signUpSection}>
                <Text style={styles.signUpText}>Har du ikke en konto?</Text>
                <TouchableOpacity
                  onPress={handleSignUp}
                  style={styles.signUpButton}
                >
                  <Text style={styles.signUpButtonText}>Opprett konto</Text>
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
    forgotPasswordButton: {
      alignSelf: "flex-end",
      marginBottom: theme.spacing.lg,
    },
    forgotPasswordText: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.primary[600],
      fontWeight: "600",
    },
    loginButton: {
      marginTop: theme.spacing.sm,
    },
    signUpSection: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: theme.spacing.lg,
    },
    signUpText: {
      fontSize: theme.typography.fontSize.base,
      color: theme.colors.text.inverse,
      opacity: 0.9,
    },
    signUpButton: {
      marginLeft: theme.spacing.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xs,
    },
    signUpButtonText: {
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
