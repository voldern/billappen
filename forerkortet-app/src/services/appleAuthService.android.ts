import { FirebaseAuthTypes } from "@react-native-firebase/auth";

interface AppleAuthResult {
  user?: FirebaseAuthTypes.User;
  error?: Error;
}

// Android implementation - Apple Sign In is not available on Android
export const appleAuthService = {
  isAvailable: (): boolean => {
    return false;
  },

  signIn: async (): Promise<AppleAuthResult> => {
    return { error: new Error("Apple Sign In is not available on Android") };
  },

  signOut: async () => {
    // No-op on Android
  },

  onCredentialRevoked: (callback: () => void) => {
    // Return empty unsubscribe function
    return () => {};
  },
};