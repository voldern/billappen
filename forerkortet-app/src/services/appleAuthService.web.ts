import { AuthUser } from "../types/auth";

interface AppleAuthResult {
  user?: AuthUser;
  error?: Error;
}

// Web implementation - Apple Sign In is not available on web
export const appleAuthService = {
  isAvailable: (): boolean => {
    return false;
  },

  signIn: async (): Promise<AppleAuthResult> => {
    return { error: new Error("Apple Sign In is not available on web") };
  },

  signOut: async () => {
    // No-op on web
  },

  onCredentialRevoked: (callback: () => void) => {
    // Return empty unsubscribe function
    return () => {};
  },
};