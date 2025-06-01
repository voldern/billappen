import auth from "@react-native-firebase/auth";
import { appleAuth } from "@invertase/react-native-apple-authentication";

interface AppleAuthResult {
  user?: any;
  error?: Error;
}

export const appleAuthService = {
  /**
   * Check if Apple Sign In is available on this device
   */
  isAvailable: (): boolean => {
    return appleAuth.isSupported;
  },

  /**
   * Sign in with Apple
   */
  signIn: async (): Promise<AppleAuthResult> => {
    try {
      // Check if Apple Sign In is available
      const isAvailable = appleAuthService.isAvailable();
      if (!isAvailable) {
        throw new Error("Apple Sign In is not available on this device");
      }

      // Perform Apple Sign In request
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      // Ensure we have the necessary data
      if (!appleAuthRequestResponse.identityToken) {
        throw new Error("Apple Sign In failed - no identity token returned");
      }

      // Create a Firebase credential from the response
      const { identityToken, nonce } = appleAuthRequestResponse;
      const appleCredential = auth.AppleAuthProvider.credential(
        identityToken,
        nonce
      );

      // Sign in with Firebase
      const userCredential = await auth().signInWithCredential(appleCredential);

      // Update user profile if we have name information (only provided on first sign in)
      if (appleAuthRequestResponse.fullName && userCredential.user) {
        const fullName = [
          appleAuthRequestResponse.fullName.givenName,
          appleAuthRequestResponse.fullName.familyName,
        ]
          .filter(Boolean)
          .join(" ");

        if (fullName) {
          await userCredential.user.updateProfile({
            displayName: fullName,
          });
        }
      }

      return { user: userCredential.user };
    } catch (error: any) {
      console.error("Apple Sign In error:", error);

      // Handle specific error cases
      if (error.code === appleAuth.Error.CANCELED) {
        return { error: new Error("Sign in was cancelled") };
      } else if (error.code === appleAuth.Error.FAILED) {
        return { error: new Error("Sign in failed. Please try again.") };
      } else if (error.code === appleAuth.Error.INVALID_RESPONSE) {
        return {
          error: new Error("Invalid response from Apple. Please try again."),
        };
      } else if (error.code === appleAuth.Error.NOT_HANDLED) {
        return {
          error: new Error("Apple Sign In is not supported on this device"),
        };
      }

      return { error };
    }
  },

  /**
   * Sign out (handled by Firebase Auth)
   */
  signOut: async () => {
    await auth().signOut();
  },

  /**
   * Get the current Apple auth state
   */
  onCredentialRevoked: (callback: () => void) => {
    // Listen for credential revocation
    return appleAuth.onCredentialRevoked(async () => {
      console.warn("Apple credential revoked");
      callback();
    });
  },
};
