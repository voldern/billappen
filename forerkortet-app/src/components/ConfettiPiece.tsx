import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

interface ConfettiPieceProps {
  color: string;
  initialX: number;
  initialY: number;
  rotation: number;
  delay: number;
}

export const ConfettiPiece: React.FC<ConfettiPieceProps> = ({
  color,
  initialX,
  initialY,
  rotation,
  delay,
}) => {
  const translateY = useSharedValue(initialY);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Start animation with delay
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 100 });
      translateY.value = withTiming(height + 100, {
        duration: 3000 + Math.random() * 1000,
        easing: Easing.out(Easing.quad),
      });
      
      // Fade out after 2.5 seconds
      setTimeout(() => {
        opacity.value = withTiming(0, { duration: 500 });
      }, 2500);
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: initialX },
      { translateY: translateY.value },
      { rotate: `${rotation}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};