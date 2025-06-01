import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { theme } from "../constants/theme";

interface CardProps {
  children: React.ReactNode;
  variant?: "elevated" | "flat" | "gradient" | "blur" | "neumorphic";
  padding?: "none" | "small" | "medium" | "large";
  animate?: boolean;
  delay?: number;
  style?: ViewStyle;
  gradientColors?: string[];
}

const { width } = Dimensions.get("window");

export const Card: React.FC<CardProps> = ({
  children,
  variant = "elevated",
  padding = "medium",
  animate = true,
  delay = 0,
  style,
  gradientColors,
}) => {
  const scale = useSharedValue(animate ? 0.9 : 1);
  const opacity = useSharedValue(animate ? 0 : 1);
  const translateY = useSharedValue(animate ? 20 : 0);

  useEffect(() => {
    if (animate) {
      scale.value = withDelay(
        delay,
        withSpring(1, {
          damping: 12,
          stiffness: 100,
        })
      );
      opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
      translateY.value = withDelay(
        delay,
        withSpring(0, {
          damping: 12,
          stiffness: 100,
        })
      );
    }
  }, [animate, delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const getPadding = () => {
    switch (padding) {
      case "none":
        return 0;
      case "small":
        return theme.spacing.sm;
      case "large":
        return theme.spacing.lg;
      default:
        return theme.spacing.md;
    }
  };

  const renderCard = () => {
    const cardContent = <View style={{ padding: getPadding(), flex: 1 }}>{children}</View>;

    switch (variant) {
      case "gradient":
        return (
          <LinearGradient
            colors={
              gradientColors || theme.colors.background.gradient.background
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, styles.elevated]}
          >
            {cardContent}
          </LinearGradient>
        );
      
      case "blur":
        return (
          <BlurView
            intensity={40}
            tint="light"
            style={[styles.card, styles.blur, { flex: 1 }]}
          >
            {cardContent}
          </BlurView>
        );
      
      case "neumorphic":
        return (
          <View style={[styles.card, styles.neumorphic]}>
            <View style={styles.neumorphicInner}>
              {cardContent}
            </View>
          </View>
        );
      
      case "flat":
        return (
          <View style={[styles.card, styles.flat]}>
            {cardContent}
          </View>
        );
      
      default:
        return (
          <View style={[styles.card, styles.elevated]}>
            {cardContent}
          </View>
        );
    }
  };

  return (
    <Animated.View style={[animatedStyle, style, { flex: style?.flex || undefined }]}>
      {renderCard()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.background.elevated,
    overflow: "hidden",
  },
  elevated: {
    ...theme.shadows.lg,
    backgroundColor: theme.colors.background.elevated,
  },
  flat: {
    backgroundColor: theme.colors.background.secondary,
  },
  blur: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  neumorphic: {
    backgroundColor: theme.colors.background.secondary,
    shadowColor: theme.colors.neutral[300],
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  neumorphicInner: {
    backgroundColor: theme.colors.background.secondary,
    shadowColor: theme.colors.neutral[500],
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
});