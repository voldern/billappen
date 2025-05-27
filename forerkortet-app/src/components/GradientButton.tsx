import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { premiumTheme as theme } from '../constants/premiumTheme';

interface GradientButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'success';
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const GradientButton: React.FC<GradientButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  style,
  textStyle,
  disabled = false,
}) => {
  const scale = useSharedValue(1);
  const styles = createStyles();

  const getGradientColors = () => {
    switch (variant) {
      case 'secondary':
        return [theme.colors.accent.main, theme.colors.accent.dark];
      case 'success':
        return [theme.colors.semantic.success.main, theme.colors.semantic.success.dark];
      default:
        return [theme.colors.primary[500], theme.colors.primary[700]];
    }
  };

  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(
      withSpring(0.95),
      withSpring(1.05),
      withSpring(1)
    );
    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      activeOpacity={0.8}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animatedStyle, style]}
    >
      <LinearGradient
        colors={disabled ? [theme.colors.neutral[300], theme.colors.neutral[400]] : getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Text style={[styles.text, textStyle]}>{title}</Text>
      </LinearGradient>
    </AnimatedTouchable>
  );
};

const createStyles = () => StyleSheet.create({
  gradient: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  },
  text: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
  },
});