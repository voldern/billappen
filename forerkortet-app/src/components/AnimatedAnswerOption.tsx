import React, { useEffect } from "react";
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Dimensions,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  interpolate,
  Extrapolate,
  runOnJS,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { theme } from "../constants/theme";

interface AnimatedAnswerOptionProps {
  option: string;
  index: number;
  isSelected: boolean;
  isCorrect: boolean;
  showResult: boolean;
  onPress: () => void;
  disabled: boolean;
  delay?: number;
}

const { width } = Dimensions.get("window");

export const AnimatedAnswerOption: React.FC<AnimatedAnswerOptionProps> = ({
  option,
  index,
  isSelected,
  isCorrect,
  showResult,
  onPress,
  disabled,
  delay = 0,
}) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-30);
  const borderScale = useSharedValue(0);
  const iconScale = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    scale.value = withDelay(
      delay,
      withSpring(1, {
        damping: 15,
        stiffness: 100,
      })
    );
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    translateX.value = withDelay(
      delay,
      withSpring(0, {
        damping: 15,
        stiffness: 100,
      })
    );
  }, []);

  useEffect(() => {
    if (isSelected && !showResult) {
      borderScale.value = withSpring(1, {
        damping: 10,
        stiffness: 200,
      });
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    } else if (!isSelected) {
      borderScale.value = withSpring(0);
    }
  }, [isSelected, showResult]);

  useEffect(() => {
    if (showResult && (isSelected || isCorrect)) {
      iconScale.value = withSpring(1, {
        damping: 10,
        stiffness: 200,
      });
    }
  }, [showResult, isSelected, isCorrect]);

  const handlePress = () => {
    if (!disabled) {
      onPress();
    }
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translateX.value },
    ],
    opacity: opacity.value,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    transform: [{ scale: borderScale.value }],
    opacity: borderScale.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
    opacity: iconScale.value,
  }));

  const getBackgroundColor = () => {
    if (!showResult) {
      return isSelected
        ? theme.colors.primary[50]
        : theme.colors.background.secondary;
    }

    if (isCorrect) {
      return theme.colors.semantic.success.light;
    }

    if (isSelected && !isCorrect) {
      return theme.colors.semantic.error.light;
    }

    return theme.colors.background.secondary;
  };

  const getBorderColor = () => {
    if (!showResult) {
      return isSelected
        ? theme.colors.primary[400]
        : "transparent";
    }

    if (isCorrect) {
      return theme.colors.semantic.success.main;
    }

    if (isSelected && !isCorrect) {
      return theme.colors.semantic.error.main;
    }

    return "transparent";
  };

  return (
    <Animated.View style={containerStyle}>
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.container,
            {
              backgroundColor: getBackgroundColor(),
              borderColor: getBorderColor(),
              borderWidth: showResult && (isSelected || isCorrect) ? 2 : 0,
            },
          ]}
        >
          {/* Selection border animation */}
          {!showResult && (
            <Animated.View
              style={[
                styles.selectionBorder,
                borderStyle,
                {
                  borderColor: theme.colors.primary[400],
                },
              ]}
            />
          )}

          <View style={styles.content}>
            <View style={styles.indexContainer}>
              <Text style={styles.indexText}>
                {String.fromCharCode(65 + index)}
              </Text>
            </View>

            <Text
              style={[
                styles.optionText,
                showResult && isCorrect && styles.correctText,
                showResult && isSelected && !isCorrect && styles.incorrectText,
              ]}
            >
              {option}
            </Text>

            {showResult && (
              <Animated.View style={[styles.iconContainer, iconStyle]}>
                {isCorrect ? (
                  <>
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.colors.semantic.success.main}
                      testID="checkmark-circle"
                    />
                    {!isSelected && (
                      <Text style={styles.correctLabel}>Riktig svar</Text>
                    )}
                  </>
                ) : (
                  isSelected && (
                    <Ionicons
                      name="close-circle"
                      size={24}
                      color={theme.colors.semantic.error.main}
                      testID="close-circle"
                    />
                  )
                )}
              </Animated.View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    overflow: "hidden",
    position: "relative",
  },
  selectionBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.md,
  },
  indexContainer: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.neutral[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: theme.spacing.md,
  },
  indexText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.secondary,
  },
  optionText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight:
      theme.typography.fontSize.base *
      theme.typography.lineHeight.normal,
  },
  correctText: {
    color: theme.colors.semantic.success.text,
    fontWeight: theme.typography.fontWeight.medium,
  },
  incorrectText: {
    color: theme.colors.semantic.error.text,
  },
  iconContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: theme.spacing.md,
  },
  correctLabel: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.semantic.success.main,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});