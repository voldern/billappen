import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Dimensions,
  View,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { premiumTheme } from "../constants/premiumTheme";

interface PremiumButtonProps {
  onPress: () => void;
  title: string;
  variant?: "primary" | "secondary" | "ghost" | "blur";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  haptic?: boolean;
}

const { width } = Dimensions.get("window");

export const PremiumButton: React.FC<PremiumButtonProps> = ({
  onPress,
  title,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  disabled = false,
  icon,
  style,
  haptic = true,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, {
      damping: 10,
      stiffness: 400,
    });
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 400,
    });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const handlePress = () => {
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: interpolate(
      opacity.value,
      [0.8, 1],
      [disabled ? 0.5 : 0.8, disabled ? 0.5 : 1],
      Extrapolate.CLAMP
    ),
  }));

  const getButtonSize = () => {
    switch (size) {
      case "small":
        return styles.small;
      case "large":
        return styles.large;
      default:
        return styles.medium;
    }
  };

  const getTextSize = () => {
    switch (size) {
      case "small":
        return styles.textSmall;
      case "large":
        return styles.textLarge;
      default:
        return styles.textMedium;
    }
  };

  const renderButtonContent = () => {
    const content = (
      <View style={styles.contentContainer}>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <Text style={[getTextSize(), getTextStyle()]}>{title}</Text>
      </View>
    );

    switch (variant) {
      case "primary":
        return (
          <LinearGradient
            colors={
              disabled
                ? [premiumTheme.colors.neutral[300], premiumTheme.colors.neutral[400]]
                : [premiumTheme.colors.primary[500], premiumTheme.colors.primary[600]]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, getButtonSize()]}
          >
            {content}
          </LinearGradient>
        );
      case "blur":
        return (
          <BlurView intensity={80} tint="light" style={[styles.blur, getButtonSize()]}>
            {content}
          </BlurView>
        );
      default:
        return <View style={[styles.default, getButtonSize(), getVariantStyle()]}>{content}</View>;
    }
  };

  const getVariantStyle = () => {
    switch (variant) {
      case "secondary":
        return styles.secondary;
      case "ghost":
        return styles.ghost;
      default:
        return null;
    }
  };

  const getTextStyle = (): TextStyle => {
    switch (variant) {
      case "primary":
      case "blur":
        return { color: premiumTheme.colors.text.inverse };
      case "secondary":
        return { color: premiumTheme.colors.primary[600] };
      case "ghost":
        return { color: premiumTheme.colors.text.primary };
      default:
        return { color: premiumTheme.colors.text.primary };
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
      style={[fullWidth && styles.fullWidth, style]}
    >
      <Animated.View style={[styles.container, animatedStyle]}>
        {renderButtonContent()}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: premiumTheme.borderRadius.full,
    overflow: "hidden",
    ...premiumTheme.shadows.md,
  },
  fullWidth: {
    width: "100%",
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginRight: premiumTheme.spacing.sm,
  },
  gradient: {
    justifyContent: "center",
    alignItems: "center",
  },
  blur: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  default: {
    justifyContent: "center",
    alignItems: "center",
  },
  secondary: {
    backgroundColor: premiumTheme.colors.primary[50],
    borderWidth: 2,
    borderColor: premiumTheme.colors.primary[200],
  },
  ghost: {
    backgroundColor: "transparent",
  },
  small: {
    paddingHorizontal: premiumTheme.spacing.md,
    paddingVertical: premiumTheme.spacing.sm,
    minHeight: 40,
  },
  medium: {
    paddingHorizontal: premiumTheme.spacing.lg,
    paddingVertical: premiumTheme.spacing.md,
    minHeight: 52,
  },
  large: {
    paddingHorizontal: premiumTheme.spacing.xl,
    paddingVertical: premiumTheme.spacing.lg,
    minHeight: 64,
  },
  textSmall: {
    fontSize: premiumTheme.typography.fontSize.sm,
    fontWeight: premiumTheme.typography.fontWeight.semibold,
  },
  textMedium: {
    fontSize: premiumTheme.typography.fontSize.base,
    fontWeight: premiumTheme.typography.fontWeight.semibold,
  },
  textLarge: {
    fontSize: premiumTheme.typography.fontSize.lg,
    fontWeight: premiumTheme.typography.fontWeight.bold,
  },
});