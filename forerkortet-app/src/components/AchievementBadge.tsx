import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { premiumTheme as theme } from "../constants/premiumTheme";
import Animated, { FadeIn, useAnimatedStyle, withSpring } from "react-native-reanimated";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedDate?: string;
  progress?: {
    current: number;
    target: number;
  };
}

interface AchievementBadgeProps {
  achievement: Achievement;
  delay?: number;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  delay = 0,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(achievement.unlocked ? 1 : 0.95) }],
    opacity: achievement.unlocked ? 1 : 0.6,
  }));

  return (
    <Animated.View
      entering={FadeIn.delay(delay).springify()}
      style={[styles.container, animatedStyle]}
    >
      <View style={styles.topSection}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: achievement.unlocked
                ? achievement.color + "20"
                : theme.colors.neutral[100],
            },
          ]}
        >
          <Ionicons
            name={achievement.icon as any}
            size={32}
            color={achievement.unlocked ? achievement.color : theme.colors.neutral[400]}
          />
        </View>
        <Text style={styles.title}>{achievement.title}</Text>
        <Text style={styles.description}>{achievement.description}</Text>
      </View>
      
      <View style={styles.bottomSection}>
        {achievement.progress && !achievement.unlocked && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${(achievement.progress.current / achievement.progress.target) * 100}%`,
                    backgroundColor: achievement.color,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {achievement.progress.current}/{achievement.progress.target}
            </Text>
          </View>
        )}
        
        {achievement.unlocked && achievement.unlockedDate && (
          <Text style={styles.unlockedDate}>
            Låst opp {new Date(achievement.unlockedDate).toLocaleDateString("nb-NO")}
          </Text>
        )}
        
        {!achievement.progress && !achievement.unlockedDate && (
          <View style={styles.bottomPlaceholder} />
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background.primary,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
    minHeight: 220,
    flex: 1,
  },
  topSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomSection: {
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: theme.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: "700",
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    textAlign: "center",
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
    marginTop: theme.spacing.sm,
  },
  progressBar: {
    height: 6,
    backgroundColor: theme.colors.neutral[200],
    borderRadius: theme.borderRadius.full,
    overflow: "hidden",
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: "100%",
    borderRadius: theme.borderRadius.full,
  },
  progressText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: "center",
    fontWeight: "600",
  },
  unlockedDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.semantic.success.main,
    fontWeight: "600",
  },
  bottomPlaceholder: {
    height: 20,
  },
});