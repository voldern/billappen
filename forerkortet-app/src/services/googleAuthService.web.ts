import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface GoogleAuthResult {
  user?: any;
  error?: Error;
}

export const googleAuthService = {
  /**
   * Configure Google Sign In (not needed for web)
   */
  configure: () => {
    // No configuration needed for web
  },

  /**
   * Check if Google Play Services are available (always true on web)
   */
  hasPlayServices: async (): Promise<boolean> => {
    return true;
  },

  /**
   * Sign in with Google using popup
   */
  signIn: async (): Promise<GoogleAuthResult> => {
    try {
      const provider = new GoogleAuthProvider();
      
      // Add scopes if needed
      provider.addScope('profile');
      provider.addScope('email');
      
      const result = await signInWithPopup(auth, provider);
      return { user: result.user };
    } catch (error: any) {
      console.error('Google Sign In error:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        return { error: new Error('Sign in was cancelled') };
      } else if (error.code === 'auth/popup-blocked') {
        return { error: new Error('Popup was blocked. Please allow popups for this site.') };
      } else if (error.code === 'auth/cancelled-popup-request') {
        return { error: new Error('Another popup is already open') };
      } else if (error.code === 'auth/network-request-failed') {
        return { error: new Error('Network error. Please check your connection.') };
      }
      
      return { error };
    }
  },

  /**
   * Sign out (handled by Firebase Auth)
   */
  signOut: async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out from Google:', error);
    }
  },

  /**
   * Check if user is signed in
   */
  isSignedIn: (): boolean => {
    return auth.currentUser !== null;
  },

  /**
   * Get current user
   */
  getCurrentUser: () => {
    return auth.currentUser;
  },

  /**
   * Revoke access (not available on web)
   */
  revokeAccess: async () => {
    // Not available on web - just sign out
    await auth.signOut();
  },
};