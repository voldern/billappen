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
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Alert } from "react-native";
import { RootStackParamList } from "../types";
import { premiumTheme } from "../constants/premiumTheme";
import { PremiumButton } from "../components/PremiumButton";
import { PremiumCard } from "../components/PremiumCard";
import { useAuth } from "../contexts/AuthContext";

const { width } = Dimensions.get("window");

const logo = require("../assets/lappen.png");

type LandingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Landing"
>;

interface Props {
  navigation: LandingScreenNavigationProp;
}

export default function PremiumLandingScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  
  // Animated values for background shapes
  const floatingShape1 = useSharedValue(0);
  const floatingShape2 = useSharedValue(0);
  const heroScale = useSharedValue(0.8);
  const heroOpacity = useSharedValue(0);

  const styles = createStyles();
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
      <PremiumCard
        variant="blur"
        padding="large"
        animate
        delay={delay}
        style={styles.featureCard}
      >
        <View style={styles.featureIcon}>
          <LinearGradient
            colors={[
              premiumTheme.colors.primary[400],
              premiumTheme.colors.primary[600],
            ]}
            style={styles.featureIconGradient}
          >
            <Ionicons
              name={icon as any}
              size={28}
              color={premiumTheme.colors.text.inverse}
            />
          </LinearGradient>
        </View>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </PremiumCard>
    );
  };

  useEffect(() => {
    // Floating animation for background shapes
    floatingShape1.value = withRepeat(
      withTiming(1, {
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    floatingShape2.value = withRepeat(
      withTiming(1, {
        duration: 3000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true
    );

    // Hero animation
    heroScale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
    });
    heroOpacity.value = withTiming(1, { duration: 800 });
  }, []);

  const shape1Style = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          floatingShape1.value,
          [0, 1],
          [0, -30],
          Extrapolate.CLAMP
        ),
      },
      {
        translateX: interpolate(
          floatingShape1.value,
          [0, 1],
          [0, 20],
          Extrapolate.CLAMP
        ),
      },
      {
        scale: interpolate(
          floatingShape1.value,
          [0, 0.5, 1],
          [1, 1.1, 1],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const shape2Style = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          floatingShape2.value,
          [0, 1],
          [0, 20],
          Extrapolate.CLAMP
        ),
      },
      {
        translateX: interpolate(
          floatingShape2.value,
          [0, 1],
          [0, -15],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heroScale.value }],
    opacity: heroOpacity.value,
  }));

  const handleLogout = async () => {
    Alert.alert(
      'Logg ut',
      'Er du sikker på at du vil logge ut?',
      [
        {
          text: 'Avbryt',
          style: 'cancel',
        },
        {
          text: 'Logg ut',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={premiumTheme.colors.background.gradient.primary}
        style={styles.gradient}
      >
        {/* Animated background shapes */}
        <Animated.View style={[styles.floatingShape1, shape1Style]}>
          <LinearGradient
            colors={[
              premiumTheme.colors.accent.light,
              premiumTheme.colors.accent.main,
            ]}
            style={styles.shapeGradient}
          />
        </Animated.View>

        <Animated.View style={[styles.floatingShape2, shape2Style]}>
          <LinearGradient
            colors={[
              premiumTheme.colors.purple[300],
              premiumTheme.colors.purple[500],
            ]}
            style={styles.shapeGradient}
          />
        </Animated.View>

        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              {user && (
                <Text style={styles.welcomeText}>
                  Hei, {user.email?.split('@')[0]}!
                </Text>
              )}
            </View>
            <View style={styles.headerRight}>
              {user ? (
                <>
                  {/* Temporary admin button - remove after migration */}
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('AdminMigration' as any)} 
                    style={[styles.logoutButton, { marginRight: 15 }]}
                  >
                    <Ionicons name="settings-outline" size={24} color={premiumTheme.colors.primary[600]} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <Ionicons name="log-out-outline" size={24} color={premiumTheme.colors.primary[600]} />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Login')} 
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
            <Animated.View style={[styles.heroSection, heroStyle]}>
              <View style={styles.logoContainer}>
                {/* <LinearGradient
                  colors={[
                    premiumTheme.colors.primary[500],
                    premiumTheme.colors.primary[700],
                  ]}
                  style={styles.logoGradient}
                > */}
                {/* <Ionicons
                    name="car-sport"
                    size={48}
                    color={premiumTheme.colors.text.inverse}
                  /> */}
                <Image
                  source={logo}
                  resizeMode="contain"
                  style={styles.logoImage}
                />
                {/* </LinearGradient> */}
              </View>

              <Text style={styles.appTitle}>Lappen</Text>
              <Text style={styles.tagline}>Øv deg til teoriprøven</Text>

              {/* <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>500+</Text>
                  <Text style={styles.statLabel}>Spørsmål</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>98%</Text>
                  <Text style={styles.statLabel}>Bestått</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>4.9★</Text>
                  <Text style={styles.statLabel}>Rating</Text>
                </View>
              </View> */}
            </Animated.View>

            {/* Action Buttons */}
            <View style={styles.actionSection}>
              <PremiumButton
                title="Ta test"
                onPress={() => navigation.navigate("CategorySelection")}
                variant="white"
                size="large"
                fullWidth
                icon={
                  <Ionicons
                    name="play"
                    size={20}
                    color={premiumTheme.colors.text.primary}
                  />
                }
              />

              <PremiumButton
                title="Din Fremgang"
                onPress={() => navigation.navigate("Progress")}
                variant="secondary"
                size="large"
                fullWidth
                style={{ marginTop: premiumTheme.spacing.md }}
                icon={
                  <Ionicons
                    name="bar-chart"
                    size={20}
                    color={premiumTheme.colors.primary[600]}
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
            <PremiumCard
              variant="gradient"
              padding="large"
              style={styles.quoteCard}
            >
              <Text style={styles.quoteText}>
                "Veien til suksess starter med det første steget"
              </Text>
              <Text style={styles.quoteAuthor}>- Start din reise i dag</Text>
            </PremiumCard>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: premiumTheme.colors.background.primary,
    },
    gradient: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: premiumTheme.spacing.lg,
      paddingVertical: premiumTheme.spacing.md,
    },
    headerLeft: {
      flex: 1,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    welcomeText: {
      fontSize: premiumTheme.typography.fontSize.base,
      fontWeight: '600',
      color: premiumTheme.colors.text.inverse,
    },
    loginButton: {
      paddingHorizontal: premiumTheme.spacing.md,
      paddingVertical: premiumTheme.spacing.sm,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: premiumTheme.borderRadius.lg,
    },
    loginButtonText: {
      fontSize: premiumTheme.typography.fontSize.sm,
      fontWeight: '600',
      color: premiumTheme.colors.text.inverse,
    },
    logoutButton: {
      padding: premiumTheme.spacing.sm,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: premiumTheme.borderRadius.full,
    },
    scrollContent: {
      paddingBottom: premiumTheme.spacing["3xl"],
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
      paddingTop: premiumTheme.spacing["2xl"],
      paddingHorizontal: premiumTheme.spacing.lg,
    },
    logoContainer: {
      width: 96,
      height: 96,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: premiumTheme.spacing.lg,
      ...premiumTheme.shadows.xl,
    },
    // logoImage: {
    //   width: 96,
    //   height: 96,
    //   borderRadius: premiumTheme.borderRadius["2xl"],
    //   justifyContent: "center",
    //   alignItems: "center",
    // },
    logoImage: {
      width: 96,
      height: 96,
      maxWidth: "100%",
    },
    appTitle: {
      fontSize: 56,
      fontWeight: "900",
      color: premiumTheme.colors.text.inverse,
      marginBottom: premiumTheme.spacing.xs,
      letterSpacing: -2,
      textAlign: "center",
      textShadowColor: "rgba(0, 0, 0, 0.1)",
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    tagline: {
      fontSize: premiumTheme.typography.fontSize.lg,
      color: premiumTheme.colors.text.inverse,
      marginBottom: premiumTheme.spacing.xl,
      textAlign: "center",
      opacity: 0.9,
    },
    statsContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: premiumTheme.colors.background.elevated,
      borderRadius: premiumTheme.borderRadius.xl,
      paddingVertical: premiumTheme.spacing.lg,
      paddingHorizontal: premiumTheme.spacing.xl,
      ...premiumTheme.shadows.md,
    },
    statItem: {
      alignItems: "center",
      paddingHorizontal: premiumTheme.spacing.lg,
    },
    statNumber: {
      fontSize: premiumTheme.typography.fontSize["2xl"],
      fontWeight: premiumTheme.typography.fontWeight.bold,
      color: premiumTheme.colors.primary[600],
      marginBottom: premiumTheme.spacing.xs,
    },
    statLabel: {
      fontSize: premiumTheme.typography.fontSize.sm,
      color: premiumTheme.colors.text.secondary,
    },
    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: premiumTheme.colors.neutral[200],
    },
    actionSection: {
      paddingHorizontal: premiumTheme.spacing.lg,
      marginTop: premiumTheme.spacing["2xl"],
    },
    featuresSection: {
      paddingHorizontal: premiumTheme.spacing.lg,
      marginTop: premiumTheme.spacing["3xl"],
    },
    sectionTitle: {
      fontSize: premiumTheme.typography.fontSize["2xl"],
      fontWeight: premiumTheme.typography.fontWeight.bold,
      color: premiumTheme.colors.text.primary,
      marginBottom: premiumTheme.spacing.lg,
      textAlign: "center",
    },
    featuresGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: -premiumTheme.spacing.sm,
    },
    featureCard: {
      width:
        (width - premiumTheme.spacing.lg * 2 - premiumTheme.spacing.sm * 2) / 2,
      margin: premiumTheme.spacing.sm,
      alignItems: "center",
      minHeight: 180,
    },
    featureIcon: {
      marginBottom: premiumTheme.spacing.md,
      alignSelf: "center",
    },
    featureIconGradient: {
      width: 60,
      height: 60,
      borderRadius: premiumTheme.borderRadius.lg,
      justifyContent: "center",
      alignItems: "center",
    },
    featureTitle: {
      fontSize: premiumTheme.typography.fontSize.base,
      fontWeight: premiumTheme.typography.fontWeight.semibold,
      color: premiumTheme.colors.text.primary,
      marginBottom: premiumTheme.spacing.xs,
      textAlign: "center",
    },
    featureDescription: {
      fontSize: premiumTheme.typography.fontSize.sm,
      color: premiumTheme.colors.text.secondary,
      textAlign: "center",
      lineHeight:
        premiumTheme.typography.fontSize.sm *
        premiumTheme.typography.lineHeight.relaxed,
    },
    quoteCard: {
      marginHorizontal: premiumTheme.spacing.lg,
      marginTop: premiumTheme.spacing["2xl"],
      alignItems: "center",
    },
    quoteText: {
      fontSize: premiumTheme.typography.fontSize.lg,
      fontWeight: premiumTheme.typography.fontWeight.medium,
      color: premiumTheme.colors.text.primary,
      textAlign: "center",
      marginBottom: premiumTheme.spacing.sm,
      fontStyle: "italic",
    },
    quoteAuthor: {
      fontSize: premiumTheme.typography.fontSize.sm,
      color: premiumTheme.colors.text.secondary,
      textAlign: "center",
    },
  });
