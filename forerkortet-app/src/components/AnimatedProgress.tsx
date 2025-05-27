import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from "react-native-reanimated";
import { premiumTheme } from "../constants/premiumTheme";
import * as Haptics from "expo-haptics";

interface AnimatedProgressProps {
  progress: number; // 0-100
  currentStep: number;
  totalSteps: number;
  showPercentage?: boolean;
  height?: number;
  animated?: boolean;
}

const { width } = Dimensions.get("window");

export const AnimatedProgress: React.FC<AnimatedProgressProps> = ({
  progress,
  currentStep,
  totalSteps,
  showPercentage = true,
  height = 8,
  animated = true,
}) => {
  const animatedProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (animated) {
      animatedProgress.value = withSpring(progress, {
        damping: 15,
        stiffness: 100,
      });
      
      // Pulse animation when progress updates
      pulseScale.value = withSpring(1.05, {
        damping: 10,
        stiffness: 400,
      }, () => {
        pulseScale.value = withSpring(1, {
          damping: 10,
          stiffness: 400,
        });
      });
      
      // Haptic feedback on progress milestones
      if (progress % 10 === 0 && progress > 0) {
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      }
    } else {
      animatedProgress.value = progress;
    }
  }, [progress, animated]);

  const progressBarStyle = useAnimatedStyle(() => ({
    width: `${animatedProgress.value}%`,
    transform: [
      {
        scaleY: interpolate(
          pulseScale.value,
          [1, 1.05],
          [1, 1.2],
          Extrapolate.CLAMP
        ),
      },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      animatedProgress.value,
      [0, 50, 100],
      [0.3, 0.6, 0.8],
      Extrapolate.CLAMP
    ),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.stepText}>
          Spørsmål {currentStep} av {totalSteps}
        </Text>
        {showPercentage && (
          <Text style={styles.percentageText}>{Math.round(progress)}%</Text>
        )}
      </View>
      
      <View style={[styles.progressBar, { height }]}>
        <Animated.View style={[styles.progressFill, progressBarStyle]}>
          <Animated.View style={[styles.glow, glowStyle]} />
        </Animated.View>
        
        {/* Progress dots */}
        <View style={styles.dotsContainer}>
          {Array.from({ length: totalSteps }).map((_, index) => {
            const dotProgress = ((index + 1) / totalSteps) * 100;
            const isActive = progress >= dotProgress;
            const isCurrent = currentStep === index + 1;
            
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  isActive && styles.dotActive,
                  isCurrent && styles.dotCurrent,
                  { left: `${dotProgress}%` },
                ]}
              />
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: premiumTheme.spacing.sm,
  },
  stepText: {
    fontSize: premiumTheme.typography.fontSize.sm,
    color: premiumTheme.colors.text.secondary,
    fontWeight: premiumTheme.typography.fontWeight.medium,
  },
  percentageText: {
    fontSize: premiumTheme.typography.fontSize.sm,
    color: premiumTheme.colors.primary[600],
    fontWeight: premiumTheme.typography.fontWeight.semibold,
  },
  progressBar: {
    width: "100%",
    backgroundColor: premiumTheme.colors.neutral[100],
    borderRadius: premiumTheme.borderRadius.full,
    overflow: "hidden",
    position: "relative",
  },
  progressFill: {
    height: "100%",
    backgroundColor: premiumTheme.colors.primary[500],
    borderRadius: premiumTheme.borderRadius.full,
    position: "relative",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 40,
    height: "100%",
    backgroundColor: premiumTheme.colors.primary[300],
    opacity: 0.6,
    transform: [{ skewX: "-20deg" }],
  },
  dotsContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "100%",
  },
  dot: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: premiumTheme.colors.neutral[200],
    top: "50%",
    marginTop: -6,
    marginLeft: -6,
    borderWidth: 2,
    borderColor: premiumTheme.colors.background.primary,
  },
  dotActive: {
    backgroundColor: premiumTheme.colors.primary[400],
  },
  dotCurrent: {
    backgroundColor: premiumTheme.colors.primary[600],
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: -8,
    marginLeft: -8,
    borderWidth: 3,
    ...premiumTheme.shadows.sm,
  },
});