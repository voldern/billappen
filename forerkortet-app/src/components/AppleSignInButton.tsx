import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  Platform,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { theme } from "../constants/theme";

interface AppleSignInButtonProps {
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
}

export const AppleSignInButton: React.FC<AppleSignInButtonProps> = ({
  onPress,
  style,
  disabled = false,
  loading = false,
}) => {
  if (Platform.OS !== "ios") {
    return null;
  }

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
        <Ionicons
          name="logo-apple"
          size={20}
          color={theme.colors.text.inverse}
          style={styles.icon}
        />
        <Text style={styles.text}>
          {loading ? "Kobler til..." : "Fortsett med Apple"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#000000",
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    width: '100%',
    ...theme.shadows.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  text: {
    color: theme.colors.text.inverse,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
  },
});