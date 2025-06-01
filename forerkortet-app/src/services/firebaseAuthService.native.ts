import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import crashlytics from '@react-native-firebase/crashlytics';

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: any;
  updatedAt?: any;
}

class FirebaseAuthService {
  async signUp(email: string, password: string, displayName?: string): Promise<FirebaseAuthTypes.User> {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (displayName) {
        await user.updateProfile({ displayName });
      }

      await firestore().collection('users').doc(user.uid).set({
        uid: user.uid,
        email: user.email,
        displayName: displayName || null,
        photoURL: null,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });

      return user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async signIn(email: string, password: string): Promise<FirebaseAuthTypes.User> {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      return userCredential.user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await auth().signOut();
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async getUserProfile(uid: string): Promise<FirebaseUser | null> {
    try {
      const userDoc = await firestore().collection('users').doc(uid).get();
      if (userDoc.exists) {
        return userDoc.data() as FirebaseUser;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      crashlytics().recordError(error as Error);
      return null;
    }
  }

  onAuthStateChanged(callback: (user: FirebaseAuthTypes.User | null) => void): () => void {
    return auth().onAuthStateChanged(callback);
  }

  getCurrentUser(): FirebaseAuthTypes.User | null {
    return auth().currentUser;
  }

  private handleAuthError(error: any): Error {
    const errorMessages: { [key: string]: string } = {
      'auth/email-already-in-use': 'This email is already registered',
      'auth/invalid-email': 'Invalid email address',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/user-not-found': 'No user found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
    };

    const message = errorMessages[error.code] || error.message || 'An error occurred';
    return new Error(message);
  }
}

export default new FirebaseAuthService();