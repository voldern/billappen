import auth from "@react-native-firebase/auth";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { Platform } from "react-native";

interface GoogleAuthResult {
  user?: any;
  error?: Error;
}

export const googleAuthService = {
  /**
   * Configure Google Sign In
   * This should be called once when the app starts
   */
  configure: () => {
    GoogleSignin.configure({
      // This is the OAuth 2.0 Web Client ID (client_type: 3) from Firebase Console
      webClientId:
        "792835849296-o9hsrp5oba62teclk0upo5ahdrcll78n.apps.googleusercontent.com",
      offlineAccess: true,
      iosClientId:
        "792835849296-630vbujbpr4f9pca62r11p0p1nau64qh.apps.googleusercontent.com", // iOS client ID
      forceCodeForRefreshToken: true,
    });
  },

  /**
   * Check if Google Play Services are available (Android only)
   */
  hasPlayServices: async (): Promise<boolean> => {
    try {
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      return true;
    } catch (error) {
      console.error("Play Services not available:", error);
      return false;
    }
  },

  /**
   * Sign in with Google
   */
  signIn: async (): Promise<GoogleAuthResult> => {
    try {
      // Check if we have Play Services on Android
      if (Platform.OS === "android") {
        const hasServices = await googleAuthService.hasPlayServices();
        if (!hasServices) {
          throw new Error("Google Play Services are not available");
        }
      }

      // Get the user's ID token
      const { data } = await GoogleSignin.signIn();

      if (!data) {
        throw new Error("No data returned from Google Sign In");
      }

      // Create a Google credential with the token
      const googleCredential = auth.GoogleAuthProvider.credential(data.idToken);

      // Sign-in the user with the credential
      const userCredential = await auth().signInWithCredential(
        googleCredential
      );

      return { user: userCredential.user };
    } catch (error: any) {
      console.error("Google Sign In error:", error);

      // Handle specific error cases
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return { error: new Error("Sign in was cancelled") };
      } else if (error.code === statusCodes.IN_PROGRESS) {
        return { error: new Error("Sign in is already in progress") };
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        return {
          error: new Error("Google Play Services not available or outdated"),
        };
      } else if (error.message?.includes("Network request failed")) {
        return {
          error: new Error("Network error. Please check your connection."),
        };
      }

      return { error };
    }
  },

  /**
   * Sign out (handled by Firebase Auth and Google Sign In)
   */
  signOut: async () => {
    try {
      await GoogleSignin.signOut();
      await auth().signOut();
    } catch (error) {
      console.error("Error signing out from Google:", error);
      // Still sign out from Firebase even if Google sign out fails
      await auth().signOut();
    }
  },

  /**
   * Check if user is signed in
   */
  isSignedIn: (): boolean => {
    try {
      const currentUser = GoogleSignin.getCurrentUser();
      return currentUser !== null;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get current user
   */
  getCurrentUser: () => {
    try {
      return GoogleSignin.getCurrentUser();
    } catch (error) {
      return null;
    }
  },

  /**
   * Revoke access and sign out
   */
  revokeAccess: async () => {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
    } catch (error) {
      console.error("Error revoking Google access:", error);
    }
  },
};
