import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  Image,
  TouchableOpacity,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Alert } from "react-native";
import { RootStackParamList } from "../types";
import { theme } from "../constants/theme";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useAuth } from "../contexts/AuthContext";
import { useFocusEffect } from "@react-navigation/native";
import { isFeatureEnabled } from "../constants/featureFlags";
import analytics from "@react-native-firebase/analytics";

const logo = require("../assets/lappen.png");

type LandingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Landing"
>;

interface Props {
  navigation: LandingScreenNavigationProp;
}

export default function LandingScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const isNavigating = useRef(false);
  const insets = useSafeAreaInsets();

  const styles = createStyles(insets);
  interface FeatureCardProps {
    icon: string;
    title: string;
    description: string;
    delay: number;
  }

  const FeatureCard: React.FC<FeatureCardProps> = ({
    icon,
    title,
    description,
    delay,
  }) => {
    return (
      <View style={styles.featureCard}>
        <Card
          variant="blur"
          padding="none"
          animate
          delay={delay}
          style={{ flex: 1, width: "100%" }}
        >
          <View style={styles.featureCardContent}>
            <View style={styles.featureIcon}>
              <LinearGradient
                colors={
                  [theme.colors.primary[400], theme.colors.primary[600]] as [
                    string,
                    string
                  ]
                }
                style={styles.featureIconGradient}
              >
                <Ionicons
                  name={icon as any}
                  size={28}
                  color={theme.colors.text.inverse}
                />
              </LinearGradient>
            </View>
            <Text style={styles.featureTitle}>{title}</Text>
            <Text style={styles.featureDescription} numberOfLines={2}>
              {description}
            </Text>
          </View>
        </Card>
      </View>
    );
  };

  // Cleanup on unmount
  useFocusEffect(
    React.useCallback(() => {
      // Component is focused
      isNavigating.current = false;

      return () => {
        // Component is unfocused
        isNavigating.current = true;
      };
    }, [])
  );

  const handleLogout = async () => {
    if (isNavigating.current) return;

    Alert.alert("Logg ut", "Er du sikker på at du vil logge ut?", [
      {
        text: "Avbryt",
        style: "cancel",
      },
      {
        text: "Logg ut",
        style: "destructive",
        onPress: async () => {
          isNavigating.current = true;
          await signOut();
          await analytics().logEvent("logout");
        },
      },
    ]);
  };

  const handleNavigation = (screen: keyof RootStackParamList) => {
    // Always push new screens to avoid the old navigate back behavior
    navigation.push(screen as any);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
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
        {/* Animated background shapes */}
        <View style={styles.floatingShape1}>
          <LinearGradient
            colors={
              [theme.colors.accent.light, theme.colors.accent.main] as [
                string,
                string
              ]
            }
            style={styles.shapeGradient}
          />
        </View>

        <View style={styles.floatingShape2}>
          <LinearGradient
            colors={
              [theme.colors.purple[300], theme.colors.purple[500]] as [
                string,
                string
              ]
            }
            style={styles.shapeGradient}
          />
        </View>

        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {user && (
                <Text style={styles.welcomeText}>
                  Hei, {user.email?.split("@")[0]}!
                </Text>
              )}
            </View>
            <View style={styles.headerRight}>
              {user ? (
                <>
                  <TouchableOpacity
                    onPress={handleLogout}
                    style={styles.logoutButton}
                  >
                    <Ionicons
                      name="log-out-outline"
                      size={24}
                      color={theme.colors.primary[600]}
                    />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={() => handleNavigation("Login")}
                  style={styles.loginButton}
                >
                  <Text style={styles.loginButtonText}>Logg inn</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Hero Section */}
            <View style={styles.heroSection}>
              <View style={styles.logoContainer}>
                <Image
                  source={logo}
                  resizeMode="contain"
                  style={styles.logoImage}
                />
              </View>

              <Text style={styles.appTitle}>Lappen</Text>
              <Text style={styles.tagline}>Øv deg til teoriprøven</Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionSection}>
              <Button
                title="Ta test"
                onPress={() =>
                  handleNavigation(
                    isFeatureEnabled("ENABLE_CATEGORY_SELECTION")
                      ? "CategorySelection"
                      : "NewTest"
                  )
                }
                variant="white"
                size="large"
                fullWidth
                icon={
                  <Ionicons
                    name="play"
                    size={20}
                    color={theme.colors.text.primary}
                  />
                }
              />

              <Button
                title="Din Fremgang"
                onPress={() => handleNavigation("Progress")}
                variant="secondary"
                size="large"
                fullWidth
                style={{ marginTop: theme.spacing.md }}
                icon={
                  <Ionicons
                    name="bar-chart"
                    size={20}
                    color={theme.colors.primary[600]}
                  />
                }
              />
            </View>

            {/* Features Section */}
            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>Hvorfor velge oss?</Text>

              <View style={styles.featuresGrid}>
                <FeatureCard
                  icon="gift-outline"
                  title="Helt gratis"
                  description="Ingen skjulte kostnader eller abonnementer"
                  delay={100}
                />
                <FeatureCard
                  icon="bulb-outline"
                  title="Smart læring"
                  description="Tilpasset til ditt nivå med AI"
                  delay={200}
                />
                <FeatureCard
                  icon="analytics-outline"
                  title="Detaljert analyse"
                  description="Se din fremgang i sanntid"
                  delay={300}
                />
                <FeatureCard
                  icon="trophy-outline"
                  title="Gamification"
                  description="Lær gjennom morsomme utfordringer"
                  delay={400}
                />
              </View>
            </View>

            {/* Motivational Quote */}
            <View style={styles.quoteContainer}>
              <Card variant="gradient" padding="large" style={styles.quoteCard}>
                <Text style={styles.quoteText}>
                  "Veien til suksess starter med det første steget"
                </Text>
                <Text style={styles.quoteAuthor}>- Start din reise i dag</Text>
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
      backgroundColor: theme.colors.background.primary,
    },
    gradient: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    headerLeft: {
      flex: 1,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    welcomeText: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: "600",
      color: theme.colors.text.inverse,
    },
    loginButton: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: theme.borderRadius.lg,
    },
    loginButtonText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: "600",
      color: theme.colors.text.inverse,
    },
    logoutButton: {
      padding: theme.spacing.sm,
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderRadius: theme.borderRadius.full,
    },
    scrollContent: {
      paddingBottom: Math.max(theme.spacing["3xl"], insets.bottom),
    },
    floatingShape1: {
      position: "absolute",
      top: -100,
      right: -50,
      width: 250,
      height: 250,
      opacity: 0.15,
    },
    floatingShape2: {
      position: "absolute",
      bottom: 100,
      left: -80,
      width: 200,
      height: 200,
      opacity: 0.1,
    },
    shapeGradient: {
      width: "100%",
      height: "100%",
      borderRadius: 999,
    },
    heroSection: {
      alignItems: "center",
      paddingTop: theme.spacing["2xl"],
      paddingHorizontal: theme.spacing.lg,
    },
    logoContainer: {
      width: 96,
      height: 96,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: theme.spacing.lg,
      ...theme.shadows.xl,
    },
    logoImage: {
      width: 96,
      height: 96,
      maxWidth: "100%",
    },
    appTitle: {
      fontSize: 56,
      fontWeight: "900",
      color: theme.colors.text.inverse,
      marginBottom: theme.spacing.xs,
      letterSpacing: -2,
      textAlign: "center",
      textShadowColor: "rgba(0, 0, 0, 0.1)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    tagline: {
      fontSize: theme.typography.fontSize.lg,
      color: theme.colors.text.inverse,
      marginBottom: theme.spacing.xl,
      textAlign: "center",
      opacity: 0.9,
    },
    actionSection: {
      paddingHorizontal: theme.spacing.lg,
      marginTop: theme.spacing["2xl"],
      maxWidth: 600,
      alignSelf: "center",
      width: "100%",
    },
    featuresSection: {
      marginTop: theme.spacing["3xl"],
      alignItems: "center",
      width: "100%",
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize["2xl"],
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.text.primary,
      marginBottom: theme.spacing.lg,
      textAlign: "center",
    },
    featuresGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      maxWidth: 600,
      alignSelf: "center",
      width: "100%",
      paddingHorizontal: theme.spacing.lg,
    },
    featureCard: {
      width: "48%",
      aspectRatio: 1,
      marginBottom: theme.spacing.lg,
    },
    featureCardContent: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.lg,
    },
    featureIcon: {
      marginBottom: theme.spacing.md,
    },
    featureIconGradient: {
      width: 56,
      height: 56,
      borderRadius: theme.borderRadius.lg,
      justifyContent: "center",
      alignItems: "center",
    },
    featureTitle: {
      fontSize: theme.typography.fontSize.base,
      fontWeight: theme.typography.fontWeight.semibold,
      color: theme.colors.primary[700],
      marginBottom: theme.spacing.xs,
      textAlign: "center",
    },
    featureDescription: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.primary[600],
      textAlign: "center",
      lineHeight: theme.typography.fontSize.sm * 1.4,
    },
    quoteContainer: {
      paddingHorizontal: theme.spacing.lg,
      marginTop: theme.spacing["2xl"],
      maxWidth: 600,
      alignSelf: "center",
      width: "100%",
    },
    quoteCard: {
      alignItems: "center",
      width: "100%",
    },
    quoteText: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.medium,
      color: theme.colors.text.primary,
      textAlign: "center",
      marginBottom: theme.spacing.sm,
      fontStyle: "italic",
    },
    quoteAuthor: {
      fontSize: theme.typography.fontSize.sm,
      color: theme.colors.text.secondary,
      textAlign: "center",
    },
  });
