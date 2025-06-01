import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
  updateProfile,
  AuthError
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt?: any;
  updatedAt?: any;
}

class FirebaseAuthService {
  async signUp(email: string, password: string, displayName?: string): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName || null,
        photoURL: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  onAuthStateChanged(callback: (user: User | null) => void) {
    return firebaseOnAuthStateChanged(auth, callback);
  }

  private handleAuthError(error: AuthError): Error {
    console.error('Firebase Auth Error:', error);
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        return new Error('This email is already registered. Please sign in instead.');
      case 'auth/invalid-email':
        return new Error('Please enter a valid email address.');
      case 'auth/operation-not-allowed':
        return new Error('Email/password accounts are not enabled.');
      case 'auth/weak-password':
        return new Error('Password should be at least 6 characters.');
      case 'auth/user-disabled':
        return new Error('This account has been disabled.');
      case 'auth/user-not-found':
        return new Error('No account found with this email address.');
      case 'auth/wrong-password':
        return new Error('Incorrect password. Please try again.');
      case 'auth/invalid-login-credentials':
        return new Error('Invalid email or password.');
      case 'auth/network-request-failed':
        return new Error('Network error. Please check your connection.');
      default:
        return new Error(error.message || 'An unexpected error occurred.');
    }
  }
}

const firebaseAuthService = new FirebaseAuthService();
export default firebaseAuthService;