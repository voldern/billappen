import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  View,
  Image,
} from "react-native";
import * as Haptics from "expo-haptics";
import { theme } from "../constants/theme";

interface GoogleSignInButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
}

// Google logo URL
const GOOGLE_LOGO = 'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg';

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onPress,
  style,
  disabled = false,
  loading = false,
}) => {
  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, disabled && styles.buttonDisabled, style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <View style={styles.googleIcon}>
            <View style={[styles.googlePart, styles.googleBlue]} />
            <View style={[styles.googlePart, styles.googleRed]} />
            <View style={[styles.googlePart, styles.googleYellow]} />
            <View style={[styles.googlePart, styles.googleGreen]} />
          </View>
        </View>
        <Text style={styles.text}>
          {loading ? "Kobler til..." : "Fortsett med Google"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#FFFFFF",
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.neutral[300],
    ...theme.shadows.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginRight: theme.spacing.sm,
    width: 20,
    height: 20,
  },
  googleIcon: {
    width: 20,
    height: 20,
    position: 'relative',
  },
  googlePart: {
    position: 'absolute',
    width: 10,
    height: 10,
  },
  googleBlue: {
    backgroundColor: '#4285F4',
    top: 0,
    left: 0,
    borderTopLeftRadius: 10,
  },
  googleRed: {
    backgroundColor: '#EA4335',
    top: 0,
    right: 0,
    borderTopRightRadius: 10,
  },
  googleYellow: {
    backgroundColor: '#FBBC04',
    bottom: 0,
    left: 0,
    borderBottomLeftRadius: 10,
  },
  googleGreen: {
    backgroundColor: '#34A853',
    bottom: 0,
    right: 0,
    borderBottomRightRadius: 10,
  },
  text: {
    color: theme.colors.text.primary,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});