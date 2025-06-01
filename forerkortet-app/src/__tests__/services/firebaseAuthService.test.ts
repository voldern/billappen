import firebaseAuthService from '../../services/firebaseAuthService';
import { mockAuth, mockFirestore } from '../../test-utils/firebase-mocks';

describe('FirebaseAuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signUp', () => {
    it('should create a new user with email and password', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
        updateProfile: jest.fn().mockResolvedValue(undefined),
      };

      mockAuth.createUserWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      const userDocRef = {
        set: jest.fn().mockResolvedValue(undefined),
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(userDocRef),
      });

      const result = await firebaseAuthService.signUp(
        'test@example.com',
        'password123',
        'Test User'
      );

      expect(mockAuth.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(mockUser.updateProfile).toHaveBeenCalledWith({
        displayName: 'Test User',
      });
      expect(userDocRef.set).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: 'user123',
          email: 'test@example.com',
          displayName: 'Test User',
        })
      );
      expect(result).toEqual(mockUser);
    });

    it('should handle email already in use error', async () => {
      const error = { code: 'auth/email-already-in-use', message: 'Email in use' };
      mockAuth.createUserWithEmailAndPassword.mockRejectedValue(error);

      await expect(
        firebaseAuthService.signUp('test@example.com', 'password123')
      ).rejects.toThrow('This email is already registered');
    });

    it('should handle weak password error', async () => {
      const error = { code: 'auth/weak-password', message: 'Weak password' };
      mockAuth.createUserWithEmailAndPassword.mockRejectedValue(error);

      await expect(
        firebaseAuthService.signUp('test@example.com', '123')
      ).rejects.toThrow('Password should be at least 6 characters');
    });
  });

  describe('signIn', () => {
    it('should sign in user with email and password', async () => {
      const mockUser = {
        uid: 'user123',
        email: 'test@example.com',
      };

      mockAuth.signInWithEmailAndPassword.mockResolvedValue({
        user: mockUser,
      });

      const result = await firebaseAuthService.signIn(
        'test@example.com',
        'password123'
      );

      expect(mockAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(result).toEqual(mockUser);
    });

    it('should handle wrong password error', async () => {
      const error = { code: 'auth/wrong-password', message: 'Wrong password' };
      mockAuth.signInWithEmailAndPassword.mockRejectedValue(error);

      await expect(
        firebaseAuthService.signIn('test@example.com', 'wrongpass')
      ).rejects.toThrow('Incorrect password');
    });

    it('should handle user not found error', async () => {
      const error = { code: 'auth/user-not-found', message: 'User not found' };
      mockAuth.signInWithEmailAndPassword.mockRejectedValue(error);

      await expect(
        firebaseAuthService.signIn('notfound@example.com', 'password')
      ).rejects.toThrow('No user found with this email');
    });

    it('should handle too many requests error', async () => {
      const error = { code: 'auth/too-many-requests', message: 'Too many requests' };
      mockAuth.signInWithEmailAndPassword.mockRejectedValue(error);

      await expect(
        firebaseAuthService.signIn('test@example.com', 'password')
      ).rejects.toThrow('Too many failed attempts. Please try again later');
    });
  });

  describe('signOut', () => {
    it('should sign out the current user', async () => {
      mockAuth.signOut.mockResolvedValue(undefined);

      await firebaseAuthService.signOut();

      expect(mockAuth.signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      const error = new Error('Sign out failed');
      mockAuth.signOut.mockRejectedValue(error);

      await expect(firebaseAuthService.signOut()).rejects.toThrow(
        'Sign out failed'
      );
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      mockAuth.sendPasswordResetEmail.mockResolvedValue(undefined);

      await firebaseAuthService.resetPassword('test@example.com');

      expect(mockAuth.sendPasswordResetEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
    });

    it('should handle invalid email error', async () => {
      const error = { code: 'auth/invalid-email', message: 'Invalid email' };
      mockAuth.sendPasswordResetEmail.mockRejectedValue(error);

      await expect(
        firebaseAuthService.resetPassword('invalid-email')
      ).rejects.toThrow('Invalid email address');
    });

    it('should handle network error', async () => {
      const error = {
        code: 'auth/network-request-failed',
        message: 'Network error',
      };
      mockAuth.sendPasswordResetEmail.mockRejectedValue(error);

      await expect(
        firebaseAuthService.resetPassword('test@example.com')
      ).rejects.toThrow('Network error. Please check your connection');
    });
  });

  describe('getUserProfile', () => {
    it('should fetch user profile from Firestore', async () => {
      const mockUserProfile = {
        uid: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
      };

      const userDoc = {
        exists: true,
        data: () => mockUserProfile,
      };

      const userDocRef = {
        get: jest.fn().mockResolvedValue(userDoc),
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(userDocRef),
      });

      const result = await firebaseAuthService.getUserProfile('user123');

      expect(mockFirestore.collection).toHaveBeenCalledWith('users');
      expect(result).toEqual(mockUserProfile);
    });

    it('should return null if user profile does not exist', async () => {
      const userDoc = {
        exists: false,
      };

      const userDocRef = {
        get: jest.fn().mockResolvedValue(userDoc),
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(userDocRef),
      });

      const result = await firebaseAuthService.getUserProfile('user123');

      expect(result).toBeNull();
    });

    it('should handle errors and return null', async () => {
      const error = new Error('Firestore error');

      const userDocRef = {
        get: jest.fn().mockRejectedValue(error),
      };

      mockFirestore.collection.mockReturnValue({
        doc: jest.fn().mockReturnValue(userDocRef),
      });

      const result = await firebaseAuthService.getUserProfile('user123');

      expect(result).toBeNull();
    });
  });

  describe('onAuthStateChanged', () => {
    it('should register auth state change listener', () => {
      const callback = jest.fn();
      const unsubscribe = jest.fn();

      mockAuth.onAuthStateChanged.mockReturnValue(unsubscribe);

      const result = firebaseAuthService.onAuthStateChanged(callback);

      expect(mockAuth.onAuthStateChanged).toHaveBeenCalledWith(callback);
      expect(result).toBe(unsubscribe);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user when logged in', () => {
      const mockUser = { uid: 'user123', email: 'test@example.com' };
      mockAuth.currentUser = mockUser;

      const result = firebaseAuthService.getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null when not logged in', () => {
      mockAuth.currentUser = null;

      const result = firebaseAuthService.getCurrentUser();

      expect(result).toBeNull();
    });
  });
});